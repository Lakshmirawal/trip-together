import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTripStore } from '../../../../stores/tripStore';
import { useAuthStore } from '../../../../stores/authStore';
import { supabase } from '../../../../lib/supabase';
import { generateWhatsAppDeeplink, generateInviteLink, openWhatsApp } from '../../../../lib/whatsapp';
import MemberAvatar from '../../../../components/MemberAvatar';

type Tab = 'Group' | 'Destinations';

const INTEREST_LABELS: Record<string, string> = {
  beach: 'Beach & relax', adventure: 'Adventure', culture: 'Culture & food',
  nature: 'Nature', spiritual: 'Pilgrimage', city: 'City',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentTrip, members, destinationVotes, loading, loadingAI,
    fetchTripDetails, generateDestinationSuggestions, castVote, confirmDestination, fetchDestinationVotes } = useTripStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('Group');

  const isOrganiser = currentTrip?.organiser_id === user?.id;
  const myMember = members.find(m => m.user_id === user?.id);
  const myVote = destinationVotes.find(v => v.member_id === myMember?.id);
  const suggestions = currentTrip?.ai_suggestions || [];
  const hasSuggestions = suggestions.length > 0;
  const pendingCount = Math.max(0, (currentTrip?.group_size ?? 0) - members.length);

  // Initial fetch + realtime
  useEffect(() => {
    if (!id) return;
    fetchTripDetails(id);
    const channel = supabase
      .channel(`group-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${id}` },
        () => fetchTripDetails(id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'destination_votes', filter: `trip_id=eq.${id}` },
        () => fetchDestinationVotes(id))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${id}` },
        () => fetchTripDetails(id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleGetSuggestions = async () => {
    await generateDestinationSuggestions(id);
    setActiveTab('Destinations');
  };

  const handleVote = async (index: number) => {
    if (!myMember) { Alert.alert('Error', 'You are not a member of this trip.'); return; }
    if (myVote) { Alert.alert('Already voted', 'You have already cast your vote.'); return; }
    await castVote(id, myMember.id, myMember.name, index);
  };

  const handleConfirmDestination = async (name: string) => {
    Alert.alert('Confirm destination', `Set "${name}" as the trip destination?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => confirmDestination(id, name) },
    ]);
  };

  // Vote counts per suggestion
  const voteCounts = suggestions.map((_, i) =>
    destinationVotes.filter(v => v.suggestion_index === i).length
  );
  const maxVotes = Math.max(...voteCounts, 1);
  const totalVotes = voteCounts.reduce((a, b) => a + b, 0);
  const leadingIndex = voteCounts.indexOf(Math.max(...voteCounts));

  // Sort members: organiser first, then by joined_at
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'organiser') return -1;
    if (b.role === 'organiser') return 1;
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });

  if (loading && !currentTrip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ECE5DD', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#075E54" />
        <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 13 }}>Loading group...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ECE5DD' }}>
      {/* Header — WhatsApp style */}
      <View style={{ backgroundColor: '#075E54', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#128C7E', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>✈️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
            {currentTrip?.name || 'Trip Group'}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
            {members.length} member{members.length !== 1 ? 's' : ''}{pendingCount > 0 ? `, ${pendingCount} pending` : ''}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        {(['Group', 'Destinations'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === tab ? '#075E54' : 'transparent' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: activeTab === tab ? '#075E54' : '#6B7280' }}>
              {tab === 'Destinations' && hasSuggestions ? `${tab} (${suggestions.length})` : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Group' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>

          {/* System: trip created */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: '#fff', fontSize: 11, textAlign: 'center' }}>
                🎉 {sortedMembers.find(m => m.role === 'organiser')?.name || 'Organiser'} created this group
              </Text>
            </View>
          </View>

          {/* Member join bubbles */}
          {sortedMembers.map((member, i) => (
            <View key={member.id} style={{ marginBottom: 10 }}>
              {/* System notification: member joined */}
              {member.role !== 'organiser' && (
                <View style={{ alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 11 }}>
                      {member.name} joined the group
                    </Text>
                  </View>
                </View>
              )}

              {/* Member preference card — left aligned (like received message) */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' }}>
                <MemberAvatar name={member.name} size={8} />
                <View style={{ backgroundColor: '#fff', borderRadius: 12, borderTopLeftRadius: 0, padding: 10, flex: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: member.role === 'organiser' ? '#075E54' : '#1A3C5E' }}>
                      {member.name}{member.role === 'organiser' ? ' 👑' : ''}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#9CA3AF' }}>
                      {formatTime(member.joined_at)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {member.dietary && member.dietary !== 'No preference' && (
                      <View style={{ backgroundColor: '#F0FDF4', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 10, color: '#16A34A', fontWeight: '500' }}>🥗 {member.dietary}</Text>
                      </View>
                    )}
                    {member.budget_comfort && (
                      <View style={{ backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 10, color: '#1D4ED8', fontWeight: '500' }}>💰 {member.budget_comfort}</Text>
                      </View>
                    )}
                    {(member.interests || []).slice(0, 2).map(k => (
                      <View key={k} style={{ backgroundColor: '#FFF7ED', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 10, color: '#C2410C', fontWeight: '500' }}>
                          {INTEREST_LABELS[k] || k}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Pending slots */}
          {pendingCount > 0 && (
            <View style={{ alignItems: 'center', marginVertical: 8 }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: '#fff', fontSize: 11 }}>
                  ⏳ Waiting for {pendingCount} more member{pendingCount > 1 ? 's' : ''}...
                </Text>
              </View>
            </View>
          )}

          {/* Destination already set — skip AI */}
          {currentTrip?.destination && (
            <>
              <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 12 }}>
                <View style={{ backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ color: '#fff', fontSize: 11 }}>
                    📍 Destination: {currentTrip.destination}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ backgroundColor: '#DCF8C6', borderRadius: 12, borderTopRightRadius: 0, padding: 12, maxWidth: '85%' }}>
                  <Text style={{ fontSize: 11, color: '#075E54', fontWeight: '700', marginBottom: 4 }}>✦ TripMate AI</Text>
                  <Text style={{ fontSize: 12, color: '#1F2937', lineHeight: 18, marginBottom: 8 }}>
                    Destination is set to <Text style={{ fontWeight: '700' }}>{currentTrip.destination}</Text>. Ready to plan your itinerary! 🗺️
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push(`/(app)/trips/${id}/ai` as any)}
                    style={{ backgroundColor: '#075E54', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Plan itinerary with AI →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* No destination yet — AI suggestions prompt */}
          {!currentTrip?.destination && !hasSuggestions && members.length >= 2 && (
            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
              <View style={{ backgroundColor: '#DCF8C6', borderRadius: 12, borderTopRightRadius: 0, padding: 12, maxWidth: '85%' }}>
                <Text style={{ fontSize: 11, color: '#075E54', fontWeight: '700', marginBottom: 4 }}>✦ TripMate AI</Text>
                <Text style={{ fontSize: 12, color: '#1F2937', lineHeight: 18, marginBottom: 8 }}>
                  {members.length} members have shared their preferences! I can suggest the best destinations for your group. 🗺️
                </Text>
                <TouchableOpacity
                  onPress={handleGetSuggestions}
                  disabled={loadingAI}
                  style={{ backgroundColor: '#075E54', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                >
                  {loadingAI ? <ActivityIndicator color="#fff" size="small" /> : null}
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                    {loadingAI ? 'Thinking...' : 'Get AI destination suggestions →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Suggestions ready — nudge to Destinations tab */}
          {!currentTrip?.destination && hasSuggestions && (
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setActiveTab('Destinations')}
                style={{ backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                  🗺️ {suggestions.length} destinations suggested — vote now →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      ) : (
        /* ── DESTINATIONS TAB ── */
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

          {hasSuggestions ? (
            <>
              <View style={{ backgroundColor: '#1A3C5E', borderRadius: 14, padding: 14, marginBottom: 16 }}>
                <Text style={{ color: '#93C5FD', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
                  ✦ AI Suggests
                </Text>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
                  3 destinations picked for your group
                </Text>
                <Text style={{ color: '#BFDBFE', fontSize: 12 }}>
                  Based on {members.length} members' preferences · {totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast
                </Text>
              </View>

              {suggestions.map((s, i) => {
                const votes = voteCounts[i];
                const pct = maxVotes > 0 ? votes / maxVotes : 0;
                const isLeading = i === leadingIndex && votes > 0;
                const hasVoted = !!myVote;
                const votedForThis = myVote?.suggestion_index === i;

                return (
                  <View
                    key={i}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 12,
                      borderWidth: isLeading ? 2 : 1,
                      borderColor: isLeading ? '#075E54' : '#E5E7EB',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
                          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>{s.name}</Text>
                          {isLeading && votes > 0 && (
                            <View style={{ backgroundColor: '#075E54', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Leading</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 17 }}>{s.reason}</Text>
                      </View>
                    </View>

                    {/* Vote bar */}
                    <View style={{ height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, marginBottom: 6, overflow: 'hidden' }}>
                      <View style={{ height: 6, width: `${pct * 100}%` as any, backgroundColor: isLeading ? '#075E54' : '#1A3C5E', borderRadius: 3 }} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 11, color: '#6B7280' }}>
                        {votes} vote{votes !== 1 ? 's' : ''}
                      </Text>
                      {!hasVoted ? (
                        <TouchableOpacity
                          onPress={() => handleVote(i)}
                          style={{ backgroundColor: '#1A3C5E', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16 }}
                        >
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Vote</Text>
                        </TouchableOpacity>
                      ) : votedForThis ? (
                        <View style={{ backgroundColor: '#F0FDF4', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 }}>
                          <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '600' }}>✓ Your vote</Text>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Voted for another</Text>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Organiser confirm button */}
              {isOrganiser && totalVotes > 0 ? (
                <TouchableOpacity
                  onPress={() => handleConfirmDestination(suggestions[leadingIndex].name)}
                  style={{ backgroundColor: '#075E54', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                    Confirm {suggestions[leadingIndex]?.name} as destination →
                  </Text>
                </TouchableOpacity>
              ) : null}

              {isOrganiser && (
                <TouchableOpacity
                  onPress={handleGetSuggestions}
                  disabled={loadingAI}
                  style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 8 }}
                >
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>
                    {loadingAI ? 'Regenerating...' : '↻ Regenerate suggestions'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🗺️</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A3C5E', marginBottom: 8, textAlign: 'center' }}>
                No suggestions yet
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 20 }}>
                {members.length < 2
                  ? `Waiting for at least 2 members to join before AI can suggest destinations.`
                  : `Go to the Group tab and ask AI to suggest destinations.`}
              </Text>
              {members.length >= 2 && (
                <TouchableOpacity
                  onPress={handleGetSuggestions}
                  disabled={loadingAI}
                  style={{ backgroundColor: '#1A3C5E', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}
                >
                  {loadingAI ? <ActivityIndicator color="#fff" /> : (
                    <Text style={{ color: '#fff', fontWeight: '600' }}>✦ Get AI suggestions</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Bottom bar */}
      <View style={{ backgroundColor: '#F0F0F0', padding: 12, flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
        <TouchableOpacity
          onPress={() => openWhatsApp(generateWhatsAppDeeplink(currentTrip?.name || 'our trip', currentTrip?.invite_token || ''))}
          style={{ flex: 1, backgroundColor: '#25D366', borderRadius: 24, paddingVertical: 11, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Share invite on WhatsApp</Text>
        </TouchableOpacity>
        {pendingCount > 0 && (
          <TouchableOpacity
            onPress={() => openWhatsApp(generateWhatsAppDeeplink(currentTrip?.name || 'our trip', currentTrip?.invite_token || ''))}
            style={{ backgroundColor: '#fff', borderRadius: 24, paddingVertical: 11, paddingHorizontal: 16, borderWidth: 1, borderColor: '#D1D5DB' }}
          >
            <Text style={{ color: '#374151', fontWeight: '600', fontSize: 13 }}>Nudge {pendingCount}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

