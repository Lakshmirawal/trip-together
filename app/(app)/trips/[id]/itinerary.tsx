import { useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTripStore } from '../../../../stores/tripStore';
import { useAuthStore } from '../../../../stores/authStore';
import { supabase, ItineraryItem } from '../../../../lib/supabase';
import { generateItineraryShareLink, openWhatsApp } from '../../../../lib/whatsapp';

const P = '#0D2B1F';
const GOLD = '#E8A020';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  transport:     { bg: '#EFF6FF', text: '#1D4ED8', emoji: '🚌' },
  accommodation: { bg: '#FFF7ED', text: '#C2410C', emoji: '🏨' },
  food:          { bg: '#F0FDF4', text: '#15803D', emoji: '🍽️' },
  activity:      { bg: '#FAF5FF', text: '#7E22CE', emoji: '🎯' },
  other:         { bg: '#F9FAFB', text: '#374151', emoji: '📦' },
};

export default function ItineraryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentTrip, itinerary, fetchTripDetails } = useTripStore();
  const { user } = useAuthStore();
  const isOrganiser = currentTrip?.organiser_id === user?.id;

  useEffect(() => {
    if (!id) return;
    fetchTripDetails(id);
    const channel = supabase.channel(`itinerary-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'itinerary_items', filter: `trip_id=eq.${id}` },
        () => fetchTripDetails(id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const days = itinerary.reduce<Record<number, ItineraryItem[]>>((acc, item) => {
    if (!acc[item.day_number]) acc[item.day_number] = [];
    acc[item.day_number].push(item);
    return acc;
  }, {});
  const dayNumbers = Object.keys(days).map(Number).sort((a, b) => a - b);

  if (dayNumbers.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF' }}>
        <View style={{ backgroundColor: P, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Itinerary</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>📅</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: P, marginBottom: 8, textAlign: 'center' }}>No itinerary yet</Text>
          <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
            Ask the AI companion to draft a day-by-day plan tailored to your group
          </Text>
          {isOrganiser && (
            <TouchableOpacity
              style={{ backgroundColor: GOLD, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 }}
              onPress={() => router.push(`/(app)/trips/${id}/ai` as any)}
            >
              <Text style={{ color: P, fontWeight: '800', fontSize: 14 }}>✦ Draft with AI →</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF' }}>
      {/* Header */}
      <View style={{ backgroundColor: P, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Itinerary Draft</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{dayNumbers.length} days · {itinerary.length} activities</Text>
          </View>
        </View>
        {isOrganiser && (
          <TouchableOpacity
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}
            onPress={() => openWhatsApp(generateItineraryShareLink(currentTrip?.name || 'our trip', id))}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Share →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom action bar */}
      {isOrganiser && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E8E6E0', padding: 16, flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push(`/(app)/trips/${id}/ai` as any)}
            style={{ flex: 1, backgroundColor: '#F4F3EF', borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#E8E6E0' }}
          >
            <Text style={{ color: P, fontWeight: '700', fontSize: 13 }}>✦ Edit in AI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openWhatsApp(generateItineraryShareLink(currentTrip?.name || 'our trip', id))}
            style={{ flex: 2, backgroundColor: P, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Share to group →</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {dayNumbers.map((dayNum) => {
          const items = days[dayNum];
          const firstItem = items[0];
          const dateLabel = firstItem?.day_date
            ? new Date(firstItem.day_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
            : `Day ${dayNum}`;
          const dayTotal = items.reduce((s, i) => s + (i.cost_per_person ?? 0), 0);

          return (
            <View key={dayNum} style={{ marginBottom: 24 }}>
              {/* Day header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: P, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: GOLD, fontSize: 12, fontWeight: '800' }}>{dayNum}</Text>
                </View>
                <View>
                  <Text style={{ fontWeight: '800', color: P, fontSize: 15 }}>{dateLabel}</Text>
                  {dayTotal > 0 && (
                    <Text style={{ fontSize: 11, color: '#64748B' }}>₹{dayTotal.toLocaleString('en-IN')}/person</Text>
                  )}
                </View>
              </View>

              {/* Timeline */}
              <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
                {items.map((item, idx) => {
                  const cat = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;
                  return (
                    <View key={item.id} style={{ flexDirection: 'row', padding: 14, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: '#F4F3EF' }}>
                      {/* Time + category dot */}
                      <View style={{ width: 48, alignItems: 'center', marginRight: 12 }}>
                        {item.time ? <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>{item.time}</Text> : null}
                        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: cat.bg, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                          <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                        </View>
                      </View>

                      {/* Content */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ fontWeight: '700', color: '#1F2937', fontSize: 13, flex: 1, marginRight: 8 }}>{item.title}</Text>
                          {item.cost_per_person ? (
                            <Text style={{ fontSize: 12, fontWeight: '700', color: P }}>₹{item.cost_per_person.toLocaleString('en-IN')}</Text>
                          ) : null}
                        </View>
                        {item.location ? <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>📍 {item.location}</Text> : null}
                        {item.description ? <Text style={{ fontSize: 12, color: '#374151', lineHeight: 17, marginBottom: 4 }}>{item.description}</Text> : null}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                          {item.timing_intel ? (
                            <View style={{ backgroundColor: '#FFF7ED', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                              <Text style={{ fontSize: 10, color: '#C2410C' }}>⏱ {item.timing_intel}</Text>
                            </View>
                          ) : null}
                          {item.transport_intel ? (
                            <View style={{ backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                              <Text style={{ fontSize: 10, color: '#1D4ED8' }}>🚌 {item.transport_intel}</Text>
                            </View>
                          ) : null}
                          {item.dietary_badge ? (
                            <View style={{ backgroundColor: '#F0FDF4', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                              <Text style={{ fontSize: 10, color: '#15803D' }}>🥗 {item.dietary_badge}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Day total */}
              {dayTotal > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                  <View style={{ backgroundColor: `${P}12`, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 }}>
                    <Text style={{ color: P, fontSize: 12, fontWeight: '700' }}>Day total: ₹{dayTotal.toLocaleString('en-IN')}/person</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
