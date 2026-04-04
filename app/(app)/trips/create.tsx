import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';

function generateToken(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

type Field = 'budget' | null;

export default function CreateTripScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupSize, setGroupSize] = useState(4);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState<Field>(null);
  const [createError, setCreateError] = useState('');

  const handleCreate = async () => {
    setCreateError('');
    if (!tripName.trim()) {
      setCreateError('Please enter a trip name.');
      return;
    }
    if (budgetMin && budgetMax && parseInt(budgetMin) >= parseInt(budgetMax)) {
      setCreateError('Min budget must be less than max budget.');
      return;
    }
    if (budgetMin && parseInt(budgetMin) < 0) {
      setCreateError('Budget cannot be negative.');
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setCreateError('End date cannot be before start date.');
      return;
    }
    if (!user?.id) {
      setCreateError('You are not signed in. Please log in and try again.');
      return;
    }
    setLoading(true);
    try {
      const inviteToken = generateToken(8);
      const { data: trip, error } = await supabase
        .from('trips')
        .insert({
          name: tripName.trim(),
          destination: destination.trim() || null,
          dates_start: startDate || null,
          dates_end: endDate || null,
          budget_min: budgetMin ? parseInt(budgetMin) : null,
          budget_max: budgetMax ? parseInt(budgetMax) : null,
          group_size: groupSize,
          organiser_id: user.id,
          invite_token: inviteToken,
          status: 'planning',
        })
        .select()
        .single();

      if (error || !trip) {
        setCreateError(error?.message || 'Failed to create trip. Please try again.');
        return;
      }

      await supabase.from('trip_members').insert({
        trip_id: trip.id,
        user_id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Organiser',
        email: user.email,
        dietary: 'No preference',
        budget_comfort: budgetMax ? `₹${parseInt(budgetMax).toLocaleString('en-IN')}+` : '₹8,000–15,000',
        interests: [],
        role: 'organiser',
      });

      router.push({
        pathname: '/(app)/trips/invite',
        params: { tripId: trip.id, tripName: trip.name, inviteToken },
      });
    } catch (e: any) {
      setCreateError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const budgetLabel = budgetMax
    ? budgetMin
      ? `₹${parseInt(budgetMin).toLocaleString('en-IN')} – ₹${parseInt(budgetMax).toLocaleString('en-IN')}`
      : `Up to ₹${parseInt(budgetMax).toLocaleString('en-IN')}`
    : null;

  const datesLabel = startDate
    ? endDate
      ? `${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)}`
      : formatDateDisplay(startDate)
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF' }}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Hero header */}
        <View style={{ backgroundColor: '#0D2B1F', paddingHorizontal: 20, paddingTop: 48, paddingBottom: 28 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View style={{ backgroundColor: '#E8A020', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 10 }}>
            <Text style={{ color: '#0D2B1F', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>NEW TRIP</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 4 }}>
            Plan with your group
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            AI handles the research. You handle the decisions.
          </Text>
        </View>

        {/* Trip basics */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
            Trip basics
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>

          {/* Trip name row */}
          <View style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <Text style={{ ...rowLabel, marginBottom: 8 }}>Trip name <Text style={{ color: '#EF4444' }}>*</Text></Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. Goa Girls Trip"
              placeholderTextColor="#9CA3AF"
              value={tripName}
              onChangeText={setTripName}
              returnKeyType="done"
            />
          </View>

          {/* Dates row — visible styled date inputs on web */}
          <View style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <Text style={{ ...rowLabel, marginBottom: 8 }}>Dates</Text>
            {Platform.OS === 'web' ? (() => {
              const today = new Date().toISOString().split('T')[0];
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 3 }}>Start date</Text>
                    <input
                      type="date"
                      value={startDate}
                      min={today}
                      onChange={(e: any) => {
                        setStartDate(e.target.value);
                        if (endDate && e.target.value > endDate) setEndDate('');
                      }}
                      style={{
                        width: '100%', border: '1px solid #E5E7EB', borderRadius: 8,
                        padding: '8px 10px', fontSize: 13, color: startDate ? '#1F2937' : '#9CA3AF',
                        fontFamily: 'system-ui', outline: 'none', cursor: 'pointer',
                        backgroundColor: '#FAFAFA',
                      } as any}
                    />
                  </View>
                  <Text style={{ color: '#9CA3AF', marginTop: 16 }}>–</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 3 }}>End date</Text>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || today}
                      onChange={(e: any) => setEndDate(e.target.value)}
                      style={{
                        width: '100%', border: '1px solid #E5E7EB', borderRadius: 8,
                        padding: '8px 10px', fontSize: 13, color: endDate ? '#1F2937' : '#9CA3AF',
                        fontFamily: 'system-ui', outline: 'none', cursor: 'pointer',
                        backgroundColor: '#FAFAFA',
                      } as any}
                    />
                  </View>
                </View>
              );
            })() : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={{ ...inputStyle, flex: 1, marginBottom: 0 }} placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
                <TextInput style={{ ...inputStyle, flex: 1, marginBottom: 0 }} placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} />
              </View>
            )}
          </View>

          {/* Group size row */}
          <View style={rowStyle}>
            <Text style={rowLabel}>Group size</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setGroupSize(Math.max(2, groupSize - 1))}
                style={stepperBtn}
              >
                <Text style={{ color: '#374151', fontSize: 16 }}>−</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0D2B1F', width: 20, textAlign: 'center' }}>
                {groupSize}
              </Text>
              <TouchableOpacity
                onPress={() => setGroupSize(groupSize + 1)}
                style={stepperBtn}
              >
                <Text style={{ color: '#374151', fontSize: 16 }}>+</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 13, color: '#64748B' }}>people</Text>
            </View>
          </View>

          {/* Budget row */}
          <TouchableOpacity
            style={rowStyle}
            onPress={() => setActiveField(activeField === 'budget' ? null : 'budget')}
            activeOpacity={0.7}
          >
            <Text style={rowLabel}>Budget / person</Text>
            <Text style={budgetLabel ? rowValueFilled : rowValueEmpty}>
              {budgetLabel ? `${budgetLabel} →` : '₹ Set range →'}
            </Text>
          </TouchableOpacity>
          {activeField === 'budget' && (
            <View style={{ marginTop: 8, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Min (₹)</Text>
                <TextInput
                  style={{ ...inputStyle, borderColor: budgetMin && budgetMax && parseInt(budgetMin) >= parseInt(budgetMax) ? '#DC2626' : 'rgba(13,43,31,0.25)' }}
                  placeholder="5,000"
                  placeholderTextColor="#9CA3AF"
                  value={budgetMin}
                  onChangeText={v => { setBudgetMin(v); setCreateError(''); }}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Max (₹)</Text>
                <TextInput
                  style={{ ...inputStyle, borderColor: budgetMin && budgetMax && parseInt(budgetMin) >= parseInt(budgetMax) ? '#DC2626' : 'rgba(13,43,31,0.25)' }}
                  placeholder="15,000"
                  placeholderTextColor="#9CA3AF"
                  value={budgetMax}
                  onChangeText={v => { setBudgetMax(v); setCreateError(''); }}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={() => setActiveField(null)}
                />
              </View>
              </View>
              {budgetMin && budgetMax && parseInt(budgetMin) >= parseInt(budgetMax) ? (
                <Text style={{ color: '#DC2626', fontSize: 11, marginTop: 4 }}>Min budget must be less than max budget.</Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Destination section */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
            Destination
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <Text style={{ ...rowLabel, marginBottom: 8 }}>Where to? <Text style={{ fontSize: 12, color: '#0D9488', fontWeight: '700' }}>✦ optional — AI can suggest</Text></Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. Goa, Manali, Rajasthan... (leave blank for AI)"
              placeholderTextColor="#9CA3AF"
              value={destination}
              onChangeText={setDestination}
              returnKeyType="done"
            />
          </View>

          {!destination && (
            <View style={{ backgroundColor: 'rgba(26,60,94,0.05)', borderWidth: 1, borderColor: 'rgba(26,60,94,0.1)', borderRadius: 12, padding: 14, marginTop: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0D2B1F', marginBottom: 3 }}>
                Leave blank — AI will suggest
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 18 }}>
                Once your group submits preferences, AI recommends the best destination based on everyone's interests, budget, and dietary needs.
              </Text>
            </View>
          )}
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 }}>
          {createError ? (
            <View style={{ backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <Text style={{ color: '#DC2626', fontSize: 13 }}>{createError}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={{
              backgroundColor: loading || !tripName.trim() ? '#D1D5DB' : '#E8A020',
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              shadowColor: '#E8A020',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: loading || !tripName.trim() ? 0 : 0.4,
              shadowRadius: 8,
              elevation: loading || !tripName.trim() ? 0 : 6,
            }}
            onPress={handleCreate}
            disabled={loading || !tripName.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#0D2B1F" />
            ) : (
              <Text style={{ color: loading || !tripName.trim() ? '#9CA3AF' : '#0D2B1F', fontWeight: '800', fontSize: 15 }}>
                Invite group & collect preferences →
              </Text>
            )}
          </TouchableOpacity>
          <Text style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 10 }}>
            Group members join via WhatsApp link — no account needed
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const rowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#F3F4F6',
};

const rowLabel = {
  fontSize: 14,
  fontWeight: '500' as const,
  color: '#1F2937',
};

const rowValueFilled = {
  fontSize: 14,
  fontWeight: '600' as const,
  color: '#1F2937',
  maxWidth: 180,
};

const rowValueEmpty = {
  fontSize: 14,
  color: '#9CA3AF',
};

const inputStyle = {
  borderWidth: 1,
  borderColor: 'rgba(26,60,94,0.25)',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 14,
  color: '#1F2937',
  marginBottom: 8,
};

const stepperBtn = {
  width: 28,
  height: 28,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: '#D1D5DB',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
