
-- Update is_promoter function to include new roles
CREATE OR REPLACE FUNCTION public.is_promoter(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'national_secretary', 'deputy_national_secretary', 'regional_supervisor', 'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high', 'provincial_manager', 'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high', 'local_coordinator', 'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high')
  )
$$;

-- Update can_access_attachment_file to include new roles
CREATE OR REPLACE FUNCTION public.can_access_attachment_file(_file_path text, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
        OR public.has_role(_user_id, 'national_secretary'::public.app_role)
        OR public.has_role(_user_id, 'deputy_national_secretary'::public.app_role)
      )
  )
$$;
