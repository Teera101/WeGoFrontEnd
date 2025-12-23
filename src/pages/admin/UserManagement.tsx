import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { socket } from '../../lib/socket';

interface User {
  _id: string;
  email: string;
  username?: string;
  role: 'user' | 'admin';
  isBlocked?: boolean;
  isOnline?: boolean;
  lastActive?: string;
  createdAt: string;
  profile?: {
    avatar?: string;
    name?: string;
  };
}

interface UserProfile {
  name?: string;
  avatar?: string;
  bio?: string;
  updatedAt?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    fetchUsers();
    
    // Connect socket and authenticate user
    const initSocket = async () => {
      if (!socket.connected) {
        socket.connect();
      }

      // Get current user ID from localStorage or API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          const currentUserId = response.data._id;
          
          // Join socket with user ID
          socket.emit('user:join', currentUserId);
          console.log('Admin joined socket with ID:', currentUserId);
        } catch (error) {
          console.error('Error getting current user:', error);
        }
      }
    };

    initSocket();

    // Listen for user status updates
    socket.on('userStatusChanged', ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      console.log('User status changed:', userId, isOnline ? '🟢 ONLINE' : '⚫ OFFLINE');
      
      // Update users list
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, isOnline } : user
        )
      );
      
      // Update selected user in modal if it's open
      setSelectedUser((prevSelected) =>
        prevSelected && prevSelected._id === userId
          ? { ...prevSelected, isOnline }
          : prevSelected
      );
    });

    // Cleanup
    return () => {
      socket.off('userStatusChanged');
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    // ตรวจสอบว่าไม่ใช่ตัวเอง
    try {
      const response = await api.get('/auth/me');
      const currentUserId = response.data._id;
      
      if (userId === currentUserId) {
        alert('⚠️ Cannot block yourself!\n\nYou cannot block your own admin account.');
        return;
      }
    } catch (error) {
      console.error('Error checking current user:', error);
    }

    // Confirmation message
    const user = users.find(u => u._id === userId);
    const confirmMessage = isBlocked 
      ? `Unblock ${user?.email || 'this user'}?\n\nThey will be able to login and use the system again.`
      : `⚠️ Block ${user?.email || 'this user'}?\n\n⛔ This user will:\n• Cannot login to the system\n• Cannot access any features\n• Be kicked out immediately if online\n\nAre you sure?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/block`, { isBlocked: !isBlocked });
      
      // Update users list
      await fetchUsers();
      
      // Update selected user in modal if it's open
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({ ...selectedUser, isBlocked: !isBlocked });
      }

      // Success message
      const successMsg = !isBlocked 
        ? `✅ User blocked successfully!\n\n🚫 ${user?.email} cannot login or use the system anymore.`
        : `✅ User unblocked successfully!\n\n✓ ${user?.email} can now login and use the system.`;
      
      alert(successMsg);
    } catch (error: any) {
      console.error('Error blocking user:', error);
      alert(`❌ Failed to ${isBlocked ? 'unblock' : 'block'} user\n\n${error.response?.data?.message || 'Unknown error occurred'}`);
    }
  };
  
  const handleViewUser = async (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
    setLoadingProfile(true);
    
    // Fetch user profile
    try {
      const response = await api.get(`/profiles/${user._id}`);
      setUserProfile(response.data || null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full space-y-6">
      {/* Header with Quick Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 font-['Poppins']">User Management</h1>
          <p className="text-primary-300 text-sm sm:text-base">Manage all users in the system</p>
        </div>
        <button onClick={fetchUsers} className="btn-ghost px-3 py-2 text-sm rounded-lg hover:bg-white/5">
          <i className="fas fa-sync-alt mr-2"></i>Refresh
        </button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-transparent border border-blue-500/30 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 group cursor-pointer hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/40 to-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fas fa-users text-xl text-blue-300"></i>
            </div>
            <p className="text-blue-300 text-xs font-bold uppercase tracking-wider">Total Users</p>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-white">{filteredUsers.length}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 via-red-600/10 to-transparent border border-red-500/30 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300 group cursor-pointer hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/40 to-red-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fas fa-crown text-xl text-red-300"></i>
            </div>
            <p className="text-red-300 text-xs font-bold uppercase tracking-wider">Admins</p>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-white">{filteredUsers.filter((u) => u.role === 'admin').length}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/30 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 group cursor-pointer hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/40 to-emerald-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fas fa-wifi text-xl text-emerald-300"></i>
            </div>
            <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider">Online</p>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-white">{filteredUsers.filter((u) => u.isOnline && !u.isBlocked).length}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-500/20 via-gray-600/10 to-transparent border border-gray-500/30 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:shadow-gray-500/20 transition-all duration-300 group cursor-pointer hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-500/40 to-gray-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fas fa-ban text-xl text-gray-300"></i>
            </div>
            <p className="text-gray-300 text-xs font-bold uppercase tracking-wider">Blocked</p>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-white">{filteredUsers.filter((u) => u.isBlocked).length}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-gradient-to-br from-primary-800/60 via-primary-700/40 to-primary-800/60 backdrop-blur-xl border border-primary-600/50 rounded-2xl p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative group">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-hover:scale-110 transition-transform"></i>
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-primary-900/50 text-white rounded-xl pl-12 pr-4 py-3.5 border border-primary-600/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:outline-none transition-all placeholder:text-primary-400"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="bg-primary-900/50 text-white rounded-xl px-4 py-3.5 border border-primary-600/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 focus:outline-none cursor-pointer transition-all hover:bg-primary-900/70"
          >
            <option value="all">🔍 All Roles</option>
            <option value="user">👤 User Only</option>
            <option value="admin">👑 Admin Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gradient-to-br from-primary-800/60 via-primary-700/40 to-primary-800/60 backdrop-blur-xl border border-primary-600/50 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-primary-700/70 to-primary-600/50">
              <tr>
                <th className="text-left py-4 px-6 text-blue-300 font-bold text-sm uppercase tracking-wider">
                  <i className="fas fa-user mr-2"></i>User
                </th>
                <th className="text-left py-4 px-6 text-emerald-300 font-bold text-sm uppercase tracking-wider">
                  <i className="fas fa-envelope mr-2"></i>Email
                </th>
                <th className="text-left py-4 px-6 text-purple-300 font-bold text-sm uppercase tracking-wider">
                  <i className="fas fa-shield-alt mr-2"></i>Role
                </th>
                <th className="text-left py-4 px-6 text-amber-300 font-bold text-sm uppercase tracking-wider">
                  <i className="fas fa-circle mr-2"></i>Status
                </th>
                <th className="text-left py-4 px-6 text-pink-300 font-bold text-sm uppercase tracking-wider hidden md:table-cell">
                  <i className="fas fa-calendar mr-2"></i>Joined
                </th>
                <th className="text-right py-4 px-6 text-gray-300 font-bold text-sm uppercase tracking-wider">
                  <i className="fas fa-cog mr-2"></i>Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr 
                    key={user._id} 
                    className="border-t border-primary-600/30 hover:bg-gradient-to-r hover:from-primary-700/40 hover:to-transparent transition-all duration-200 group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {user.profile?.avatar ? (
                          <img
                            src={user.profile.avatar.startsWith('http') ? user.profile.avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${user.profile.avatar}`}
                            alt={user.profile.name || user.email}
                            className={`w-12 h-12 rounded-xl object-cover ring-2 transition-all ${
                              user.isBlocked 
                                ? 'ring-red-500/50 opacity-50 grayscale' 
                                : 'ring-blue-500/30 group-hover:ring-blue-400/50'
                            }`}
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 ring-2 transition-all ${
                            user.isBlocked
                              ? 'from-red-500/30 to-gray-500/30 ring-red-500/30 opacity-50'
                              : 'from-blue-500/30 to-purple-500/30 ring-blue-500/20 group-hover:ring-blue-400/40'
                          }`}>
                            <span className={`font-black text-lg ${user.isBlocked ? 'text-red-300' : 'text-blue-300'}`}>
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className={`font-bold text-sm transition-colors ${
                            user.isBlocked 
                              ? 'text-red-400 line-through' 
                              : 'text-white group-hover:text-blue-300'
                          }`}>
                            {user.profile?.name || user.username || 'N/A'}
                          </span>
                          {user.isBlocked && (
                            <p className="text-xs text-red-400 mt-0.5">🚫 Blocked - Cannot use system</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-emerald-300/80 text-sm font-medium">{user.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider inline-block ${
                        user.role === 'admin'
                          ? 'bg-gradient-to-r from-red-500/30 to-pink-500/20 text-red-300 border border-red-500/40'
                          : 'bg-gradient-to-r from-blue-500/30 to-purple-500/20 text-blue-300 border border-blue-500/40'
                      }`}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                            user.isBlocked
                              ? 'bg-gradient-to-r from-gray-500/30 to-gray-600/20 text-gray-300 border border-gray-500/40'
                              : user.isOnline
                              ? 'bg-gradient-to-r from-emerald-500/30 to-green-600/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                              : 'bg-gradient-to-r from-amber-500/30 to-yellow-600/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {user.isBlocked ? '🚫 Blocked' : user.isOnline ? '🟢 Online' : '⚫ Offline'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-pink-300/80 text-sm font-medium hidden md:table-cell">
                      <i className="fas fa-calendar-alt mr-2"></i>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewUser(user);
                          }}
                          title="View user details"
                          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500/30 to-blue-600/20 text-blue-300 hover:from-blue-500/40 hover:to-blue-600/30 transition-all border border-blue-500/40 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 group/btn"
                        >
                          <i className="fas fa-eye mr-2 group-hover/btn:scale-110 inline-block transition-transform"></i>
                          View
                        </button>
                        <button
                          onClick={() => handleBlockUser(user._id, user.isBlocked || false)}
                          title={user.isBlocked ? 'Unblock user' : 'Block user'}
                          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 hover:shadow-lg group/btn ${
                            user.isBlocked
                              ? 'bg-gradient-to-r from-emerald-500/30 to-green-600/20 text-emerald-300 hover:from-emerald-500/40 hover:to-green-600/30 border border-emerald-500/40 hover:shadow-emerald-500/20'
                              : 'bg-gradient-to-r from-red-500/30 to-pink-600/20 text-red-300 hover:from-red-500/40 hover:to-pink-600/30 border border-red-500/40 hover:shadow-red-500/20'
                          }`}
                        >
                          <i className={`fas ${user.isBlocked ? 'fa-unlock' : 'fa-ban'} mr-2 group-hover/btn:scale-110 inline-block transition-transform`}></i>
                          <span className="hidden sm:inline">{user.isBlocked ? 'Unblock' : 'Block'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-primary-400">
                    <i className="fas fa-users text-4xl mb-3 opacity-50"></i>
                    <p>No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-primary-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-primary-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-primary-800 border-b border-primary-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">User Details</h2>
              <button onClick={() => setShowModal(false)} className="text-primary-400 hover:text-white transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Blocked Warning */}
              {selectedUser.isBlocked && (
                <div className="bg-gradient-to-r from-red-500/20 to-pink-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-ban text-2xl text-red-400"></i>
                  </div>
                  <div>
                    <p className="text-red-400 font-bold text-lg">⚠️ User Blocked</p>
                    <p className="text-red-300 text-sm">This user cannot login or access any system features</p>
                  </div>
                </div>
              )}

              {/* Avatar & Basic Info */}
              <div className="flex items-center gap-4">
                {loadingProfile ? (
                  <div className="w-20 h-20 rounded-full bg-primary-700 animate-pulse"></div>
                  ) : userProfile?.avatar ? (
                  <img
                    src={userProfile.avatar.startsWith('http') ? userProfile.avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${userProfile.avatar}`}
                    alt={userProfile.name || selectedUser.email}
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-400/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold text-3xl">
                      {selectedUser.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white">
                    {loadingProfile ? (
                      <div className="h-8 w-48 bg-primary-700 animate-pulse rounded"></div>
                    ) : (
                      userProfile?.name || selectedUser.username || 'N/A'
                    )}
                  </h3>
                  <p className="text-primary-300">{selectedUser.email}</p>
                </div>
              </div>

              {/* Bio Section */}
              {!loadingProfile && userProfile?.bio && (
                <div>
                  <label className="text-primary-400 text-sm">Bio</label>
                  <p className="text-white bg-primary-700/50 rounded-lg p-3 mt-1">{userProfile.bio}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-primary-400 text-sm font-semibold">User ID</label>
                  <p className="text-white font-mono text-xs mt-1 break-all">{selectedUser._id}</p>
                </div>
                <div>
                  <label className="text-primary-400 text-sm font-semibold">Role</label>
                  <p className="text-white mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedUser.role === 'admin'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {selectedUser.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-primary-400 text-sm font-semibold">Online Status</label>
                  <p className="text-white mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedUser.isOnline
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {selectedUser.isOnline ? '🟢 Online' : '⚫ Offline'}
                    </span>
                  </p>
                  {!selectedUser.isOnline && selectedUser.lastActive && (
                    <p className="text-xs text-primary-400 mt-1">
                      Last seen: {new Date(selectedUser.lastActive).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-primary-400 text-sm font-semibold">Joined Date</label>
                  <p className="text-white mt-1 flex items-center gap-2">
                    <i className="fas fa-calendar-alt text-pink-400"></i>
                    {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    <span className="text-primary-400 text-sm">
                      ({new Date(selectedUser.createdAt).toLocaleTimeString()})
                    </span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-primary-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary-700 text-white hover:bg-primary-600 transition-all font-semibold hover:scale-105"
                >
                  <i className="fas fa-times mr-2"></i>Close
                </button>
                <button
                  onClick={() => handleBlockUser(selectedUser._id, selectedUser.isBlocked || false)}
                  className={`flex-1 px-6 py-2.5 rounded-lg transition-all font-bold uppercase tracking-wider hover:scale-105 ${
                    selectedUser.isBlocked
                      ? 'bg-gradient-to-r from-emerald-500/30 to-green-600/20 text-green-400 hover:from-emerald-500/40 hover:to-green-600/30 border-2 border-green-500/50 hover:shadow-xl hover:shadow-green-500/30'
                      : 'bg-gradient-to-r from-red-500/30 to-pink-600/20 text-red-400 hover:from-red-500/40 hover:to-pink-600/30 border-2 border-red-500/50 hover:shadow-xl hover:shadow-red-500/30'
                  }`}
                >
                  <i className={`fas ${selectedUser.isBlocked ? 'fa-unlock' : 'fa-ban'} mr-2`}></i>
                  {selectedUser.isBlocked ? '✓ Unblock User' : '⚠️ Block User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip hover preview removed - View button opens modal instead */}

      {/* View uses the existing User Details modal (handleViewUser) */}
    </div>
  );
}