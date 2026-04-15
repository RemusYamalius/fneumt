
-- Create a helper function to check post-attachment access
CREATE OR REPLACE FUNCTION public.can_access_post_attachment(_file_path text, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.post_attachments pa
    WHERE pa.file_path = _file_path
      AND (
        EXISTS (
          SELECT 1 FROM public.post_recipients pr
          WHERE pr.post_id = pa.post_id AND pr.user_id = _user_id
        )
        OR public.has_role(_user_id, 'admin'::public.app_role)
        OR public.has_role(_user_id, 'national_secretary'::public.app_role)
        OR public.has_role(_user_id, 'deputy_national_secretary'::public.app_role)
      )
  )
$$;

-- Drop existing overly-permissive storage policies for post-attachments
DROP POLICY IF EXISTS "Authenticated users can read post attachments" ON storage.objects;
DROP POLICY IF EXISTS "Supreme accounts can upload post attachments" ON storage.objects;
DROP POLICY IF EXISTS "Supreme accounts can delete post attachments" ON storage.objects;

-- Recreate with proper checks
CREATE POLICY "Recipients can read post attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'post-attachments'
  AND public.can_access_post_attachment(name, auth.uid())
);

CREATE POLICY "Supreme accounts can upload post attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-attachments'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  )
);

CREATE POLICY "Supreme accounts can delete post attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-attachments'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  )
);
