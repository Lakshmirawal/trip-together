import { useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useTripStore } from '../../stores/tripStore';
import TripCard from '../../components/TripCard';

const HIGHLIGHTED_FEATURES = [
  { id: 'ai',          icon: '✦',  title: 'AI Trip Planner',    desc: 'Draft itineraries from group preferences' },
  { id: 'coordinator', icon: '👥', title: 'Group Co-ordinator', desc: 'Passive onboarding, tasks & shared plans' },
  { id: 'budget',      icon: '💰', title: 'Smart Budget',       desc: 'Pre-declared budget, live spend tracking' },
];

const STANDARD_FEATURES = [
  { icon: '✈️', label: 'Flights', route: '/(app)/explore' },
  { icon: '🏨', label: 'Hotels', route: '/(app)/explore' },
  { icon: '🚂', label: 'Trains', route: '/(app)/explore' },
  { icon: '🚕', label: 'Cabs', route: '/(app)/explore' },
  { icon: '📦', label: 'Packages', route: '/(app)/explore' },
  { icon: '🌍', label: 'Explore', route: '/(app)/explore' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { trips, fetchTrips } = useTripStore();
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Traveller';

  useEffect(() => {
    if (user?.id) fetchTrips(user.id);
  }, [user?.id]);

  const activeTrips = trips.filter((t) => t.status !== 'completed');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Top bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View>
            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>Welcome back</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#0D2B1F' }}>👋 {userName}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E6E0', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
              <Text>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#0D2B1F', alignItems: 'center', justifyContent: 'center' }}
              onPress={() => router.push('/(app)/profile')}
            >
              <Text>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Highlighted Features */}
        <View style={{ marginHorizontal: 20, marginTop: 12, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0D2B1F', padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ backgroundColor: '#E8A020', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 }}>
              <Text style={{ color: '#0D2B1F', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>NEW</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Highlighted Features</Text>
          </View>
          {HIGHLIGHTED_FEATURES.map((feat) => (
            <TouchableOpacity
              key={feat.id}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
              onPress={() => {
                const trip = activeTrips[0];
                if (feat.id === 'budget') {
                  router.push(trip ? `/(app)/trips/${trip.id}/budget` as any : '/(app)/trips/index' as any);
                } else if (feat.id === 'coordinator') {
                  router.push(trip ? `/(app)/trips/${trip.id}/group` as any : '/(app)/trips/index' as any);
                } else {
                  router.push(trip ? `/(app)/trips/${trip.id}/ai` as any : '/(app)/trips/create' as any);
                }
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#E8A020', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 16 }}>{feat.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{feat.title}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>{feat.desc}</Text>
              </View>
              <Text style={{ color: '#E8A020', fontSize: 16 }}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Standard Features */}
        <View style={{ marginHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
            Explore
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {STANDARD_FEATURES.map((feat) => (
              <TouchableOpacity
                key={feat.label}
                style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', justifyContent: 'center', width: '30%', borderWidth: 1, borderColor: '#E8E6E0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
                onPress={() => router.push(feat.route as any)}
              >
                <Text style={{ fontSize: 24, marginBottom: 6 }}>{feat.icon}</Text>
                <Text style={{ fontSize: 11, color: '#0D2B1F', fontWeight: '600' }}>{feat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* My Active Trips */}
        <View style={{ marginHorizontal: 20, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              My Active Trips
            </Text>
            {activeTrips.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(app)/trips/index' as any)}>
                <Text style={{ color: '#00897B', fontSize: 13, fontWeight: '700' }}>See all →</Text>
              </TouchableOpacity>
            )}
          </View>

          {activeTrips.length === 0 ? (
            <TouchableOpacity
              style={{ backgroundColor: '#fff', borderWidth: 2, borderStyle: 'dashed', borderColor: '#E8E6E0', borderRadius: 20, padding: 32, alignItems: 'center' }}
              onPress={() => router.push('/(app)/trips/create' as any)}
            >
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🗺️</Text>
              <Text style={{ color: '#0D2B1F', fontWeight: '700', fontSize: 15, marginBottom: 4 }}>
                Create your first trip →
              </Text>
              <Text style={{ color: '#64748B', fontSize: 12, textAlign: 'center' }}>
                Plan a group trip in minutes with AI
              </Text>
            </TouchableOpacity>
          ) : (
            activeTrips.slice(0, 3).map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onPress={() => router.push(`/(app)/trips/${trip.id}` as any)}
                quickActions={[
                  { label: '✦ Ask AI', primary: true, onPress: () => router.push(`/(app)/trips/${trip.id}/ai` as any) },
                  { label: 'Budget', onPress: () => router.push(`/(app)/trips/${trip.id}/budget` as any) },
                  { label: 'Itinerary', onPress: () => router.push(`/(app)/trips/${trip.id}/itinerary` as any) },
                  { label: 'Group', onPress: () => router.push(`/(app)/trips/${trip.id}/group` as any) },
                ]}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
