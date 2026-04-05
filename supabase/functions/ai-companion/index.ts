import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ── Groq (free) via OpenAI-compatible REST API ──────────────────────────────
async function callGroq(apiKey: string, system: string, messages: any[], maxTokens = 2000): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });
  if (!res.ok) throw new Error(`Groq API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Anthropic Claude via REST API ────────────────────────────────────────────
async function callAnthropic(apiKey: string, system: string, messages: any[], maxTokens = 2000): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

// ── Pick whichever AI key is available ───────────────────────────────────────
async function callAI(system: string, messages: any[], maxTokens = 2000): Promise<string | null> {
  const groqKey = Deno.env.get('GROQ_API_KEY');
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (groqKey) return callGroq(groqKey, system, messages, maxTokens);
  if (anthropicKey && anthropicKey !== 'dummy') return callAnthropic(anthropicKey, system, messages, maxTokens);
  return null; // no key configured
}

function buildSystemPrompt(trip: any, members: any[]): string {
  const memberSummary = members.map((m: any) =>
    `- ${m.name}: dietary=${m.dietary}, budget=${m.budget_comfort}, interests=[${(m.interests || []).join(', ')}]`
  ).join('\n');

  return `You are TripMate, an expert group travel planner for Indian travellers.

TRIP DETAILS:
- Name: ${trip.name}
- Destination: ${trip.destination || 'Not decided yet'}
- Dates: ${trip.dates_start || 'TBD'} to ${trip.dates_end || 'TBD'}
- Group size: ${trip.group_size} people
- Budget: Rs.${trip.budget_min || 0} to Rs.${trip.budget_max || 0} per person total

GROUP MEMBERS (${members.length} joined):
${memberSummary || 'No members have joined yet.'}

YOUR EXPERTISE:
1. Always consider ALL dietary restrictions in every food recommendation
2. Always provide TIMING INTEL — best time of day, crowd patterns, seasonal notes
3. Always provide TRANSPORT INTEL — distance, mode, cost, time from previous location
4. Calculate running per-person cost against budget
5. Flag accessibility concerns proactively
6. Provide LOCAL CONTEXT that generic apps miss

Keep responses concise and actionable. Use Rs. for Indian Rupee amounts.`;
}

function getSmartSuggestions(members: any[], trip: any): any[] {
  const allInterests: string[] = members.flatMap((m: any) => m.interests || []);
  const interestCounts: Record<string, number> = {};
  for (const interest of allInterests) {
    interestCounts[interest] = (interestCounts[interest] || 0) + 1;
  }
  const budgets: string[] = members.map((m: any) => m.budget_comfort || '');
  const isLowBudget = budgets.some((b) => b.includes('2,000') || b.includes('4,000'));
  const isHighBudget = budgets.some((b) => b.includes('15,000'));
  const hasVegan = members.some((m: any) => m.dietary === 'Vegan' || m.dietary === 'Jain');

  const pool = [
    { name: 'Goa', emoji: '🏖️', tags: ['beach', 'city'], budget: 'mid', vegan: true, reason: 'Sun, sand and vibrant nightlife — perfect beach escape' },
    { name: 'Manali', emoji: '🏔️', tags: ['adventure', 'nature'], budget: 'low', vegan: false, reason: 'Snow-capped peaks and thrilling adventures in the Himalayas' },
    { name: 'Coorg', emoji: '🌿', tags: ['nature', 'culture'], budget: 'mid', vegan: true, reason: 'Misty coffee estates and lush greenery for nature lovers' },
    { name: 'Pondicherry', emoji: '🏛️', tags: ['culture', 'beach', 'city'], budget: 'low', vegan: true, reason: 'French-colonial charm with serene beaches and great food' },
    { name: 'Rajasthan', emoji: '🏰', tags: ['culture', 'spiritual', 'city'], budget: 'mid', vegan: true, reason: 'Royal forts, vibrant culture and rich heritage' },
    { name: 'Kerala Backwaters', emoji: '🛶', tags: ['nature', 'culture', 'beach'], budget: 'mid', vegan: true, reason: 'Tranquil backwaters, spice trails and Ayurvedic retreats' },
    { name: 'Varanasi', emoji: '🛕', tags: ['spiritual', 'culture'], budget: 'low', vegan: true, reason: 'Sacred ghats and ancient temples on the banks of the Ganga' },
    { name: 'Andaman Islands', emoji: '🐠', tags: ['beach', 'adventure', 'nature'], budget: 'high', vegan: false, reason: 'Crystal-clear waters and pristine beaches, untouched paradise' },
    { name: 'Hampi', emoji: '🗿', tags: ['culture', 'adventure', 'spiritual'], budget: 'low', vegan: true, reason: 'Ancient ruins and boulder landscapes unlike anywhere else' },
    { name: 'Munnar', emoji: '🍵', tags: ['nature', 'culture'], budget: 'low', vegan: true, reason: 'Rolling tea gardens and cool hill air perfect for relaxation' },
    { name: 'Ladakh', emoji: '🏜️', tags: ['adventure', 'spiritual', 'nature'], budget: 'high', vegan: false, reason: 'High-altitude desert with monasteries and dramatic landscapes' },
    { name: 'Rishikesh', emoji: '🧘', tags: ['spiritual', 'adventure', 'nature'], budget: 'low', vegan: true, reason: 'Yoga capital with river rafting and Himalayan vibes' },
  ];

  const scored = pool.map((dest) => {
    let score = 0;
    for (const tag of dest.tags) {
      if (interestCounts[tag]) score += interestCounts[tag] * 2;
    }
    if (isLowBudget && dest.budget === 'low') score += 3;
    if (isHighBudget && dest.budget === 'high') score += 2;
    if (hasVegan && dest.vegan) score += 2;
    return { ...dest, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const picked: typeof pool = [];
  const usedTags = new Set<string>();
  for (const dest of scored) {
    if (picked.length >= 3) break;
    if (!usedTags.has(dest.tags[0]) || picked.length === 2) {
      picked.push(dest);
      usedTags.add(dest.tags[0]);
    }
  }
  for (const dest of scored) {
    if (picked.length >= 3) break;
    if (!picked.find((p) => p.name === dest.name)) picked.push(dest);
  }
  return picked.slice(0, 3).map(({ name, emoji, reason }) => ({ name, emoji, reason }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { tripId, messages, mode } = body;

    if (!tripId) return ok({ content: 'Missing tripId in request.' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) return ok({ content: 'Supabase environment not configured.' });

    const supabaseClient = createClient(supabaseUrl, serviceKey);

    const { data: trip, error: tripError } = await supabaseClient
      .from('trips').select('*').eq('id', tripId).single();

    if (tripError || !trip) {
      return ok({ content: `Could not load trip data. Please try again. (${tripError?.message || 'not found'})` });
    }

    const { data: members } = await supabaseClient
      .from('trip_members').select('*').eq('trip_id', tripId);

    const memberList = members || [];
    const systemPrompt = buildSystemPrompt(trip, memberList);

    // ── DESTINATION SUGGESTIONS MODE ─────────────────────────────────────────
    if (mode === 'destinations') {
      let finalSuggestions = getSmartSuggestions(memberList, trip);
      try {
        const memberPrefs = memberList.map((m: any) =>
          `${m.name}: ${m.dietary}, budget ${m.budget_comfort}, interests: ${(m.interests || []).join(', ')}`
        ).join('\n');
        const prompt = `Based on these group preferences, suggest exactly 3 Indian travel destinations.\n\nGroup:\n${memberPrefs}\n\nBudget: Rs.${trip.budget_min || 0} to Rs.${trip.budget_max || 0} per person\n\nReturn ONLY this JSON:\n{"suggestions":[{"name":"Name","emoji":"emoji","reason":"One-liner"},{"name":"Name2","emoji":"emoji","reason":"One-liner"},{"name":"Name3","emoji":"emoji","reason":"One-liner"}]}`;
        const raw = await callAI(systemPrompt, [{ role: 'user', content: prompt }], 500);
        if (raw) {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.suggestions?.length > 0) finalSuggestions = parsed.suggestions;
          }
        }
      } catch (err) {
        console.error('AI suggestions failed, using fallback:', err);
      }
      await supabaseClient.from('trips').update({ ai_suggestions: finalSuggestions }).eq('id', tripId);
      return ok({ suggestions: finalSuggestions });
    }

    // ── NORMAL CHAT MODE ─────────────────────────────────────────────────────
    let content = '';
    try {
      const aiReply = await callAI(
        systemPrompt,
        (messages || []).map((m: any) => ({ role: m.role, content: m.content })),
        2000
      );
      if (aiReply) {
        content = aiReply;
      } else {
        // No API key — smart rule-based fallback
        const lastMsg = (messages || []).slice(-1)[0]?.content?.toLowerCase() || '';
        const dest = trip.destination || 'your destination';
        const budget = trip.budget_max ? `₹${trip.budget_max.toLocaleString('en-IN')}/person` : null;
        const vegCount = memberList.filter((m: any) => ['Vegetarian', 'Vegan', 'Jain'].includes(m.dietary)).length;

        if (lastMsg.includes('itinerary') || lastMsg.includes('draft') || lastMsg.includes('plan')) {
          content = `To draft a full AI itinerary for ${dest}, add a free API key:\n\n• Groq (free): console.groq.com → API Keys\n  Add GROQ_API_KEY secret in Supabase Edge Functions\n\n• Anthropic: console.anthropic.com\n  Add ANTHROPIC_API_KEY secret\n\nThen redeploy the ai-companion function.`;
        } else if (lastMsg.includes('budget')) {
          content = `Budget summary for ${dest}:\n\n• Group size: ${trip.group_size} people\n• Per-person: ${budget || 'Not set'}\n• Total: ${budget ? `₹${((trip.budget_max || 0) * trip.group_size).toLocaleString('en-IN')}` : 'Not set'}\n${vegCount > 0 ? `• ${vegCount} vegetarian(s) in group\n` : ''}• Typical split: 30% stay · 25% food · 20% transport · 15% activities · 10% misc`;
        } else if (lastMsg.includes('restaurant') || lastMsg.includes('food') || lastMsg.includes('eat')) {
          content = `Food tips for ${dest}:\n\n• Look for "Pure Veg" signs near temples and markets\n• Small dhabas = better food at half the price\n• Avoid restaurants right next to tourist spots\n${vegCount > 0 ? `• Group has ${vegCount} vegetarian(s) — always ask about egg in sauces\n` : ''}\nAdd a free Groq key (console.groq.com) for personalised AI recommendations!`;
        } else {
          content = `Hi! I'm TripMate for ${trip.name}.\n\nI'm running in basic mode. To unlock full AI:\n\n1. Go to console.groq.com (free, no card needed)\n2. Create an API key\n3. Add it as GROQ_API_KEY in Supabase → Edge Functions → ai-companion → Secrets\n4. Redeploy the function\n\nFor now, try asking about budget or food!`;
        }
      }
    } catch (aiErr: any) {
      console.error('AI call error:', aiErr);
      content = `I couldn't reach the AI service right now (${aiErr?.message || 'unknown error'}). Please try again in a moment.`;
    }

    return ok({ content });

  } catch (error: any) {
    console.error('Edge function error:', error);
    return ok({ content: `Something went wrong: ${error.message}. Please try again.` });
  }
});
