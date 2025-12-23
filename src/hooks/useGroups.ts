import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsAPI } from '../lib/api';
import { toast } from '../components/Toasts';
import { socket } from '../lib/socket';

export type Group = {
  _id?: string;
  name: string;
  members: string[];
  createdAt: Date;
};

export function useGroups() {
  const queryClient = useQueryClient();

  const groups = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: () => groupsAPI.getAll().then(res => res.data),
  });

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const refreshGroups = () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    };

    socket.on('group:create', refreshGroups);
    socket.on('group:update', refreshGroups);
    socket.on('group:delete', refreshGroups);
    socket.on('chat:updated', refreshGroups);
    socket.on('participant:update', refreshGroups);

    return () => {
      socket.off('group:create', refreshGroups);
      socket.off('group:update', refreshGroups);
      socket.off('group:delete', refreshGroups);
      socket.off('chat:updated', refreshGroups);
      socket.off('participant:update', refreshGroups);
    };
  }, [queryClient]);

  const createGroup = useMutation({
    mutationFn: groupsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast('สร้างกลุ่มสำเร็จ');
    },
    onError: (error: any) => {
      toast(error?.message || 'สร้างกลุ่มไม่สำเร็จ');
    },
  });

  const updateGroup = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      groupsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast('อัพเดทกลุ่มสำเร็จ');
    },
    onError: (error: any) => {
      toast(error?.message || 'อัพเดทกลุ่มไม่สำเร็จ');
    },
  });

  const deleteGroup = useMutation({
    mutationFn: groupsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast('ลบกลุ่มสำเร็จ');
    },
    onError: (error: any) => {
      toast(error?.message || 'ลบกลุ่มไม่สำเร็จ');
    },
  });

  const joinGroup = useMutation({
    mutationFn: groupsAPI.join,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast('เข้าร่วมกลุ่มสำเร็จ');
    },
    onError: (error: any) => {
      toast(error?.message || 'เข้าร่วมกลุ่มไม่สำเร็จ');
    },
  });

  const leaveGroup = useMutation({
    mutationFn: groupsAPI.leave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast('ออกจากกลุ่มสำเร็จ');
    },
    onError: (error: any) => {
      toast(error?.message || 'ออกจากกลุ่มไม่สำเร็จ');
    },
  });

  return {
    groups,
    createGroup,
    updateGroup,
    deleteGroup,
    joinGroup,
    leaveGroup,
  };
}