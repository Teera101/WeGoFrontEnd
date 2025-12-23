// Schedule selection for group members (demo data)
//import { useMemo } from 'react';
import { useState, useEffect } from 'react';

type Slot = { day: string; hour: number };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Schedule() {
  const [picked, setPicked] = useState<Slot[]>([]);

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggle = (d: number, h: number) => {
    const i = picked.findIndex((s) => s.day === DAYS[d] && s.hour === h);
    if (i >= 0) setPicked((s) => s.filter((_, k) => k !== i));
    else setPicked((s) => [...s, { day: DAYS[d], hour: h }]);
  };

  const scoreByKey = picked.reduce<Record<string, number>>((acc, s) => {
    const k = `${s.day}-${s.hour}`;
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const best = Object.entries(scoreByKey).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <section className="min-h-screen py-8">
      <div className="container-app space-y-6">
        {/* Header with Icon */}
        <header className="mb-6 text-center">
          <div className="inline-block p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl mb-4 shadow-lg shadow-teal-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-pink-300 to-amber-400 bg-clip-text text-transparent font-['Poppins']">
            Match Schedule
          </h3>
          <p className="text-slate-400">Select your available times to find the best meeting slot</p>
        </header>

      <div className="card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4 text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-5 h-5 rounded bg-amber-500/30" /> ✅ Selected
          </span>
          <span className="inline-flex items-center gap-2 ml-4">
            <span className="inline-block w-5 h-5 rounded ring-2 ring-amber-400" /> 🌟 Best Match
          </span>
        </div>

        <table className="min-w-[720px] w-full border-separate border-spacing-2">
          <thead>
            <tr>
              <th className="text-left text-slate-300 font-semibold">⏰ ชั่วโมง</th>
              {DAYS.map((d) => (
                <th key={d} className="text-left text-slate-300 font-semibold">
                  {d === 'Mon' ? '🌙 จ.' : d === 'Tue' ? '🔥 อ.' : d === 'Wed' ? '💧 พ.' : d === 'Thu' ? '🌳 พฤ.' : d === 'Fri' ? '💎 ศ.' : d === 'Sat' ? '🌤️ ส.' : '☀️ อา.'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 14 }).map((_, row) => {
              const hour = 8 + row;
              return (
                <tr key={row}>
                  <td className="text-slate-400 text-sm font-medium">{hour}:00</td>
                  {DAYS.map((d, col) => {
                    const on = picked.some((s) => s.day === d && s.hour === hour);
                    const k = `${d}-${hour}`;
                    const isBest = best === k;
                    return (
                      <td key={col}>
                        <button
                          onClick={() => toggle(col, hour)}
                          className={`w-20 h-10 rounded-lg text-sm font-medium transition-all duration-300 ${
                            on ? 'bg-amber-500/30 scale-105' : 'bg-white/10 hover:bg-white/20 hover:scale-105'
                          } ${isBest ? 'ring-2 ring-amber-400 animate-pulse-subtle' : ''}`}
                          title={k}
                          aria-pressed={on}
                        >
                          {on ? '✔' : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card p-6 border border-white/10">
        <div className="font-semibold text-lg mb-2 text-amber-400">🎯 Best Time Match</div>
        <div className="text-slate-200 text-lg">{best ? `📅 ${best.replace('-', ' @ ')}` : '👆 Select times from the table to see the best match'}</div>
        </div>
      </div>
    </section>
  );
}
