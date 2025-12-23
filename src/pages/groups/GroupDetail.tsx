import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import ChatPanel from '../../components/ChatPanel';
import AvailabilityPicker from '../../components/AvailabilityPicker';
import RatingDialog from '../../components/RatingDialog';
import GroupReviews from '../../components/GroupReviews';
import ReportModal from '../../components/ReportModal';
import EditGroupModal from '../../components/EditGroupModal';

export default function GroupDetail() {
  const { id } = useParams();
  const gid = id || '';
  const { user } = useAuth();
  
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // แยก State การเปิด Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [isRenameMode, setIsRenameMode] = useState(false);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/groups/${gid}`);
      setGroup(res.data);
    } catch (err) {
      console.error('Failed to fetch group:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (gid) fetchGroup();
  }, [gid]);

  const isOwnerOrAdmin = group && user && group.members && group.members.some(
    (m: any) => m.userId?._id === user._id && (m.role === 'owner' || m.role === 'admin')
  );

  // ฟังก์ชันเปิด Modal แก้ไข (ปุ่มใหญ่)
  const openEditSettings = () => {
    setIsRenameMode(false);
    setShowEditModal(true);
  };

  // ฟังก์ชันเปิด Modal เปลี่ยนชื่อ (ปุ่มเฟือง)
  const openRenameChat = () => {
    setIsRenameMode(true);
    setShowEditModal(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950">Loading...</div>;
  }

  return (
    <section className="min-h-screen py-8 bg-white dark:bg-slate-950 transition-colors duration-200">
      <div className="container-app mx-auto px-4">
        <header className="mb-8 text-center relative">
          <div className="inline-block p-4 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-3xl mb-4 shadow-lg ring-4 ring-white dark:ring-slate-900">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-3">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight font-['Poppins']">
              {group?.name || 'Group Details'}
            </h2>
            
            {/* ✅ ปุ่มเฟือง (Rename Chat) */}
            {isOwnerOrAdmin && (
              <button 
                onClick={openRenameChat} 
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Rename Chat"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            {group?.description || 'Chat, plan schedules, and rate members'}
          </p>

          <div className="flex items-center justify-center gap-4 mt-6">
            {/* ✅ ปุ่ม Edit Group (Settings) */}
            {isOwnerOrAdmin && (
              <button
                onClick={openEditSettings}
                className="px-5 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all font-semibold text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Group
              </button>
            )}

            <button
              onClick={() => setShowReportModal(true)}
              className="px-5 py-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-all font-semibold text-sm flex items-center gap-2 border border-red-100 dark:border-red-900/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Report Group
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
               <ChatPanel groupId={gid} />
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-8 transition-colors duration-200">
               <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                 <span className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">★</span> 
                 Group Reviews
               </h3>
               <GroupReviews groupId={gid} currentUserId={user?._id} />
            </div>
            
            <RatingDialog />
          </div>
          
          <div className="space-y-8">
            <AvailabilityPicker />
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="group"
        targetId={gid}
      />

      {group && (
        <EditGroupModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          targetId={group._id} 
          
          // ✅ ใช้ type="group" เสมอเพื่อยิง API ถูกต้อง
          type="group" 
          
          // ✅ ปรับโหมด Rename หรือ Full Edit
          renameOnly={isRenameMode} 
          
          isOwner={isOwnerOrAdmin}
          initialData={{
            name: group.name,
            description: group.description,
            maxMembers: group.maxMembers
          }}
          onUpdate={fetchGroup}
        />
      )}
    </section>
  );
}