import { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase, Trip } from '../../lib/supabase';

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Jain', 'No preference'];
const BUDGET_OPTIONS = ['₹2,000–4,000', '₹4,000–8,000', '₹8,000–15,000', '₹15,000+'];
const INTEREST_OPTIONS = [
  { key: 'beach', label: 'Beach & relax', emoji: '🏖️' },
  { key: 'adventure', label: 'Adventure & trekking', emoji: '🧗' },
  { key: 'culture', label: 'Culture & food', emoji: '🍜' },
  { key: 'nature', label: 'Nature & wildlife', emoji: '🌿' },
  { key: 'spiritual', label: 'Pilgrimage', emoji: '🛕' },
  { key: 'city', label: 'City exploration', emoji: '🏙️' },
];

export default function JoinTripScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [organiserName, setOrganiserName] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Q1 — Name
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  // Q2 — Dietary
  const [dietary, setDietary] = useState('');
  // Q3 — Budget
  const [budget, setBudget] = useState('');
  // Q4 — Interests (multi-select)
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => { fetchTripByToken(); }, [token]);

  const fetchTripByToken = async () => {
    if (!token) return;
    const { data: tripData } = await supabase.from('trips').select('*').eq('invite_token', token).single();
    if (!tripData) { setLoadingTrip(false); return; }
    setTrip(tripData);

    const { count } = await supabase.from('trip_members').select('*', { count: 'exact', head: true }).eq('trip_id', tripData.id);
    setMemberCount(count ?? 0);

    const { data: org } = await supabase.from('trip_members').select('name').eq('trip_id', tripData.id).eq('role', 'organiser').single();
    setOrganiserName(org?.name || 'Your organiser');
    setLoadingTrip(false);
  };

  const toggleInterest = (key: string) =>
    setInterests(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const handleSubmit = async () => {
    setNameError('');
    if (!name.trim()) { setNameError('Please enter your name.'); return; }
    if (!trip) return;

    setSubmitting(true);
    const { error } = await supabase.from('trip_members').insert({
      trip_id: trip.id,
      user_id: null,
      name: name.trim(),
      dietary: dietary || 'No preference',
      budget_comfort: budget || '₹4,000–8,000',
      interests,
      accessibility: null,
      dream_destination: null,
      role: 'member',
    });
    setSubmitting(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setMemberCount(c => c + 1);
    setSubmitted(true);
  };

  if (loadingTrip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#1A3C5E" />
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>🔗</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A3C5E', marginBottom: 8, textAlign: 'center' }}>Invalid invite link</Text>
        <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>This link may have expired. Ask your organiser to share it again.</Text>
      </SafeAreaView>
    );
  }

  if (submitted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 52, marginBottom: 16 }}>🎉</Text>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#1A3C5E', marginBottom: 8, textAlign: 'center' }}>You're in!</Text>
        <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
          You've joined{' '}
          <Text style={{ fontWeight: '700', color: '#1A3C5E' }}>{trip.name}</Text>
          .{'\n'}The organiser will now get AI to plan the trip using your preferences.
        </Text>
        <View style={{ backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16, width: '100%', marginBottom: 24 }}>
          {trip.dates_start ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#6B7280', fontSize: 13 }}>Dates</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937' }}>
                {new Date(trip.dates_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                {trip.dates_end ? ` – ${new Date(trip.dates_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
              </Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>Group so far</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937' }}>{memberCount} / {trip.group_size} people</Text>
          </View>
        </View>
        <TouchableOpacity
          style={{ borderWidth: 1, borderColor: '#1A3C5E', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={{ color: '#1A3C5E', fontWeight: '600', fontSize: 13 }}>Create a free account to track the plan →</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={{ backgroundColor: '#1A3C5E', paddingHorizontal: 20, paddingTop: 36, paddingBottom: 24 }}>
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Text style={{ color: '#fff', fontSize: 20 }}>✦</Text>
          </View>
          <Text style={{ color: '#BFDBFE', fontSize: 12, marginBottom: 4 }}>
            <Text style={{ fontWeight: '700' }}>{organiserName}</Text> added you to
          </Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>{trip.name} 🌊</Text>
          <Text style={{ color: '#93C5FD', fontSize: 12 }}>
            {trip.dates_start
              ? `${new Date(trip.dates_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · `
              : ''}
            {trip.group_size} people
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
          <View style={{ backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12, marginBottom: 20 }}>
            <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
              Answer 3 quick questions so AI can plan the perfect trip for your group
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 24, paddingBottom: 32 }}>

          {/* Q1: Name */}
          <View>
            <Text style={qLabel}>1. Your name <Text style={{ color: '#EF4444' }}>*</Text></Text>
            <TextInput
              style={{ ...fieldInput, borderColor: nameError ? '#EF4444' : '#E5E7EB' }}
              placeholder="e.g. Priya Sharma"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={t => { setName(t); setNameError(''); }}
            />
            {nameError ? <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>{nameError}</Text> : null}
          </View>

          {/* Q2: Dietary */}
          <View>
            <Text style={qLabel}>2. Dietary preference</Text>
            <View style={{ gap: 8 }}>
              {DIETARY_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setDietary(opt)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: dietary === opt ? '#1A3C5E' : '#D1D5DB', alignItems: 'center', justifyContent: 'center' }}>
                    {dietary === opt ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A3C5E' }} /> : null}
                  </View>
                  <Text style={{ fontSize: 14, color: '#1F2937' }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Q3: Budget */}
          <View>
            <Text style={qLabel}>3. Daily budget comfort</Text>
            <View style={{ gap: 8 }}>
              {BUDGET_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setBudget(opt)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: budget === opt ? '#1A3C5E' : '#D1D5DB', alignItems: 'center', justifyContent: 'center' }}>
                    {budget === opt ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A3C5E' }} /> : null}
                  </View>
                  <Text style={{ fontSize: 14, color: '#1F2937' }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Q4: Interests */}
          <View>
            <Text style={qLabel}>4. What do you enjoy? (pick all that apply)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {INTEREST_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => toggleInterest(opt.key)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
                    borderRadius: 10, borderWidth: 1,
                    backgroundColor: interests.includes(opt.key) ? '#1A3C5E' : '#fff',
                    borderColor: interests.includes(opt.key) ? '#1A3C5E' : '#E5E7EB',
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 13 }}>{opt.emoji}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: interests.includes(opt.key) ? '#fff' : '#374151' }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={{ backgroundColor: submitting ? '#9CA3AF' : '#1A3C5E', borderRadius: 12, paddingVertical: 15, alignItems: 'center' }}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Join trip →</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const qLabel = { fontSize: 14, fontWeight: '600' as const, color: '#1F2937', marginBottom: 10 };
const fieldInput = {
  borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
  paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937',
};
