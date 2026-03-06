import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useDM } from '../hooks/useDM';
import { Compass, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'WeGo';

function nameFromEmail(email?: string | null) {
  return email ? (email.split('@')[0] || '') : '';
}

export default function Navbar() {
  const { user, logOut } = useAuth();
  const { data: profile } = useProfile(user?._id);
  const { openDM } = useDM();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [chatDetails, setChatDetails] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatDropdownRef = useRef<HTMLDivElement>(null);

  const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
    }
    return 'http://localhost:10000/api';
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchChatStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${getApiUrl()}/chat-status/unread`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadChatCount(data.totalUnread || 0);
          setChatDetails(data.details || []);
          localStorage.setItem('unreadChatIds', JSON.stringify(data.unreadChatIds || []));
          window.dispatchEvent(new CustomEvent('chat-status-update', { detail: data.unreadChatIds }));
        }
      } catch (error) {}
    };

    fetchChatStatus();
    const interval = setInterval(fetchChatStatus, 3000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatDropdownRef.current && !chatDropdownRef.current.contains(event.target as Node)) {
        setIsChatOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMessagesClick = async () => {
    setUnreadChatCount(0);
    setChatDetails([]);
    setIsChatOpen(false);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${getApiUrl()}/chat-status/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem('unreadChatIds', JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('chat-status-update', { detail: [] }));
    } catch (error) {}
  };

  const handleChatItemClick = async (chat: any) => {
    setIsChatOpen(false);

    setUnreadChatCount(prev => Math.max(0, prev - chat.count));
    setChatDetails(prev => prev.filter(c => c.chatId !== chat.chatId));

    try {
      const currentUnread = JSON.parse(localStorage.getItem('unreadChatIds') || '[]');
      const updatedUnread = currentUnread.filter((id: string) => id !== chat.chatId);
      localStorage.setItem('unreadChatIds', JSON.stringify(updatedUnread));
      window.dispatchEvent(new CustomEvent('chat-status-update', { detail: updatedUnread }));
    } catch(e) {}

    if (chat.type === 'group') {
      navigate(`/dm/${chat.chatId}`);
    } else {
      openDM({
        uid: chat.chatId,
        name: chat.name,
        avatar: '', 
        isOnline: true
      });
    }

    try {
      const token = localStorage.getItem('token');
      if (chat.type === 'direct_msg') {
        await fetch(`${getApiUrl()}/chat-status/read-dm/${chat.chatId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await fetch(`${getApiUrl()}/chats/${chat.chatId}/read`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ messageIds: [] })
        });
      }
    } catch(e) {}
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'px-3 py-2 font-semibold transition-colors',
      'hover:underline underline-offset-8 decoration-2',
      isActive 
        ? 'text-amber-600 dark:text-white underline decoration-2' 
        : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-white'
    );

  const displayName = (profile?.name && profile.name.trim()) || (user as any)?.username || nameFromEmail(user?.email) || '';
  const profileAvatar = profile?.avatar || '';
  const isTransient = profileAvatar && (profileAvatar.startsWith('blob:') || profileAvatar.startsWith('file:'));
  const avatar = isTransient ? '' : profileAvatar;
  const first = (displayName || '?').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-primary-900/70 backdrop-blur-xl shadow-sm dark:shadow-none transition-colors duration-200">
      <div className="container-app flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-2 group" aria-label={APP_NAME}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 rounded-xl blur-md opacity-60 group-hover:opacity-90 transition-opacity" />
            <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-400 p-2 rounded-xl shadow-lg group-hover:shadow-purple-500/50 transition-all">
              <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <span className="text-2xl font-bold font-['Poppins'] bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 dark:from-purple-400 dark:via-pink-400 dark:to-cyan-300 bg-clip-text text-transparent">
            WeGo
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-2 lg:gap-3">
          <NavLink to="/explore" className={linkClass}>Explore</NavLink>
          <NavLink to="/create" className={linkClass}>Create</NavLink>
          
          {user?.role === 'admin' && (
            <NavLink to="/admin/dashboard" className={linkClass}>Dashboard</NavLink>
          )}

          <div className="ml-2">
            <ThemeToggle />
          </div>

          {user ? (
            <div className="flex items-center gap-3 ml-2">
              
              <div className="relative" ref={chatDropdownRef}>
                <button 
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                >
                  <MessageSquare className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                  {unreadChatCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                </button>

                {isChatOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[100]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="font-bold text-slate-800 dark:text-white">ข้อความใหม่</h3>
                      {chatDetails.length > 0 && (
                        <button 
                          onClick={handleMessagesClick}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          อ่านทั้งหมด
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-[350px] overflow-y-auto">
                      {chatDetails.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                          ไม่มีข้อความใหม่
                        </div>
                      ) : (
                        chatDetails.map((chat, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleChatItemClick(chat)}
                            className="p-4 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 flex gap-3 items-center bg-blue-50/50 dark:bg-blue-900/10"
                          >
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 overflow-hidden shrink-0 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
                              {chat.name ? chat.name.charAt(0).toUpperCase() : 'G'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                                  {chat.name}
                                </p>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap mt-0.5">
                                  {new Date(chat.time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                                <span className="font-semibold text-slate-800 dark:text-slate-300">{chat.senderName}: </span>{chat.lastMessage}
                              </p>
                            </div>
                            <div className="w-5 h-5 bg-red-500 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                              {chat.count > 99 ? '99+' : chat.count}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="p-2 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                      <Link 
                        to="/messages" 
                        onClick={() => setIsChatOpen(false)}
                        className="block w-full py-2 text-center text-sm text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-colors"
                      >
                        ดูแชททั้งหมด
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <NotificationBell />
              
              <Link
                to="/profile"
                className="flex items-center gap-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-amber-400 dark:hover:border-amber-500/40 px-4 py-2 transition-all hover:scale-105 shadow-sm hover:shadow-md h-10 group"
              >
                <div className="h-7 w-7 rounded-full overflow-hidden grid place-items-center bg-gradient-to-br from-amber-500/20 to-yellow-500/20 ring-1 ring-slate-200 dark:ring-amber-400/50 flex-shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="avatar"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-300">{first}</span>
                  )}
                </div>
                <span className="text-slate-700 dark:text-white text-sm font-semibold max-w-[100px] truncate group-hover:text-amber-600 dark:group-hover:text-white transition-colors">
                  {displayName}
                </span>
              </Link>

              <button
                onClick={() => logOut()}
                className="px-5 py-2 rounded-xl font-semibold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 hover:border-red-300 dark:hover:border-red-400/50 transition-all hover:scale-105 h-10"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-2">
              <NavLink 
                to="/auth/signin" 
                className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 hover:from-amber-500 hover:to-yellow-600 transition-all hover:scale-105 shadow-md shadow-amber-500/20"
              >
                Sign in
              </NavLink>
              <NavLink 
                to="/auth/signup" 
                className="px-5 py-2 rounded-xl font-semibold border-2 border-slate-200 dark:border-white/30 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/50 transition-all hover:scale-105"
              >
                Sign up
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}