import { useMemo, useState, useEffect } from 'react';
import { useEvents, Event } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { ALL_TAGS } from '../lib/demoData';
import TagFilterBar from '../components/TagFilterBar';
import EventCard from '../components/EventCard';
import EditGroupModal from '../components/EditGroupModal';
import RecommendedEvents from '../components/RecommendedEvents';
import { socket } from '../lib/socket';

export default function Explore() {
  const { events, isLoading, fetchEvents } = useEvents();
  const { user } = useAuth();
  
  const [q, setQ] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'joined'>('all');
  
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const toggleTag = (t: string) => setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleRealtimeUpdate = () => {
      fetchEvents();
    };

    socket.on('activity:create', handleRealtimeUpdate);
    socket.on('activity:update', handleRealtimeUpdate);
    socket.on('activity:delete', handleRealtimeUpdate);
    socket.on('group:create', handleRealtimeUpdate);
    socket.on('group:update', handleRealtimeUpdate);
    socket.on('group:delete', handleRealtimeUpdate);
    socket.on('participant:update', handleRealtimeUpdate);
    
    return () => {
      socket.off('activity:create', handleRealtimeUpdate);
      socket.off('activity:update', handleRealtimeUpdate);
      socket.off('activity:delete', handleRealtimeUpdate);
      socket.off('group:create', handleRealtimeUpdate);
      socket.off('group:update', handleRealtimeUpdate);
      socket.off('group:delete', handleRealtimeUpdate);
      socket.off('participant:update', handleRealtimeUpdate);
    };
  }, [fetchEvents]);

  const filtered = useMemo(() => {
    let arr: (Event & { isImportant?: boolean })[] = [...events];

    if (viewMode === 'joined' && user) {
      arr = arr.filter((ev) => {
        return ev.participants?.some((p: any) => {
          if (!p) return false;
          const pid = typeof p === 'string' ? p : (p.user?._id || p.user);
          return pid === user._id;
        });
      });
    }

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter((e) => 
        e.title.toLowerCase().includes(s) || 
        e.description.toLowerCase().includes(s) || 
        e.tags.some((t: string) => t.toLowerCase().includes(s))
      );
    }
    if (tags.length) arr = arr.filter((e) => tags.every((t) => e.tags.includes(t)));

    return arr.sort((a, b) => {
      if (a.isImportant && !b.isImportant) return -1;
      if (!a.isImportant && b.isImportant) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [q, tags, events, viewMode, user]);

  const handleEditClick = (eventData: any) => {
    setEditingEvent(eventData);
    setShowEditModal(true);
  };

  const importantEvents = viewMode === 'all' ? filtered.filter(ev => ev.isImportant) : [];
  const normalEvents = viewMode === 'all' ? filtered.filter(ev => !ev.isImportant) : filtered;

  return (
    <section className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-amber-400/20 dark:bg-amber-600/10 blur-[100px] mix-blend-multiply dark:mix-blend-lighten animate-blob" />
        <div className="absolute top-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[100px] mix-blend-multiply dark:mix-blend-lighten animate-blob animation-delay-2000" />
        <div className="absolute -bottom-[10%] left-[20%] w-[600px] h-[600px] rounded-full bg-pink-400/20 dark:bg-pink-600/10 blur-[100px] mix-blend-multiply dark:mix-blend-lighten animate-blob animation-delay-4000" />
      </div>

      <div className="container-app relative z-10 space-y-8 py-8 px-4 sm:px-6">
        
        <header className="relative overflow-hidden rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-xl dark:shadow-2xl dark:shadow-black/20 p-8 sm:p-12 text-center transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-purple-500/5 to-pink-500/5 dark:from-amber-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />
          
          <div className="relative">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-3xl mb-6 shadow-lg shadow-purple-500/30 transform hover:scale-110 transition-transform duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight bg-gradient-to-r from-slate-800 via-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-300 bg-clip-text text-transparent font-['Poppins']">
              Explore Activities
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              ค้นหากิจกรรมที่ใช่ กลุ่มคนที่ชอบ และเริ่มต้นประสบการณ์ใหม่ๆ ไปด้วยกัน
              <br className="hidden sm:block" /> พื้นที่สำหรับคนมีไฟในการทำกิจกรรม
            </p>
          </div>
        </header>

        <div className="flex justify-center">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-1.5 rounded-2xl inline-flex border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <button
              onClick={() => setViewMode('all')}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                viewMode === 'all' 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              กิจกรรมทั้งหมด
            </button>
            <button
              onClick={() => {
                if (!user) return;
                setViewMode('joined');
              }}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                viewMode === 'joined' 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              กิจกรรมที่เข้าร่วม
            </button>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm sticky top-4 z-30 transition-all duration-300">
          <TagFilterBar allTags={ALL_TAGS} active={tags} onToggle={toggleTag} query={q} onQuery={setQ} />
        </div>

        {viewMode === 'all' && !q && tags.length === 0 && (
          <RecommendedEvents />
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-2 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="px-4 py-1.5 bg-gradient-to-r from-amber-500/10 to-amber-600/10 dark:from-amber-500/20 dark:to-amber-600/20 rounded-full border border-amber-500/20 dark:border-amber-500/30 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-700 dark:text-amber-400 font-bold text-lg">{filtered.length}</span>
                <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">กิจกรรมที่พบ</span>
              </div>
            </div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
              {tags.length > 0 ? `กรองด้วย ${tags.length} แท็ก` : 'แสดงทั้งหมด'}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="mt-6 text-sm font-bold text-slate-700 dark:text-slate-200 animate-pulse">กำลังโหลดกิจกรรม...</div>
          </div>
        ) : filtered.length ? (
          <div className="space-y-10">
            
            {importantEvents.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
                    <i className="fas fa-bullhorn text-white text-lg"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-wider font-['Poppins']">Highlight Activities</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-amber-500/50 to-transparent"></div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {importantEvents.map((ev) => {
                    const isParticipant = !!(user && ev.participants?.some((p: any) => {
                      if (!p) return false;
                      const pid = typeof p === 'string' ? p : (p.user?._id || p.user);
                      return pid === user._id;
                    }));

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
                      <div key={ev._id} className="relative ring-4 ring-amber-500/30 dark:ring-amber-500/20 rounded-[2rem] transition-transform hover:-translate-y-1 duration-300 mt-2">
                        <div className="absolute -top-3 -left-3 z-20 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-4 py-1.5 rounded-2xl text-[10px] font-black shadow-xl flex items-center gap-2 border-2 border-white dark:border-slate-900 animate-pulse">
                          <i className="fas fa-star text-[8px]"></i> ADMIN PICK
                        </div>
                        <EventCard
                          event={{
                            id: ev._id,
                            title: ev.title,
                            about: ev.description,
                            cover: (!ev.cover || (typeof ev.cover === 'string' && (ev.cover.startsWith('blob:') || ev.cover.startsWith('file:')))) ? undefined : ev.cover,
                            tags: ev.tags,
                            location: ev.location,
                            date: ev.date,
                            time: ev.time,
                            participantsCount: participantsCount,
                            popularity: popularity
                          }}
                          maxParticipants={ev.maxParticipants}
                          isParticipant={isParticipant}
                          isCreator={isCreator}
                          chatId={ev.chat}
                          onUpdate={fetchEvents}
                          onEdit={() => handleEditClick(ev)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {importantEvents.length > 0 && (
                <div className="flex items-center gap-3 px-2 pt-4">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 font-['Poppins'] uppercase tracking-widest">Other Activities</h3>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                </div>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {normalEvents.map((ev) => {
                  const isParticipant = !!(user && ev.participants?.some((p: any) => {
                    if (!p) return false;
                    const pid = typeof p === 'string' ? p : (p.user?._id || p.user);
                    return pid === user._id;
                  }));

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
                    <div key={ev._id} className="transform hover:-translate-y-1 transition-transform duration-300">
                      <EventCard
                        event={{
                          id: ev._id,
                          title: ev.title,
                          about: ev.description,
                          cover: (!ev.cover || (typeof ev.cover === 'string' && (ev.cover.startsWith('blob:') || ev.cover.startsWith('file:')))) ? undefined : ev.cover,
                          tags: ev.tags,
                          location: ev.location,
                          date: ev.date,
                          time: ev.time,
                          participantsCount: participantsCount,
                          popularity: popularity
                        }}
                        maxParticipants={ev.maxParticipants}
                        isParticipant={isParticipant}
                        isCreator={isCreator}
                        chatId={ev.chat}
                        onUpdate={fetchEvents}
                        onEdit={() => handleEditClick(ev)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="bg-slate-100 dark:bg-slate-800/50 p-8 rounded-full mb-6 ring-8 ring-slate-50 dark:ring-slate-900 shadow-inner">
              <span className="text-6xl filter grayscale opacity-50">🔭</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">ไม่พบกิจกรรมที่คุณค้นหา</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
              ลองปรับคำค้นหา หรือลบตัวกรองบางอย่างออกดูนะ หรือจะเริ่มสร้างกิจกรรมใหม่เองเลยก็ได้!
            </p>
            {(q || tags.length > 0 || viewMode === 'joined') && (
              <button
                onClick={() => {
                  setQ('');
                  setTags([]);
                  setViewMode('all');
                }}
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        )}
      </div>

      {editingEvent && (
        <EditGroupModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          targetId={editingEvent._id}
          type="event"
          isOwner={user?._id === (typeof editingEvent.createdBy === 'string' ? editingEvent.createdBy : editingEvent.createdBy?._id)}
          initialData={{
            name: editingEvent.title,
            description: editingEvent.description,
            maxMembers: editingEvent.maxParticipants || editingEvent.maxMembers
          }}
          onUpdate={() => {
            fetchEvents();
          }}
        />
      )}
    </section>
  );
}