// Purpose: members list UI with clickable profiles
import { useState } from 'react';
import ProfileModal from './ProfileModal';

export default function MemberList() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const members = [
    { id: '1', name: 'Mina', role: 'owner' },
    { id: '2', name: 'Kai', role: 'member' },
    { id: '3', name: 'Fah', role: 'member' }
  ];
  
  return (
    <>
      <div className="card p-4">
        <div className="text-lg font-semibold mb-3">Members</div>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 -ml-2 transition-colors flex-1"
                onClick={() => setSelectedUserId(m.id)}
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 grid place-items-center flex-shrink-0">
                  <span className="text-white font-bold">{m.name[0]}</span>
                </div>
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs opacity-70">{m.role}</div>
                </div>
              </div>
              <button className="px-3 py-1 rounded-lg ring-1 ring-white/10 hover:bg-white/10 text-sm transition-colors">
                Message
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={selectedUserId !== null}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId}
      />
    </>
  );
}