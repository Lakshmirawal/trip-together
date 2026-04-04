import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';

function Icon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 6 }}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <Text style={{
        fontSize: 9, marginTop: 2, fontWeight: focused ? '700' : '400',
        color: focused ? '#E8A020' : 'rgba(255,255,255,0.4)',
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function TripDetailLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'web' ? 60 : 68,
          paddingBottom: Platform.OS === 'web' ? 0 : 6,
          backgroundColor: '#0D2B1F',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 16,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index"
        options={{ tabBarIcon: ({ focused }) => <Icon emoji="🏠" label="Overview" focused={focused} /> }}
      />
      <Tabs.Screen name="itinerary"
        options={{ tabBarIcon: ({ focused }) => <Icon emoji="📅" label="Itinerary" focused={focused} /> }}
      />
      <Tabs.Screen name="tasks"
        options={{ tabBarIcon: ({ focused }) => <Icon emoji="✅" label="Tasks" focused={focused} /> }}
      />
      <Tabs.Screen name="budget"
        options={{ tabBarIcon: ({ focused }) => <Icon emoji="💰" label="Budget" focused={focused} /> }}
      />
      <Tabs.Screen name="group"
        options={{ tabBarIcon: ({ focused }) => <Icon emoji="👥" label="Group" focused={focused} /> }}
      />
      <Tabs.Screen name="ai"
        options={{ tabBarIcon: ({ focused }) => <Icon emoji="✦" label="AI" focused={focused} /> }}
      />
    </Tabs>
  );
}
