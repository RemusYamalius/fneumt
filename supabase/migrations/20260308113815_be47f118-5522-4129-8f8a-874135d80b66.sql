CREATE OR REPLACE FUNCTION public.is_promoter(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'regional_supervisor', 'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high', 'provincial_manager', 'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high', 'local_coordinator', 'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high')
  )
$$;