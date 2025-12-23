import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesAPI } from '../lib/api';
import { toast } from '../components/Toasts';

export type Activity = {
  _id?: string;
  title: string;
  description?: string;
  date: Date;
  participants: string[];
};

export function useActivities() {
  const queryClient = useQueryClient();

  const activities = useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: () => activitiesAPI.getAll().then(res => res.data),
  });

  const createActivity = useMutation({
    mutationFn: activitiesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast('สร้างกิจกรรมสำเร็จ');
    },
    onError: (error: any) => {
      toast(error?.message || 'สร้างกิจกรรมไม่สำเร็จ');
    },
  });

  const updateActivity = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      activitiesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast('อัพเดทกิจกรรมสำเร็จ');
    },
    onError: (error: any) => {
      toast(error?.message || 'อัพเดทกิจกรรมไม่สำเร็จ');
    },
  });

  const deleteActivity = useMutation({
    mutationFn: activitiesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast('ลบกิจกรรมสำเร็จ');
    },
    onError: (error: any) => {
      toast(error?.message || 'ลบกิจกรรมไม่สำเร็จ');
    },
  });

  const joinActivity = useMutation({
    mutationFn: activitiesAPI.join,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast('เข้าร่วมกิจกรรมสำเร็จ');
    },
    onError: (error: any) => {
      toast(error?.message || 'เข้าร่วมกิจกรรมไม่สำเร็จ');
    },
  });

  const leaveActivity = useMutation({
    mutationFn: activitiesAPI.leave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast('ออกจากกิจกรรมสำเร็จ');
    },
    onError: (error: any) => {
      toast(error?.message || 'ออกจากกิจกรรมไม่สำเร็จ');
    },
  });

  return {
    activities,
    createActivity,
    updateActivity,
    deleteActivity,
    joinActivity,
    leaveActivity,
  };
}