export interface Activity {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  tags: string[];
  maxParticipants?: number;
  category?: string;
  createdBy: string;
  createdAt: string;
  participants: string[];
  status: 'open' | 'full' | 'closed';
  cover?: string;
  coverImage?: string;
}

export interface CreateActivityPayload {
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  tags: string[];
  maxParticipants?: number;
  category?: string;
  coverImage?: File;
}

export interface ActivityResponse {
  success: boolean;
  data: Activity;
  message?: string;
}

export interface ActivitiesResponse {
  success: boolean;
  data: Activity[];
  message?: string;
}