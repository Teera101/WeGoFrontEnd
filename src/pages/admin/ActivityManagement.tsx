import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';

interface Activity {
  _id: string;
  title: string;
  description: string;
  category: string;
  location?: string | { address?: string; coordinates?: { lat: number; lng: number } };
  maxParticipants: number;
  participants: string[];
  createdBy: { _id: string; email: string; username?: string };
  status: string;
  createdAt: string;
  coverImage?: string;
  cover?: string; // Field ชื่อ cover ใน database
  images?: string[];
}

export default function ActivityManagement() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [usingPublicApi, setUsingPublicApi] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      // Log token for debugging
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      console.log('Token preview:', token?.substring(0, 20) + '...');

      // Try admin endpoint first, fallback to public endpoint if unauthorized
      try {
        console.log('Attempting to fetch from admin endpoint...');
        const response = await api.get('/admin/activities');
        console.log('Admin API success! Activities:', response.data.activities?.length);
        // Debug: log sample payload to inspect createdBy shape
        try {
          console.log('Admin activities payload (sample):', response.data.activities && response.data.activities.length ? response.data.activities[0] : null);
        } catch (e) {
          console.log('Could not stringify activities payload', e);
        }
        setActivities(response.data.activities || []);
        setUsingPublicApi(false);
      } catch (adminError: any) {
        console.error('Admin API error:', {
          status: adminError.response?.status,
          message: adminError.response?.data?.message || adminError.response?.data?.error,
          error: adminError.message
        });

        // If admin endpoint fails (401/403), try public endpoint
        if (adminError.response?.status === 401 || adminError.response?.status === 403) {
          console.log('Admin endpoint failed, using public endpoint');
          const response = await api.get('/activities');
          console.log('Public API success! Activities:', response.data.activities?.length);
          setActivities(response.data.activities || []);
          setUsingPublicApi(true);
        } else {
          throw adminError;
        }
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Try public endpoint as last resort
      try {
        console.log('Final fallback to public endpoint...');
        const response = await api.get('/activities');
        setActivities(response.data.activities || []);
        setUsingPublicApi(true);
      } catch (fallbackError) {
        console.error('All endpoints failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      await api.delete(`/admin/activities/${activityId}`);
      fetchActivities();
      if (selectedActivity?._id === activityId) {
        setShowModal(false);
        setSelectedActivity(null);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity');
    }
  };

  const handleViewActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowModal(true);
  };

  const categories = ['all', 'sport', 'music', 'travel', 'food', 'study', 'other'];

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof activity.location === 'string' && activity.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof activity.location === 'object' && activity.location?.address?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || activity.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Helper function to get location string
  const getLocationString = (location?: string | { address?: string; coordinates?: { lat: number; lng: number } }): string => {
    if (!location) return 'Not specified';
    if (typeof location === 'string') return location;
    return location.address || 'Not specified';
  };

  // Helper function to check if location has valid coordinates
  const hasValidCoordinates = (location?: string | { address?: string; coordinates?: { lat: number; lng: number } }): boolean => {
    if (!location || typeof location === 'string') return false;
    const coords = location.coordinates;
    return !!(coords && typeof coords.lat === 'number' && typeof coords.lng === 'number' && !isNaN(coords.lat) && !isNaN(coords.lng));
  };

  // Helper function to get activity image
  const getActivityImage = (activity: Activity): string | null => {
    // Try coverImage first
    if (activity.coverImage && !activity.coverImage.startsWith('blob:')) {
      return activity.coverImage;
    }
    // Try cover field
    if (activity.cover && !activity.cover.startsWith('blob:')) {
      return activity.cover;
    }
    // Try first image from images array
    if (activity.images && activity.images.length > 0) {
      const validImage = activity.images.find(img => !img.startsWith('blob:'));
      if (validImage) return validImage;
    }
    return null;
  };

  // Helper to get creator display name robustly
  const getCreatorDisplay = (activity: Activity): string => {
    const cb: any = (activity as any).createdBy;
    if (!cb) return 'Unknown';
    if (typeof cb === 'string') return cb;
    return cb.username || (cb.email ? cb.email.split('@')[0] : 'Unknown');
  };

  const getCreatorInitial = (activity: Activity): string => {
    const cb: any = (activity as any).createdBy;
    if (!cb) return '?';
    if (typeof cb === 'string') return cb.charAt(0).toUpperCase();
    const name = cb.username || cb.email || '';
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 font-['Poppins']">Activity Management</h1>
          <p className="text-primary-300 text-sm sm:text-base">Manage all activities in the system</p>
          {usingPublicApi && (
            <div className="mt-2 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs inline-flex items-center gap-2">
              <i className="fas fa-exclamation-triangle"></i>
              <span>Using public API - Please login as admin for full access</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={fetchActivities} className="btn-ghost px-3 py-2 text-sm rounded-lg hover:bg-white/5">
            <i className="fas fa-sync-alt mr-2"></i>Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/30 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 group cursor-pointer hover:scale-105">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/40 to-emerald-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i className="fas fa-layer-group text-2xl text-emerald-300"></i>
              </div>
              <div className="flex-1">
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider">Total</p>
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider">Activities</p>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white">{filteredActivities.length}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-transparent border border-blue-500/30 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 group cursor-pointer hover:scale-105">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/40 to-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i className="fas fa-check-circle text-2xl text-blue-300"></i>
              </div>
              <div className="flex-1">
                <p className="text-blue-300 text-xs font-bold uppercase tracking-wider">Published</p>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white">
              {filteredActivities.filter((a) => a.status === 'published').length}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent border border-amber-500/30 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 group cursor-pointer hover:scale-105">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/40 to-amber-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i className="fas fa-users text-2xl text-amber-300"></i>
              </div>
              <div className="flex-1">
                <p className="text-amber-300 text-xs font-bold uppercase tracking-wider">Total</p>
                <p className="text-amber-300 text-xs font-bold uppercase tracking-wider">Participants</p>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white">
              {filteredActivities.reduce((sum, a) => sum + a.participants.length, 0)}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-transparent border border-purple-500/30 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 group cursor-pointer hover:scale-105">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/40 to-purple-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i className="fas fa-tags text-2xl text-purple-300"></i>
              </div>
              <div className="flex-1">
                <p className="text-purple-300 text-xs font-bold uppercase tracking-wider">Categories</p>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white">
              {new Set(filteredActivities.map((a) => a.category)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-gradient-to-br from-primary-800/60 via-primary-700/40 to-primary-800/60 backdrop-blur-xl border border-primary-600/50 rounded-2xl p-5 sm:p-6 shadow-2xl">
        <div className="relative group">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-hover:scale-110 transition-transform"></i>
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-primary-900/50 text-white rounded-xl pl-12 pr-4 py-3.5 border border-primary-600/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 focus:outline-none transition-all placeholder:text-primary-400"
          />
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-gradient-to-br from-primary-800/60 via-primary-700/40 to-primary-800/60 backdrop-blur-xl border border-primary-600/50 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-primary-700/70 to-primary-600/50">
              <tr>
                <th className="text-left py-4 px-4 lg:px-6 text-emerald-300 font-bold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                  <i className="fas fa-layer-group mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">Activity</span>
                </th>
                <th className="text-left py-4 px-4 lg:px-6 text-amber-300 font-bold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                  <i className="fas fa-map-marker-alt mr-1 sm:mr-2"></i>
                  <span className="hidden lg:inline">Location</span>
                </th>
                <th className="text-left py-4 px-4 lg:px-6 text-blue-300 font-bold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                  <i className="fas fa-users mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">Participants</span>
                </th>
                <th className="text-left py-4 px-4 lg:px-6 text-pink-300 font-bold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                  <i className="fas fa-user-circle mr-1 sm:mr-2"></i>
                  <span className="hidden xl:inline">Creator</span>
                </th>
                <th className="text-left py-4 px-4 lg:px-6 text-cyan-300 font-bold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap hidden xl:table-cell">
                  <i className="fas fa-calendar mr-1 sm:mr-2"></i>
                  <span>Created</span>
                </th>
                <th className="text-right py-4 px-4 lg:px-6 text-gray-300 font-bold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                  <i className="fas fa-cog mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <tr key={activity._id} className="border-t border-primary-600/30 hover:bg-gradient-to-r hover:from-primary-700/40 hover:to-transparent transition-all duration-200 group">
                    <td className="py-3 px-4 lg:px-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {getActivityImage(activity) ? (
                          <img
                            src={getActivityImage(activity)!.startsWith('http') ? getActivityImage(activity)! : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${getActivityImage(activity)}`}
                            alt={activity.title}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover flex-shrink-0 ring-2 ring-emerald-500/30 group-hover:ring-emerald-400/50 transition-all"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-emerald-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0 ring-2 ring-emerald-500/20 group-hover:ring-emerald-400/40 transition-all">
                            <i className="fas fa-image text-xl sm:text-2xl text-emerald-300"></i>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-bold text-xs sm:text-sm group-hover:text-emerald-300 transition-colors truncate">{activity.title}</p>
                          <p className="text-primary-400 text-xs truncate hidden sm:block">{activity.description}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-xs font-bold ${activity.status === 'published'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}>
                            {activity.status === 'published' ? '✓' : '○'}
                            <span className="hidden sm:inline ml-1">{activity.status === 'published' ? 'Published' : 'Draft'}</span>
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 lg:px-6 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-amber-300/80 text-xs sm:text-sm">
                        <i className="fas fa-map-marker-alt"></i>
                        <span className="font-medium truncate max-w-[120px] lg:max-w-[150px]">
                          {getLocationString(activity.location)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 lg:px-6">
                      <div className="text-blue-300/80 text-xs sm:text-sm font-medium whitespace-nowrap">
                        <i className="fas fa-users mr-1 sm:mr-2"></i>
                        {activity.participants?.length || 0} / {activity.maxParticipants}
                      </div>
                    </td>
                    <td className="py-3 px-4 lg:px-6 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-pink-300/80 text-xs sm:text-sm">
                        <i className="fas fa-user-circle"></i>
                        <span className="font-medium truncate max-w-[100px] xl:max-w-[120px]">
                          {getCreatorDisplay(activity)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 lg:px-6 text-cyan-300/80 text-xs sm:text-sm font-medium hidden xl:table-cell">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 sm:gap-2">
                          <i className="fas fa-calendar-alt"></i>
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-primary-400">
                          {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 lg:px-6">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleViewActivity(activity)}
                          title="View activity"
                          className="px-2 sm:px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500/30 to-blue-600/20 text-blue-300 hover:from-blue-500/40 hover:to-blue-600/30 transition-all border border-blue-500/40 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 group/btn"
                        >
                          <i className="fas fa-eye group-hover/btn:scale-110 inline-block transition-transform"></i>
                          <span className="hidden sm:inline ml-2">View</span>
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(activity._id)}
                          title="Delete activity"
                          className="px-2 sm:px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-red-500/30 to-pink-500/20 text-red-300 hover:from-red-500/40 hover:to-pink-500/30 transition-all border border-red-500/40 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 group/btn"
                        >
                          <i className="fas fa-trash group-hover/btn:scale-110 inline-block transition-transform"></i>
                          <span className="hidden sm:inline ml-2">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-primary-400">
                    <i className="fas fa-clipboard-list text-4xl mb-3 opacity-50"></i>
                    <p>No activities found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {showModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gradient-to-br from-primary-800 via-primary-900 to-primary-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-primary-600/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-700/90 to-primary-800/90 backdrop-blur-xl border-b border-primary-600/50 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/40 to-blue-500/40 flex items-center justify-center">
                  <i className="fas fa-layer-group text-emerald-300"></i>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">Activity Details</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-xl bg-primary-700/50 hover:bg-red-500/30 text-primary-400 hover:text-red-300 transition-all hover:scale-110 hover:rotate-90"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Cover Image */}
              {getActivityImage(selectedActivity) && (
                <div className="rounded-2xl overflow-hidden ring-2 ring-emerald-500/30 shadow-2xl">
                  <img
                    src={getActivityImage(selectedActivity)!.startsWith('http') ? getActivityImage(selectedActivity)! : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${getActivityImage(selectedActivity)}`}
                    alt={selectedActivity.title}
                    className="w-full h-80 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* All Images Gallery (if multiple) */}
              {selectedActivity.images && selectedActivity.images.length > 1 && (
                <div className="grid grid-cols-3 gap-3">
                  {selectedActivity.images.map((img, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden ring-2 ring-primary-600/30 hover:ring-emerald-400/50 transition-all cursor-pointer">
                      <img
                        src={img.startsWith('http') ? img : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${img}`}
                        alt={`${selectedActivity.title} - Image ${idx + 1}`}
                        className="w-full h-32 object-cover hover:scale-110 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Title & Description */}
              <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 rounded-2xl p-6 border border-primary-600/30">
                <label className="text-emerald-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                  <i className="fas fa-heading"></i> Title
                </label>
                <p className="text-white font-bold text-2xl mb-4">{selectedActivity.title}</p>

                <label className="text-blue-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                  <i className="fas fa-align-left"></i> Description
                </label>
                <p className="text-primary-300 leading-relaxed">{selectedActivity.description}</p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location */}
                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl p-4 border border-amber-500/20">
                  <label className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                    <i className="fas fa-map-marker-alt"></i> Location
                  </label>
                  <p className="text-white font-semibold">{getLocationString(selectedActivity.location)}</p>
                  {hasValidCoordinates(selectedActivity.location) &&
                    typeof selectedActivity.location === 'object' &&
                    selectedActivity.location.coordinates && (
                      <p className="text-xs text-primary-400 mt-1">
                        📍 {selectedActivity.location.coordinates.lat.toFixed(6)}, {selectedActivity.location.coordinates.lng.toFixed(6)}
                      </p>
                    )}
                </div>

                {/* Max Participants */}
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-4 border border-blue-500/20">
                  <label className="text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                    <i className="fas fa-users"></i> Max Participants
                  </label>
                  <p className="text-white font-semibold text-2xl">{selectedActivity.maxParticipants}</p>
                </div>

                {/* Current Participants */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-xl p-4 border border-cyan-500/20">
                  <label className="text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                    <i className="fas fa-user-friends"></i> Current Participants
                  </label>
                  <div className="flex items-center gap-3">
                    <p className="text-white font-semibold text-2xl">{selectedActivity.participants.length}</p>
                    <div className="flex-1 bg-primary-900/50 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.min((selectedActivity.participants.length / selectedActivity.maxParticipants * 100), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-xs text-primary-400 mt-1">
                    {Math.round((selectedActivity.participants.length / selectedActivity.maxParticipants * 100))}% Full
                  </p>
                </div>

                {/* Created Date */}
                <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 rounded-xl p-4 border border-pink-500/20">
                  <label className="text-pink-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                    <i className="fas fa-calendar-alt"></i> Created Date
                  </label>
                  <p className="text-white font-semibold">{new Date(selectedActivity.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-primary-400 mt-1">
                    {new Date(selectedActivity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Creator Info */}
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-4 border border-purple-500/20">
                <label className="text-purple-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                  <i className="fas fa-user-circle"></i> Created By
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/20 flex items-center justify-center">
                    <span className="text-purple-300 font-black text-lg">
                      {getCreatorInitial(selectedActivity)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{getCreatorDisplay(selectedActivity)}</p>
                    <p className="text-xs text-primary-400">Activity Creator</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-primary-600/30">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-700/50 to-primary-600/30 text-white font-bold uppercase tracking-wider hover:from-primary-700/70 hover:to-primary-600/50 transition-all border border-primary-600/40 hover:scale-105"
                >
                  <i className="fas fa-times mr-2"></i>Close
                </button>
                <button
                  onClick={() => {
                    if (confirm('⚠️ Are you sure you want to delete this activity? This action cannot be undone!')) {
                      handleDeleteActivity(selectedActivity._id);
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500/30 to-pink-500/20 text-red-300 font-bold uppercase tracking-wider hover:from-red-500/40 hover:to-pink-500/30 transition-all border border-red-500/40 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                >
                  <i className="fas fa-trash mr-2"></i>Delete Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
