import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../components/Toasts';
import { Edit3 } from 'lucide-react';

const BIO_MAX = 240;
const AVATAR_MAX_MB = 5;

async function compressImage(file: File, maxSide = 512, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: true })!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b as Blob), 'image/jpeg', quality)
  );
  return blob;
}

export default function Profile() {
  const { user } = useAuth();
  const { data, isLoading, updateProfile } = useProfile();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const bioRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (data || user) {
      const emailPrefix = user?.email?.split('@')[0] || '';
      setName(data?.name || emailPrefix);
      setBio(data?.bio || '');
      setAvatar(data?.avatar || '');
    }
  }, [data, user]);

  useEffect(() => {
    return () => {
      if (avatar && avatar.startsWith('blob:')) {
        URL.revokeObjectURL(avatar);
      }
    };
  }, [avatar]);

  const openFilePicker = () => fileInputRef.current?.click();

  const _apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:10000/api').replace(/\/api\/?$/i, '');

  const onSelectFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please select an image file', 'error');
      return;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > AVATAR_MAX_MB) {
      toast(`File too large (max ${AVATAR_MAX_MB} MB)`, 'error');
      return;
    }

    let blob: Blob;
    try {
      blob = await compressImage(file, 512, 0.82);
    } catch {
      blob = file;
    }

    let localUrl: string | null = null;
    try {
      if (avatar && avatar.startsWith('blob:')) {
        URL.revokeObjectURL(avatar);
      }
      
      localUrl = URL.createObjectURL(blob);
      setAvatar(localUrl);
      setUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

  const response = await fetch(`${_apiBase}/api/profiles/avatar`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const data = await response.json();
      
      await updateProfile({ name, bio, avatar: data.avatarUrl });
      setAvatar(data.avatarUrl);
      setUploading(false);
      setProgress(100);
      toast('รูปโปรไฟล์อัปเดตสำเร็จ! ✨', 'success');

      if (localUrl) {
        const urlToRevoke: string = localUrl; 
        setTimeout(() => {
          try {
            URL.revokeObjectURL(urlToRevoke);
          } catch (err) {
          }
        }, 300);
      }
    } catch (error: any) {
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
      setAvatar('');
      setUploading(false);
      setProgress(0);
      console.error('Upload error:', error);
      toast('Failed to upload image. Please try again.', 'error');
    }
  };

  const removeAvatar = async () => {
    try {
      if (avatar && avatar.startsWith('blob:')) {
        URL.revokeObjectURL(avatar);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

  const response = await fetch(`${_apiBase}/api/profiles/avatar`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete avatar');
      }

      setAvatar('');
      await updateProfile({ name, bio, avatar: '' });
      toast('รูปโปรไฟล์ถูกลบแล้ว', 'success');
    } catch (error) {
      console.error('Remove avatar error:', error);
      toast('Failed to remove picture', 'error');
    }
  };

  const save = async () => {
    try {
      if (bio.length > BIO_MAX) {
        toast(`Bio exceeds ${BIO_MAX} characters`, 'error');
        return;
      }
      await updateProfile({ name, bio, avatar });
      toast('โปรไฟล์อัปเดตสำเร็จ! ✨', 'success');
      setIsEditingName(false);
      setIsEditingBio(false);
    } catch (error) {
      console.error('Update profile error:', error);
      toast('Failed to update profile', 'error');
    }
  };

  if (!user) {
    return (
      <section className="container-app py-8">
        <div className="card p-4">Please sign in to view profile.</div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="container-app py-8">
        <div className="card p-4">Loading…</div>
      </section>
    );
  }

  const firstChar = (name || user.email || '?').charAt(0).toUpperCase();

  return (
    <section className="min-h-screen py-8">
      <div className="container-app">
        <header className="mb-6 text-center">
          <div className="inline-block p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-purple-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-800 via-pink-600 to-amber-600 dark:from-white dark:via-pink-300 dark:to-amber-400 bg-clip-text text-transparent font-['Poppins']">
            Profile Settings
          </h2>
          <p className="text-slate-600 dark:text-slate-400">Manage your account information and preferences</p>
        </header>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[320px,minmax(0,640px)] items-start justify-center">
        <aside className="card p-5 space-y-4 self-start bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 shadow-sm dark:shadow-none">
            <h3 className="text-lg font-semibold text-amber-500 dark:text-amber-400 font-['Poppins']">Profile Picture</h3>
            
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0">
                {avatar ? (
                  <>
                    <img
                      src={avatar}
                      alt="Avatar"
                      className="h-24 w-24 rounded-full object-cover ring-2 ring-amber-400/40 hover:ring-amber-400/60 transition-all duration-300 contrast-110 brightness-105"
                    />
                  </>
                ) : (
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-3xl font-semibold ring-2 ring-amber-400/40 text-slate-600 dark:text-white">
                    {firstChar}
                  </div>
                )}
                {uploading && (
                  <div className="absolute -bottom-2 left-1/2 w-24 -translate-x-1/2 rounded-full bg-white/10">
                    <div
                      className="h-1 rounded-full bg-gradient-to-r from-amber-400 to-pink-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={openFilePicker}
                  className="rounded-lg px-5 py-2.5 font-semibold text-white bg-amber-500 hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 transition-all duration-300 disabled:opacity-60"
                  disabled={uploading}
                >
                  {uploading ? '⏳ กำลังอัปโหลด…' : '📸 Upload'}
                </button>
                {avatar && (
                  <button
                    onClick={removeAvatar}
                    className="rounded-lg px-5 py-2.5 font-semibold border border-red-400/40 bg-red-500/10 hover:bg-red-500/20 hover:border-red-400/60 text-red-500 dark:text-red-300 transition-all duration-300"
                  >
                    🗑️ Remove
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-slate-500 dark:text-white/60">แนะนำไม่เกิน {AVATAR_MAX_MB}MB</p>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-white/10 pt-4 space-y-3">
              <div className="text-base font-semibold text-amber-500 dark:text-amber-400">🔐 Your account</div>
              <div className="space-y-1.5">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">👤 {name}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">📧 {user.email}</div>
              </div>
            </div>
        </aside>

        <main className="card p-6 space-y-6 self-start w-full max-w-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 shadow-sm dark:shadow-none">
            <h3 className="text-xl font-semibold text-amber-500 dark:text-amber-400 font-['Poppins']">✏️ Your Information</h3>

            <div className="space-y-2">
              <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="name">👤 ชื่อผู้ใช้</label>
              <div className="relative">
                <input
                  id="name"
                  ref={usernameRef}
                  className={`input pr-12 transition-all duration-300 bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white ${isEditingName ? 'ring-2 ring-amber-400/50 bg-slate-50 dark:bg-slate-700/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={!isEditingName}
                />
                <button
                  type="button"
                  aria-label="Edit name"
                  aria-pressed={isEditingName}
                  onClick={() => {
                    setIsEditingName((v: boolean) => !v);
                    setTimeout(() => usernameRef.current?.focus(), 0);
                  }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 transition-all duration-300 ${
                    isEditingName ? 'bg-amber-500 scale-105' : 'bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 hover:scale-105'
                  }`}
                >
                  <Edit3 className={`h-4 w-4 ${isEditingName ? 'text-white' : 'text-slate-600 dark:text-white'}`} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="email">📧 อีเมล</label>
              <input id="email" className="input bg-slate-100 dark:bg-slate-700/30 border border-slate-200 dark:border-transparent text-slate-500 dark:text-slate-400 cursor-not-allowed" value={user?.email || ''} readOnly />
            </div>

            <div className="space-y-2">
              <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="bio">📝 เกี่ยวกับคุณ</label>
              <div className="relative">
                <textarea
                  id="bio"
                  ref={bioRef}
                  className={`input h-32 resize-y pr-12 transition-all duration-300 bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white ${isEditingBio ? 'ring-2 ring-amber-400/50 bg-slate-50 dark:bg-slate-700/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                  readOnly={!isEditingBio}
                  placeholder="บอกอะไรเกี่ยวกับตัวคุณสักหน่อย..."
                />
                <button
                  type="button"
                  aria-label="Edit bio"
                  aria-pressed={isEditingBio}
                  onClick={() => {
                    setIsEditingBio((v: boolean) => !v);
                    setTimeout(() => bioRef.current?.focus(), 0);
                  }}
                  className={`absolute right-2 top-2 rounded-lg p-2 transition-all duration-300 ${
                    isEditingBio ? 'bg-amber-500 scale-105' : 'bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 hover:scale-105'
                  }`}
                >
                  <Edit3 className={`h-4 w-4 ${isEditingBio ? 'text-white' : 'text-slate-600 dark:text-white'}`} />
                </button>
              </div>
              <div className="text-right text-xs text-slate-500 dark:text-slate-400 font-medium">{bio.length}/{BIO_MAX} ตัวอักษร</div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/10">
              <button 
                className="px-8 py-3 font-semibold text-white rounded-lg bg-amber-500 hover:bg-amber-400 transition-all duration-300 disabled:opacity-60" 
                onClick={save} 
                disabled={uploading}
              >
                Confirm changes
              </button>
            </div>
        </main>
        </div>
      </div>
    </section>
  );
}