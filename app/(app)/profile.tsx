import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useTripStore } from '../../stores/tripStore';

const P = '#0D2B1F';
const GOLD = '#E8A020';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { trips } = useTripStore();

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Traveller';
  const initials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const activeTrips = trips.filter((t) => t.status !== 'completed').length;
  const totalTrips = trips.length;

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login'); } },
    ]);
  };

  const MENU = [
    { emoji: '✈️', label: 'My Trips', sub: `${totalTrips} trips total`, action: () => router.push('/(app)/trips/index' as any) },
    { emoji: '🌍', label: 'Explore Destinations', sub: 'Find your next adventure', action: () => router.push('/(app)/explore' as any) },
    { emoji: '❓', label: 'Help & Support', sub: 'Get help with the app', action: () => {} },
    { emoji: '🔒', label: 'Privacy Policy', sub: 'How we use your data', action: () => {} },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View style={{ backgroundColor: P, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Profile</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', shadowColor: GOLD, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 }}>
              <Text style={{ color: P, fontSize: 24, fontWeight: '800' }}>{initials}</Text>
            </View>
            <View>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{userName}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: -16, gap: 10, marginBottom: 24 }}>
          {[
            { value: totalTrips, label: 'Total trips' },
            { value: activeTrips, label: 'Active trips' },
            { value: trips.filter(t => t.status === 'completed').length, label: 'Completed' },
          ].map((stat) => (
            <View key={stat.label} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: P }}>{stat.value}</Text>
              <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2, textAlign: 'center' }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Account</Text>
          {MENU.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}
              onPress={item.action}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F4F3EF', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>{item.label}</Text>
                <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>{item.sub}</Text>
              </View>
              <Text style={{ color: '#C8C5BE', fontSize: 16 }}>→</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={{ backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 }}
            onPress={handleSignOut}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20 }}>🚪</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: '#DC2626' }}>Sign out</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ textAlign: 'center', color: '#C8C5BE', fontSize: 11, marginTop: 32 }}>
          TripTogether v1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
