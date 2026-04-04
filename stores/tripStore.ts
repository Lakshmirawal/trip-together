import { create } from 'zustand';
import { supabase, Trip, TripMember, ItineraryItem, Task, Expense, DestinationVote } from '../lib/supabase';

export type AIItineraryDay = {
  day: number;
  date: string;
  items: {
    time: string | null;
    title: string;
    description: string | null;
    location: string | null;
    cost_per_person: number | null;
    category: ItineraryItem['category'];
    timing_intel: string | null;
    transport_intel: string | null;
    dietary_badge: string | null;
  }[];
};

type TripStore = {
  trips: Trip[];
  currentTrip: Trip | null;
  members: TripMember[];
  itinerary: ItineraryItem[];
  tasks: Task[];
  expenses: Expense[];
  destinationVotes: DestinationVote[];
  loading: boolean;
  loadingAI: boolean;

  fetchTrips: (userId: string) => Promise<void>;
  setCurrentTrip: (trip: Trip | null) => void;
  fetchTripDetails: (tripId: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'created_at'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  saveItineraryFromAI: (tripId: string, days: AIItineraryDay[]) => Promise<void>;
  generateDestinationSuggestions: (tripId: string) => Promise<void>;
  fetchDestinationVotes: (tripId: string) => Promise<void>;
  castVote: (tripId: string, memberId: string, voterName: string, index: number) => Promise<void>;
  confirmDestination: (tripId: string, destination: string) => Promise<void>;
};

export const useTripStore = create<TripStore>((set, get) => ({
  trips: [],
  currentTrip: null,
  members: [],
  itinerary: [],
  tasks: [],
  expenses: [],
  destinationVotes: [],
  loading: false,
  loadingAI: false,

  fetchTrips: async (userId: string) => {
    set({ loading: true });
    const { data: organiserTrips } = await supabase
      .from('trips').select('*').eq('organiser_id', userId).order('created_at', { ascending: false });

    const { data: memberTrips } = await supabase
      .from('trip_members').select('trip_id, trips(*)').eq('user_id', userId);

    const memberTripData = memberTrips?.map((m: any) => m.trips).filter(Boolean) ?? [];
    const allTrips = [...(organiserTrips ?? []), ...memberTripData]
      .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);

    set({ trips: allTrips, loading: false });
  },

  setCurrentTrip: (trip) => set({ currentTrip: trip }),

  fetchTripDetails: async (tripId: string) => {
    set({ loading: true });
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. Check your Supabase RLS policies.')), 8000)
    );
    try {
      const [
        { data: trip, error: tripErr },
        { data: members },
        { data: itinerary },
        { data: tasks },
        { data: expenses },
        { data: votes },
      ] = await Promise.race([
        Promise.all([
          supabase.from('trips').select('*').eq('id', tripId).single(),
          supabase.from('trip_members').select('*').eq('trip_id', tripId),
          supabase.from('itinerary_items').select('*').eq('trip_id', tripId).order('day_number').order('order_index'),
          supabase.from('tasks').select('*').eq('trip_id', tripId).order('created_at'),
          supabase.from('expenses').select('*').eq('trip_id', tripId).order('created_at'),
          supabase.from('destination_votes').select('*').eq('trip_id', tripId),
        ]),
        timeout,
      ]);

      if (tripErr) throw new Error(tripErr.message);

      set({
        currentTrip: trip,
        members: members ?? [],
        itinerary: itinerary ?? [],
        tasks: tasks ?? [],
        expenses: expenses ?? [],
        destinationVotes: votes ?? [],
        loading: false,
      });
    } catch (err) {
      console.error('fetchTripDetails error:', err);
      set({ loading: false });
    }
  },

  addExpense: async (expense) => {
    const { data } = await supabase.from('expenses').insert(expense).select().single();
    if (data) set((state) => ({ expenses: [...state.expenses, data] }));
  },

  addTask: async (task) => {
    const { data } = await supabase.from('tasks').insert(task).select().single();
    if (data) set((state) => ({ tasks: [...state.tasks, data] }));
  },

  updateTask: async (taskId, updates) => {
    const { data } = await supabase.from('tasks').update(updates).eq('id', taskId).select().single();
    if (data) set((state) => ({ tasks: state.tasks.map((t) => (t.id === taskId ? data : t)) }));
  },

  saveItineraryFromAI: async (tripId, days) => {
    await supabase.from('itinerary_items').delete().eq('trip_id', tripId);
    const rows = days.flatMap((day) =>
      day.items.map((item, idx) => ({
        trip_id: tripId,
        day_number: day.day,
        day_date: day.date || null,
        time: item.time || null,
        title: item.title,
        description: item.description || null,
        location: item.location || null,
        cost_per_person: item.cost_per_person ?? null,
        category: item.category || 'activity',
        timing_intel: item.timing_intel || null,
        transport_intel: item.transport_intel || null,
        dietary_badge: item.dietary_badge || null,
        order_index: idx,
      }))
    );
    const { data } = await supabase.from('itinerary_items').insert(rows).select();
    if (data) set({ itinerary: data });
  },

  generateDestinationSuggestions: async (tripId: string) => {
    set({ loadingAI: true });
    try {
      const { data, error } = await supabase.functions.invoke('ai-companion', {
        body: { tripId, mode: 'destinations' },
      });
      if (!error && data?.suggestions) {
        set((state) => ({
          currentTrip: state.currentTrip
            ? { ...state.currentTrip, ai_suggestions: data.suggestions }
            : null,
        }));
      }
    } finally {
      set({ loadingAI: false });
    }
  },

  fetchDestinationVotes: async (tripId: string) => {
    const { data } = await supabase.from('destination_votes').select('*').eq('trip_id', tripId);
    if (data) set({ destinationVotes: data });
  },

  castVote: async (tripId: string, memberId: string, voterName: string, index: number) => {
    const { data } = await supabase
      .from('destination_votes')
      .upsert({ trip_id: tripId, member_id: memberId, voter_name: voterName, suggestion_index: index })
      .select()
      .single();
    if (data) {
      set((state) => ({
        destinationVotes: [
          ...state.destinationVotes.filter((v) => v.member_id !== memberId),
          data,
        ],
      }));
    }
  },

  confirmDestination: async (tripId: string, destination: string) => {
    const { data } = await supabase
      .from('trips')
      .update({ destination, ai_suggestions: [] })
      .eq('id', tripId)
      .select()
      .single();
    if (data) set({ currentTrip: data });
  },
}));
