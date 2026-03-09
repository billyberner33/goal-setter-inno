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

    const systemPrompt = `You are an educational data analyst specializing in K-12 school performance metrics. Given a school's metric data and selected target level, write 3-4 sentences of evidence explaining WHY this target is appropriate. Be specific about peer benchmarks, growth trajectories, and actionable context. Keep your tone professional but encouraging. Do not use markdown formatting.`;

    const userPrompt = `School: ${schoolName || "Your School"}
Metric: ${metricName}
Current Value: ${currentValue}%
Selected Target: ${targetType} (${targetValue}%)
Target Description: This target ${targetDescriptions[targetType.toLowerCase()] || "represents a reasonable goal"}.

Write 3-4 sentences explaining why this ${targetType} target of ${targetValue}% is appropriate for this school, citing peer benchmarks and growth trajectory considerations.`;

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
