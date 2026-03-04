
-- Allow service role to insert into schools and school_similarities
CREATE POLICY "Service role insert schools"
  ON public.schools FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role insert school_similarities"
  ON public.school_similarities FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role update schools"
  ON public.schools FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
