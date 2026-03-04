
-- Schools table
CREATE TABLE public.schools (
  school_id text PRIMARY KEY,
  school_name text NOT NULL,
  students integer,
  school_level text NOT NULL CHECK (school_level IN ('ES', 'HS'))
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for schools"
  ON public.schools FOR SELECT
  TO anon, authenticated
  USING (true);

-- School similarities table
CREATE TABLE public.school_similarities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id text NOT NULL REFERENCES public.schools(school_id),
  similar_school_id text NOT NULL REFERENCES public.schools(school_id),
  rank integer NOT NULL,
  euclidean_distance numeric NOT NULL,
  d_el numeric,
  d_iep numeric,
  d_stls numeric,
  d_teach_ret numeric,
  d_poverty numeric,
  d_hardship numeric,
  d_life_exp numeric,
  d_uninsured numeric,
  d_diversity numeric,
  d_fund_a numeric,
  d_fund_b numeric,
  school_level text NOT NULL CHECK (school_level IN ('ES', 'HS')),
  UNIQUE (school_id, similar_school_id, school_level)
);

ALTER TABLE public.school_similarities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for school_similarities"
  ON public.school_similarities FOR SELECT
  TO anon, authenticated
  USING (true);

-- Index for fast lookups by school
CREATE INDEX idx_school_similarities_school_id ON public.school_similarities(school_id);
CREATE INDEX idx_school_similarities_similar_school_id ON public.school_similarities(similar_school_id);
