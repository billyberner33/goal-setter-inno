CREATE TABLE public.school_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id text NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  metric_id text NOT NULL,
  academic_year text NOT NULL DEFAULT '2025-2026',
  baseline_value numeric NOT NULL,
  start_value numeric NOT NULL,
  goal_value numeric NOT NULL,
  mode text NOT NULL DEFAULT 'accept',
  rationale text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, metric_id, academic_year)
);

ALTER TABLE public.school_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for school_goals"
  ON public.school_goals FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert school_goals"
  ON public.school_goals FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update school_goals"
  ON public.school_goals FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Public delete school_goals"
  ON public.school_goals FOR DELETE TO anon, authenticated
  USING (true);