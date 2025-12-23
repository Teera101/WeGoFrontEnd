import { api } from './apiClient';

// Re-export api for direct use
export { api };

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Profile API
export const profileAPI = {
  get: (userId: string) => api.get(`/profiles/${userId}`),
  update: (data: { name: string; bio?: string; avatar?: string }) =>
    api.post('/profiles', data),
  delete: () => api.delete('/profiles'),
};

// Events API
export const eventsAPI = {
  getAll: () => api.get('/events'),
  getById: (id: string) => api.get(`/events/${id}`),
  create: (data: {
    title: string;
    description: string;
    location: string;
    date: string;
    time: string;
    tags: string[];
    maxParticipants: number;
    category?: string;
    cover?: string;
  }) => api.post('/events', data),
  update: (id: string, data: {
    title?: string;
    description?: string;
    location?: string;
    date?: string;
    time?: string;
    tags?: string[];
    maxParticipants?: number;
    category?: string;
    cover?: string;
  }) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  join: (id: string) => api.post(`/events/${id}/join`),
  leave: (id: string) => api.post(`/events/${id}/leave`),
  search: (params: { tags?: string }) =>
    api.get('/events/search/filter', { params }),
};

// Activities API
export const activitiesAPI = {
  getAll: () => api.get('/activities'),
  getById: (id: string) => api.get(`/activities/${id}`),
  create: (data: { 
    title: string;
    description?: string;
    date: Date;
  }) => api.post('/activities', data),
  update: (id: string, data: {
    title?: string;
    description?: string;
    date?: Date;
  }) => api.patch(`/activities/${id}`, data),
  delete: (id: string) => api.delete(`/activities/${id}`),
  join: (id: string) => api.post(`/activities/${id}/join`),
  leave: (id: string) => api.post(`/activities/${id}/leave`),
};

// Groups API
export const groupsAPI = {
  getAll: () => api.get('/groups'),
  getById: (id: string) => api.get(`/groups/${id}`),
  create: (data: { name: string }) => api.post('/groups', data),
  update: (id: string, data: { name: string }) =>
    api.patch(`/groups/${id}`, data),
  delete: (id: string) => api.delete(`/groups/${id}`),
  join: (id: string) => api.post(`/groups/${id}/join`),
  leave: (id: string) => api.post(`/groups/${id}/leave`),
};