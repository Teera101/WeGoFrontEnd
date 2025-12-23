import { useEffect, useRef, useState } from 'react';
import { useDM } from '../hooks/useDM';

export default function DMFloating() {
  const { isOpen, openPeer, closeDM, getMsgs, sendTo, meUid } = useDM();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const msgs = isOpen && openPeer ? getMsgs(openPeer.uid) : [];
  
  useEffect(() => {
    if (isOpen && openPeer) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [msgs, isOpen, openPeer]);

  if (!isOpen || !openPeer) return null;

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    sendTo(openPeer.uid, t);
    setText('');
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 z-50 animate-slide-in-right">
      {/* Container หลัก:
          - Light: สีขาว ขอบเทา (สะอาด)
          - Dark: สีเทาเข้มเกือบดำ (Slate-900) ขอบเทาเข้ม (Slate-700) -> ทึบและเนียนตา
      */}
      <div className="flex flex-col h-[600px] rounded-2xl shadow-2xl overflow-hidden 
        bg-white border border-slate-200 
        dark:bg-slate-900 dark:border-slate-700">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 
          bg-white/95 border-b border-slate-200 backdrop-blur-md
          dark:bg-slate-800 dark:border-slate-700 dark:backdrop-blur-none shadow-sm">
          
          <div className="flex items-center gap-3">
            <div className="relative">
              {openPeer.avatar ? (
                <img
                  src={openPeer.avatar}
                  alt={openPeer.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-600 shadow-md"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-slate-100 dark:ring-slate-600 shadow-md">
                  {openPeer.name.charAt(0).toUpperCase()}
                </div>
              )}
              {openPeer.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm"></span>
              )}
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-white text-base">{openPeer.name}</div>
              {openPeer.isOnline ? (
                <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></span>
                  <span>Active now</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full"></span>
                  <span>Offline</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={closeDM}
            className="w-8 h-8 rounded-lg transition-all duration-300 flex items-center justify-center group
              hover:bg-slate-100 text-slate-400 hover:text-red-500
              dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-red-400"
            aria-label="Close"
            title="Close"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 thin-scrollbar
          bg-slate-50
          dark:bg-slate-900">
          
          {msgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="relative">
                <div className="text-6xl animate-bounce-subtle opacity-50 dark:opacity-30">💬</div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-xs">✨</span>
                </div>
              </div>
              <div>
                <div className="text-slate-700 dark:text-slate-200 font-semibold mb-1">Start a conversation</div>
                <div className="text-slate-500 dark:text-slate-500 text-sm">Send a message to {openPeer.name}</div>
              </div>
            </div>
          ) : (
            <>
              {msgs.map((m, i) => {
                const mine = (typeof m.from === 'object' ? m.from._id : m.from) === meUid;
                const fromUser = typeof m.from === 'object' ? m.from : null;
                const displayAvatar = !mine && fromUser ? fromUser.avatar : openPeer.avatar;
                const displayName = !mine && fromUser ? fromUser.username : openPeer.name;
                
                return (
                  <div key={m._id || i} className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[75%] ${mine ? '' : 'flex gap-2'}`}>
                      {!mine && (
                        <div className="flex-shrink-0 mt-auto mb-1">
                          {displayAvatar ? (
                            <img src={displayAvatar} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xs">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        {/* Bubble:
                           - Mine: สีส้ม (Amber) เสมอ
                           - Theirs: 
                             - Light: ขาว ขอบเทา
                             - Dark: เทาเข้ม (Slate-800) ขอบเทา (Slate-700)
                        */}
                        <div
                          className={`px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-300 ${
                            mine
                              ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-br-md shadow-md'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md dark:bg-slate-800 dark:text-white dark:border-slate-700'
                          }`}
                        >
                          <div className="break-words text-sm leading-relaxed">{m.text}</div>
                        </div>
                        <div className={`text-[10px] mt-1 px-1 ${mine ? 'text-right text-slate-400' : 'text-left text-slate-400 dark:text-slate-500'}`}>
                          {new Date(m.createdAt).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 
          bg-white border-t border-slate-200
          dark:bg-slate-800 dark:border-t dark:border-slate-700">
          
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
                </svg>
              </div>
              <textarea
                className="w-full pl-12 pr-4 py-3 text-sm rounded-xl resize-none shadow-inner transition-all duration-300
                  bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-500 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20
                  dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-amber-500/50 dark:hover:bg-slate-950"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="พิมพ์ข้อความ…"
                rows={1}
                style={{
                  minHeight: '44px',
                  maxHeight: '120px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            </div>
            <button 
              className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:via-amber-500 hover:to-amber-600 text-white font-semibold shadow-xl shadow-amber-500/40 hover:shadow-amber-500/60 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
              onClick={handleSend}
              disabled={!text.trim()}
              title="Send message (Enter)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 ml-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}