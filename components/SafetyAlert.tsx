import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

type Props = {
  destination: string;
  alert: string;
};

const DESTINATION_ALERTS: Record<string, string> = {
  amsterdam: 'Heating pads / electric medical devices require documentation at Amsterdam Schiphol. Pack in checked baggage.',
  dubai: 'Alcohol consumption in public is prohibited in Dubai. Some medications may be restricted — check before packing.',
  maldives: 'Bringing alcohol into the Maldives for personal use is prohibited. Only resort-sold alcohol permitted.',
  bali: 'Respect temple dress codes — carry a sarong. Avoid pointing feet toward religious objects.',
  singapore: 'Chewing gum, e-cigarettes, and vaping are banned in Singapore. Fines are heavily enforced.',
  london: 'Oyster Card or contactless is required for tube travel — cash not accepted on TfL services.',
  tirupati: 'Strict dress code at Tirupati temple — traditional Indian attire mandatory. Photography inside sanctum is prohibited.',
  goa: 'Avoid wearing swimwear away from beach areas. Some beach shacks close during monsoon (June–Sept).',
  kerala: 'Elephant processions are common — maintain safe distance. Leeches are active during monsoon treks.',
  manali: 'High altitude above 2000m — acclimatise for 1 day. Carry altitude sickness medication.',
  ladakh: 'Altitude above 3500m — avoid exertion on Day 1. Inner Line Permit required for border areas.',
  shimla: 'Snowfall can block roads Dec–Feb. Check road status before travel.',
  'new york': 'Tap water is safe to drink. MetroCard required for subway — cash not accepted at turnstiles.',
  paris: 'Pickpocketing common near Eiffel Tower and Louvre. Keep belongings close.',
  thailand: 'Respect royal family and Buddhist symbols — criticising the monarchy is a criminal offence.',
};

export default function SafetyAlert({ destination, alert }: Props) {
  const [dismissed, setDismissed] = useState(false);

  const destKey = destination.toLowerCase();
  const matchedAlert = alert || Object.entries(DESTINATION_ALERTS).find(([key]) =>
    destKey.includes(key)
  )?.[1];

  if (!matchedAlert || dismissed) return null;

  return (
    <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-3">
      <View className="flex-row items-start gap-3">
        <Text className="text-xl">⚠️</Text>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-yellow-900 mb-1">Destination Alert</Text>
          <Text className="text-xs text-yellow-800 leading-4">{matchedAlert}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => setDismissed(true)}
        className="mt-3 items-end"
      >
        <Text className="text-xs text-yellow-700 font-semibold">Got it ✓</Text>
      </TouchableOpacity>
    </View>
  );
}

export { DESTINATION_ALERTS };
