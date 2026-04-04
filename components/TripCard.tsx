import { View, Text, TouchableOpacity } from 'react-native';
import { Trip } from '../lib/supabase';

type Props = { trip: Trip; onPress?: () => void };

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

const STATUS: Record<Trip['status'], { bg: string; text: string; label: string }> = {
  planning:  { bg: '#FFF7ED', text: '#C2410C', label: 'Planning' },
  confirmed: { bg: '#F0FDF4', text: '#15803D', label: 'Confirmed' },
  ongoing:   { bg: '#EFF6FF', text: '#1D4ED8', label: 'Ongoing' },
  completed: { bg: '#F9FAFB', text: '#6B7280', label: 'Done' },
};

export default function TripCard({ trip, onPress }: Props) {
  const { label: daysLabel, urgent } = getDaysUntil(trip.dates_start);
  const status = STATUS[trip.status] || STATUS.planning;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1F2937', marginBottom: 2 }} numberOfLines={1}>
            {trip.name}
          </Text>
          {trip.destination ? (
            <Text style={{ fontSize: 12, color: '#64748B' }}>📍 {trip.destination}</Text>
          ) : (
            <Text style={{ fontSize: 12, color: `${P}60`, fontStyle: 'italic' }}>✦ Destination TBD</Text>
          )}
        </View>
        <View style={{ backgroundColor: status.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: status.text }}>{status.label}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          {trip.dates_start && (
            <Text style={{ fontSize: 12, color: '#64748B' }}>
              📅 {new Date(trip.dates_start + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          )}
          <Text style={{ fontSize: 12, color: '#64748B' }}>👥 {trip.group_size}</Text>
          {trip.budget_max ? (
            <Text style={{ fontSize: 12, color: '#64748B' }}>💰 ₹{trip.budget_max.toLocaleString('en-IN')}/person</Text>
          ) : null}
        </View>
        {daysLabel ? (
          <View style={{ backgroundColor: urgent ? `${GOLD}20` : '#F4F3EF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: urgent ? '#C2410C' : '#64748B' }}>{daysLabel}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
