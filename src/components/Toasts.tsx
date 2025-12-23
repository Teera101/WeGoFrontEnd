import { useEffect, useState } from 'react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let pushFn: ((msg: string, type?: 'success' | 'error' | 'info') => void) | null = null;

export function toast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
  pushFn?.(msg, type);
}

export default function Toasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  
  useEffect(() => {
    let idCounter = 0;
    pushFn = (m: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = idCounter++;
      setItems((s) => [...s, { id, message: m, type }]);
      setTimeout(() => setItems((s) => s.filter(item => item.id !== id)), 3500);
    };
    return () => {
      pushFn = null;
    };
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
      case 'success':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getStyles = (type: string) => {
    switch(type) {
      case 'success':
        return 'bg-gradient-to-r from-emerald-500/95 to-green-500/95 border-emerald-400/30';
      case 'error':
        return 'bg-gradient-to-r from-red-500/95 to-rose-500/95 border-red-400/30';
      default:
        return 'bg-gradient-to-r from-slate-700/95 to-slate-600/95 border-slate-500/30';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-[60] space-y-3 max-w-md">
      {items.map((item) => (
        <div
          key={item.id}
          className={`
            flex items-start gap-3 px-5 py-4 rounded-xl border-2 
            text-white shadow-2xl backdrop-blur-sm
            animate-slide-in-right
            ${getStyles(item.type)}
          `}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(item.type)}
          </div>
          <div className="flex-1 font-medium text-sm leading-relaxed">
            {item.message}
          </div>
        </div>
      ))}
    </div>
  );
}