import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthStore = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isOnboarded: boolean;
  setSession: (session: Session | null) => void;
  setOnboarded: (val: boolean) => void;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  loading: true,
  isOnboarded: false,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      loading: false,
      // Persist onboarded status from Supabase user metadata so refresh works correctly
      isOnboarded: session?.user?.user_metadata?.onboarded === true,
    }),
  setOnboarded: (val) => set({ isOnboarded: val }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, isOnboarded: false });
  },
}));
