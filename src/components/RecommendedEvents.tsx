import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import EventCard from './EventCard';

export default function RecommendedEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const response = await api.get('/events/matchmaking');
      setEvents(response.data);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  if (isLoading || events.length === 0) {
    return null;
  }

  return (
    <div className="mb-10 w-full animate-fade-in">
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          กิจกรรมที่เหมาะกับคุณ
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {events.map((ev) => {
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
            <div key={ev._id} className="relative transform hover:-translate-y-1 transition-transform duration-300 mt-2">
              <div className="absolute -top-3 -right-2 z-20 bg-gradient-to-r from-amber-500 to-pink-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-amber-500/30 border-2 border-white dark:border-slate-900">
                ✨ แมตช์สำหรับคุณ!
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
                  participantsCount: participantsCount,
                  popularity: popularity
                }}
                maxParticipants={ev.maxParticipants}
                isParticipant={isParticipant}
                isCreator={isCreator}
                chatId={ev.chat}
                onUpdate={fetchMatches}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}