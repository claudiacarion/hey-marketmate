CREATE TABLE public.campaign_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  task_index integer NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, task_index)
);
CREATE INDEX campaign_tasks_user_idx ON public.campaign_tasks(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_tasks TO authenticated;
GRANT ALL ON public.campaign_tasks TO service_role;
ALTER TABLE public.campaign_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own tasks select" ON public.campaign_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own tasks insert" ON public.campaign_tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()));
CREATE POLICY "Own tasks update" ON public.campaign_tasks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()));
CREATE POLICY "Own tasks delete" ON public.campaign_tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_campaign_tasks_updated_at BEFORE UPDATE ON public.campaign_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();