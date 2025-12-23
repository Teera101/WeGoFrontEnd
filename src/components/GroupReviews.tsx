import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/apiClient'; // แก้ import path ให้ตรงกับโปรเจกต์ของคุณ (apiClient หรือ api)
import { toast } from './Toasts';
import { socket } from '../lib/socket';

type Review = {
  _id: string;
  userId: {
    _id: string;
    email: string;
    username?: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

type ReviewsData = {
  reviews: Review[];
  averageRating: string;
  totalReviews: number;
};

export default function GroupReviews({ groupId, currentUserId, type = 'group' }: { groupId: string; currentUserId?: string; type?: 'group' | 'activity' }) {
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ฟังก์ชันดึงรีวิว (เปลี่ยนไปใช้ Endpoint กลาง /events/reviews/:id)
  const fetchReviews = async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      // ✅✅ แก้ไข Endpoint ให้มาชี้ที่ events.js ที่เราแก้ไว้ ✅✅
      const response = await api.get(`/events/reviews/${groupId}`);
      
      // คำนวณค่าเฉลี่ยเอง (ถ้า Backend ส่งมาเป็น Array ล้วน)
      const reviews = Array.isArray(response.data) ? response.data : (response.data.reviews || []);
      const total = reviews.length;
      const avg = total > 0 
        ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / total).toFixed(1) 
        : '0.0';

      setReviewsData({
        reviews: reviews,
        averageRating: avg,
        totalReviews: total
      });
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      // ไม่ต้อง Toast Error ถ้าแค่หาไม่เจอ (404)
      if (error?.response?.status !== 404) {
         // toast('Failed to load reviews', 'error');
      }
      setReviewsData({ reviews: [], averageRating: '0.0', totalReviews: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [groupId]);

  // Submit Review (Create or Update)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;

    try {
      setSubmitting(true);
      // ✅✅ แก้ไข Endpoint ให้ยิงเข้า /events/reviews (Upsert) ✅✅
      await api.post('/events/reviews', {
        groupId: groupId, // ส่ง ID ของกลุ่มไปใน Body
        rating,
        comment: comment.trim()
      });
      
      toast('✨ Review submitted successfully!', 'success');
      setShowReviewForm(false);
      fetchReviews(); // โหลดข้อมูลใหม่
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast(error?.response?.data?.error || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive: boolean = false, onSelect?: (n: number) => void) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onSelect && onSelect(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : ''} transition-transform`}
          >
            <svg
              className={`w-4 h-4 ${
                star <= count 
                  ? 'text-amber-400 fill-amber-400' 
                  : 'text-slate-300 dark:text-slate-600 fill-slate-300 dark:fill-slate-600'
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  const userHasReviewed = reviewsData?.reviews.some(r => r.userId?._id === currentUserId);

  if (loading) return <div className="text-xs text-slate-400 p-4">Loading reviews...</div>;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {reviewsData && reviewsData.totalReviews > 0 ? (
            <>
              <div className="flex items-center gap-1">
                {renderStars(Math.round(parseFloat(reviewsData.averageRating)))}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {reviewsData.averageRating}
              </span>
              <span className="text-xs text-slate-500">
                ({reviewsData.totalReviews})
              </span>
            </>
          ) : (
            <span className="text-sm text-slate-400">No reviews yet</span>
          )}
        </div>
        
        {currentUserId && !showReviewForm && (
          <button
            onClick={() => {
              // ถ้าเคยรีวิวแล้ว ให้ดึงข้อมูลเดิมมาใส่ในฟอร์ม
              if (userHasReviewed) {
                const myReview = reviewsData?.reviews.find(r => r.userId?._id === currentUserId);
                if (myReview) {
                  setRating(myReview.rating);
                  setComment(myReview.comment);
                }
              }
              setShowReviewForm(true);
            }}
            className="px-3 py-1.5 text-xs font-medium bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 rounded-lg transition-colors flex items-center gap-1.5"
          >
            {userHasReviewed ? '✏️ Edit' : '✨ Write'}
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-amber-200 dark:border-amber-500/20 space-y-3 animate-fade-in">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">Your Rating</label>
            <div className="flex gap-1 cursor-pointer">
              {renderStars(rating, true, setRating)}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-600 dark:text-slate-400">Comment</label>
            <textarea
              className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-3 py-1.5 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="px-4 py-1.5 text-sm font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {reviewsData && reviewsData.reviews.length > 0 ? (
          reviewsData.reviews.map((review) => (
            <div key={review._id} className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 overflow-hidden">
                      {review.userId?.avatar ? (
                        <img src={review.userId.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        (review.userId?.username || 'U')[0].toUpperCase()
                      )}
                   </div>
                   <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                      {review.userId?.username || review.userId?.email?.split('@')[0] || 'Unknown'}
                   </div>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(review.updatedAt || review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                 {renderStars(review.rating)}
              </div>
              {review.comment && (
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-slate-500 text-xs">
            No reviews yet. Be the first!
          </div>
        )}
      </div>
    </div>
  );
}