// Zod schemas for forms
import { z } from 'zod';

export const CreateActivitySchema = z.object({
  name: z.string().min(3, 'Please enter an activity name (min 3 characters)'),
  description: z.string().min(10, 'Please provide more details'),
  location: z.string().min(3, 'Please specify a location'),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  tags: z.array(z.string().min(1)).min(1, 'Please select at least 1 tag'),
  maxParticipants: z.number().min(2, 'Minimum 2 participants required'),
  
});

export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Min 6 chars'),
  displayName: z.string().min(2, 'Min 2 chars')
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const ProfileSchema = z.object({
  displayName: z.string().min(2).optional(),
  bio: z.string().max(300).optional(),
  interests: z.array(z.string()).optional()
});