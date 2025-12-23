import { useMemo, useState, useEffect } from 'react';
import { useEvents, Event } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { ALL_TAGS } from '../lib/demoData';
import TagFilterBar from '../components/TagFilterBar';
import EventCard from '../components/EventCard';
import EditGroupModal from '../components/EditGroupModal';

export default function Explore() {
  const { events, isLoading, fetchEvents } = useEvents();
  const { user } = useAuth();
  
  const [q, setQ] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  // State สำหรับ Modal
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const toggleTag = (t: string) => setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filtered = useMemo(() => {
    let arr: Event[] = [...events];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter((e) => 
        e.title.toLowerCase().includes(s) || 
        e.description.toLowerCase().includes(s) || 
        e.tags.some((t: string) => t.toLowerCase().includes(s))
      );
    }
    if (tags.length) arr = arr.filter((e) => tags.every((t) => e.tags.includes(t)));
    return arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [q, tags, events]);

  // ฟังก์ชันเปิด Modal
  const handleEditClick = (eventData: any) => {
    setEditingEvent(eventData);
    setShowEditModal(true);
  };

  return (
    <section className="min-h-screen py-8">
      <div className="container-app space-y-8">
        <header className="mb-6 text-center">
          <div className="inline-block p-3 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-800 via-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-300 bg-clip-text text-transparent font-['Poppins']">
            🌟 Explore Activities
          </h2>
          <p className="text-slate-600 dark:text-slate-400">ค้นหากิจกรรมและกลุ่มที่ตรงกับความสนใจของคุณ เริ่มต้นการผลผลิตใหม่วันนี้!</p>
        </header>

      <div>
        <TagFilterBar allTags={ALL_TAGS} active={tags} onToggle={toggleTag} query={q} onQuery={setQ} />
      </div>

      {!isLoading && filtered.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-full border border-amber-500/30">
              <span className="text-amber-600 dark:text-amber-400 font-bold text-lg">{filtered.length}</span>
              <span className="text-slate-600 dark:text-slate-300 ml-2">กิจกรรม</span>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            {tags.length > 0 && `กรองด้วย ${tags.length} แท็ก`}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="card p-16 text-center border-2 border-amber-500/20 shadow-2xl shadow-amber-500/10 bg-white dark:bg-slate-800">
            <div className="inline-block space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-amber-400/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-xl font-bold text-slate-800 dark:text-white">กำลังโหลดกิจกรรม...</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">รอสักครู่...</div>
            </div>
        </div>
      ) : filtered.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {filtered.map((ev) => {
            const isParticipant = !!(user && ev.participants?.some((p: any) => {
              if (!p) return false;
              const pid = typeof p === 'string' ? p : (p.user?._id || p.user);
              return pid === user._id;
            }));

            // ✅ [4] แก้ไข Logic เช็ค Owner ให้รองรับทั้ง String และ Object
            const createdById = ev.createdBy 
              ? (typeof ev.createdBy === 'string' ? ev.createdBy : ev.createdBy._id) 
              : null;
            const isCreator = !!(user && createdById === user._id);

            const participantsCount = ev.participants?.length || 0;
            let creatorIncluded = false;
            if (createdById && ev.participants && Array.isArray(ev.participants)) {
              creatorIncluded = ev.participants.some((p: any) => {
                if (!p) return false;
                const pid = typeof p === 'string' ? p : (p.user?._id || p.user);
                return pid === createdById;
              });
            }
            const popularity = participantsCount + (createdById && !creatorIncluded ? 1 : 0);

            return (
              <EventCard
                key={ev._id}
                event={{
                  id: ev._id,
                  title: ev.title,
                  about: ev.description,
                  cover: (!ev.cover || (typeof ev.cover === 'string' && (ev.cover.startsWith('blob:') || ev.cover.startsWith('file:')))) ? undefined : ev.cover,
                  tags: ev.tags,
                  location: ev.location,
                  date: ev.date,
                  participantsCount: participantsCount,
                  popularity: popularity
                }}
                maxParticipants={ev.maxParticipants}
                isParticipant={isParticipant}
                isCreator={isCreator}
                chatId={ev.chat}
                onUpdate={fetchEvents}
                onEdit={() => handleEditClick(ev)} // ✅ ส่งฟังก์ชันเปิด Modal
              />
            );
          })}
        </div>
      ) : (
        <div className="card p-16 text-center border-2 border-slate-200 dark:border-slate-700/50 shadow-xl space-y-4 bg-white dark:bg-slate-800">
            <div className="relative inline-block">
              <div className="text-8xl">🔍</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-slate-800 dark:text-white">ไม่พบกิจกรรม</div>
              <div className="text-slate-500 dark:text-slate-400">ลองเปลี่ยนคำค้นหาหรือลบตัวกรองบางส่วนดูนะ</div>
            </div>
            {(q || tags.length > 0) && (
              <button
                onClick={() => {
                  setQ('');
                  setTags([]);
                }}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-amber-500/50 transition-all duration-300"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        )}
      </div>

      {/* ✅ [5] Modal Controller */}
      {editingEvent && (
        <EditGroupModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          targetId={editingEvent._id}
          
          type="event" // 👈 กำหนด type เป็น event (สำคัญมาก!)
          
          isOwner={user?._id === (typeof editingEvent.createdBy === 'string' ? editingEvent.createdBy : editingEvent.createdBy?._id)}
          initialData={{
            name: editingEvent.title, // Map ข้อมูลให้ตรง
            description: editingEvent.description,
            maxMembers: editingEvent.maxParticipants || editingEvent.maxMembers
          }}
          onUpdate={() => {
            fetchEvents(); // โหลดข้อมูลใหม่หลังแก้เสร็จ
          }}
        />
      )}
    </section>
  );
}