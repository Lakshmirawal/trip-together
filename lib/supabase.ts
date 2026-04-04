import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const storage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export type DestinationSuggestion = {
  name: string;
  emoji: string;
  reason: string;
};

export type DestinationVote = {
  id: string;
  trip_id: string;
  member_id: string | null;
  voter_name: string;
  suggestion_index: number;
  created_at: string;
};

export type Trip = {
  id: string;
  name: string;
  destination: string | null;
  dates_start: string | null;
  dates_end: string | null;
  budget_min: number | null;
  budget_max: number | null;
  group_size: number;
  organiser_id: string;
  invite_token: string;
  status: 'planning' | 'confirmed' | 'ongoing' | 'completed';
  ai_suggestions: DestinationSuggestion[] | null;
  created_at: string;
};

export type TripMember = {
  id: string;
  trip_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  dietary: string;
  budget_comfort: string;
  interests: string[];
  accessibility: string | null;
  dream_destination: string | null;
  role: 'organiser' | 'member';
  joined_at: string;
};

export type ItineraryItem = {
  id: string;
  trip_id: string;
  day_number: number;
  day_date: string;
  time: string | null;
  title: string;
  description: string | null;
  location: string | null;
  cost_per_person: number | null;
  category: 'transport' | 'accommodation' | 'food' | 'activity' | 'other';
  timing_intel: string | null;
  transport_intel: string | null;
  dietary_badge: string | null;
  order_index: number;
  created_at: string;
};

export type Task = {
  id: string;
  trip_id: string;
  title: string;
  description: string | null;
  assigned_to_member_id: string | null;
  assigned_to_name: string | null;
  due_date: string | null;
  status: 'open' | 'in_progress' | 'done';
  created_at: string;
};

export type Expense = {
  id: string;
  trip_id: string;
  title: string;
  amount: number;
  category: 'accommodation' | 'food' | 'transport' | 'activities' | 'other';
  added_by: string | null;
  created_at: string;
};
