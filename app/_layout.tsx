import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import MobileFrame from '../components/MobileFrame';

export default function RootLayout() {
  const { session, setSession, isOnboarded, loading } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/(auth)/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Wait until initial session check is done before redirecting
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inJoinGroup = segments[0] === 'join';
    const inResetPassword = segments[0] === '(auth)' && segments[1] === 'reset-password';

    // Never redirect away from the reset-password screen — it needs the recovery session
    if (inResetPassword) return;

    if (!session && !inAuthGroup && !inJoinGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      if (!isOnboarded) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(app)');
      }
    }
  }, [session, segments, isOnboarded, loading]);

  return (
    <MobileFrame>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="join/[token]" />
      </Stack>
    </MobileFrame>
  );
}
