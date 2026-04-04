import { useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTripStore } from '../../../../stores/tripStore';
import { useAuthStore } from '../../../../stores/authStore';
import BudgetBar from '../../../../components/BudgetBar';
import MemberAvatar from '../../../../components/MemberAvatar';
import { supabase } from '../../../../lib/supabase';

function getDaysUntil(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff <= 0) return 'Happening now!';
  return `${diff} days away`;
}

export default function TripOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentTrip, members, tasks, expenses, itinerary, fetchTripDetails, loading } = useTripStore();

  useEffect(() => {
    if (id) {
      fetchTripDetails(id);
      const channel = supabase.channel(`trip-${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'itinerary_items', filter: `trip_id=eq.${id}` }, () => fetchTripDetails(id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${id}` }, () => fetchTripDetails(id))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [id]);

  if (loading || !currentTrip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#0D2B1F" size="large" />
      </SafeAreaView>
    );
  }

  const openTasks = tasks.filter((t) => t.status !== 'done');
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = (currentTrip.budget_max ?? 0) * currentTrip.group_size;
  const joinedCount = members.length;
  const daysUntil = getDaysUntil(currentTrip.dates_start);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF' }}>
      {/* Rich header */}
      <View style={{ backgroundColor: '#0D2B1F', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16, flex: 1, textAlign: 'center', marginHorizontal: 8 }} numberOfLines={1}>
            {currentTrip.name}
          </Text>
          <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff' }}>⚙️</Text>
          </TouchableOpacity>
        </View>
        {daysUntil ? (
          <View style={{ alignItems: 'center' }}>
            <View style={{ backgroundColor: '#E8A020', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 }}>
              <Text style={{ color: '#0D2B1F', fontSize: 12, fontWeight: '700' }}>⏱ {daysUntil}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Joined', value: `${joinedCount}/${currentTrip.group_size}`, emoji: '👥', color: '#EEF2FF' },
            { label: 'Open tasks', value: String(openTasks.length), emoji: '✅', color: '#F0FDF4' },
            { label: 'Spent', value: `₹${(totalSpent / 1000).toFixed(1)}K`, emoji: '💰', color: '#FFF7ED' },
          ].map((stat) => (
            <View key={stat.label} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: stat.color, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 18 }}>{stat.emoji}</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0D2B1F' }}>{stat.value}</Text>
              <Text style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* AI Companion card */}
        <TouchableOpacity
          style={{ backgroundColor: '#0D2B1F', borderRadius: 20, padding: 18, marginBottom: 14 }}
          onPress={() => router.push(`/(app)/trips/${id}/ai` as any)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ backgroundColor: '#E8A020', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 }}>
              <Text style={{ color: '#0D2B1F', fontSize: 11, fontWeight: '800' }}>✦ AI</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>TripMate Companion</Text>
          </View>
          {itinerary.length > 0 ? (
            <>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 10 }}>
                I've drafted a {[...new Set(itinerary.map(i => i.day_number))].length}-day itinerary for {currentTrip.destination || 'your trip'}.
              </Text>
              <TouchableOpacity
                onPress={() => router.push(`/(app)/trips/${id}/itinerary` as any)}
                style={{ backgroundColor: '#E8A020', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start' }}
              >
                <Text style={{ color: '#0D2B1F', fontSize: 12, fontWeight: '700' }}>Review draft →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14, marginBottom: 4 }}>
                Ask me to draft an itinerary for {currentTrip.destination || 'your destination'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                I'll account for all group preferences automatically
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Open Tasks */}
        {openTasks.length > 0 && (
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontWeight: '700', color: '#0D2B1F', fontSize: 14 }}>Open tasks ({openTasks.length})</Text>
              <TouchableOpacity onPress={() => router.push(`/(app)/trips/${id}/tasks` as any)}>
                <Text style={{ color: '#00897B', fontSize: 12, fontWeight: '700' }}>See all →</Text>
              </TouchableOpacity>
            </View>
            {openTasks.slice(0, 3).map((task) => (
              <View key={task.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F4F3EF' }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#E8E6E0' }} />
                <Text style={{ flex: 1, fontSize: 13, color: '#374151' }} numberOfLines={1}>{task.title}</Text>
                {task.assigned_to_name && (
                  <Text style={{ fontSize: 11, color: '#64748B' }}>→ {task.assigned_to_name}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Group */}
        <TouchableOpacity
          style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}
          onPress={() => router.push(`/(app)/trips/${id}/group` as any)}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', color: '#0D2B1F', fontSize: 14 }}>
              Group · {joinedCount} joined, {currentTrip.group_size - joinedCount} pending
            </Text>
            <Text style={{ color: '#00897B', fontSize: 12, fontWeight: '700' }}>Manage →</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {members.slice(0, 5).map((m) => (
              <MemberAvatar key={m.id} name={m.name} size={10} />
            ))}
            {currentTrip.group_size - joinedCount > 0 && (
              <MemberAvatar name="?" size={10} pending />
            )}
          </View>
        </TouchableOpacity>

        {/* Budget */}
        <TouchableOpacity
          style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}
          onPress={() => router.push(`/(app)/trips/${id}/budget` as any)}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontWeight: '700', color: '#0D2B1F', fontSize: 14 }}>Budget</Text>
            <Text style={{ color: '#00897B', fontSize: 12, fontWeight: '700' }}>Details →</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
            ₹{totalSpent.toLocaleString('en-IN')} of ₹{totalBudget.toLocaleString('en-IN')} spent
          </Text>
          <BudgetBar spent={totalSpent} total={totalBudget} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
