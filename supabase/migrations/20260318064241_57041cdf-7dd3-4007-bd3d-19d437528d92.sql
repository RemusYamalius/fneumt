
-- Posts table
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  content text,
  filters jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Post attachments
CREATE TABLE public.post_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size integer
);

-- Post recipients
CREATE TABLE public.post_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Post likes
CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Storage bucket for post attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('post-attachments', 'post-attachments', false);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger for posts
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: posts
CREATE POLICY "Supreme accounts can manage posts" ON public.posts FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'national_secretary'::app_role)
    OR has_role(auth.uid(), 'deputy_national_secretary'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'national_secretary'::app_role)
    OR has_role(auth.uid(), 'deputy_national_secretary'::app_role)
  );

CREATE POLICY "Recipients can read their posts" ON public.posts FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.post_recipients WHERE post_id = posts.id AND user_id = auth.uid())
  );

-- RLS: post_attachments
CREATE POLICY "Supreme accounts can manage attachments" ON public.post_attachments FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'national_secretary'::app_role)
    OR has_role(auth.uid(), 'deputy_national_secretary'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'national_secretary'::app_role)
    OR has_role(auth.uid(), 'deputy_national_secretary'::app_role)
  );

CREATE POLICY "Recipients can view post attachments" ON public.post_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.post_recipients WHERE post_id = post_attachments.post_id AND user_id = auth.uid())
  );

-- RLS: post_recipients
CREATE POLICY "Supreme accounts can manage recipients" ON public.post_recipients FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'national_secretary'::app_role)
    OR has_role(auth.uid(), 'deputy_national_secretary'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'national_secretary'::app_role)
    OR has_role(auth.uid(), 'deputy_national_secretary'::app_role)
  );

CREATE POLICY "Recipients can view own records" ON public.post_recipients FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Recipients can update own read status" ON public.post_recipients FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS: post_likes
CREATE POLICY "Recipients can like posts" ON public.post_likes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.post_recipients WHERE post_id = post_likes.post_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can remove own likes" ON public.post_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Supreme accounts can view all likes" ON public.post_likes FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'national_secretary'::app_role)
    OR has_role(auth.uid(), 'deputy_national_secretary'::app_role)
    OR user_id = auth.uid()
  );

CREATE POLICY "Recipients can view post likes" ON public.post_likes FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.post_recipients WHERE post_id = post_likes.post_id AND user_id = auth.uid())
  );

-- Storage RLS for post-attachments bucket
CREATE POLICY "Supreme accounts can upload post attachments" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-attachments'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'national_secretary'::public.app_role)
      OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
    )
  );

CREATE POLICY "Authenticated can read post attachments" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'post-attachments');

-- Enable realtime on post_recipients
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_recipients;
