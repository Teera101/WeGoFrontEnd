import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { toast } from './Toasts';
import { useAuth } from '../hooks/useAuth';

type ReportReason =
  | 'spam'
  | 'inappropriate_content'
  | 'harassment'
  | 'false_information'
  | 'scam'
  | 'other';

const REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam',
  inappropriate_content: 'Inappropriate',
  harassment: 'Harassment / Abuse',
  false_information: 'False information',
  scam: 'Scam',
  other: 'Other'
};

const MAX_CHARS = 240;
const countWords = (text: string) => (text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length);

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId
}: {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'group' | 'activity' | 'user' | string;
  targetId: string;
}) {
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const { user } = useAuth();
  const [isComposing, setIsComposing] = useState(false);
  
  const DEV_ALLOW_DUPLICATE = false;

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    (async () => {
      try {
        if (!user) return;

        let activity: any = null;

        try {
          const res = await api.get(`/activities/${targetId}`);
          activity = res.data?.activity || res.data;
        } catch (err: any) {
        }

        if (!activity) {
          try {
            const res2 = await api.get(`/activities/by-chat/${targetId}`);
            activity = res2.data?.activity || res2.data;
          } catch (err: any) {
          }
        }

        if (!activity) {
          try {
            const chatRes = await api.get(`/chats/${targetId}`);
            const chat = chatRes.data?.chat || chatRes.data;
            const related = chat?.groupInfo?.relatedActivity;
            if (related) {
              const relId = typeof related === 'string' ? related : (related._id || related.toString());
              const ares = await api.get(`/activities/${relId}`);
              activity = ares.data?.activity || ares.data;
            }
          } catch (err: any) {
          }
        }

        if (!activity) {
          try {
            const acts = await api.get('/activities');
            const activities = acts.data?.activities || acts.data || [];
            const matched = Array.isArray(activities) ? activities.find((a: any) => String(a?.chat?._id || a?.chat) === String(targetId)) : null;
            if (matched) {
              activity = matched;
            }
          } catch (err: any) {
          }
        }

        if (!active) return;
        if (!activity) return;

        try {
          const checkRes = await api.get(`/activities/${activity._id || activity}/has-reported`);
          if (checkRes.data && typeof checkRes.data.reported === 'boolean') {
            setAlreadyReported(Boolean(checkRes.data.reported));
            return;
          }
        } catch (e) {
        }

        const reports = activity.reports || [];
        const found = Array.isArray(reports) && !!reports.find((r: any) => String((r.user?._id || r.user)) === String(user._id));
        setAlreadyReported(Boolean(found));
      } catch (e) {
      }
    })();

    return () => { active = false; };
  }, [isOpen, targetId, targetType, user]);

  const words = countWords(details);
  const chars = details.trim().length;

  const submitReportTo = async (path: string, payload: any) => api.post(path, payload);

  const resolveAndPostActivity = async (id: string, payload: any) => {
    try {
      const path = `/activities/${id}/report`;
      return await submitReportTo(path, payload);
    } catch (err: any) {
      const is404 = err?.response?.status === 404 || String(err?.message || '').includes('ไม่พบข้อมูล') || String(err).includes('Not Found');
      if (is404) {
        try {
          const chatRes = await api.get(`/chats/${id}`);
          const chat = chatRes.data?.chat || chatRes.data;
          const relatedActivity = chat?.groupInfo?.relatedActivity;
          if (relatedActivity) {
            const relId = typeof relatedActivity === 'string' ? relatedActivity : (relatedActivity._id || relatedActivity.toString());
            if (relId) {
              const path = `/activities/${relId}/report`;
              return await submitReportTo(path, payload);
            }
          }
        } catch (e) {
        }

        try {
          const res = await api.get(`/activities/by-chat/${id}`);
          const activity = res.data?.activity || res.data;
          const aid = activity?._id || activity?.id || activity;
          if (aid) {
            const path = `/activities/${aid}/report`;
            return await submitReportTo(path, payload);
          }
        } catch (e) {
        }

        try {
          const acts = await api.get('/activities');
          const activities = acts.data?.activities || acts.data || [];
          const matched = Array.isArray(activities) ? activities.find((a: any) => String(a?.chat?._id || a?.chat) === String(id)) : null;
          if (matched && matched._id) {
            const path = `/activities/${matched._id}/report`;
            return await submitReportTo(path, payload);
          }
        } catch (e) {
        }
      }
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (chars < 10) {
      toast('Please provide detailed description (at least 10 characters)');
      return;
    }
    if (chars > MAX_CHARS) {
      toast(`Please limit your report to ${MAX_CHARS} characters or fewer`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = { reason, details: details.trim() };

      if (targetType === 'activity') {
        await resolveAndPostActivity(targetId, payload);
      } else if (targetType === 'group') {
        const path = `/groups/${targetId}/report`;
        await submitReportTo(path, payload);
      } else {
        const path = `/users/${targetId}/report`;
        await submitReportTo(path, payload);
      }

      toast('Report submitted. Our moderation team will review it.', 'success');
      setReason('spam');
      setDetails('');
      onClose();
    } catch (error: any) {
      console.error('Error submitting report:', error);
      const status = error?.response?.status;
      const serverError = error?.response?.data?.error || error?.message;
      
      if (status === 404) {
        toast('Activity not found. It may have been deleted.', 'error');
      } else if (status === 409) {
        toast('You have already reported this activity.', 'info');
      } else if (status === 400) {
        toast(serverError || 'Invalid report. Please check your input.', 'error');
      } else {
        toast(serverError || 'Failed to submit report. Please try again.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Container:
          - Light: bg-white
          - Dark: bg-slate-800
      */}
      <div className="rounded-2xl shadow-2xl max-w-md sm:max-w-lg md:max-w-xl w-full overflow-hidden flex flex-col transition-all transform scale-100
        bg-white border border-slate-200
        dark:bg-slate-800 dark:border-slate-700">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0
          bg-white border-slate-200
          dark:bg-slate-800 dark:border-slate-700">
          
          <h3 className="text-xl font-bold flex items-center gap-2
            text-slate-900 dark:text-white">
            <span className="text-red-500">🚩</span>
            Report {targetType}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full transition-colors
              text-slate-400 hover:text-slate-600 hover:bg-slate-100
              dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2
              text-slate-700 dark:text-slate-300">
              Reason
            </label>
            <div className="relative">
              <select
                className="w-full px-4 py-2.5 rounded-xl appearance-none cursor-pointer border focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all
                  bg-slate-50 border-slate-300 text-slate-900
                  dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
              >
                {Object.entries(REASON_LABELS).map(([value, label]) => (
                  <option key={value} value={value} className="dark:bg-slate-900">
                    {label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="mb-2">
            <label className="block text-sm font-semibold mb-2
              text-slate-700 dark:text-slate-300">
              Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => { if (!isComposing) setDetails(e.target.value); else setDetails(e.target.value); }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={(e) => { setIsComposing(false); setDetails((e.target as HTMLTextAreaElement).value); }}
              placeholder="Please describe the issue..."
              rows={5}
              className="w-full min-h-[140px] px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none
                bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400
                dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder-slate-500"
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs">
                {chars > 0 && chars < 10 && (
                  <span className="text-red-500">Min 10 chars required</span>
                )}
                {chars > MAX_CHARS && (
                  <span className="text-red-500">Max {MAX_CHARS} chars exceeded</span>
                )}
              </div>
              <div className={`text-xs ${chars > MAX_CHARS ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {chars}/{MAX_CHARS}
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t flex justify-end gap-3
          bg-slate-50 border-slate-200
          dark:bg-slate-800/50 dark:border-slate-700">
          
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg font-medium transition-colors
              text-slate-600 hover:bg-slate-200
              dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={submitting || details.trim().length < 10 || details.trim().length > MAX_CHARS || (alreadyReported && !DEV_ALLOW_DUPLICATE)}
            className="px-6 py-2.5 rounded-lg font-semibold text-white shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
              bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/30"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Sending...
              </span>
            ) : (alreadyReported && !DEV_ALLOW_DUPLICATE) ? 'Already Reported' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}