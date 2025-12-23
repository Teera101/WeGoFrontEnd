import { useState } from 'react';
import { toast } from './Toasts';

export default function RatingDialog() {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState('');

  const submit = () => {
    setOpen(false);
    toast(`Thanks! You rated ${stars}★`);
    setStars(0);
    setNote('');
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Rate recent activity</div>
        <button className="btn-primary" onClick={() => setOpen(true)}>Open</button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                className={`h-10 w-10 rounded-full grid place-items-center ${
                  i <= stars ? 'bg-amber-400 text-black' : 'bg-white/10'
                }`}
                onClick={() => setStars(i)}
                aria-label={`${i} stars`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="input h-24"
            placeholder="Leave a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-lg ring-1 ring-white/10" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={submit}>Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}