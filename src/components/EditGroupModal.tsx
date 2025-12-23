import { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  initialData: {
    name: string;
    description?: string;
    maxMembers?: number;
  };
  type?: 'group' | 'chat' | 'event'; 
  isOwner?: boolean;
  renameOnly?: boolean;
  onUpdate?: () => void;
  onDelete?: () => void;
}

export default function EditGroupModal({ 
  isOpen, 
  onClose, 
  targetId, 
  initialData, 
  type = 'group', 
  isOwner = false,
  renameOnly = false,
  onUpdate,
  onDelete
}: EditGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: 100
  });
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        maxMembers: initialData.maxMembers || 100
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let endpoint = `/groups/${targetId}`;
      let body: any = formData;

      if (type === 'event') {
        endpoint = `/events/${targetId}`;
        body = { 
          title: formData.name, 
          description: formData.description, 
          maxParticipants: formData.maxMembers 
        };
      } else if (type === 'chat') {
        endpoint = `/chats/${targetId}`;
        body = {
          name: formData.name,
          groupInfo: {
            name: formData.name,
            description: renameOnly ? initialData.description : formData.description,
            maxMembers: renameOnly ? initialData.maxMembers : formData.maxMembers
          }
        };
      } else {
        body = formData;
      }

      await api.put(endpoint, body);
      if (onUpdate) onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Update failed:', error);
      alert(`Failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to DELETE this group?')) return;
    setIsDeleting(true);
    try {
      if (type === 'event') await api.delete(`/events/${targetId}`);
      else if (type === 'chat') await api.delete(`/chats/${targetId}/destroy`);
      else await api.delete(`/groups/${targetId}`);
      
      if (onDelete) {
        onDelete();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Delete failed:', error);
      alert(`Failed to delete: ${error.message}`);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {renameOnly ? 'Rename Chat' : 'Edit Settings'}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white dark:bg-slate-900">
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border outline-none bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-amber-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          {!renameOnly && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border outline-none resize-none bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-amber-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Max Members</label>
                <input
                  type="number"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border outline-none bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-amber-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </>
          )}

          <div className="pt-4 flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
            
            {isOwner && !renameOnly && (
               <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full mt-2 px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all
                    bg-red-50 text-red-600 border-red-100 hover:bg-red-100 
                    dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/20
                    disabled:opacity-50"
               >
                  {isDeleting ? 'Deleting...' : 'Delete Group'}
               </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}