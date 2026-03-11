
CREATE TABLE public.school_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id text NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  year integer NOT NULL,
  ela_proficiency numeric,
  math_proficiency numeric,
  chronic_absenteeism numeric,
  ela_growth_percentile numeric,
  math_growth_percentile numeric,
  isa_proficiency numeric,
  graduation_rate_4yr numeric,
  graduation_rate_5yr numeric,
  pct_9th_on_track numeric,
  UNIQUE(school_id, year)
);

ALTER TABLE public.school_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for school_metrics"
ON public.school_metrics
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Service role insert school_metrics"
ON public.school_metrics
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role update school_metrics"
ON public.school_metrics
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
