CREATE OR REPLACE FUNCTION public.can_access_attachment_file(_file_path text, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.attachments a
    JOIN public.requests r ON r.id = a.request_id
    WHERE a.file_path = _file_path
      AND (
        r.user_id = _user_id
        OR r.assigned_to = _user_id
        OR public.has_role(_user_id, 'admin'::public.app_role)
      )
  )
$$;

DROP POLICY IF EXISTS "Authorized users can read attachment files" ON storage.objects;

CREATE POLICY "Authorized users can read attachment files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments'
  AND public.can_access_attachment_file(name, auth.uid())
);