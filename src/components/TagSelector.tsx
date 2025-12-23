import { useState } from 'react';

export default function TagSelector({
  value,
  onChange,
  suggestions = ['กีฬา', 'กาแฟ', 'บอร์ดเกม', 'เดินป่า', 'ดนตรี', 'โยคะ', 'อาหาร', 'ท่องเที่ยว', 'ศิลปะ'],
  disabled = false,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  suggestions?: string[];
  disabled?: boolean;
}) {
  const [input, setInput] = useState('');

  const add = (t: string) => {
    const tag = t.trim().toLowerCase();
    if (!tag) return;
    if (value.includes(tag)) return;
    onChange([...value, tag]);
    setInput('');
  };
  const remove = (t: string) => onChange(value.filter((x) => x !== t));

  return (
    <div>
      {/* ส่วนแสดง Tag ที่ถูกเลือกแล้ว */}
      <div className="flex flex-wrap gap-2 mb-3">
        {value.map((t) => (
          <span 
            key={t} 
            // กำหนดสีพื้นหลังและตัวอักษรใหม่ ไม่ใช้ class 'tag' เดิมที่อาจจะล็อคสีขาวไว้
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-500/30 transition-colors"
          >
            {t}
            <button 
              type="button" 
              className="hover:text-amber-700 dark:hover:text-amber-50 opacity-60 hover:opacity-100 transition-opacity focus:outline-none" 
              onClick={() => !disabled && remove(t)}
              disabled={disabled}
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* ช่องกรอกข้อมูล */}
      <div className="flex gap-2">
        <input
          // กำหนดสีพื้นหลัง (bg-slate-100) และสีตัวอักษร (text-slate-900) ให้ชัดเจนใน Light mode
          className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
          placeholder="พิมพ์แท็กแล้วกด Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !disabled) {
              e.preventDefault();
              add(input);
            }
          }}
        />
        <button 
          type="button" 
          className="px-6 py-2.5 font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          onClick={() => add(input)}
          disabled={disabled}
        >
          เพิ่ม
        </button>
      </div>

      {/* ปุ่มแนะนำ Tag */}
      {!!suggestions.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              type="button"
              key={s}
              // กำหนดสีขอบ (border-slate-300) และสีตัวอักษร (text-slate-600) ให้ชัดเจน
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/20 transition-colors"
              onClick={() => add(s)}
              disabled={disabled}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}