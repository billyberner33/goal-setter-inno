import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SchoolMetric {
  school_id: string;
  year: number;
  ela_proficiency: number | null;
  math_proficiency: number | null;
  chronic_absenteeism: number | null;
  ela_growth_percentile: number | null;
  math_growth_percentile: number | null;
  isa_proficiency: number | null;
  graduation_rate_4yr: number | null;
  graduation_rate_5yr: number | null;
  pct_9th_on_track: number | null;
}

// Map app metric IDs to the column name in school_metrics
export const metricToColumn: Record<string, keyof SchoolMetric> = {
  attendance: "chronic_absenteeism",
  math: "math_proficiency",
  ela: "ela_proficiency",
  sgp_reading: "ela_growth_percentile",
  sgp_math: "math_growth_percentile",
  behavior: "chronic_absenteeism", // fallback — no direct behavior data
};

export function getMetricValue(metric: SchoolMetric | undefined, metricId: string): number | null {
  if (!metric) return null;
  const col = metricToColumn[metricId];
  if (!col) return null;
  return metric[col] as number | null;
}

export function useSchoolMetrics(schoolIds: string[]) {
  const [metrics, setMetrics] = useState<Record<string, { y2023?: SchoolMetric; y2024?: SchoolMetric }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (schoolIds.length === 0) {
      setMetrics({});
      return;
    }

    const fetchMetrics = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("school_metrics")
        .select("*")
        .in("school_id", schoolIds)
        .in("year", [2023, 2024]);

      if (error) {
        console.error("Error fetching school metrics:", error);
        setLoading(false);
        return;
      }

      const result: Record<string, { y2023?: SchoolMetric; y2024?: SchoolMetric }> = {};
      for (const row of (data || [])) {
        if (!result[row.school_id]) result[row.school_id] = {};
        if (row.year === 2023) result[row.school_id].y2023 = row as SchoolMetric;
        if (row.year === 2024) result[row.school_id].y2024 = row as SchoolMetric;
      }
      setMetrics(result);
      setLoading(false);
    };

    fetchMetrics();
  }, [schoolIds.join(",")]);

  return { metrics, loading };
}
