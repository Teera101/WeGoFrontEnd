import { useMemo, useState, useRef, useEffect } from 'react';
import { toast } from '../components/Toasts';
import TagSelector from '../components/TagSelector';
import { useEvents } from '../hooks/useEvents';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPin({ position, onPin }: { position: any, onPin: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPin(e.latlng.lat, e.latlng.lng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
}

function MapUpdater({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15);
    }
  }, [center, map]);
  return null;
}

interface FormData {
  title: string;
  description: string;
  location: string;
  locationDetails: string;
  coordinates: { lat: number; lng: number } | null;
  date: string;
  time: string;
  tags: string[];
  maxParticipants: number;
  coverImage?: File;
}

const DEFAULT_COVERS = [
  { id: 'concert', url: '/covers/concert.jpg', label: 'Concert' },
  { id: 'study', url: '/covers/study.jpg', label: 'Study' },
];

export default function Create() {
  const { user } = useAuth();
  const { data } = useProfile();
  const { createEvent, isLoading } = useEvents();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    location: '',
    locationDetails: '',
    coordinates: null,
    date: '',
    time: '',
    tags: [],
    maxParticipants: 2,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [selectedDefault, setSelectedDefault] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=th`)
          .then(res => res.json())
          .then(data => {
            setSuggestions(data);
            setShowSuggestions(true);
          })
          .catch(() => setSuggestions([]));
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: name === 'maxParticipants' ? parseInt(value) || 2 : value
    }));
  };

  const handleSelectSuggestion = (place: any) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    
    setFormData(prev => ({
      ...prev,
      coordinates: { lat, lng },
      location: place.display_name
    }));
    
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleMapPin = async (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, coordinates: { lat, lng } }));
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=th`);
      const data = await response.json();
      
      if (data && data.display_name) {
        setFormData(prev => ({
          ...prev,
          coordinates: { lat, lng },
          location: data.display_name
        }));
      }
    } catch (error) {
    }
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
      toast('กรุณาเลือกไฟล์รูปภาพ', 'error');
      return;
    }

    const maxSize = 5;
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxSize) {
      toast(`ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${maxSize} MB)`, 'error');
      return;
    }

    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewImage(localUrl);
    setSelectedDefault('');

    setFormData((prev: FormData) => ({
      ...prev,
      coverImage: file
    }));
  };

  const handleDefaultSelect = async (url: string) => {
    try {
      setSelectedDefault(url);
      
      const response = await fetch(url);
      const blob = await response.blob();
      const fileName = url.split('/').pop() || 'default-cover.jpg';
      const file = new File([blob], fileName, { type: blob.type });

      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
      const localUrl = URL.createObjectURL(file);
      setPreviewImage(localUrl);

      setFormData((prev) => ({
        ...prev,
        coverImage: file
      }));

    } catch (error) {
      toast('ไม่สามารถโหลดรูปภาพที่เลือกได้', 'error');
    }
  };

  const removeImage = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage('');
    setSelectedDefault('');
    setFormData((prev: FormData) => ({
      ...prev,
      coverImage: undefined
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) return;

    if (!formData.title || !formData.description || !formData.location || 
        !formData.date || !formData.time) {
      toast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'error');
      return;
    }

    if (formData.maxParticipants < 2) {
      toast('ต้องมีผู้เข้าร่วมขั้นต่ำ 2 คน', 'error');
      return;
    }

    setIsSubmitting(true);

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
              try { URL.revokeObjectURL(previewImage); } catch (err) {}
            }, 300);
            setPreviewImage('');
          }
        } catch (uploadError) {
          toast('อัปโหลดรูปภาพไม่สำเร็จ กำลังสร้างกิจกรรมโดยไม่มีรูปภาพ...', 'error');
        } finally {
          setUploading(false);
          setProgress(0);
        }
      }

      // ส่ง location เป็น Object สะอาดๆ 
      const eventData = {
        title: formData.title,
        description: formData.description,
        location: {
          address: formData.location,
          details: formData.locationDetails || '',
          coordinates: formData.coordinates ? [formData.coordinates.lng, formData.coordinates.lat] : []
        },
        date: formData.date + 'T' + formData.time + ':00.000Z',
        time: formData.time,
        tags: formData.tags,
        maxParticipants: formData.maxParticipants,
        cover: coverUrl
      };

      await createEvent(eventData as any);
      toast('กิจกรรมถูกสร้างเรียบร้อยแล้ว 🎉', 'success');
      navigate('/explore');
    } catch (error: any) {
      toast('ไม่สามารถสร้างกิจกรรมได้', 'error');
      setIsSubmitting(false);
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
            สร้างกิจกรรม
          </h2>
          <p className="text-slate-600 dark:text-slate-400">แบ่งปันความสนใจและพบปะผู้คนที่มีความชอบเหมือนกัน</p>
        </header>

        <div className="w-full max-w-3xl mx-auto">
        <form
          onSubmit={onSubmit}
          className="card p-6 space-y-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 shadow-sm dark:shadow-none"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
            <h3 className="text-lg font-semibold text-amber-500 dark:text-amber-400 font-['Poppins']">รายละเอียดกิจกรรม</h3>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              ผู้สร้าง: <span className="font-medium text-amber-500 dark:text-amber-400">{userName}</span>
            </span>
          </div>

          <div className="space-y-4">
            <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="coverImage">รูปภาพหน้าปก</label>
            
            <div className="flex gap-4 items-start">
              <div className="relative w-40 h-40 bg-slate-100 dark:bg-slate-700/30 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 shrink-0">
                {previewImage || selectedDefault ? (
                  <img
                    src={previewImage || selectedDefault}
                    alt="Activity cover"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 flex-col gap-2">
                    <span className="text-2xl">📷</span>
                    <span className="text-xs">ไม่มีรูปภาพ</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 w-full">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-400 rounded-lg transition-all duration-300 shadow-sm"
                    disabled={isSubmitting || isLoading}
                  >
                    📤 อัปโหลดรูปภาพ
                  </button>
                  {(previewImage || selectedDefault) && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="px-4 py-2 text-sm font-semibold border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 rounded-lg transition-all duration-300"
                      disabled={isSubmitting || isLoading}
                    >
                      ลบรูปภาพ
                    </button>
                  )}
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ขนาดที่แนะนำ: 1200×800px • สูงสุด 5MB
                </p>

                <div className="mt-2">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">หรือเลือกจากธีม:</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {DEFAULT_COVERS.map((cover) => (
                      <button
                        key={cover.id}
                        type="button"
                        onClick={() => handleDefaultSelect(cover.url)}
                        disabled={isSubmitting || isLoading}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 group ${
                          selectedDefault === cover.url 
                            ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105 z-10' 
                            : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={cover.url} 
                          alt={cover.label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[10px] text-white text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {cover.label}
                        </div>
                        {selectedDefault === cover.url && (
                          <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                            <div className="bg-amber-500 text-white rounded-full p-0.5">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
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
            <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="title">ชื่อกิจกรรม : </label>
            <input
              id="title"
              name="title"
              className="input bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-2 focus:ring-amber-400/50 transition-all duration-300"
              placeholder="กรอกชื่อกิจกรรม"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={isSubmitting || isLoading}
            />
          </div>

          <div>
            <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="description">รายละเอียด :</label>
            <textarea
              id="description"
              name="description"
              className="input h-24 bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-2 focus:ring-amber-400/50 transition-all duration-300"
              placeholder="อธิบายกิจกรรมของคุณสั้นๆ"
              value={formData.description}
              onChange={handleChange}
              required
              disabled={isSubmitting || isLoading}
            />
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-700/20 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              สถานที่จัดกิจกรรม
            </h4>
            
            <div className="pt-2">
              <label className="label font-medium text-slate-700 dark:text-slate-200">ค้นหาและปักหมุดบนแผนที่ :</label>
              
              <div className="relative mb-3 mt-1">
                <input
                  type="text"
                  className="input w-full bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-2 focus:ring-amber-400/50 transition-all duration-300"
                  placeholder="พิมพ์ชื่อสถานที่ จังหวัด หรือประเทศ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  disabled={isSubmitting || isLoading}
                />
                
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-[1000] top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-200 border-b last:border-0 border-slate-100 dark:border-slate-700/50 flex items-start gap-2"
                        onClick={() => handleSelectSuggestion(s)}
                      >
                        <span className="mt-0.5">📍</span>
                        <span className="line-clamp-2">{s.display_name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">หรือคลิกบนแผนที่เพื่อเลือกตำแหน่งที่ตั้งด้วยตัวเอง</p>
              
              <div className="h-[300px] w-full rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-600 relative z-0">
                <MapContainer center={[13.7563, 100.5018]} zoom={11} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPin 
                    position={formData.coordinates} 
                    onPin={handleMapPin} 
                  />
                  <MapUpdater center={formData.coordinates ? [formData.coordinates.lat, formData.coordinates.lng] : null} />
                </MapContainer>
              </div>
              
              {formData.coordinates && (
                <div className="flex items-center justify-between mt-2 px-1">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    📍 ปักหมุดแล้ว ({formData.coordinates.lat.toFixed(4)}, {formData.coordinates.lng.toFixed(4)})
                  </p>
                  <button 
                    type="button" 
                    onClick={() => {
                      setFormData(prev => ({ ...prev, coordinates: null, location: '' }));
                      setSearchQuery('');
                    }}
                    className="text-sm text-red-500 hover:text-red-600 underline"
                  >
                    ลบหมุด
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="location">ชื่อสถานที่ / ที่อยู่ :</label>
              <input
                id="location"
                name="location"
                className="input bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-2 focus:ring-amber-400/50 transition-all duration-300"
                placeholder="ชื่อสถานที่ที่ได้จากการปักหมุด หรือพิมพ์เพิ่มเติม..."
                value={formData.location}
                onChange={handleChange}
                required
                disabled={isSubmitting || isLoading}
              />
            </div>

            <div>
              <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="locationDetails">รายละเอียดจุดสังเกตเพิ่มเติม (ถ้ามี) :</label>
              <textarea
                id="locationDetails"
                name="locationDetails"
                className="input h-20 bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-2 focus:ring-amber-400/50 transition-all duration-300"
                placeholder="เช่น รอที่หน้าร้านกาแฟ, จุดสังเกตคือ..."
                value={formData.locationDetails}
                onChange={handleChange}
                disabled={isSubmitting || isLoading}
              />
            </div>

          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="date">วันที่ : </label>
              <input
                type="date"
                id="date"
                name="date"
                className="input bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-2 focus:ring-amber-400/50 transition-all duration-300 [color-scheme:light] dark:[color-scheme:dark]"
                value={formData.date}
                onChange={handleChange}
                required
                disabled={isSubmitting || isLoading}
              />
            </div>
            <div>
              <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="time">เวลา : </label>
              <input
                type="time"
                id="time"
                name="time"
                className="input bg-white dark:bg-slate-700/30 border border-slate-300 dark:border-transparent text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-2 focus:ring-amber-400/50 transition-all duration-300 [color-scheme:light] dark:[color-scheme:dark]"
                value={formData.time}
                onChange={handleChange}
                required
                disabled={isSubmitting || isLoading}
              />
            </div>
          </div>
          <div>
            <div className="label font-medium text-slate-700 dark:text-slate-200">🏷️ ป้ายกำกับ (Tags)</div>
            <TagSelector 
              value={formData.tags} 
              onChange={(newTags) => setFormData((prev: FormData) => ({ ...prev, tags: newTags }))}
              disabled={isSubmitting || isLoading}
            />
          </div>

          <div>
            <label className="label font-medium text-slate-700 dark:text-slate-200" htmlFor="maxParticipants">จำนวนผู้เข้าร่วมสูงสุด</label>
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
              disabled={isSubmitting || isLoading}
            />
            <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
              ระบุจำนวนคนที่ต้องการรับเข้ากิจกรรม (ไม่นับรวมผู้สร้าง)
            </p>
          </div>

          <button 
            className="w-full py-3 text-base font-semibold text-white bg-amber-500 hover:bg-amber-400 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" 
            type="submit"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                กำลังสร้างกิจกรรม...
              </>
            ) : (
              <>สร้างกิจกรรม</>
            )}
          </button>
        </form>
       
        </div>
      </div>
    </section>
  );
}