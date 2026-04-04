import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TABS = [
  { name: 'index', emoji: '🏠', label: 'Home' },
  { name: 'trips/index', emoji: '✈️', label: 'Trips' },
  { name: 'trips/create', emoji: null, label: 'New' },
  { name: 'explore', emoji: '🌍', label: 'Explore' },
  { name: 'profile', emoji: '👤', label: 'Profile' },
];

const PRIMARY = '#0D2B1F';
const GOLD = '#E8A020';
const INACTIVE = 'rgba(255,255,255,0.38)';
const BAR_HEIGHT = Platform.OS === 'web' ? 64 : 72;

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();

  return (
    <View style={{
      height: BAR_HEIGHT,
      backgroundColor: PRIMARY,
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: Platform.OS === 'web' ? 0 : 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 20,
    }}>
      {TABS.map((tab, idx) => {
        const routeIndex = state.routes.findIndex(r => r.name === tab.name);
        const focused = routeIndex !== -1 && state.index === routeIndex;
        const isCreate = tab.name === 'trips/create';

        return (
          <TouchableOpacity
            key={tab.name}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => router.push(('/(app)/' + (tab.name === 'index' ? '' : tab.name)) as any)}
            activeOpacity={0.7}
          >
            {isCreate ? (
              <View style={{
                width: 52, height: 52, borderRadius: 26,
                backgroundColor: GOLD,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 4,
                shadowColor: GOLD,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.6,
                shadowRadius: 10,
                elevation: 10,
              }}>
                <Text style={{ color: PRIMARY, fontSize: 28, fontWeight: '300', lineHeight: 32 }}>+</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingTop: 4 }}>
                <Text style={{ fontSize: 20 }}>{tab.emoji}</Text>
                <Text style={{
                  fontSize: 10, marginTop: 3,
                  color: focused ? GOLD : INACTIVE,
                  fontWeight: focused ? '700' : '400',
                }}>
                  {tab.label}
                </Text>
                {focused && (
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: GOLD, marginTop: 3 }} />
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const HIDDEN = { href: null as null };

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="trips/index" />
      <Tabs.Screen name="trips/create" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="trips/[id]/index" options={HIDDEN} />
      <Tabs.Screen name="trips/[id]/itinerary" options={HIDDEN} />
      <Tabs.Screen name="trips/[id]/tasks" options={HIDDEN} />
      <Tabs.Screen name="trips/[id]/budget" options={HIDDEN} />
      <Tabs.Screen name="trips/[id]/group" options={HIDDEN} />
      <Tabs.Screen name="trips/[id]/ai" options={HIDDEN} />
      <Tabs.Screen name="trips/invite" options={HIDDEN} />
    </Tabs>
  );
}
