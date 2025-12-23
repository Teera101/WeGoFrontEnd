import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/apiClient';
import { toast } from './Toasts';

interface MemberActionMenuProps {
  groupId: string;
  targetMember: {
    id: string;
    role: string;
    name: string;
  };
  currentUserRole: string;
  currentUserId: string;
  onUpdate: () => void;
}

export default function MemberActionMenu({ 
  groupId, 
  targetMember, 
  currentUserRole, 
  currentUserId,
  onUpdate 
}: MemberActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (targetMember.id === currentUserId) return null;

  // ✅ แก้ไข: อนุญาตให้ Admin เห็นปุ่มจัดการ Admin ได้ (เพื่อให้ปุ่มไม่หาย)
  // แต่Backend จะเป็นตัวบล็อกเองถ้าไม่มีสิทธิ์
  const canManage = 
    currentUserRole === 'owner' || 
    currentUserRole === 'admin'; 

  if (!canManage) return null;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const screenHeight = window.innerHeight;
      const menuHeight = 120;
      
      let top = rect.bottom + 5;
      if (top + menuHeight > screenHeight) {
        top = rect.top - menuHeight - 5;
      }
      
      setMenuPos({ top, left: rect.right - 160 });
    }
    setIsOpen(true);
  };

  const kickMember = async () => {
    if (!window.confirm(`Are you sure you want to remove ${targetMember.name}?`)) return;
    
    // ✅ แจ้งเตือนชัดเจนถ้าหา Group ID ไม่เจอ
    if (!groupId) {
      toast('❌ System Error: Group ID not found. Please try refreshing or re-entering the group.');
      return;
    }

    try {
      await api.delete(`/groups/${groupId}/members/${targetMember.id}`);
      toast('👋 Member removed');
      onUpdate();
    } catch (err: any) {
      console.error(err);
      // แสดงข้อความจาก Backend (เช่น Admins cannot remove other admins)
      toast(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsOpen(false);
    }
  };

  const changeRole = async (newRole: string) => {
    if (!groupId) {
        toast('❌ System Error: Group ID not found.');
        return;
    }
    try {
      await api.put(`/groups/${groupId}/members/${targetMember.id}/role`, { role: newRole });
      toast(`✅ Role changed to ${newRole}`);
      onUpdate();
    } catch (err: any) {
      toast(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <>
      <button 
        ref={buttonRef} 
        onClick={handleToggle} 
        className="p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm
          bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200
          dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:border-slate-600"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
          />
          <div 
            className="fixed z-[9999] w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-sm"
            style={{ top: menuPos.top, left: menuPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            {currentUserRole === 'owner' && (
              <>
                <button 
                  onClick={() => changeRole(targetMember.role === 'admin' ? 'member' : 'admin')} 
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-200"
                >
                  {targetMember.role === 'admin' ? '⬇️ Demote' : '👮 Promote'}
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
              </>
            )}
            
            <button 
              onClick={kickMember} 
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
            >
              🚫 Remove User
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}