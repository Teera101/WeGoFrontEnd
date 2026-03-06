import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
    }
    return 'http://localhost:10000/api';
  };

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${getApiUrl()}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const unreadOnly = data.notifications.filter((n: any) => !n.isRead);
          setNotifications(unreadOnly);
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {}
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string, relatedId?: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${getApiUrl()}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.filter(n => n._id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));

      if (relatedId) {
        setIsOpen(false);
      }
    } catch (error) {}
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${getApiUrl()}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {}
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
      >
        <Bell className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[100]">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-800 dark:text-white">การแจ้งเตือน</h3>
            {notifications.length > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                อ่านทั้งหมด
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                ไม่มีการแจ้งเตือนใหม่
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id}
                  onClick={() => markAsRead(notif._id, notif.relatedId)}
                  className="p-4 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 flex gap-3 bg-blue-50/50 dark:bg-blue-900/10"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {notif.sender?.avatar ? (
                      <img src={notif.sender.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">👤</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 dark:text-slate-200">
                      <span className="font-semibold">{notif.sender?.username || notif.sender?.name || 'ผู้ใช้'}</span>
                      {' '}{notif.message}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString('th-TH', { 
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                      })} น.
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5"></div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}