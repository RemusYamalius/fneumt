
-- Add columns for filters, link preview to sponsored_posts
ALTER TABLE public.sponsored_posts ADD COLUMN IF NOT EXISTS filters jsonb;
ALTER TABLE public.sponsored_posts ADD COLUMN IF NOT EXISTS link_url text;
ALTER TABLE public.sponsored_posts ADD COLUMN IF NOT EXISTS link_preview jsonb;

-- Create sponsored_post_recipients table
CREATE TABLE IF NOT EXISTS public.sponsored_post_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.sponsored_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sponsored_post_recipients ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can manage all
CREATE POLICY "Admins can manage sponsored recipients" ON public.sponsored_post_recipients
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: Users can read own records
CREATE POLICY "Users can read own sponsored recipients" ON public.sponsored_post_recipients
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- RLS: Users can update own read status
CREATE POLICY "Users can update own sponsored read status" ON public.sponsored_post_recipients
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
