import { View, Text } from 'react-native';
import { ItineraryItem as IItem } from '../lib/supabase';

const CATEGORY_ICONS: Record<string, string> = {
  transport: '🚌',
  accommodation: '🏨',
  food: '🍽️',
  activity: '🎯',
  other: '📍',
};

type Props = {
  item: IItem;
};

export default function ItineraryItemCard({ item }: Props) {
  return (
    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3 shadow-sm">
      <View className="flex-row items-start gap-3">
        <Text className="text-2xl">{CATEGORY_ICONS[item.category] || '📍'}</Text>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            {item.time && (
              <Text className="text-xs text-muted font-semibold">{item.time}</Text>
            )}
            <Text className="text-sm font-bold text-gray-900 flex-1">{item.title}</Text>
          </View>

          {item.description && (
            <Text className="text-xs text-muted mt-1">{item.description}</Text>
          )}

          {item.location && (
            <Text className="text-xs text-muted mt-0.5">📍 {item.location}</Text>
          )}

          {/* Timing Intel */}
          {item.timing_intel && (
            <View className="bg-gold/10 rounded-lg px-3 py-1.5 mt-2">
              <Text className="text-xs text-yellow-800">⏰ {item.timing_intel}</Text>
            </View>
          )}

          {/* Transport Intel */}
          {item.transport_intel && (
            <View className="bg-blue-50 rounded-lg px-3 py-1.5 mt-1">
              <Text className="text-xs text-blue-800">🚶 {item.transport_intel}</Text>
            </View>
          )}

          {/* Dietary Badge */}
          {item.dietary_badge && (
            <View className="bg-success/10 rounded-lg px-3 py-1.5 mt-1">
              <Text className="text-xs text-green-800">✓ {item.dietary_badge}</Text>
            </View>
          )}

          {item.cost_per_person !== null && (
            <Text className="text-xs font-semibold text-teal mt-2">
              ₹{item.cost_per_person.toLocaleString('en-IN')}/person
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
