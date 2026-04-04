import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTripStore, AIItineraryDay } from '../../../../stores/tripStore';
import { callAICompanion, AIMessage } from '../../../../lib/anthropic';

const P = '#0D2B1F';
const GOLD = '#E8A020';

const QUICK_PROMPTS: { label: string; message: string }[] = [
  {
    label: '📅 Draft itinerary',
    message: `Draft a complete day-by-day itinerary for our trip. For each day include timings, places, costs per person, transport details, and dietary notes.

IMPORTANT: End your response with the itinerary in this exact JSON (no extra text after the JSON):
{"itinerary":[{"day":1,"date":"YYYY-MM-DD","items":[{"time":"09:00","title":"Activity","description":"Details","location":"Place","cost_per_person":500,"category":"activity","timing_intel":"Best in morning","transport_intel":"10 min walk","dietary_badge":null}]}]}

Categories must be one of: transport, accommodation, food, activity, other`,
  },
  { label: '🍽️ Veg restaurants', message: 'Suggest the best vegetarian and Jain-friendly restaurants near our destination. Include price range, specialties, and best time to visit.' },
  { label: '⏰ Best time to visit', message: 'What is the best time of year to visit our destination? Include weather, crowds, festivals, and any seasonal tips.' },
  { label: '💰 Budget breakdown', message: 'Give a detailed per-person budget breakdown for our trip covering accommodation, food, transport, activities, and miscellaneous. Flag if our stated budget is tight or comfortable.' },
  { label: '🎒 Packing list', message: 'Create a smart packing list tailored to our destination, travel dates, and group interests. Highlight things people commonly forget.' },
];

function extractItineraryJSON(text: string): AIItineraryDay[] | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed?.itinerary && Array.isArray(parsed.itinerary)) return parsed.itinerary;
  } catch {}
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (parsed?.itinerary && Array.isArray(parsed.itinerary)) return parsed.itinerary;
  } catch {}
  return null;
}

function buildWelcome(tripName: string): AIMessage {
  return {
    role: 'assistant',
    content: `Hi! I'm ✦ TripMate, your AI travel companion for ${tripName}.\n\nI know your group's dietary needs, budget, and interests — so I plan specifically for you.\n\nTap a quick prompt or ask me anything!`,
  };
}

export default function AICompanionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentTrip, fetchTripDetails, saveItineraryFromAI } = useTripStore();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<AIMessage[]>([buildWelcome(currentTrip?.name || 'this trip')]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [itineraryMsgIdx, setItineraryMsgIdx] = useState<number | null>(null);
  const [pendingItinerary, setPendingItinerary] = useState<AIItineraryDay[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Fetch trip details on mount and reset conversation when trip changes
  useEffect(() => {
    if (!id) return;
    fetchTripDetails(id);
  }, [id]);

  // Update welcome message once trip name is known
  useEffect(() => {
    if (currentTrip?.id === id && currentTrip?.name) {
      setMessages([buildWelcome(currentTrip.name)]);
      setInput('');
      setError('');
      setPendingItinerary(null);
      setItineraryMsgIdx(null);
      setSaved(false);
    }
  }, [currentTrip?.id]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setError('');
    const userMsg: AIMessage = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setSaved(false);
    setPendingItinerary(null);
    setItineraryMsgIdx(null);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const reply = await callAICompanion(id, newMessages);
      const updated: AIMessage[] = [...newMessages, { role: 'assistant', content: reply }];
      setMessages(updated);
      const parsed = extractItineraryJSON(reply);
      if (parsed && parsed.length > 0) {
        setPendingItinerary(parsed);
        setItineraryMsgIdx(updated.length - 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reach AI. Check your edge function deployment.');
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleSaveItinerary = async () => {
    if (!pendingItinerary) return;
    setSaving(true);
    try {
      await saveItineraryFromAI(id, pendingItinerary);
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save itinerary.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF' }}>
      {/* Header */}
      <View style={{ backgroundColor: P, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 16 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: GOLD, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: P, fontSize: 10, fontWeight: '800' }}>✦ AI</Text>
            </View>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>TripMate Companion</Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1 }}>{currentTrip?.name}</Text>
        </View>
      </View>

      {/* Quick prompts */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E8E6E0', maxHeight: 48 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}
      >
        {QUICK_PROMPTS.map((p) => (
          <TouchableOpacity
            key={p.label}
            onPress={() => sendMessage(p.message)}
            style={{ backgroundColor: `${P}12`, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: `${P}25` }}
          >
            <Text style={{ color: P, fontSize: 12, fontWeight: '600' }}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Error banner */}
      {error ? (
        <View style={{ backgroundColor: '#FEF2F2', padding: 12, borderBottomWidth: 1, borderBottomColor: '#FCA5A5' }}>
          <Text style={{ color: '#DC2626', fontSize: 12 }}>⚠️ {error}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={120}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, i) => (
            <View key={i}>
              {msg.role === 'user' ? (
                <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
                  <View style={{ backgroundColor: '#E8E6E0', borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '80%' }}>
                    <Text style={{ color: '#1F2937', fontSize: 13, lineHeight: 19 }}>{msg.content.split('\n')[0]}</Text>
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ backgroundColor: P, borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '88%' }}>
                    <Text style={{ color: GOLD, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>✦ TripMate</Text>
                    <Text style={{ color: '#fff', fontSize: 13, lineHeight: 19 }}>{msg.content}</Text>
                  </View>
                </View>
              )}

              {/* Save itinerary card */}
              {i === itineraryMsgIdx && pendingItinerary && (
                <View style={{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${P}20`, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: P, marginBottom: 4 }}>
                    ✦ {pendingItinerary.length}-day itinerary ready
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
                    {pendingItinerary.reduce((s, d) => s + d.items.length, 0)} activities · tap to save
                  </Text>
                  {saved ? (
                    <View style={{ gap: 10 }}>
                      <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                        <Text style={{ color: '#059669', fontWeight: '700', fontSize: 13 }}>✓ Saved to itinerary</Text>
                      </View>
                      <TouchableOpacity
                        style={{ backgroundColor: P, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                        onPress={() => router.push(`/(app)/trips/${id}/itinerary` as any)}
                      >
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>View itinerary →</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={{ backgroundColor: saving ? '#D1D5DB' : GOLD, borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                      onPress={handleSaveItinerary}
                      disabled={saving}
                    >
                      {saving ? <ActivityIndicator color={P} size="small" /> : null}
                      <Text style={{ color: P, fontWeight: '800', fontSize: 13 }}>
                        {saving ? 'Saving...' : 'Save to itinerary →'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
          {loading && (
            <View style={{ alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ backgroundColor: P, borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10 }}>
                <Text style={{ color: GOLD, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>✦ TripMate</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Thinking...</Text>
              </View>
            </View>
          )}
          <View style={{ height: 8 }} />
        </ScrollView>

        {/* Input */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E8E6E0', backgroundColor: '#fff' }}>
          <TextInput
            style={{ flex: 1, backgroundColor: '#F4F3EF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 13, color: '#1F2937', borderWidth: 1, borderColor: '#E8E6E0', maxHeight: 100 }}
            placeholder="Ask TripMate anything..."
            placeholderTextColor="#94A3B8"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: input.trim() && !loading ? GOLD : '#E8E6E0', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: input.trim() && !loading ? P : '#94A3B8', fontSize: 18, fontWeight: '700' }}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
