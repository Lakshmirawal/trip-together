import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

export default function OnboardingScreen() {
  const router = useRouter();
  const { setOnboarded, user } = useAuthStore();

  const handleChoice = async (role: 'organiser' | 'member') => {
    if (user) {
      await supabase.auth.updateUser({
        data: { role, onboarded: true },
      });
    }
    setOnboarded(true);
    router.replace('/(app)');
  };

  return (
    <View className="flex-1 bg-white justify-center px-8">
      <View className="items-center mb-10">
        <Text className="text-4xl mb-3">👋</Text>
        <Text className="text-2xl font-bold text-navy text-center">How are you here?</Text>
        <Text className="text-muted text-sm mt-2 text-center">
          This helps us personalise your experience
        </Text>
      </View>

      <TouchableOpacity
        className="bg-navy rounded-2xl p-6 mb-4"
        onPress={() => handleChoice('organiser')}
      >
        <Text className="text-white text-xl mb-1">🗺️ I'm planning a trip</Text>
        <Text className="text-blue-200 text-sm">
          Create a trip, invite your group, and let AI help coordinate everything
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="border-2 border-navy rounded-2xl p-6"
        onPress={() => handleChoice('member')}
      >
        <Text className="text-navy text-xl mb-1">📨 Someone invited me</Text>
        <Text className="text-muted text-sm">
          Join a trip and submit your preferences — takes 30 seconds
        </Text>
      </TouchableOpacity>
    </View>
  );
}
