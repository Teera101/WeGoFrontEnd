import { useState, useEffect } from 'react';
import { eventsAPI } from '../lib/api';
import { toast } from '../components/Toasts';

export interface Event {
  _id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  tags: string[];
  maxParticipants: number;
  category?: string;
  cover?: string;
  participants: string[];
  chat?: string; // Chat ID reference
  createdBy: {
    _id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await eventsAPI.getAll();
      setEvents(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch events');
      console.error('Fetch events error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: {
    title: string;
    description: string;
    location: string;
    date: string;
    time: string;
    tags: string[];
    maxParticipants: number;
    category?: string;
    cover?: string;
  }) => {
    try {
      setIsLoading(true);
      const response = await eventsAPI.create(eventData);
      setEvents(prev => [...prev, response.data]);
      toast('Event created successfully!');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create event';
      setError(errorMessage);
      toast(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    try {
      setIsLoading(true);
      const response = await eventsAPI.update(id, eventData);
      setEvents(prev => prev.map(event => 
        event._id === id ? response.data : event
      ));
      toast('Event updated successfully!');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update event';
      setError(errorMessage);
      toast(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      setIsLoading(true);
      await eventsAPI.delete(id);
      setEvents(prev => prev.filter(event => event._id !== id));
      toast('Event deleted successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete event';
      setError(errorMessage);
      toast(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const joinEvent = async (id: string) => {
    try {
      const response = await eventsAPI.join(id);
      setEvents(prev => prev.map(event => 
        event._id === id ? response.data.activity : event
      ));
      toast('Successfully joined event!');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to join event';
      toast(errorMessage);
      throw error;
    }
  };

  const leaveEvent = async (id: string) => {
    try {
      const response = await eventsAPI.leave(id);
      setEvents(prev => prev.map(event => 
        event._id === id ? response.data.activity : event
      ));
      toast('Successfully left event!');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to leave event';
      toast(errorMessage);
      throw error;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    isLoading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    joinEvent,
    leaveEvent,
  };
}