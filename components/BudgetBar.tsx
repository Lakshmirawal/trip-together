import { View, Text } from 'react-native';

type Props = {
  spent: number;
  total: number;
  label?: string;
};

export default function BudgetBar({ spent, total, label }: Props) {
  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  const barColor = pct > 90 ? 'bg-danger' : pct > 70 ? 'bg-gold' : 'bg-teal';

  return (
    <View className="mb-1">
      {label && (
        <View className="flex-row justify-between mb-1">
          <Text className="text-xs text-muted">{label}</Text>
          <Text className="text-xs text-gray-700 font-medium">
            ₹{spent.toLocaleString('en-IN')} / ₹{total.toLocaleString('en-IN')}
          </Text>
        </View>
      )}
      <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <View className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}
