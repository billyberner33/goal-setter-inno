
-- Drop old unique constraint and add new one that includes goal_metric
ALTER TABLE public.school_similarities DROP CONSTRAINT IF EXISTS school_similarities_school_id_similar_school_id_school_leve_key;

-- Add new unique constraint including goal_metric
ALTER TABLE public.school_similarities ADD CONSTRAINT school_similarities_unique_per_goal 
  UNIQUE (school_id, similar_school_id, school_level, goal_metric);
