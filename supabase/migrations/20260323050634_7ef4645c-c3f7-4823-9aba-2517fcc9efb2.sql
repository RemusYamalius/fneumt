
-- publisher_settings table
CREATE TABLE public.publisher_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  display_title text,
  avatar_path text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.publisher_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read (for showing avatars in posts)
CREATE POLICY "Anyone can read publisher settings" ON public.publisher_settings
FOR SELECT TO authenticated USING (true);

-- Users can manage own settings
CREATE POLICY "Users can manage own publisher settings" ON public.publisher_settings
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- sponsored_posts table
CREATE TABLE public.sponsored_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  advertiser_name text NOT NULL,
  advertiser_avatar_path text,
  content text,
  display_style text NOT NULL DEFAULT 'elegant',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.sponsored_posts ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage sponsored posts" ON public.sponsored_posts
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated can read active posts
CREATE POLICY "All can read active sponsored posts" ON public.sponsored_posts
FOR SELECT TO authenticated
USING (is_active = true);

-- sponsored_post_attachments table
CREATE TABLE public.sponsored_post_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.sponsored_posts(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.sponsored_post_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sponsored attachments" ON public.sponsored_post_attachments
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All can read sponsored attachments" ON public.sponsored_post_attachments
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.sponsored_posts sp WHERE sp.id = post_id AND sp.is_active = true));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('publisher-avatars', 'publisher-avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('sponsor-assets', 'sponsor-assets', true);

-- Storage policies for publisher-avatars
CREATE POLICY "Anyone can view publisher avatars" ON storage.objects FOR SELECT USING (bucket_id = 'publisher-avatars');
CREATE POLICY "Authenticated users can upload publisher avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'publisher-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own publisher avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'publisher-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own publisher avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'publisher-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for sponsor-assets
CREATE POLICY "Anyone can view sponsor assets" ON storage.objects FOR SELECT USING (bucket_id = 'sponsor-assets');
CREATE POLICY "Admins can upload sponsor assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sponsor-assets' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update sponsor assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'sponsor-assets' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete sponsor assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'sponsor-assets' AND has_role(auth.uid(), 'admin'::app_role));
