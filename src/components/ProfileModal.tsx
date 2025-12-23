import { useState, useEffect } from 'react';
import { api } from '../lib/api';

type Profile = {
  userId: string;
  name: string;
  bio?: string;
  avatar?: string;
  tags?: string[];
  availability?: any;
  createdAt: string;
};

type User = {
  _id: string;
  email: string;
  username?: string;
  role?: string;
  createdAt?: string;
};

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  userId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  userId: string | null;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/profiles/${userId}`);
      setProfile(response.data.profile);
      setUser(response.data.user);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err?.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && profile && user && (
          <div>
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mb-4 overflow-hidden">
                {profile.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Name */}
              <h3 className="text-2xl font-bold mb-1">{profile.name}</h3>
              
              {/* Email */}
              <p className="text-slate-400 text-sm mb-2">{user.email}</p>
              
              {/* Role Badge */}
              {user.role === 'admin' && (
                <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-300">
                  Admin
                </span>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-400 mb-2">Bio</h4>
                <p className="text-slate-300">{profile.bio}</p>
              </div>
            )}

            {/* Tags */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-400 mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs text-cyan-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Member Since */}
            <div className="pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Close
              </button>
              {/* You can add more actions here like "Send Message" */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
