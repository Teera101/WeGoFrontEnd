// apps/frontend/src/pages/groups/GroupList.tsx
import { useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DEMO_EVENTS, DEMO_GROUPS, GroupItem, joinGroup } from '../../lib/demoData';

export default function GroupsList() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const eventId = sp.get('event');

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const event = useMemo(() => DEMO_EVENTS.find((e) => e.id === eventId), [eventId]);
  const groups = useMemo<GroupItem[]>(
    () => DEMO_GROUPS.filter((g) => g.eventId === eventId),
    [eventId]
  );

  return (
    <section className="min-h-screen py-8">
      <div className="container-app space-y-6">
        {/* Header Section with Icon */}
        <header className="space-y-4 text-center">
          <div className="inline-block p-3 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl mb-4 shadow-lg shadow-rose-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-pink-300 to-amber-400 bg-clip-text text-transparent font-['Poppins']">
            Activity Groups
          </h3>
          {event ? (
            <div className="card p-4 border border-white/10 max-w-2xl mx-auto">
              <div className="flex items-center gap-4">
              <img src={event.cover} className="h-16 w-24 object-cover rounded-lg ring-2 ring-amber-400/30 contrast-110 brightness-105" />
              <div className="flex-1">
                <div className="font-bold text-lg text-amber-400">{event.title}</div>
                <div className="text-sm text-slate-300">📍 {event.location}</div>
              </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-300 text-lg">🔍 Select an activity from Explore to see groups</div>
          )}
        </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((g) => (
          <div key={g.id} className="card p-5 space-y-3 border border-white/10 hover:border-white/20 transition-all duration-300 h-full flex flex-col">
            <div className="flex items-start justify-between">
              <div className="font-bold text-lg text-amber-400">{g.name}</div>
              <div className="text-xs bg-white/10 px-2 py-1 rounded-full font-medium">
                👥 {g.members}{g.max ? ` / ${g.max}` : ''}
              </div>
            </div>
            <div className="text-sm text-slate-300 flex-1">{g.description ?? '🎉 Welcome new members!'}</div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  joinGroup(g.id);
                  navigate(`/groups/${g.id}`);
                }}
                className="flex-1 px-5 py-2.5 font-semibold text-white rounded-lg bg-amber-500 hover:bg-amber-400 transition-all duration-300"
              >
                💬 Join & Chat
              </button>
            </div>
          </div>
        ))}
      </div>

      {!groups.length && (
        <div className="card p-8 text-center border border-white/10">
            <div className="text-6xl mb-4">😔</div>
            <div className="text-lg text-slate-200">No groups available for this activity</div>
            <div className="text-sm text-slate-400 mt-2">Be the first to create one!</div>
        </div>
      )}
      </div>
    </section>
  );
}
