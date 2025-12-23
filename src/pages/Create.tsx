import { useMemo, useState, useRef, useEffect } from 'react';
import { toast } from '../components/Toasts';
import TagSelector from '../components/TagSelector';
import { useEvents } from '../hooks/useEvents';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface FormData {
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  tags: string[];
  maxParticipants: number;
  coverImage?: File;
}

export default function Create() {
  const { user } = useAuth();
  const { data } = useProfile();
  const { createEvent, isLoading } = useEvents();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    tags: [],
    maxParticipants: 2,
    
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: name === 'maxParticipants' ? parseInt(value) || 2 : value
    }));
  };

  const userName = useMemo(
    () =>
      (data?.name?.trim() ||
        user?.email?.split('@')[0] ||
        '') as string,
    [data?.name, user?.email]
  );

  const handleImageSelect = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please select an image file', 'error');
      return;
    }

    const maxSize = 5; // 5MB
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxSize) {
      toast(`File too large (max ${maxSize} MB)`, 'error');
      return;
    }

    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewImage(localUrl);

    setFormData((prev: FormData) => ({
      ...prev,
      coverImage: file
    }));
  };

  const removeImage = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage('');
    setFormData((prev: FormData) => ({
      ...prev,
      coverImage: undefined
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.location || 
        !formData.date || !formData.time) {
      toast('Please fill in all required fields', 'error');
      return;
    }

    if (formData.maxParticipants < 2) {
      toast('Minimum 2 participants required', 'error');
      return;
    }

    try {
      let coverUrl = undefined;
      if (formData.coverImage) {
        setUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('cover', formData.coverImage);

        try {
          const token = localStorage.getItem('token');
          const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:10000/api').replace(/\/api\/?$/i, '');
          const uploadResponse = await fetch(`${apiBase}/api/events/upload-cover`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataUpload
          });

          if (!uploadResponse.ok) {
            const text = await uploadResponse.text().catch(() => uploadResponse.statusText || 'unknown');
            throw new Error(`Failed to upload image: ${uploadResponse.status} ${text}`);
          }

          const uploadData = await uploadResponse.json();
          coverUrl = uploadData.url;
          setProgress(100);
          if (previewImage) {
            setTimeout(() => {
              try {
                URL.revokeObjectURL(previewImage);
              } catch (err) {
              }
            }, 300);
            setPreviewImage('');
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          toast('Failed to upload image. Creating activity without image...', 'error');
        } finally {
          setUploading(false);
          setProgress(0);
        }
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        date: formData.date + 'T' + formData.time + ':00.000Z',
        time: formData.time,
        tags: formData.tags,
        maxParticipants: formData.maxParticipants,
        cover: coverUrl
      };

      await createEvent(eventData);
      toast('กิจกรรมถูกสร้างเรียบร้อยแล้ว 🎉', 'success');
      navigate('/explore');
    } catch (error: any) {
      console.error('Create event error:', error);
      toast('ไม่สามารถสร้างกิจกรรมได้', 'error');
    }
  };

  return (
    <section className="min-h-screen py-8">
      <div className="container-app px-4">
        <header className="mb-6 text-center">
          <div className="inline-block p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-800 via-blue-600 to-slate-800 dark:from-white dark:via-pink-300 dark:to-amber-400 bg-clip-text text-transparent font-['Poppins']">
            Create Activity
          </h2>
          <p className="text-slate-600 dark:text-slate-400">Share your interests and meet like-minded people</p>
        </header>

        <div className="w-full max-w-3xl mx-auto">
        <form
          onSubmit={onSubmit}
          className="card p-6 space-y-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 shadow-sm dark:shadow-none"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
            <h3 className="text-lg font-semibold text-amber-500 dark:text-amber-400 font-['Poppins']">Activity Details</h3>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Creator: <span className="font-medium text-amber-500 dark:text-amber-400">{userName}</span>
            </span>
          </div>

          <div>
            <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="coverImage">Cover Image</label>
            <div className="flex gap-4 items-start">
              <div className="relative w-40 h-40 bg-slate-100 dark:bg-slate-700/30 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Activity cover"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                    📷
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 font-semibold text-white bg-amber-500 hover:bg-amber-400 rounded-lg transition-all duration-300"
                  disabled={isLoading}
                >
                  Choose Image
                </button>
                {previewImage && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-5 py-2.5 text-sm font-semibold border border-red-400/40 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-300 rounded-lg transition-all duration-300"
                  >
                    Remove
                  </button>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recommended: 1200×800px • Max 5MB<br />
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => handleImageSelect(e.target.files?.[0])}
              />
            </div>
          </div>

          <div>
            <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="title">Activity Name : </label>
            <input
              id="title"
              name="title"
              className="input bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-2 focus:ring-amber-400/50 transition-all duration-300"
              placeholder="Enter activity name"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="description">Description :</label>
            <textarea
              id="description"
              name="description"
              className="input h-24 bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-2 focus:ring-amber-400/50 transition-all duration-300"
              placeholder="Briefly describe your activity"
              value={formData.description}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="location">Location : </label>
            <input
              id="location"
              name="location"
              className="input bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-2 focus:ring-amber-400/50 transition-all duration-300"
              placeholder="Enter the activity location"
              value={formData.location}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="date">Date : </label>
              {/* ✅ แก้ไข: เพิ่ม [color-scheme:light] dark:[color-scheme:dark] เพื่อแก้ปัญหาไอคอนปฏิทินมองไม่เห็น */}
              <input
                type="date"
                id="date"
                name="date"
                className="input bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-2 focus:ring-amber-400/50 transition-all duration-300 [color-scheme:light] dark:[color-scheme:dark]"
                value={formData.date}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="time">Time : </label>
              {/* ✅ แก้ไข: เพิ่ม [color-scheme:light] dark:[color-scheme:dark] เพื่อแก้ปัญหาไอคอนนาฬิกามองไม่เห็น */}
              <input
                type="time"
                id="time"
                name="time"
                className="input bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-2 focus:ring-amber-400/50 transition-all duration-300 [color-scheme:light] dark:[color-scheme:dark]"
                value={formData.time}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div>
            <div className="label font-medium text-slate-700 dark:text-slate-200">🏷️ Tags</div>
            <TagSelector 
              value={formData.tags} 
              onChange={(newTags) => setFormData((prev: FormData) => ({ ...prev, tags: newTags }))}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="maxParticipants">Max Participants</label>
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              className="input bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-2 focus:ring-amber-400/50 transition-all duration-300"
              placeholder="ระบุจำนวนคนที่รับได้ (ขั้นต่ำ 2 คน)"
              min={2}
              max={100}
              value={formData.maxParticipants}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
              ระบุจำนวนคนที่ต้องการรับเข้ากิจกรรม (ไม่นับรวมผู้สร้าง)
            </p>
          </div>

          <button 
            className="w-full py-3 text-base font-semibold text-white bg-amber-500 hover:bg-amber-400 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating activity...
              </>
            ) : (
              <>Create Activity</>
            )}
          </button>
        </form>
       
        </div>
      </div>
    </section>
  );
}