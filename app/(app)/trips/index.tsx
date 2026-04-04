import { useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useTripStore } from '../../../stores/tripStore';
import TripCard from '../../../components/TripCard';

export default function MyTripsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { trips, fetchTrips, loading } = useTripStore();

  useEffect(() => {
    if (user?.id) fetchTrips(user.id);
  }, [user?.id]);

  const active = trips.filter((t) => t.status !== 'completed');
  const past = trips.filter((t) => t.status === 'completed');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#0D2B1F' }}>My Trips</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#0D2B1F', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          onPress={() => router.push('/(app)/trips/create' as any)}
        >
          <Text style={{ color: '#E8A020', fontSize: 16, fontWeight: '700' }}>+</Text>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        {loading ? (
          <ActivityIndicator color="#0D2B1F" style={{ marginTop: 40 }} />
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
                  Active ({active.length})
                </Text>
                {active.map((trip) => (
                  <TripCard key={trip.id} trip={trip}
                    onPress={() => router.push(`/(app)/trips/${trip.id}` as any)}
                    quickActions={[
                      { label: '✦ Ask AI', primary: true, onPress: () => router.push(`/(app)/trips/${trip.id}/ai` as any) },
                      { label: 'Itinerary', onPress: () => router.push(`/(app)/trips/${trip.id}/itinerary` as any) },
                      { label: 'Group', onPress: () => router.push(`/(app)/trips/${trip.id}/group` as any) },
                    ]}
                  />
                ))}
              </>
            )}

            {past.length > 0 && (
              <>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 }}>
                  Past ({past.length})
                </Text>
                {past.map((trip) => (
                  <TripCard key={trip.id} trip={trip}
                    onPress={() => router.push(`/(app)/trips/${trip.id}` as any)} />
                ))}
              </>
            )}

            {trips.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Text style={{ fontSize: 52, marginBottom: 16 }}>✈️</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#0D2B1F', marginBottom: 8 }}>No trips yet</Text>
                <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                  Create your first group trip and invite your friends
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#0D2B1F', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 }}
                  onPress={() => router.push('/(app)/trips/create' as any)}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Create a trip →</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
