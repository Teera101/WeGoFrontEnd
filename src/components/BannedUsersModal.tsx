import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';
import { toast } from './Toasts';

interface BannedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

export default function BannedUsersModal({ isOpen, onClose, groupId }: BannedUsersModalProps) {
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBannedUsers = async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      // ดึงข้อมูลกลุ่มเพื่อเอารายชื่อ bannedUsers (Backend ต้อง populate ให้แล้ว)
      const res = await api.get(`/groups/${groupId}`);
      setBannedUsers(res.data.bannedUsers || []);
    } catch (error) {
      console.error('Failed to fetch banned users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBannedUsers();
    }
  }, [isOpen, groupId]);

  const handleUnban = async (userId: string) => {
    if (!window.confirm('Are you sure you want to unban this user?')) return;
    
    try {
      // เรียก API ปลดแบน
      await api.put(`/groups/${groupId}/unban/${userId}`);
      toast('✅ User unbanned successfully');
      fetchBannedUsers(); // รีโหลดหน้าต่าง
    } catch (err: any) {
      console.error(err);
      toast(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
            🚫 Banned Users
          </h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500 animate-pulse">Loading list...</div>
          ) : bannedUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-3">
              <div className="text-4xl opacity-50">✨</div>
              <p>No banned users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bannedUsers.map((user) => (
                <div 
                  key={user._id} 
                  className="flex items-center justify-between p-3 bg-white border border-slate-100 dark:bg-slate-700/30 dark:border-slate-700 rounded-xl hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate dark:text-slate-200">
                        {user.username || 'Unknown'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUnban(user._id)}
                    className="ml-2 px-3 py-1.5 text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 border border-green-200 rounded-lg transition-colors shrink-0 flex items-center gap-1"
                  >
                    <span>Unban</span>
                    <span>🔓</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}