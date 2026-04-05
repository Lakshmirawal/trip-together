import { useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTripStore } from '../../../../stores/tripStore';
import { useAuthStore } from '../../../../stores/authStore';
import { supabase } from '../../../../lib/supabase';

const P = '#0D2B1F';
const GOLD = '#E8A020';

function getDaysUntil(dateStr: string | null): { label: string; urgent: boolean } {
  if (!dateStr) return { label: '', urgent: false };
  const diff = Math.ceil((new Date(dateStr + 'T00:00:00').getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: 'Trip passed', urgent: false };
  if (diff === 0) return { label: 'Today!', urgent: true };
  if (diff <= 7) return { label: `${diff} days away`, urgent: true };
  return { label: `${diff} days away`, urgent: false };
}

function getDueLabel(due: string | null): string {
  if (!due) return '';
  const diff = Math.ceil((new Date(due + 'T00:00:00').getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Due today';
  return `${diff} day${diff !== 1 ? 's' : ''} left`;
}

export default function TripOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentTrip, members, tasks, expenses, itinerary, fetchTripDetails, loading } = useTripStore();

  useEffect(() => {
    if (!id) return;
    fetchTripDetails(id);
    const channel = supabase.channel(`trip-overview-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${id}` }, () => fetchTripDetails(id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `trip_id=eq.${id}` }, () => fetchTripDetails(id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'itinerary_items', filter: `trip_id=eq.${id}` }, () => fetchTripDetails(id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading && !currentTrip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={P} size="large" />
      </SafeAreaView>
    );
  }

  if (!currentTrip) return null;

  const isOrganiser = currentTrip.organiser_id === user?.id;
  const openTasks = tasks.filter(t => t.status !== 'done');
  const doneTasks = tasks.filter(t => t.status === 'done');
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = (currentTrip.budget_max ?? 0) * currentTrip.group_size;
  const joinedCount = members.length;
  const prefsDone = members.filter(m => (m.interests?.length ?? 0) > 0 || m.dietary !== 'No preference').length;
  const { label: daysLabel, urgent } = getDaysUntil(currentTrip.dates_start);
  const dayCount = [...new Set(itinerary.map(i => i.day_number))].length;

  // Build AI summary message
  const vegCount = members.filter(m => ['Vegetarian', 'Vegan', 'Jain'].includes(m.dietary)).length;
  const budgetStr = currentTrip.budget_min && currentTrip.budget_max
    ? `₹${(currentTrip.budget_min / 1000).toFixed(0)}–${(currentTrip.budget_max / 1000).toFixed(0)}K/person`
    : currentTrip.budget_max ? `₹${(currentTrip.budget_max / 1000).toFixed(0)}K/person` : null;

  let aiMessage = '';
  if (itinerary.length > 0 && currentTrip.destination) {
    aiMessage = `Based on group preferences${vegCount > 0 ? ` (${vegCount} vegetarian${vegCount > 1 ? 's' : ''})` : ''}${budgetStr ? `, ${budgetStr}` : ''}, I've drafted a ${dayCount}-day ${currentTrip.destination} itinerary for you.`;
  } else if (currentTrip.destination) {
    aiMessage = `Destination is set to ${currentTrip.destination}. Ask me to draft a day-by-day itinerary for your group!`;
  } else if (members.length >= 2) {
    aiMessage = `${members.length} members have joined. I can suggest destinations based on everyone's preferences.`;
  } else {
    aiMessage = `Share the invite link with your group. Once they join, I'll help plan the perfect trip.`;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF' }}>
      {/* Header */}
      <View style={{ backgroundColor: P, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, flex: 1 }} numberOfLines={1}>
            {currentTrip.name}
          </Text>
          {daysLabel ? (
            <View style={{ backgroundColor: urgent ? '#DC2626' : GOLD, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ color: urgent ? '#fff' : P, fontSize: 11, fontWeight: '700' }}>{daysLabel}</Text>
            </View>
          ) : null}
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { value: `${joinedCount}/${currentTrip.group_size}`, label: 'Joined', emoji: '👥' },
            { value: `${prefsDone}/${joinedCount || 1}`, label: 'Prefs done', emoji: '✅' },
            { value: String(openTasks.length), label: 'Tasks open', emoji: '📋' },
          ].map(stat => (
            <View key={stat.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{stat.value}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {/* AI Companion card */}
        <View style={{ backgroundColor: P, borderRadius: 18, padding: 16, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <View style={{ backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ color: P, fontSize: 11, fontWeight: '800' }}>✦ AI COMPANION</Text>
            </View>
            {itinerary.length > 0 && (
              <View style={{ backgroundColor: '#16A34A', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Drafted for you</Text>
              </View>
            )}
          </View>
          <Text style={{ color: '#fff', fontSize: 13, lineHeight: 20, marginBottom: 12 }}>{aiMessage}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push(`/(app)/trips/${id}/ai` as any)}
              style={{ flex: 1, backgroundColor: GOLD, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
            >
              <Text style={{ color: P, fontWeight: '800', fontSize: 13 }}>
                {itinerary.length > 0 ? 'Review draft →' : '✦ Ask AI'}
              </Text>
            </TouchableOpacity>
            {itinerary.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push(`/(app)/trips/${id}/itinerary` as any)}
                style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>View itinerary</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Open Tasks */}
        <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: openTasks.length > 0 ? 12 : 0 }}>
            <Text style={{ fontWeight: '800', color: P, fontSize: 14 }}>
              Open tasks {openTasks.length > 0 ? `(${openTasks.length})` : ''}
            </Text>
            <TouchableOpacity onPress={() => router.push(`/(app)/trips/${id}/tasks` as any)}>
              <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '700' }}>
                {openTasks.length > 0 ? 'See all →' : '+ Add task'}
              </Text>
            </TouchableOpacity>
          </View>

          {openTasks.length === 0 && doneTasks.length === 0 && (
            <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', paddingVertical: 8 }}>No tasks yet</Text>
          )}

          {openTasks.slice(0, 4).map((task, i) => {
            const due = getDueLabel(task.due_date);
            const overdue = due === 'Overdue';
            return (
              <View key={task.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#F4F3EF' }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 3 }} numberOfLines={1}>{task.title}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {task.assigned_to_name && (
                      <Text style={{ fontSize: 11, color: '#64748B' }}>→ {task.assigned_to_name}</Text>
                    )}
                    {due ? (
                      <Text style={{ fontSize: 11, color: overdue ? '#DC2626' : '#C2410C', fontWeight: '600' }}>{due}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}

          {doneTasks.length > 0 && (
            <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F4F3EF', marginTop: 4 }}>
              {doneTasks.slice(0, 2).map(task => (
                <View key={task.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#94A3B8', textDecorationLine: 'line-through', flex: 1 }} numberOfLines={1}>{task.title}</Text>
                  {task.assigned_to_name && (
                    <Text style={{ fontSize: 11, color: '#94A3B8' }}>by {task.assigned_to_name}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Group */}
        <TouchableOpacity
          style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}
          onPress={() => router.push(`/(app)/trips/${id}/group` as any)}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontWeight: '800', color: P, fontSize: 14 }}>
              Group · {joinedCount}/{currentTrip.group_size} joined
            </Text>
            <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '700' }}>Manage →</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {members.slice(0, 6).map((m) => (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F3EF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 6 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: P, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: GOLD, fontSize: 9, fontWeight: '800' }}>{m.name[0].toUpperCase()}</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#374151', fontWeight: '500' }}>{m.name.split(' ')[0]}</Text>
                {m.role === 'organiser' && <Text style={{ fontSize: 10 }}>👑</Text>}
              </View>
            ))}
            {currentTrip.group_size - joinedCount > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F3EF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 6 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 10 }}>⏳</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#94A3B8' }}>{currentTrip.group_size - joinedCount} pending</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Budget */}
        <TouchableOpacity
          style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}
          onPress={() => router.push(`/(app)/trips/${id}/budget` as any)}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontWeight: '800', color: P, fontSize: 14 }}>Budget</Text>
            <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '700' }}>Details →</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
            ₹{totalSpent.toLocaleString('en-IN')} spent of ₹{totalBudget.toLocaleString('en-IN')} committed
          </Text>
          <View style={{ height: 8, backgroundColor: '#F4F3EF', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{
              height: 8,
              width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%` as any,
              backgroundColor: totalSpent > totalBudget ? '#DC2626' : P,
              borderRadius: 4,
            }} />
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
