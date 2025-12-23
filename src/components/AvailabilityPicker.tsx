import { useEffect, useMemo, useState } from 'react';
import { toast } from './Toasts';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const blocks = Array.from({ length: 12 }, (_, i) => i * 2);

export type AvailabilityMap = Record<string, number[]>;

export default function AvailabilityPicker() {
  const [avail, setAvail] = useState<AvailabilityMap>({});

  useEffect(() => {
    const raw = localStorage.getItem('wego_availability');
    if (raw) setAvail(JSON.parse(raw));
  }, []);

  const toggle = (day: string, hour: number) => {
    setAvail((s) => {
      const cur = new Set(s[day] || []);
      if (cur.has(hour)) cur.delete(hour);
      else cur.add(hour);
      return { ...s, [day]: Array.from(cur).sort((a, b) => a - b) };
    });
  };

  const count = useMemo(
    () => Object.values(avail).reduce((acc, arr) => acc + (arr?.length || 0), 0),
    [avail]
  );

  const save = () => {
    localStorage.setItem('wego_availability', JSON.stringify(avail));
    toast('Availability saved');
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Your Availability</h3>
        <button className="btn-primary" onClick={save}>
          Save
        </button>
      </div>
      <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-2">
        <div className="opacity-70 text-sm">Hour</div>
        {days.map((d) => (
          <div key={d} className="text-center text-sm font-semibold">
            {d}
          </div>
        ))}

        {blocks.map((h) => (
          <>
            <div key={`label-${h}`} className="text-sm opacity-70">
              {String(h).padStart(2, '0')}:00
            </div>
            {days.map((d) => {
              const on = avail[d]?.includes(h);
              return (
                <button
                  key={`${d}-${h}`}
                  className={`h-8 rounded-lg ring-1 ring-white/10 ${
                    on ? 'bg-emerald-500/70' : 'bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => toggle(d, h)}
                  title={`${d} ${h}:00`}
                />
              );
            })}
          </>
        ))}
      </div>
      <div className="mt-3 text-sm opacity-80">Selected blocks: {count}</div>
    </div>
  );
}