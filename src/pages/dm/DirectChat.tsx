import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { socket } from '../../lib/socket';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/apiClient';
import MemberListDM from '../../components/MemberListDM';
import GroupReviews from '../../components/GroupReviews';
import ReportModal from '../../components/ReportModal';
import EditGroupModal from '../../components/EditGroupModal';
import BannedUsersModal from '../../components/BannedUsersModal';

type Message = {
  _id: string;
  sender: {
    _id: string;
    email: string;
    username?: string;
    avatar?: string;
    isOnline?: boolean;
  } | null;
  content: string;
  createdAt: string;
};

type Participant = {
  user: {
    _id: string;
    email: string;
    username?: string;
    avatar?: string;
    isOnline?: boolean;
  };
  role: string;
};

export default function DirectChat() {
  const { uid = '' } = useParams<{ uid: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [membersWithProfiles, setMembersWithProfiles] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [relatedGroup, setRelatedGroup] = useState<any>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBannedModal, setShowBannedModal] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  // ✅ 1. เพิ่ม Ref สำหรับช่องพิมพ์
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchChat = async () => {
    try {
      const response = await api.get(`/chats/${uid}`);
      const chatData = response.data.chat || response.data;
      
      if (chatData.participants) {
        chatData.participants = chatData.participants.filter((p: any) => p && p.user);
      }

      setChatInfo(chatData);
      
      if (messages.length === 0) {
         setMessages(chatData.messages || []);
      }

      try {
        const validParticipants = (chatData.participants || []).filter((p: any) => p && p.user && p.user._id);
        const participantIds = validParticipants
          .map((p: any) => p.user._id)
          .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

        const profileReqs = participantIds.map((id: string) => api.get(`/profiles/${id}`).catch(() => null));
        const profiles = await Promise.all(profileReqs);

        const profilesById: Record<string, any> = {};
        profiles.forEach((res: any, idx: number) => {
          if (!res || !res.data) return;
          const p = res.data;
          const key = p.userId || p._id || participantIds[idx];
          profilesById[key] = p;
        });

        const members = validParticipants
          .filter((p: any, index: number, self: any[]) => 
            index === self.findIndex((t) => t.user._id === p.user._id)
          )
          .map((p: any) => {
            const pid = p.user._id;
            const prof = profilesById[pid] || {};
            return {
              id: pid,
              name: p.user.email,
              role: p.role, 
              avatar: prof.avatar || '',
              username: p.user.username || prof.name || p.user.email.split('@')[0],
              isOnline: p.user.isOnline || false,
              bio: prof.bio || ''
            };
          });

        setMembersWithProfiles(members);
      } catch (pfErr) {
        console.warn('Failed to load profiles:', pfErr);
        setMembersWithProfiles(null);
      }
    } catch (error: any) {
      console.error('Failed to fetch chat:', error);
      
      if (error.response && error.response.status === 403) {
        navigate('/explore'); 
        return;
      }

      if (error.response && error.response.status === 404) {
         setChatInfo(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (uid && user) {
      setIsLoading(true);
      fetchChat();
      
      api.get(`/events/by-chat/${uid}`)
         .then(res => {
           if (res.data.group) {
             setRelatedGroup(res.data.group);
           }
         })
         .catch(err => {
         });
    }
  }, [uid, user]);

  useEffect(() => {
    if (!uid || !user) return;

    if (!socket.connected) socket.connect();
    socket.emit('user:join', user._id);
    socket.emit('chat:join', uid);

    const handleNewMessage = (message: any) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleMessageSent = (message: any) => {
      setMessages((prev) => {
        const withoutTemp = prev.filter(m => !m._id.startsWith('temp-'));
        return [...withoutTemp, message];
      });
    };

    const handleUserStatus = (payload: { userId: string; isOnline: boolean }) => {
      setMembersWithProfiles((prev) => {
        if (!prev) return prev;
        return prev.map((m) => {
          const memberId = m.user?._id || m._id || m.id;
          if (memberId === payload.userId) {
            return {
              ...m,
              isOnline: payload.isOnline,
              user: m.user ? { ...m.user, isOnline: payload.isOnline } : undefined
            };
          }
          return m;
        });
      });
    };

    const handleParticipantsUpdate = () => {
      fetchChat(); 
    };

    const handleChatUpdated = (updatedChat: any) => {
        setChatInfo(updatedChat);
    };

    const handleChatDeleted = () => {
        navigate('/explore');
    };

    socket.on('message:receive', handleNewMessage);
    socket.on('message:sent', handleMessageSent);
    socket.on('userStatusChanged', handleUserStatus);
    socket.on('chat:participants', handleParticipantsUpdate);
    socket.on('chat:updated', handleChatUpdated);
    socket.on('chat:deleted', handleChatDeleted);

    return () => {
      socket.off('message:receive', handleNewMessage);
      socket.off('message:sent', handleMessageSent);
      socket.off('userStatusChanged', handleUserStatus);
      socket.off('chat:participants', handleParticipantsUpdate);
      socket.off('chat:updated', handleChatUpdated);
      socket.off('chat:deleted', handleChatDeleted);
      socket.emit('chat:leave', uid);
    };
  }, [uid, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const participantCount = (() => {
    if (membersWithProfiles) return membersWithProfiles.length;
    if (!chatInfo?.participants) return 0;
    const ids = chatInfo.participants
      .filter((p: any) => p && p.user)
      .map((p: any) => p.user._id);
    return Array.from(new Set(ids)).length;
  })();

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') return '?';
    return name.charAt(0).toUpperCase();
  };

  const handleSend = () => {
    const content = text.trim();
    if (!content || !user) return;

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      sender: {
        _id: user._id,
        email: user.email,
        username: (user as any).username,
        avatar: (user as any).avatar
      },
      content: content,
      createdAt: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    setText('');
    
    // ✅ 2. สั่งรีเซ็ตความสูงของช่องพิมพ์กลับไปเป็น auto (50px)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    socket.emit('message:send', {
      chatId: uid,
      userId: user._id,
      content: content
    });
  };

  const myParticipantInfo = chatInfo?.participants?.find(
    (p: any) => p.user && String(p.user._id) === String(user?._id)
  );
  const myRole = myParticipantInfo?.role || 'member';

  const isGroupOwner = myRole === 'owner';
  const isGroupAdmin = myRole === 'admin' || isGroupOwner;

  const realGroupId = 
    relatedGroup?._id || 
    chatInfo?.groupInfo?._id || 
    chatInfo?.groupInfo?.id || 
    chatInfo?.group?._id ||
    chatInfo?.group || 
    chatInfo?.relatedId || 
    uid;

  if (isLoading) {
    return (
      <section className="min-h-screen flex items-center justify-center py-4">
        <div className="card p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-center shadow-lg">
          <div className="text-6xl mb-4 animate-pulse-subtle">💬</div>
          <div className="text-lg text-slate-600 dark:text-slate-300">Loading conversation...</div>
        </div>
      </section>
    );
  }

  if (!chatInfo) {
    return (
      <section className="min-h-screen flex items-center justify-center py-4">
        <div className="card p-8 space-y-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-center max-w-md shadow-lg">
          <div className="text-6xl mb-4">😔</div>
          <div className="text-lg font-semibold text-slate-800 dark:text-white">Chat room not found</div>
          <Link to="/explore" className="inline-flex px-6 py-3 font-semibold text-white rounded-lg bg-amber-500 hover:bg-amber-400 transition-all duration-300">
            Back to Explore
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen py-8">
      <div className="container-app">
        <div className="flex gap-6 max-w-7xl mx-auto">
          <div className="flex-1 space-y-4">
            
            <header className="card p-5 flex items-center gap-4 shadow-sm transition-colors duration-200
              bg-white border border-slate-200 
              dark:bg-gradient-to-r dark:from-slate-800/95 dark:to-slate-900/95 dark:border-amber-500/20 dark:shadow-xl dark:backdrop-blur-sm">
              <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md
                  bg-slate-100 text-slate-700 hover:bg-slate-200
                  dark:bg-gradient-to-r dark:from-slate-700 dark:to-slate-600 dark:text-white dark:hover:from-slate-600 dark:hover:to-slate-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold">Back</span>
              </button>
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent font-['Poppins']
                  bg-gradient-to-r from-slate-800 to-slate-600 
                  dark:from-amber-400 dark:to-amber-300">
                  {chatInfo.type === 'group' ? `${chatInfo.groupInfo?.name || chatInfo.name || 'Group Chat'}` : '💬 Direct Message'}
                </h3>
                {chatInfo.type === 'group' && (
                  <div className="text-sm flex items-center gap-2 mt-1
                    text-slate-500 dark:text-slate-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span>{participantCount} members</span>
                    {chatInfo.groupInfo?.maxMembers && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs">
                        Max: {chatInfo.groupInfo.maxMembers}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isGroupAdmin && chatInfo.type === 'group' && (
                <div className="flex gap-2">
                  {(isGroupAdmin || chatInfo.createdBy === user?._id) && (
                    <button 
                      onClick={() => setShowBannedModal(true)}
                      className="p-2.5 rounded-xl transition-all shadow-sm
                        bg-red-50 text-red-500 hover:bg-red-100 border border-red-200
                        dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 dark:border-red-800/30"
                      title="Manage Banned Users"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="p-2.5 rounded-xl transition-all shadow-sm
                      bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200
                      dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 dark:border-slate-600"
                    title="Edit Group Info"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              )}
            </header>

            <div className="card p-8 h-[calc(100vh-280px)] flex flex-col shadow-inner transition-colors duration-200
              bg-slate-50 border border-slate-200
              dark:bg-gradient-to-b dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 dark:border-amber-500/30 dark:backdrop-blur-lg dark:shadow-2xl">
              
              <div className="flex-1 overflow-y-auto space-y-5 thin-scrollbar pr-3">
                {messages.map((msg, idx) => {
                  const sender = msg.sender || null;
                  const isMine = user && sender && sender._id === user._id;
                  
                  const username = sender?.username;
                  const email = sender?.email;
                  const displayName = username || (email ? email.split('@')[0] : 'Unknown User');
                  const avatarUrl = sender?.avatar || '';
                  
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showAvatar = !prevMsg || (prevMsg.sender && prevMsg.sender._id !== (sender?._id || 'deleted'));

                  return (
                    <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
                      <div className={`max-w-[75%] flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <div className="flex-shrink-0 relative" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
                          {avatarUrl ? (
                            <img 
                              src={avatarUrl} 
                              alt={displayName || 'User'} 
                              className="w-10 h-10 rounded-full object-cover ring-2 shadow-md
                                ring-white dark:ring-amber-400/40" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 
                              ring-white dark:ring-amber-400/40">
                              {getInitials(displayName)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          {showAvatar && (
                            <div className={`text-xs font-bold mb-1 flex items-center gap-2 ${isMine ? 'justify-end mr-1' : 'ml-1'}
                              text-slate-500 dark:text-amber-400`}>
                              <span>{displayName}</span>
                            </div>
                          )}
                          <div
                            className={`px-4 py-3 shadow-sm transition-all duration-200 ${
                              isMine
                                ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-2xl rounded-br-sm shadow-md'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-sm dark:bg-gradient-to-br dark:from-slate-700 dark:to-slate-600 dark:text-white dark:border-white/10'
                            }`}
                          >
                            <div className="break-words break-all text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                          </div>
                          <div className={`text-[10px] flex items-center gap-1 ${isMine ? 'justify-end text-slate-400' : 'text-slate-400'}`}>
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!messages.length && (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center space-y-6 p-8 opacity-60">
                      <div className="text-6xl animate-bounce-subtle">💬</div>
                      <div>
                        <div className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-1">No messages yet</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          Start the conversation here!
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-amber-500/20">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    {/* ✅ 3. ผูก Ref กับ Textarea */}
                    <textarea
                      ref={textareaRef}
                      className="w-full resize-none rounded-xl shadow-sm transition-all min-h-[50px] max-h-32 py-3 px-4 text-[15px] leading-relaxed
                        bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
                        dark:bg-slate-700/40 dark:border-slate-600/50 dark:text-white dark:placeholder-slate-400 dark:focus:border-amber-400/60 dark:focus:ring-amber-400/20"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="พิมพ์ข้อความ..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={1}
                      style={{ height: 'auto', minHeight: '50px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                      }}
                    />
                  </div>
                  <button 
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:via-amber-500 hover:to-amber-600 text-white font-semibold shadow-xl shadow-amber-500/40 hover:shadow-amber-500/60 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 active:scale-95 shrink-0"
                    onClick={handleSend}
                    disabled={!text.trim()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 ml-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {chatInfo.type === 'group' && chatInfo.participants && (
            <div className="w-80 hidden lg:block">
              <div className="h-full flex flex-col sticky top-6">
                <div className="flex-1 card p-0 shadow-lg overflow-hidden flex flex-col transition-colors duration-200
                  bg-white border border-slate-200
                  dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-900 dark:border-amber-500/20 dark:backdrop-blur-lg">
                  
                  <h4 className="font-bold text-lg p-4 flex items-center gap-3 border-b
                    bg-slate-50 border-slate-200 text-slate-800
                    dark:bg-transparent dark:border-slate-700 dark:text-amber-400">
                    <span className="p-1.5 rounded-lg
                      bg-amber-100 text-amber-600
                      dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-amber-600/20 dark:text-amber-400">
                      👥
                    </span>
                    Group Members
                  </h4>
                  <div className="flex-1 overflow-y-auto p-4">
                    <MemberListDM 
                      members={membersWithProfiles || chatInfo.participants
                        .filter((p: any) => p && p.user)
                        .map((p: any) => ({
                          id: p.user._id,
                          name: p.user.email,
                          role: p.role,
                          avatar: '',
                          username: p.user.username || p.user.email.split('@')[0],
                          isOnline: p.user.isOnline || false
                        }))} 
                      currentUserRole={myRole}
                      currentUserId={user?._id || ''}
                      groupId={realGroupId} 
                      onMemberUpdate={fetchChat}
                    />
                  </div>
                  
                  <div className="p-4 border-t 
                    border-slate-200 bg-slate-50
                    dark:border-slate-700/50 dark:bg-transparent">
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="w-full py-2.5 rounded-lg border transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2 group
                        border-red-200 text-red-600 hover:bg-red-50
                        dark:border-red-500/30 dark:bg-gradient-to-br dark:from-red-900/10 dark:to-red-800/5 dark:hover:from-red-900/20 dark:hover:to-red-800/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:border-red-500/50"
                    >
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      Report Group
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {(relatedGroup?.relatedActivity || (chatInfo?.type === 'group' && chatInfo.groupInfo?.relatedActivity)) && (
          <div className="mt-6 max-w-3xl mx-auto px-4">
            <div className="rounded-2xl overflow-hidden shadow-lg transition-colors duration-200
              bg-white border border-slate-200
              dark:bg-gradient-to-b dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 dark:border-amber-500/30 dark:shadow-2xl">
              <div className="px-5 py-4 border-b
                bg-slate-50 border-slate-200
                dark:bg-slate-900/50 dark:border-amber-500/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg
                    bg-amber-100
                    dark:bg-amber-500/20">
                    <svg className="w-4 h-4 text-amber-500 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-amber-400">
                    Activity Reviews
                  </h3>
                </div>
              </div>
              
              <div className="p-5 dark:text-slate-200">
                <GroupReviews 
                  groupId={relatedGroup?.relatedActivity || chatInfo?.groupInfo?.relatedActivity} 
                  currentUserId={user?._id}
                  type="activity"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="group"
        targetId={uid}
      />

      {showEditModal && (
        <EditGroupModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          targetId={uid}
          type="chat"
          isOwner={isGroupOwner}
          renameOnly={true}
          initialData={{
            name: chatInfo.groupInfo?.name || chatInfo.name || '',
            description: chatInfo.groupInfo?.description || '',
            maxMembers: chatInfo.groupInfo?.maxMembers || 100
          }}
          onUpdate={fetchChat}
          onDelete={() => navigate('/explore')}
        />
      )}

      <BannedUsersModal 
        isOpen={showBannedModal} 
        onClose={() => setShowBannedModal(false)} 
        groupId={realGroupId} 
      />
    </section>
  );
}