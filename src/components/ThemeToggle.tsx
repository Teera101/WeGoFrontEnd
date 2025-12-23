import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  // อ่านค่า theme จาก localStorage หรือใช้ dark เป็นค่าเริ่มต้น
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'dark' : true;
    }
    return true;
  });

  useEffect(() => {
    // อัพเดท class ใน html element
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // บันทึกค่าลง localStorage
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      // ปรับปรุง: ใช้ ring-slate-300 สำหรับ Light mode เพื่อให้ขอบชัดขึ้น
      // ปรับปรุง: ใช้ hover:bg-slate-200 ให้เห็นชัดว่าเมาส์ชี้อยู่
      className="flex items-center gap-2 px-3 py-2 rounded-lg 
        ring-1 ring-slate-300 dark:ring-white/10 
        bg-white/50 dark:bg-transparent
        hover:bg-slate-200 dark:hover:bg-white/10 
        transition-all duration-200"
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle theme"
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {dark ? (
        <Moon className="w-4 h-4 text-white/90" />
      ) : (
        // ปรับปรุง: ใช้ text-slate-700 (เทาเข้มเกือบดำ) แทนสีจางๆ
        <Sun className="w-4 h-4 text-slate-700" />
      )}
      {/* ปรับปรุง: ปรับสี Text ให้เข้มขึ้นใน Light mode */}
      <span className="text-sm font-medium text-slate-700 dark:text-white/90">
        {dark ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}