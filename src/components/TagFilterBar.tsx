import { useMemo } from 'react';

type Props = {
  allTags: string[];
  active: string[];
  onToggle: (tag: string) => void;
  query: string;
  onQuery: (q: string) => void;
};

export default function TagFilterBar({ allTags, active, onToggle, query, onQuery }: Props) {
  const ordered = useMemo(
    () => [...allTags].sort((a, b) => Number(active.includes(b)) - Number(active.includes(a))),
    [allTags, active]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <input
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Search events..."
        className="input max-w-lg bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white placeholder:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all shadow-sm dark:shadow-none"
      />
      <div className="flex flex-wrap gap-2">
        {ordered.map((t) => {
          const isOn = active.includes(t);
          return (
            <button
              key={t}
              onClick={() => onToggle(t)}
              className={
                'px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 border ' +
                (isOn 
                  ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20' 
                  : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20')
              }
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}