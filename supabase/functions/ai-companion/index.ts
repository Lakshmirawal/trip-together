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
  const isLowBudget = budgets.some((b: string) => b.includes('2,000') || b.includes('4,000'));
  const isHighBudget = budgets.some((b: string) => b.includes('15,000'));
  const hasVegan = members.some((m: any) => m.dietary === 'Vegan' || m.dietary === 'Jain');

  const pool = [
    { name: 'Goa', emoji: '🏖️', tags: ['beach', 'city'], budget: 'mid', vegan: true, reason: 'Sun, sand and vibrant nightlife — perfect beach escape' },
    { name: 'Manali', emoji: '🏔️', tags: ['adventure', 'nature'], budget: 'low', vegan: false, reason: 'Snow-capped peaks and thrilling adventures in the Himalayas' },
    { name: 'Coorg', emoji: '🌿', tags: ['nature', 'culture'], budget: 'mid', vegan: true, reason: 'Misty coffee estates and lush greenery for nature lovers' },
    { name: 'Pondicherry', emoji: '🏛️', tags: ['culture', 'beach', 'city'], budget: 'low', vegan: true, reason: 'French-colonial charm with serene beaches and great food' },
    { name: 'Rajasthan', emoji: '🏰', tags: ['culture', 'spiritual', 'city'], budget: 'mid', vegan: true, reason: 'Royal forts, vibrant culture and rich heritage' },
    { name: 'Spiti Valley', emoji: '🗻', tags: ['adventure', 'nature', 'spiritual'], budget: 'mid', vegan: false, reason: 'Remote Himalayan valley for the bold explorer' },
    { name: 'Kerala Backwaters', emoji: '🛶', tags: ['nature', 'culture', 'beach'], budget: 'mid', vegan: true, reason: 'Tranquil backwaters, spice trails and Ayurvedic retreats' },
    { name: 'Varanasi', emoji: '🛕', tags: ['spiritual', 'culture'], budget: 'low', vegan: true, reason: 'Sacred ghats and ancient temples on the banks of the Ganga' },
    { name: 'Andaman Islands', emoji: '🐠', tags: ['beach', 'adventure', 'nature'], budget: 'high', vegan: false, reason: 'Crystal-clear waters and pristine beaches, untouched paradise' },
    { name: 'Hampi', emoji: '🗿', tags: ['culture', 'adventure', 'spiritual'], budget: 'low', vegan: true, reason: 'Ancient ruins and boulder landscapes unlike anywhere else' },
    { name: 'Munnar', emoji: '🍵', tags: ['nature', 'culture'], budget: 'low', vegan: true, reason: 'Rolling tea gardens and cool hill air perfect for relaxation' },
    { name: 'Ladakh', emoji: '🏜️', tags: ['adventure', 'spiritual', 'nature'], budget: 'high', vegan: false, reason: 'High-altitude desert with monasteries and dramatic landscapes' },
    { name: 'Mumbai', emoji: '🌆', tags: ['city', 'culture'], budget: 'mid', vegan: true, reason: 'India\'s most cosmopolitan city — food, art and energy' },
    { name: 'Mysuru', emoji: '👑', tags: ['culture', 'spiritual', 'city'], budget: 'low', vegan: true, reason: 'Majestic palaces and silk bazaars, the city of royals' },
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
    const primaryTag = dest.tags[0];
    if (!usedTags.has(primaryTag) || picked.length === 2) {
      picked.push(dest);
      usedTags.add(primaryTag);
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

    if (!supabaseUrl || !serviceKey) {
      return ok({ content: 'Supabase environment variables not configured in edge function.' });
    }

    const supabaseClient = createClient(supabaseUrl, serviceKey);

    const { data: trip, error: tripError } = await supabaseClient
      .from('trips').select('*').eq('id', tripId).single();

    if (tripError || !trip) {
      return ok({ content: `Could not load trip data (${tripError?.message || 'not found'}). Please try again.` });
    }

    const { data: members } = await supabaseClient
      .from('trip_members').select('*').eq('trip_id', tripId);

    const memberList = members || [];
    const systemPrompt = buildSystemPrompt(trip, memberList);

    // DESTINATION SUGGESTIONS MODE
    if (mode === 'destinations') {
      let finalSuggestions = getSmartSuggestions(memberList, trip);

      const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (apiKey && apiKey !== 'dummy') {
        try {
          const { default: Anthropic } = await import('https://esm.sh/@anthropic-ai/sdk@0.24.3');
          const anthropic = new Anthropic({ apiKey });
          const memberPrefs = memberList.map((m: any) =>
            m.name + ': ' + m.dietary + ', budget ' + m.budget_comfort + ', interests: ' + (m.interests || []).join(', ')
          ).join('\n');

          const prompt = 'Based on these group preferences, suggest exactly 3 Indian travel destinations.\n\nGroup:\n' +
            memberPrefs +
            '\n\nBudget: Rs.' + (trip.budget_min || 0) + ' to Rs.' + (trip.budget_max || 0) + ' per person' +
            '\n\nReturn ONLY this JSON with no markdown or extra text:\n' +
            '{"suggestions":[{"name":"Name","emoji":"emoji","reason":"One-liner why perfect for this group"},{"name":"Name2","emoji":"emoji","reason":"One-liner"},{"name":"Name3","emoji":"emoji","reason":"One-liner"}]}';

          const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 500,
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }],
          });

          const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.suggestions && parsed.suggestions.length > 0) {
              finalSuggestions = parsed.suggestions;
            }
          }
        } catch (aiErr) {
          console.error('AI call failed, using smart fallback:', aiErr);
        }
      }

      await supabaseClient.from('trips').update({ ai_suggestions: finalSuggestions }).eq('id', tripId);
      return ok({ suggestions: finalSuggestions });
    }

    // NORMAL CHAT MODE
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    let content = '';

    if (!apiKey || apiKey === 'dummy') {
      const lastMsg = (messages || []).slice(-1)[0]?.content?.toLowerCase() || '';
      const dest = trip.destination || 'your destination';
      const budget = trip.budget_max ? `₹${trip.budget_max.toLocaleString('en-IN')}/person` : null;
      const vegCount = memberList.filter((m: any) => ['Vegetarian', 'Vegan', 'Jain'].includes(m.dietary)).length;

      if (lastMsg.includes('itinerary') || lastMsg.includes('draft') || lastMsg.includes('plan')) {
        content = `To draft a full AI itinerary for ${dest}, please add your Anthropic API key:\n\n1. Go to supabase.com → your project\n2. Edge Functions → ai-companion → Secrets\n3. Add secret: ANTHROPIC_API_KEY = your-key\n4. Redeploy the function\n\nGet a free API key at console.anthropic.com`;
      } else if (lastMsg.includes('budget')) {
        content = `Budget summary for ${dest}:\n\n• Group size: ${trip.group_size} people\n• Per-person budget: ${budget || 'Not set'}\n• Total trip budget: ${budget ? `₹${((trip.budget_max || 0) * trip.group_size).toLocaleString('en-IN')}` : 'Not set'}\n${vegCount > 0 ? `• ${vegCount} vegetarian(s) — factor in Jain/veg restaurant costs\n` : ''}• Typical breakdown: 30% stay, 25% food, 20% travel, 15% activities, 10% misc`;
      } else if (lastMsg.includes('restaurant') || lastMsg.includes('food') || lastMsg.includes('veg')) {
        content = `For ${dest}:\n\n• Look for "Pure Veg" or "Jain Food Available" signs\n• Ask locals for small dhabas — better food, better prices\n• Avoid touristy spots near main attractions (2× price)\n${vegCount > 0 ? `• Your group has ${vegCount} vegetarian(s) — always confirm no egg/meat in sauces\n` : ''}\nAdd your Anthropic API key for AI-powered personalised recommendations!`;
      } else {
        content = `Hi! I'm TripMate, your AI travel companion for ${trip.name}.\n\nI need an Anthropic API key to give full AI responses.\n\nTo enable AI:\n1. Go to supabase.com → Edge Functions → ai-companion → Secrets\n2. Add: ANTHROPIC_API_KEY = your-key\n3. Get a free key at console.anthropic.com\n\nFor now, try asking about budget, food, or itinerary!`;
      }
    } else {
      try {
        const { default: Anthropic } = await import('https://esm.sh/@anthropic-ai/sdk@0.24.3');
        const anthropic = new Anthropic({ apiKey });
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          system: systemPrompt,
          messages: (messages || []).map((m: any) => ({ role: m.role, content: m.content })),
        });
        content = response.content[0].type === 'text' ? response.content[0].text : '';
      } catch (aiErr: any) {
        console.error('Claude API error:', aiErr);
        content = `I couldn't connect to the AI service right now (${aiErr?.message || 'unknown error'}). Please check your ANTHROPIC_API_KEY secret and try again.`;
      }
    }

    return ok({ content });

  } catch (error: any) {
    console.error('Edge function error:', error);
    // Always return 200 with an error message — never a non-2xx
    return new Response(
      JSON.stringify({ content: `Something went wrong: ${error.message}. Please try again.` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
