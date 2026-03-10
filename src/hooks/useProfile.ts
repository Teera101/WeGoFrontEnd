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
  tags?: string[];
};

export type UpdateProfileData = {
  name: string;
  bio?: string;
  avatar?: string;
  tags?: string[];
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
        if (error.response?.status === 404) {
          return {
            userId: currentUserId,
            name: user?.email || 'User',
            bio: '',
            avatar: '',
            tags: []
          };
        }
        throw error;
      }
    },
    enabled: !!currentUserId,
    retry: false, 
    staleTime: 5 * 60 * 1000, 
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