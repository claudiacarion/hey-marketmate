CREATE TABLE public.campaign_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX campaign_notes_campaign_idx ON public.campaign_notes(campaign_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_notes TO authenticated;
GRANT ALL ON public.campaign_notes TO service_role;
ALTER TABLE public.campaign_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notes select" ON public.campaign_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own notes insert" ON public.campaign_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()));
CREATE POLICY "Own notes update" ON public.campaign_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()));
CREATE POLICY "Own notes delete" ON public.campaign_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_campaign_notes_updated_at BEFORE UPDATE ON public.campaign_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();