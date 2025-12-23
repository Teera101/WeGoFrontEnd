import { useEffect, useRef, useState } from 'react';
import { socket } from '../lib/socket';
import { toast } from './Toasts';

type ChatMsg = { id: string; text: string; user: string; at: number; readBy: string[] };

export default function ChatPanel({ groupId }: { groupId: string }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.emit('joinGroup', groupId);
    socket.on('chatMessage', (m: ChatMsg) => setMsgs((s) => [...s, m]));
    socket.on('typing', (u: string) => {
      setTyping(u);
      setTimeout(() => setTyping(null), 1200);
    });
    socket.on('messageRead', (payload: { messageId: string; userId: string }) => {
      setMsgs((s) =>
        s.map((m) =>
          m.id === payload.messageId && !m.readBy.includes(payload.userId)
            ? { ...m, readBy: [...m.readBy, payload.userId] }
            : m
        )
      );
    });

    return () => {
      socket.off('chatMessage');
      socket.off('typing');
      socket.off('messageRead');
      socket.emit('leaveGroup', groupId);
    };
  }, [groupId]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [msgs.length]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const payload: ChatMsg = {
      id: crypto.randomUUID(),
      text,
      user: 'me',
      at: Date.now(),
      readBy: ['me']
    };
    
    socket.emit('chatMessage', { groupId, message: payload });
    setMsgs((s) => [...s, payload]);
    setInput('');
    toast('Message sent');
  };

  return (
    <div className="card p-3 h-[480px] flex flex-col">
      <div className="font-semibold mb-2">Group Chat</div>
      <div className="flex-1 overflow-y-auto space-y-2 px-1">
        {msgs.map((m) => (
          <div key={m.id} className={`max-w-[80%] ${m.user === 'me' ? 'ml-auto text-right' : ''}`}>
            <div className={`bg-white/10 rounded-lg px-3 py-2 inline-block text-left`}>
              <div className="break-words break-all whitespace-pre-wrap">
                {m.text}
              </div>
              <div className="text-[10px] opacity-60 mt-1">
                {new Date(m.at).toLocaleTimeString()} • Read: {m.readBy.length}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {typing && <div className="text-xs opacity-70 mt-1">{typing} is typing…</div>}
      <div className="mt-2 flex gap-2">
        <input
          className="input flex-1"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            socket.emit('typing', groupId);
          }}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message…"
        />
        <button onClick={send} className="btn-primary">Send</button>
      </div>
    </div>
  );
}