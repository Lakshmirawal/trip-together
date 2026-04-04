import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export default function ConfirmScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const { session, isOnboarded } = useAuthStore();

  useEffect(() => {
    if (session) {
      if (!isOnboarded) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(app)');
      }
    }
  }, [session, isOnboarded]);

  return (
    <View className="flex-1 bg-white justify-center items-center px-8">
      <Text className="text-5xl mb-6">✉️</Text>
      <Text className="text-2xl font-bold text-navy text-center mb-3">Check your email</Text>
      <Text className="text-base text-muted text-center mb-8">
        We sent a magic link to{'\n'}
        <Text className="text-gray-900 font-semibold">{email}</Text>.{'\n'}
        Click it to sign in.
      </Text>

      <View className="w-full bg-card rounded-2xl p-5 mb-8">
        <Text className="text-sm text-muted text-center">
          Once you click the link in your email, you'll be automatically signed in here.
        </Text>
      </View>

      <TouchableOpacity onPress={() => router.back()}>
        <Text className="text-teal font-semibold text-sm">Wrong email? Go back</Text>
      </TouchableOpacity>
    </View>
  );
}
