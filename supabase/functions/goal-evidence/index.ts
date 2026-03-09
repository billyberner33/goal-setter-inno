import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetType, targetValue, metricName, currentValue, schoolName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const targetDescriptions: Record<string, string> = {
      conservative: "maintains current growth trajectory with high confidence of achievement",
      typical: "matches the peer median improvement rate and represents achievable but meaningful growth",
      ambitious: "reaches the 75th percentile of comparable peer performance and requires accelerated improvement",
    };

    const systemPrompt = `You are an educational data analyst specializing in K-12 school performance metrics. Given a school's metric data and selected target level, return exactly 4 evidence sections as a JSON array. Each section has a "label" (short title) and "text" (1-2 sentences of evidence). Use these 4 section labels in order: "Peer Selection", "Key Contextual Factors", "Trend Analysis", "Your Position". Be specific about peer benchmarks, growth trajectories, and actionable context. Keep your tone professional but encouraging. Return ONLY the JSON array, no other text.`;

    const userPrompt = `School: ${schoolName || "Your School"}
Metric: ${metricName}
Current Value: ${currentValue}%
Selected Target: ${targetType} (${targetValue}%)
Target Description: This target ${targetDescriptions[targetType.toLowerCase()] || "represents a reasonable goal"}.

Return a JSON array of 4 evidence sections explaining why this ${targetType} target of ${targetValue}% is appropriate. Example format:
[{"label":"Peer Selection","text":"8 schools matched via..."},{"label":"Key Contextual Factors","text":"Enrollment size..."},{"label":"Trend Analysis","text":"Comparable schools averaged..."},{"label":"Your Position","text":"Your school sits at..."}]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate evidence" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const evidence = data.choices?.[0]?.message?.content || "Unable to generate evidence at this time.";

    return new Response(
      JSON.stringify({ evidence }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("goal-evidence error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
