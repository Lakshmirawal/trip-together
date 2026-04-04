import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';

const CATEGORIES = ['Trending', 'Budget', 'Beach', 'Hills', 'Pilgrimage', 'International'];

const DESTINATIONS = [
  { name: 'Goa', emoji: '🏖️', from: '₹8,000', bestTime: 'Oct–Mar', category: 'Beach', tag: 'Trending' },
  { name: 'Manali', emoji: '🏔️', from: '₹6,500', bestTime: 'Apr–Jun', category: 'Hills', tag: 'Trending' },
  { name: 'Rajasthan', emoji: '🏯', from: '₹9,000', bestTime: 'Oct–Mar', category: 'Culture', tag: 'Trending' },
  { name: 'Kerala', emoji: '🌴', from: '₹7,500', bestTime: 'Sep–Mar', category: 'Beach', tag: 'Budget' },
  { name: 'Tirupati', emoji: '🛕', from: '₹3,000', bestTime: 'Year-round', category: 'Pilgrimage', tag: 'Pilgrimage' },
  { name: 'Shimla', emoji: '❄️', from: '₹5,000', bestTime: 'Dec–Feb', category: 'Hills', tag: 'Hills' },
  { name: 'Andaman', emoji: '🐠', from: '₹15,000', bestTime: 'Oct–May', category: 'Beach', tag: 'Beach' },
  { name: 'Rishikesh', emoji: '🏄', from: '₹4,500', bestTime: 'Mar–Jun', category: 'Adventure', tag: 'Budget' },
  { name: 'Varanasi', emoji: '🪔', from: '₹5,500', bestTime: 'Oct–Mar', category: 'Pilgrimage', tag: 'Pilgrimage' },
  { name: 'Bangkok', emoji: '🛺', from: '₹25,000', bestTime: 'Nov–Apr', category: 'International', tag: 'International' },
  { name: 'Bali', emoji: '🌺', from: '₹35,000', bestTime: 'Apr–Oct', category: 'International', tag: 'International' },
  { name: 'Singapore', emoji: '🦁', from: '₹40,000', bestTime: 'Year-round', category: 'International', tag: 'International' },
];

const DESTINATION_INFO: Record<string, { description: string; highlights: string[] }> = {
  Goa: {
    description: 'India\'s beach paradise with vibrant nightlife, seafood, and colonial heritage.',
    highlights: ['Colva Beach', 'Fort Aguada', 'Dudhsagar Falls', 'Spice plantations'],
  },
  Manali: {
    description: 'A high-altitude Himalayan resort town known for snow, adventure sports, and monasteries.',
    highlights: ['Rohtang Pass', 'Solang Valley', 'Hadimba Temple', 'Old Manali'],
  },
  Rajasthan: {
    description: 'The Land of Kings — majestic forts, desert dunes, and royal hospitality.',
    highlights: ['Jaipur City Palace', 'Jaisalmer Fort', 'Thar Desert', 'Ranthambore'],
  },
  Kerala: {
    description: 'God\'s Own Country — backwaters, Ayurveda, spice gardens, and pristine beaches.',
    highlights: ['Alleppey Houseboats', 'Munnar Tea Gardens', 'Kovalam Beach', 'Periyar Wildlife'],
  },
};

export default function ExploreScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [selectedDest, setSelectedDest] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = DESTINATIONS.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Trending' || d.tag === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const dest = selectedDest ? DESTINATIONS.find((d) => d.name === selectedDest) : null;
  const destInfo = selectedDest ? DESTINATION_INFO[selectedDest] : null;

  if (selectedDest && dest) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="bg-navy px-5 py-4 flex-row items-center gap-3">
          <TouchableOpacity onPress={() => setSelectedDest(null)}>
            <Text className="text-white text-xl">←</Text>
          </TouchableOpacity>
          <Text className="text-white font-bold text-base">{dest.name}</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="bg-navy/5 mx-5 mt-5 rounded-2xl p-6 items-center">
            <Text className="text-6xl mb-3">{dest.emoji}</Text>
            <Text className="text-2xl font-bold text-navy mb-1">{dest.name}</Text>
            <Text className="text-muted text-sm">From {dest.from} · Best: {dest.bestTime}</Text>
          </View>

          {destInfo && (
            <View className="px-5 mt-5">
              <Text className="text-sm text-gray-700 leading-5 mb-5">{destInfo.description}</Text>
              <Text className="text-sm font-bold text-navy mb-3">Top Highlights</Text>
              {destInfo.highlights.map((h) => (
                <View key={h} className="flex-row items-center gap-2 mb-2">
                  <Text className="text-teal">✦</Text>
                  <Text className="text-sm text-gray-700">{h}</Text>
                </View>
              ))}
            </View>
          )}

          <View className="px-5 mt-6 gap-3 mb-8">
            <TouchableOpacity
              className="bg-navy rounded-xl py-4 items-center"
              onPress={() => {
                setSelectedDest(null);
                router.push('/(app)/trips/create' as any);
              }}
            >
              <Text className="text-white font-semibold">Plan a trip here →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border border-gray-300 rounded-xl py-3.5 items-center"
              onPress={() => Linking.openURL(`https://www.makemytrip.com/`)}
            >
              <Text className="text-gray-700 font-semibold text-sm">Search flights on MakeMyTrip →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-3">
        <Text className="text-xl font-bold text-navy mb-3">Explore</Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm"
          placeholder="Search destinations..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-5 mb-3"
        contentContainerStyle={{ gap: 8 }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full ${activeCategory === cat ? 'bg-navy' : 'bg-white border border-gray-200'}`}
          >
            <Text className={`text-sm font-medium ${activeCategory === cat ? 'text-white' : 'text-gray-700'}`}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid */}
      <ScrollView showsVerticalScrollIndicator={false} className="px-5">
        <View className="flex-row flex-wrap gap-3 pb-8">
          {filtered.map((dest) => (
            <TouchableOpacity
              key={dest.name}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100"
              style={{ width: '47%' }}
              onPress={() => setSelectedDest(dest.name)}
            >
              <View className="bg-navy/5 items-center py-6">
                <Text className="text-4xl">{dest.emoji}</Text>
              </View>
              <View className="p-3">
                <Text className="font-bold text-gray-900 text-sm">{dest.name}</Text>
                <Text className="text-xs text-teal font-semibold">{dest.from}</Text>
                <Text className="text-xs text-muted mt-0.5">Best: {dest.bestTime}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
