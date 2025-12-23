import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../lib/api';
import { toast } from './Toasts';
import { useAuth } from '../hooks/useAuth';
import ReportModal from './ReportModal';
import { MapPin, Calendar, Edit } from 'lucide-react'; // เพิ่ม icon Edit ถ้าต้องการใช้

interface EventCardProps {
  event: {
    id: string;
    title: string;
    cover?: string;
    about: string;
    tags: string[];
    location?: string | { coordinates?: number[]; address?: string };
    date?: string;
    popularity?: number;
    participantsCount?: number;
  };
  maxParticipants?: number;
  isParticipant?: boolean;
  isCreator?: boolean;
  chatId?: string;
  onUpdate?: () => void;
  onEdit?: () => void; // ✅ [1] เพิ่ม Interface onEdit
}

export default function EventCard({ 
  event, 
  maxParticipants, 
  isParticipant = false, 
  isCreator = false, 
  chatId, 
  onUpdate,
  onEdit // ✅ [2] รับ prop onEdit เข้ามา
}: EventCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleJoin = async () => {
    if (!user) {
      toast('กรุณาเข้าสู่ระบบก่อนเข้าร่วมกิจกรรม');
      navigate('/signin');
      return;
    }

    try {
      setIsJoining(true);
      const response = await eventsAPI.join(event.id);
      toast('เข้าร่วมกิจกรรมสำเร็จ!');
      
      if (response.data.chatId) {
        navigate(`/dm/${response.data.chatId}`);
      } else if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Join error:', error);
      toast(error?.message || 'ไม่สามารถเข้าร่วมกิจกรรมได้');
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    try {
      setIsJoining(true);
      await eventsAPI.leave(event.id);
      toast('ออกจากกิจกรรมสำเร็จ');
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Leave error:', error);
      toast(error.response?.data?.error || 'ไม่สามารถออกจากกิจกรรมได้');
    } finally {
      setIsJoining(false);
    }
  };

  // Logic คำนวณจำนวนคน
  const participantsArray = Array.isArray((event as any).participants) ? (event as any).participants : null;
  let storedParticipants = 0;
  let creatorOccupiesSlot = false;
  let computedParticipants = 0;

  if (participantsArray) {
    const ids = participantsArray
      .map((p: any) => (p && p.user ? String(p.user._id || p.user) : null))
      .filter(Boolean) as string[];
    const uniqueIds = Array.from(new Set(ids));
    storedParticipants = uniqueIds.length;
    const creatorId = (event as any).createdBy ? String((event as any).createdBy) : null;
    creatorOccupiesSlot = creatorId ? !uniqueIds.includes(creatorId) : false;
    computedParticipants = storedParticipants + (creatorOccupiesSlot ? 1 : 0);
  } else {
    storedParticipants = event.participantsCount ?? 0;
    if ((event as any).popularity != null) {
      creatorOccupiesSlot = (event as any).popularity > storedParticipants;
    } else {
      creatorOccupiesSlot = false;
    }
    computedParticipants = storedParticipants + (creatorOccupiesSlot ? 1 : 0);
  }

  const displayedPopularity = event.popularity ?? computedParticipants;
  const displayIsFullyBooked = maxParticipants ? displayedPopularity >= maxParticipants : false;
  const effectiveCount = computedParticipants;
  const joinBlockedForNonCreator = maxParticipants ? effectiveCount >= maxParticipants : false;

  // Logic จัดการรูปภาพปก
  let coverImage = undefined as string | undefined;
  const hasCover = !!event.cover;
  
  if (hasCover) {
    if (event.cover!.startsWith('/') && !event.cover!.startsWith('blob:')) {
      coverImage = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${event.cover}`;
    } else {
      coverImage = event.cover;
    }
  }

  return (
    <>
      <article className="card overflow-hidden group hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 border border-slate-200 dark:border-transparent hover:border-amber-400 dark:hover:border-amber-500/30 bg-white dark:bg-slate-800 flex flex-col h-full">
        {/* ส่วนรูปปก (Cover) */}
        <div className="relative h-48 sm:h-56 overflow-hidden shrink-0">
          {coverImage ? (
            <>
              <img
                src={coverImage}
                alt={event.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            </>
          ) : (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 text-center transition-colors duration-300
              bg-gradient-to-br from-amber-50 via-orange-100 to-amber-100 
              dark:from-slate-700 dark:via-slate-800 dark:to-slate-900"
            >
              <h3 className="text-3xl font-bold font-['Poppins'] break-words w-full line-clamp-3
                text-amber-700/80 
                dark:text-amber-500"
              >
                {event.title}
              </h3>
            </div>
          )}

          {/* Badge จำนวนคน */}
          {maxParticipants && (
            <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-slate-200 dark:border-white/10 z-10">
              <span className={displayIsFullyBooked ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                {displayedPopularity}/{maxParticipants}
              </span>
            </div>
          )}
        
          {/* ข้อมูลสถานที่และเวลา (โชว์ตอน Hover) */}
          <div className="absolute bottom-3 left-3 right-3 space-y-1.5 z-10">
             <div className="flex flex-col gap-1.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                {event.location && (
                  <div className="flex items-center gap-2 text-xs font-medium bg-white/95 dark:bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm text-slate-700 dark:text-white w-fit max-w-full">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">
                      {typeof event.location === 'string' ? event.location : event.location?.address || 'ไม่ระบุสถานที่'}
                    </span>
                  </div>
                )}
                {event.date && (
                  <div className="flex items-center gap-2 text-xs font-medium bg-white/95 dark:bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm text-slate-700 dark:text-white w-fit">
                    <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{new Date(event.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* ส่วนเนื้อหาการ์ด */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 font-['Poppins'] leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {event.title}
            </h3>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed h-10">
              {event.about || "ไม่มีรายละเอียดเพิ่มเติม"}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {event.tags.slice(0, 3).map((t) => (
                <span key={t} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                  {t}
                </span>
              ))}
              {event.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600/50">
                  +{event.tags.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* ปุ่ม Action */}
          <div className="pt-5 mt-auto flex gap-3">
            {isParticipant ? (
              <>
                {chatId && (
                  <button
                    onClick={() => navigate(`/dm/${chatId}`)}
                    className="flex-1 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                    แชท
                  </button>
                )}
                
                {/* ✅ [3] ปุ่ม Edit สำหรับ Creator */}
                {isCreator && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (onEdit) onEdit();
                    }}
                    className="flex-1 px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 font-semibold transition-all border border-slate-200 dark:border-slate-600"
                  >
                    แก้ไข
                  </button>
                )}

                {/* ปุ่ม Leave (ซ่อนถ้าเป็น Creator) */}
                {!isCreator && (
                  <button
                    onClick={handleLeave}
                    className="flex-1 px-4 py-2 text-sm rounded-lg bg-white dark:bg-white/5 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                    disabled={isJoining}
                  >
                    {isJoining ? '...' : 'ออก'}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleJoin}
                className={`flex-1 px-4 py-2.5 text-sm rounded-lg font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 text-white ${
                  joinBlockedForNonCreator && !isCreator
                    ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed shadow-none hover:translate-y-0'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25'
                }`}
                disabled={isJoining || (joinBlockedForNonCreator && !isCreator)}
              >
                {isJoining ? (
                  <>รอสักครู่...</>
                ) : (joinBlockedForNonCreator && !isCreator) ? (
                  <>เต็มแล้ว</>
                ) : (
                  <>เข้าร่วมกิจกรรม</>
                )}
              </button>
            )}
          </div>
        </div>
      </article>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="activity"
        targetId={event.id}
      />
    </>
  );
}