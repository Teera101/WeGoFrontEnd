import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../lib/api';
import { toast } from './Toasts';
import { useAuth } from '../hooks/useAuth';
import ReportModal from './ReportModal';
import { MapPin, Calendar, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapFixer() {
  const map = useMap();
  useEffect(() => {
    const interval = setInterval(() => {
      map.invalidateSize();
    }, 100);
    setTimeout(() => clearInterval(interval), 1000);
    return () => clearInterval(interval);
  }, [map]);
  return null;
}

interface EventCardProps {
  event: {
    id: string;
    title: string;
    cover?: string;
    about: string;
    tags: string[];
    location?: any;
    date?: string;
    time?: string;
    popularity?: number;
    participantsCount?: number;
  };
  maxParticipants?: number;
  isParticipant?: boolean;
  isCreator?: boolean;
  chatId?: string;
  onUpdate?: () => void;
  onEdit?: () => void;
}

export default function EventCard({ 
  event, 
  maxParticipants, 
  isParticipant = false, 
  isCreator = false, 
  chatId, 
  onUpdate,
  onEdit
}: EventCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const parsedLocation = useMemo(() => {
    if (!event.location) return null;

    let address = 'ไม่ระบุสถานที่';
    let details = '';
    let lat: number | null = null;
    let lng: number | null = null;

    const extractFromObj = (obj: any) => {
        if (obj.address) address = obj.address;
        if (obj.details) details = obj.details;
        
        const coords = obj.coordinates?.coordinates || obj.coordinates;
        if (Array.isArray(coords) && coords.length >= 2) {
            lng = Number(coords[0]);
            lat = Number(coords[1]);
        }
    };

    if (typeof event.location === 'object' && event.location !== null) {
        extractFromObj(event.location);
    } else if (typeof event.location === 'string') {
        const str = event.location.trim();
        try {
            const parsed = JSON.parse(str.replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
            if (typeof parsed === 'object' && parsed !== null) {
                extractFromObj(parsed);
            } else { address = str; }
        } catch (e) {
            address = str;
        }
    }

    const isValidCoords = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

    return {
        address,
        details: (details === '--' || details.trim() === '') ? null : details,
        lat: isValidCoords ? lat : null,
        lng: isValidCoords ? lng : null
    };
  }, [event.location]);

  const handleJoin = async () => {
    if (!user) {
      toast('กรุณาเข้าสู่ระบบก่อนเข้าร่วมกิจกรรม', 'error');
      navigate('/signin');
      return;
    }
    try {
      setIsJoining(true);
      const response = await eventsAPI.join(event.id);
      toast('เข้าร่วมกิจกรรมสำเร็จ!', 'success');
      if (response.data.chatId) {
        navigate(`/dm/${response.data.chatId}`);
      } else if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      toast(error?.message || 'ไม่สามารถเข้าร่วมกิจกรรมได้', 'error');
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    try {
      setIsJoining(true);
      await eventsAPI.leave(event.id);
      toast('ออกจากกิจกรรมสำเร็จ', 'success');
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast(error.response?.data?.error || 'ไม่สามารถออกจากกิจกรรมได้', 'error');
    } finally {
      setIsJoining(false);
    }
  };

  const participantsArray = Array.isArray((event as any).participants) ? (event as any).participants : null;
  let storedParticipants = 0;
  let creatorOccupiesSlot = false;
  let computedParticipants = 0;

  if (participantsArray) {
    const ids = participantsArray
      .map((p: any) => (p && p.user ? String(p.user._id || p.user) : null))
      .filter(Boolean) as string[];
    const uniqueIds = Array.from(new Set(ids));
    storedParticipants = uniqueIds.length;
    const creatorId = (event as any).createdBy ? String((event as any).createdBy) : null;
    creatorOccupiesSlot = creatorId ? !uniqueIds.includes(creatorId) : false;
    computedParticipants = storedParticipants + (creatorOccupiesSlot ? 1 : 0);
  } else {
    storedParticipants = event.participantsCount ?? 0;
    if ((event as any).popularity != null) {
      creatorOccupiesSlot = (event as any).popularity > storedParticipants;
    } else {
      creatorOccupiesSlot = false;
    }
    computedParticipants = storedParticipants + (creatorOccupiesSlot ? 1 : 0);
  }

  const displayedPopularity = event.popularity ?? computedParticipants;
  const displayIsFullyBooked = maxParticipants ? displayedPopularity >= maxParticipants : false;
  const effectiveCount = computedParticipants;
  const joinBlockedForNonCreator = maxParticipants ? effectiveCount >= maxParticipants : false;

  let coverImage = undefined as string | undefined;
  if (event.cover) {
    if (event.cover.startsWith('/') && !event.cover.startsWith('blob:')) {
      coverImage = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/i, '')}${event.cover}`;
    } else {
      coverImage = event.cover;
    }
  }

  return (
    <>
      <article className="card overflow-hidden group hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 border border-slate-200 dark:border-transparent hover:border-amber-400 dark:hover:border-amber-500/30 bg-white dark:bg-slate-800 flex flex-col h-full relative z-0">
        <div className="relative h-48 sm:h-56 overflow-hidden shrink-0">
          {coverImage ? (
            <>
              <img
                src={coverImage}
                alt={event.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            </>
          ) : (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 text-center transition-colors duration-300 bg-gradient-to-br from-amber-50 via-orange-100 to-amber-100 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900">
              <h3 className="text-3xl font-bold font-['Poppins'] break-words w-full line-clamp-3 text-amber-700/80 dark:text-amber-500">
                {event.title}
              </h3>
            </div>
          )}

          {maxParticipants && (
            <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-slate-200 dark:border-white/10 z-10">
              <span className={displayIsFullyBooked ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                {displayedPopularity}/{maxParticipants}
              </span>
            </div>
          )}
        
          <div className="absolute bottom-3 left-3 right-3 space-y-1.5 z-10 pointer-events-none group-hover:pointer-events-auto">
             <div className="flex flex-col gap-1.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                {parsedLocation && parsedLocation.address && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLocationModal(true); }}
                    className="flex items-center gap-2 text-xs font-medium bg-white/95 dark:bg-black/70 backdrop-blur-md px-3 py-2 rounded-xl shadow-sm text-slate-700 dark:text-white w-fit max-w-full hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left border border-slate-100/20"
                  >
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate line-clamp-1 w-full">{parsedLocation.address}</span>
                    {parsedLocation.lat !== null && parsedLocation.lng !== null && (
                      <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-md hidden sm:inline-block whitespace-nowrap font-bold">
                        ดูแผนที่
                      </span>
                    )}
                  </button>
                )}
                {event.date && (
                  <div className="flex items-center gap-2 text-xs font-medium bg-white/95 dark:bg-black/70 backdrop-blur-md px-3 py-2 rounded-xl shadow-sm text-slate-700 dark:text-white w-fit border border-slate-100/20">
                    <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      {new Date(event.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' })}
                      {(() => {
                        const t = event.time || new Date(event.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok', hour12: false });
                        return t && t !== '00:00' ? ` • ${t} น.` : '';
                      })()}
                    </span>
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 font-['Poppins'] leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {event.title}
            </h3>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed h-10">
              {event.about || "ไม่มีรายละเอียดเพิ่มเติม"}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {event.tags.slice(0, 3).map((t) => (
                <span key={t} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                  {t}
                </span>
              ))}
              {event.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600/50">
                  +{event.tags.length - 3}
                </span>
              )}
            </div>
          </div>

          <div className="pt-5 mt-auto flex gap-3">
            {isParticipant ? (
              <>
                {chatId && (
                  <button
                    onClick={() => navigate(`/dm/${chatId}`)}
                    className="flex-1 px-4 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                    แชท
                  </button>
                )}
                
                {isCreator && (
                  <button
                    onClick={(e) => { e.preventDefault(); if (onEdit) onEdit(); }}
                    className="flex-1 px-4 py-2 text-sm rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 font-semibold transition-all border border-slate-200 dark:border-slate-600"
                  >
                    แก้ไข
                  </button>
                )}

                {!isCreator && (
                  <button
                    onClick={handleLeave}
                    className="flex-1 px-4 py-2 text-sm rounded-xl bg-white dark:bg-white/5 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                    disabled={isJoining}
                  >
                    {isJoining ? '...' : 'ออก'}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleJoin}
                className={`flex-1 px-4 py-2.5 text-sm rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 text-white ${
                  joinBlockedForNonCreator && !isCreator
                    ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed shadow-none hover:translate-y-0'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25'
                }`}
                disabled={isJoining || (joinBlockedForNonCreator && !isCreator)}
              >
                {isJoining ? 'รอสักครู่...' : (joinBlockedForNonCreator && !isCreator) ? 'เต็มแล้ว' : 'เข้าร่วมกิจกรรม'}
              </button>
            )}
          </div>
        </div>
      </article>

      {showLocationModal && parsedLocation && createPortal(
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-fade-in"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLocationModal(false); }}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80 shrink-0">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                รายละเอียดสถานที่
              </h3>
              <button 
                onClick={(e) => { e.preventDefault(); setShowLocationModal(false); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-200 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-4 sm:p-5 overflow-y-auto flex-grow min-h-0 space-y-4">
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">ที่ตั้ง / สถานที่จัดกิจกรรม</h4>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  {parsedLocation.address}
                </p>
              </div>
              
              {parsedLocation.details && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">จุดสังเกตเพิ่มเติม</h4>
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-4 rounded-xl">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {parsedLocation.details}
                    </p>
                  </div>
                </div>
              )}

              {parsedLocation.lat !== null && parsedLocation.lng !== null && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                  <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">แผนที่</h4>
                  <div className="h-[200px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-0 shadow-inner">
                    <MapContainer 
                      key={`${parsedLocation.lat}-${parsedLocation.lng}`}
                      center={[parsedLocation.lat, parsedLocation.lng]} 
                      zoom={16} 
                      scrollWheelZoom={true} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <MapFixer />
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[parsedLocation.lat, parsedLocation.lng]} />
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>

            {parsedLocation.lat !== null && parsedLocation.lng !== null && (
              <div className="shrink-0 px-4 sm:px-5 py-4 border-t border-slate-100 dark:border-slate-700/50">
                <a 
                  href={`https://www.google.com/maps?q=loc:${parsedLocation.lat},${parsedLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl transition-all duration-300 shadow-md"
                >
                  <ExternalLink className="w-5 h-5" /> เปิดนำทางใน Google Maps
                </a>
              </div>
            )}
          </div>
        </div>
      , document.body)}

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="activity"
        targetId={event.id}
      />
    </>
  );
}