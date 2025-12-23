import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { useDM } from '../hooks/useDM';
import UserInfoCard from './UserInfoCard';
import MemberActionMenu from './MemberActionMenu';

interface Member {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  username?: string;
  isOnline?: boolean;
  bio?: string;
  createdAt?: string;
}

interface MemberListDMProps {
  members: Member[];
  currentUserRole?: string;
  currentUserId?: string;
  groupId?: string;
  onMemberUpdate?: () => void;
}

export default function MemberListDM({ 
  members,
  currentUserRole,
  currentUserId,
  groupId,
  onMemberUpdate
}: MemberListDMProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hoveredMember, setHoveredMember] = useState<Member | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [infoModalMember, setInfoModalMember] = useState<Member | null>(null);

  const { openDM } = useDM();

  const handleDM = async (member: Member) => {
    const peer: any = {
      uid: member.id,
      name: member.username || member.name.split('@')[0] || member.name,
      avatar: member.avatar,
      isOnline: member.isOnline
    };
    try {
      openDM(peer);
    } catch (err) {
      console.error('Failed to open DM:', err);
    }
  };

  const getDisplayName = (member: Member) => {
    if (member.username) return member.username;
    return member.name.split('@')[0] || member.name;
  };

  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder: Record<string, number> = { owner: 1, admin: 2, member: 3 };
    return (roleOrder[a.role] || 3) - (roleOrder[b.role] || 3);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-3 py-2 
        bg-amber-50 border border-amber-200
        dark:bg-gradient-to-r dark:from-slate-800 dark:to-slate-900 dark:border-amber-500/30 rounded-xl shadow-sm">
        <svg className="w-4 h-4 text-amber-500 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{members.length}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{members.length === 1 ? 'Member' : 'Members'}</span>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto thin-scrollbar pr-1">
        {sortedMembers.map((member) => {
          const isMe = user && member.id === user._id;
          const isAdmin = member.role === 'admin';
          const isOwner = member.role === 'owner';
          const displayName = getDisplayName(member);
          const initial = displayName.charAt(0).toUpperCase();
          
          return (
            <div 
              key={member.id} 
              className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-md
                bg-white border border-slate-200 hover:border-amber-400
                dark:bg-gradient-to-r dark:from-slate-800 dark:to-slate-900 dark:border-amber-500/20 dark:hover:border-amber-500/50"
              onMouseEnter={(e) => {
                setHoveredMember(member);
                setTooltipPosition({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                if (hoveredMember?.id === member.id) {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }
              }}
              onMouseLeave={() => {
                setHoveredMember(null);
                setTooltipPosition(null);
              }}
              onClick={async (e) => {
                const target = e.target as HTMLElement;
                if(target.closest('button')) return;

                try {
                  const res = await api.get(`/profiles/${member.id}`).catch(() => null);
                  const prof = res && res.data ? res.data : null;
                  setInfoModalMember({
                    ...member,
                    bio: (prof && (prof.bio || prof.description)) ? (prof.bio || prof.description) : (member.bio || '')
                  });
                } catch (err) {
                  setInfoModalMember(member);
                }
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  {member.avatar && !(member.avatar.startsWith('blob:') || member.avatar.startsWith('file:')) ? (
                    <img 
                      src={member.avatar} 
                      alt={displayName}
                      className="w-11 h-11 rounded-full object-cover ring-2 shadow-md
                        ring-slate-100 group-hover:ring-amber-400
                        dark:ring-amber-500/30 dark:group-hover:ring-amber-400"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shadow-md ring-2 transition-all duration-300
                      text-white bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 
                      ring-slate-100 group-hover:ring-amber-400
                      dark:ring-amber-500/30 dark:group-hover:ring-amber-400">
                      {initial}
                    </div>
                  )}
                  {member.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full animate-pulse shadow-sm border-2 border-white dark:border-slate-800"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate flex items-center gap-1.5 text-sm
                    text-slate-900 dark:text-white">
                    <span>{displayName}</span>
                    {isMe && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold
                        bg-amber-100 text-amber-700 border border-amber-200
                        dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                        You
                      </span>
                    )}
                    {isOwner && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1
                        bg-amber-100 text-amber-700 border border-amber-200
                        dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-500/50">
                        👑 Owner
                      </span>
                    )}
                    {isAdmin && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1
                        bg-blue-100 text-blue-700 border border-blue-200
                        dark:bg-slate-700 dark:text-blue-400 dark:border-blue-500/30">
                        🛡️ Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs truncate mt-0.5 text-slate-500 dark:text-slate-400">
                    {member.name}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {!isMe && (
                    <button 
                    className="p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm
                        bg-slate-100 text-amber-600 hover:bg-slate-200 border border-slate-200
                        dark:bg-slate-700 dark:text-amber-400 dark:hover:bg-slate-600 dark:border-slate-600"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDM(member);
                    }}
                    title="Send direct message"
                    >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    </button>
                )}
                
                {onMemberUpdate && currentUserRole && currentUserId && (
                   <MemberActionMenu 
                     groupId={groupId || ''}
                     targetMember={{ id: member.id, role: member.role, name: displayName }}
                     currentUserRole={currentUserRole}
                     currentUserId={currentUserId}
                     onUpdate={onMemberUpdate}
                   />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hoveredMember && tooltipPosition && (
        <UserInfoCard
          user={{
            id: hoveredMember.id,
            name: hoveredMember.username || hoveredMember.name,
            username: hoveredMember.username || hoveredMember.name.split('@')[0],
            email: hoveredMember.name,
            role: hoveredMember.role,
            avatar: hoveredMember.avatar,
            isOnline: hoveredMember.isOnline,
            createdAt: hoveredMember.createdAt || new Date().toISOString(),
            bio: hoveredMember.bio
          }}
          mode="tooltip"
          position={tooltipPosition}
          onClose={() => {
            setHoveredMember(null);
            setTooltipPosition(null);
          }}
        />
      )}

      {infoModalMember && (
        <UserInfoCard
          user={{
            id: infoModalMember.id,
            name: infoModalMember.username || infoModalMember.name,
            username: infoModalMember.username || infoModalMember.name.split('@')[0],
            email: infoModalMember.name,
            role: infoModalMember.role,
            avatar: infoModalMember.avatar,
            isOnline: infoModalMember.isOnline,
            createdAt: infoModalMember.createdAt || new Date().toISOString(),
            bio: infoModalMember.bio
          }}
          mode="modal"
          onClose={() => setInfoModalMember(null)}
        />
      )}
    </div>
  );
}