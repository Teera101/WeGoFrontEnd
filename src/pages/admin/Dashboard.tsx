import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/apiClient';

interface DashboardStats {
  stats: {
    totalUsers: number;
    totalActivities: number;
    totalGroups: number;
    totalEvents: number;
    totalChats: number;
    totalReports?: number;
    pendingReports?: number;
  };
  recentUsers: any[];
  recentActivities: any[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // ตรวจสอบว่า user เป็น admin หรือไม่
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchDashboardStats();
  }, [user, navigate]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      // เรียก API dashboard ที่รวมข้อมูลทั้งหมด
      const response = await api.get('/admin/dashboard');
      setDashboardData(response.data);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md">
          <p className="text-red-400 text-center">{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="mt-4 w-full btn-primary rounded-lg px-4 py-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { stats, recentUsers, recentActivities } = dashboardData;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 font-['Poppins']">Admin Dashboard</h1>
          <p className="text-primary-300 text-sm sm:text-base">Welcome back, {user?.email?.split('@')[0] || 'godmode'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDashboardStats} className="btn-ghost px-3 py-2 text-sm rounded-lg hover:bg-white/5">
            <i className="fas fa-sync-alt mr-2"></i>Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Users Card */}
        <div className="group relative bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-transparent border border-blue-500/30 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
             onClick={() => navigate('/admin/users')}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-blue-300 text-xs sm:text-sm font-semibold uppercase tracking-wider">Total Users</p>
              <div className="bg-gradient-to-br from-blue-500/40 to-blue-600/40 p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-users text-blue-300 text-lg sm:text-xl"></i>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white mb-2 group-hover:text-blue-200 transition-colors">{stats.totalUsers}</p>
            <div className="flex items-center gap-2 text-blue-300/80 text-xs sm:text-sm">
              <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
              <span className="font-medium">Manage users</span>
            </div>
          </div>
        </div>

        {/* Total Activities Card */}
        <div className="group relative bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/30 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
             onClick={() => navigate('/admin/activities')}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-emerald-300 text-xs sm:text-sm font-semibold uppercase tracking-wider">Activities</p>
              <div className="bg-gradient-to-br from-emerald-500/40 to-emerald-600/40 p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-clipboard-list text-emerald-300 text-lg sm:text-xl"></i>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white mb-2 group-hover:text-emerald-200 transition-colors">{stats.totalActivities}</p>
            <div className="flex items-center gap-2 text-emerald-300/80 text-xs sm:text-sm">
              <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
              <span className="font-medium">View activities</span>
            </div>
          </div>
        </div>

        {/* Total Groups Card - Info Only */}
        <div className="group relative bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-transparent border border-purple-500/30 rounded-2xl p-4 sm:p-6 shadow-lg transition-all duration-300 overflow-hidden opacity-60">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-purple-300 text-xs sm:text-sm font-semibold uppercase tracking-wider">Groups</p>
              <div className="bg-gradient-to-br from-purple-500/40 to-purple-600/40 p-2.5 rounded-xl">
                <i className="fas fa-user-friends text-purple-300 text-lg sm:text-xl"></i>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white mb-2">{stats.totalGroups}</p>
          </div>
        </div>

        {/* Reports Card */}
        <div className="group relative bg-gradient-to-br from-red-500/20 via-red-600/10 to-transparent border border-red-500/30 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-red-500/50 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden col-span-2 md:col-span-1"
             onClick={() => navigate('/admin/reports')}>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-red-300 text-xs sm:text-sm font-semibold uppercase tracking-wider">Reports</p>
              <div className="bg-gradient-to-br from-red-500/40 to-red-600/40 p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-flag text-red-300 text-lg sm:text-xl"></i>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white mb-2 group-hover:text-red-200 transition-colors">
              {stats.totalReports || 0}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-300/80 text-xs sm:text-sm">
                <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
                <span className="font-medium">Manage reports</span>
              </div>
              {stats.pendingReports && stats.pendingReports > 0 && (
                <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-300">
                  {stats.pendingReports} pending
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Tables - Responsive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mt-6">
        {/* Recent Users Table */}
        <div className="bg-primary-800/50 backdrop-blur-sm border border-primary-700/50 rounded-xl p-4 sm:p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white">Recent Users</h2>
            <button onClick={() => navigate('/admin/users')} className="text-blue-400 hover:text-blue-300 text-sm">
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-600/50">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-primary-300 font-semibold text-xs sm:text-sm">Username</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-primary-300 font-semibold text-xs sm:text-sm">Email</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-primary-300 font-semibold text-xs sm:text-sm">Role</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length > 0 ? (
                  recentUsers.slice(0, 5).map((u: any) => (
                    <tr key={u._id} className="border-b border-primary-700/30 hover:bg-primary-700/30 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white text-xs sm:text-sm">{u.username || 'N/A'}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-primary-300 text-xs sm:text-sm truncate max-w-[150px]">{u.email}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-primary-400 text-sm">No recent users</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities Table */}
        <div className="bg-primary-800/50 backdrop-blur-sm border border-primary-700/50 rounded-xl p-4 sm:p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white">Recent Activities</h2>
            <button onClick={() => navigate('/admin/activities')} className="text-green-400 hover:text-green-300 text-sm">
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-600/50">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-primary-300 font-semibold text-xs sm:text-sm">Title</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-primary-300 font-semibold text-xs sm:text-sm">Category</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-primary-300 font-semibold text-xs sm:text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((act: any) => (
                    <tr key={act._id} className="border-b border-primary-700/30 hover:bg-primary-700/30 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white text-xs sm:text-sm truncate max-w-[150px]">{act.title}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-primary-300 text-xs sm:text-sm">{act.category}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${act.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-primary-400 text-sm">No recent activities</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}