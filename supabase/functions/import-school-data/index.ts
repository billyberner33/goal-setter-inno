import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SchoolRow {
  school_id: string;
  school_name: string;
  students: number | null;
  rank: number;
  similar_school_id: string;
  similar_school_name: string;
  similar_students: number | null;
  euclidean_distance: number;
  goal_metric: string | null;
  d_el: number | null;
  d_iep: number | null;
  d_stls: number | null;
  d_teach_ret: number | null;
  d_poverty: number | null;
  d_hardship: number | null;
  d_life_exp: number | null;
  d_uninsured: number | null;
  d_diversity: number | null;
  d_fund_a: number | null;
  d_fund_b: number | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { rows, school_level }: { rows: SchoolRow[]; school_level: "ES" | "HS" } = await req.json();

    if (!rows || !school_level) {
      return new Response(
        JSON.stringify({ error: "Missing rows or school_level" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Collect unique schools
    const schoolsMap = new Map<string, { school_id: string; school_name: string; students: number | null }>();
    for (const row of rows) {
      if (!schoolsMap.has(row.school_id)) {
        schoolsMap.set(row.school_id, {
          school_id: row.school_id,
          school_name: row.school_name,
          students: row.students,
        });
      }
      if (!schoolsMap.has(row.similar_school_id)) {
        schoolsMap.set(row.similar_school_id, {
          school_id: row.similar_school_id,
          school_name: row.similar_school_name,
          students: row.similar_students,
        });
      }
    }

    // Upsert schools in batches
    const schoolsArray = Array.from(schoolsMap.values()).map((s) => ({
      ...s,
      school_level,
    }));

    const BATCH_SIZE = 500;
    for (let i = 0; i < schoolsArray.length; i += BATCH_SIZE) {
      const batch = schoolsArray.slice(i, i + BATCH_SIZE);
      const { error: schoolError } = await supabase
        .from("schools")
        .upsert(batch, { onConflict: "school_id" });
      if (schoolError) {
        console.error("School upsert error:", schoolError);
        return new Response(
          JSON.stringify({ error: `School upsert failed: ${schoolError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Insert similarities in batches
    const similarities = rows.map((row) => ({
      school_id: row.school_id,
      similar_school_id: row.similar_school_id,
      rank: row.rank,
      euclidean_distance: row.euclidean_distance,
      goal_metric: row.goal_metric,
      d_el: row.d_el,
      d_iep: row.d_iep,
      d_stls: row.d_stls,
      d_teach_ret: row.d_teach_ret,
      d_poverty: row.d_poverty,
      d_hardship: row.d_hardship,
      d_life_exp: row.d_life_exp,
      d_uninsured: row.d_uninsured,
      d_diversity: row.d_diversity,
      d_fund_a: row.d_fund_a,
      d_fund_b: row.d_fund_b,
      school_level,
    }));

    for (let i = 0; i < similarities.length; i += BATCH_SIZE) {
      const batch = similarities.slice(i, i + BATCH_SIZE);
      const { error: simError } = await supabase
        .from("school_similarities")
        .upsert(batch, { onConflict: "school_id,similar_school_id,school_level,goal_metric" });
      if (simError) {
        console.error("Similarity upsert error:", simError);
        return new Response(
          JSON.stringify({ error: `Similarity upsert failed at batch ${i}: ${simError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        schools_count: schoolsArray.length,
        similarities_count: similarities.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Import error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
