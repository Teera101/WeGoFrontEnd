import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';

interface Profile {
  name?: string;
  avatar?: string;
  bio?: string;
  updatedAt?: string;
}

export default function AdminLayout() {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', bio: '', avatar: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่า user เป็น admin หรือไม่
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Fetch profile when user is available
    if (user) {
      fetchProfile();
    }
  }, [user?._id]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await api.get(`/profiles/${user._id}`);
      setProfile(response.data);
      setFormData({
        name: response.data?.name || '',
        bio: response.data?.bio || '',
        avatar: response.data?.avatar || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProfile = () => {
    setShowProfileModal(true);
    fetchProfile();
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await api.post('/profiles', {
        userId: user._id,
        name: formData.name,
        bio: formData.bio,
        avatar: formData.avatar
      });
      await fetchProfile();
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/activities', label: 'Activities', icon: '🎯' },
    { path: '/admin/reports', label: 'Reports', icon: '🚨' }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-primary-900/95 via-primary-800/95 to-primary-900/95 backdrop-blur-xl border-r border-primary-700/50 shadow-2xl fixed h-full">
        <div className="p-6 border-b border-primary-700/50 bg-gradient-to-r from-primary-800/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
              <i className="fas fa-crown text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-primary-400 text-xs font-medium">Management Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5">{navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-400 font-bold shadow-lg shadow-emerald-500/20 border border-emerald-500/30'
                : 'text-primary-300 hover:bg-primary-700/50 hover:text-white hover:translate-x-1'
              }`
            }
          >
            <span className={`text-xl transition-transform duration-200 ${'group-hover:scale-110'
              }`}>{item.icon}</span>
            <span className="font-semibold">{item.label}</span>
            <i className="fas fa-chevron-right ml-auto text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
          </NavLink>
        ))}
        </nav>


        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-700/50 bg-gradient-to-t from-primary-900 to-transparent">
          <div
            className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-gradient-to-r hover:from-primary-700/50 hover:to-transparent rounded-xl p-3 transition-all duration-200 group"
            onClick={handleOpenProfile}
          >
            {profile?.avatar ? (
              <div className="relative">
                <img
                  src={profile.avatar && profile.avatar.startsWith('http') ? profile.avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${profile.avatar}`}
                  alt={profile.name || user?.email}
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-emerald-500/50 group-hover:ring-emerald-400 transition-all"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-primary-900"></div>
              </div>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/30 to-blue-500/30 flex items-center justify-center ring-2 ring-emerald-500/50 group-hover:ring-emerald-400 transition-all">
                <span className="text-emerald-400 font-bold text-lg">
                  {user?.username ? user.username.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : '')}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold truncate group-hover:text-emerald-400 transition-colors">
                {user?.username || profile?.name || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-emerald-400/80 flex items-center gap-1">
                Click to edit
              </p>
            </div>
            <i className="fas fa-cog text-primary-400 group-hover:text-emerald-400 group-hover:rotate-90 transition-all duration-300"></i>
          </div>
          <button
            onClick={() => {
              logOut();
              navigate('/');
            }}
            className="w-full bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-400 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 border border-red-500/30 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20 group"
          >
            <i className="fas fa-sign-out-alt mr-2 group-hover:translate-x-1 transition-transform"></i>
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto">
        <Outlet />
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowProfileModal(false)}>
          <div className="bg-primary-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-primary-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-primary-800 border-b border-primary-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white font-['Poppins']">Admin Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-primary-400 hover:text-white transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {loading && !profile ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
                </div>
              ) : (
                <>
                  {/* Avatar & Basic Info */}
                  <div className="flex items-center gap-4">
                    {profile?.avatar ? (
                      <img
                        src={profile.avatar.startsWith('http') ? profile.avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${profile.avatar}`}
                        alt={profile.name || user?.email}
                        className="w-20 h-20 rounded-full object-cover border-2 border-emerald-400/30"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-400 font-bold text-3xl">
                            {user?.username ? user.username.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase())}
                          </span>
                        </div>
                    )}
                    <div className="flex-1">
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your name"
                          className="w-full bg-primary-700 text-white rounded-lg px-3 py-2 border border-primary-600 focus:border-emerald-400 focus:outline-none text-xl font-bold"
                        />
                      ) : (
                        <h3 className="text-2xl font-bold text-white font-['Poppins']">{profile?.name || user?.username || 'No name set'}</h3>
                      )}
                      <p className="text-primary-300 mt-1">{user?.email}</p>
                    </div>
                  </div>

                  {/* Bio Section */}
                  <div>
                    <label className="text-primary-400 text-sm mb-2 block">Bio</label>
                    {editMode ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full bg-primary-700 text-white rounded-lg px-3 py-2 border border-primary-600 focus:border-emerald-400 focus:outline-none resize-none"
                      />
                    ) : (
                      <p className="text-white bg-primary-700/50 rounded-lg p-3">
                        {profile?.bio || 'No bio added yet'}
                      </p>
                    )}
                  </div>

                  {/* Avatar URL */}
                  {editMode && (
                    <div>
                      <label className="text-primary-400 text-sm mb-2 block">Avatar URL</label>
                      <input
                        type="text"
                        value={formData.avatar}
                        onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full bg-primary-700 text-white rounded-lg px-3 py-2 border border-primary-600 focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-primary-700">
                    <div>
                      <label className="text-primary-400 text-sm">Role</label>
                      <p className="text-white">
                        <span className="px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400 border border-red-500/30">
                          Admin
                        </span>
                      </p>
                    </div>
                    {profile?.updatedAt && (
                      <div>
                        <label className="text-primary-400 text-sm">Profile Updated</label>
                        <p className="text-white">{new Date(profile.updatedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-primary-700">
                    {editMode ? (
                      <>
                        <button
                          onClick={() => setEditMode(false)}
                          className="flex-1 px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-600 transition-colors"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="flex-1 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400"></div>
                              Saving...
                            </span>
                          ) : (
                            <>
                              <i className="fas fa-save mr-2"></i>Save Changes
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowProfileModal(false)}
                          className="flex-1 px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-600 transition-colors"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => setEditMode(true)}
                          className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors border border-blue-500/30"
                        >
                          <i className="fas fa-edit mr-2"></i>Edit Profile
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
