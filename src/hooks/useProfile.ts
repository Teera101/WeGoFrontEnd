import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileAPI } from '../lib/api';
import { toast } from '../components/Toasts';
import { useAuth } from './useAuth';

export type Profile = {
  _id?: string;
  userId: string;
  name: string;
  avatar?: string;
  bio?: string;
};

export type UpdateProfileData = {
  name: string;
  bio?: string;
  avatar?: string;
};

export function useProfile(userId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentUserId = userId || user?._id;

  const profile = useQuery<Profile>({
    queryKey: ['profile', currentUserId],
    queryFn: async () => {
      if (!currentUserId) throw new Error('กรุณาระบุรหัสผู้ใช้');
      try {
        const res = await profileAPI.get(currentUserId);
        return res.data;
      } catch (error: any) {
        // Return default profile if API not found (404)
        if (error.response?.status === 404) {
          return {
            userId: currentUserId,
            name: user?.email || 'User',
            bio: '',
            avatar: ''
          };
        }
        throw error;
      }
    },
    enabled: !!currentUserId,
    retry: false, // Don't retry on failure
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const updateProfile = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const res = await profileAPI.update(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', currentUserId] });
      toast('อัพเดทโปรไฟล์สำเร็จ');
    },
    onError: (error: any) => {
      toast(error?.message || 'ไม่สามารถอัพเดทโปรไฟล์ได้ โปรดลองใหม่อีกครั้ง');
    },
  });

  const deleteProfile = useMutation({
    mutationFn: async () => {
      const res = await profileAPI.delete();
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', currentUserId] });
      toast('ลบโปรไฟล์สำเร็จ');
    },
    onError: (error: any) => {
      toast(error?.message || 'ไม่สามารถลบโปรไฟล์ได้ โปรดลองใหม่อีกครั้ง');
    },
  });

  return {
    data: profile.data,
    isLoading: profile.isLoading,
    isError: profile.isError,
    error: profile.error,
    updateProfile: updateProfile.mutateAsync,
    deleteProfile: deleteProfile.mutateAsync,
  };
}
