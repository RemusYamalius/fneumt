
-- 1. Fix privilege escalation in user_roles: prevent promoters from assigning roles above their level or to themselves
CREATE OR REPLACE FUNCTION public.can_assign_role(_promoter_id uuid, _target_role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _promoter_role app_role;
BEGIN
  IF public.has_role(_promoter_id, 'admin'::app_role) THEN
    RETURN _target_role <> 'admin'::app_role;
  END IF;

  SELECT role INTO _promoter_role FROM public.user_roles WHERE user_id = _promoter_id LIMIT 1;
  IF _promoter_role IS NULL THEN RETURN false; END IF;

  RETURN CASE _promoter_role
    WHEN 'national_secretary' THEN _target_role IN ('regional_supervisor','deputy_regional_primary','deputy_regional_middle','deputy_regional_high','provincial_manager','deputy_provincial_primary','deputy_provincial_middle','deputy_provincial_high','local_coordinator','deputy_local_primary','deputy_local_middle','deputy_local_high','teacher')
    WHEN 'deputy_national_secretary' THEN _target_role IN ('regional_supervisor','deputy_regional_primary','deputy_regional_middle','deputy_regional_high','provincial_manager','deputy_provincial_primary','deputy_provincial_middle','deputy_provincial_high','local_coordinator','deputy_local_primary','deputy_local_middle','deputy_local_high','teacher')
    WHEN 'regional_supervisor' THEN _target_role IN ('deputy_regional_primary','deputy_regional_middle','deputy_regional_high')
    WHEN 'deputy_regional_primary' THEN _target_role = 'provincial_manager'
    WHEN 'deputy_regional_middle' THEN _target_role = 'provincial_manager'
    WHEN 'deputy_regional_high' THEN _target_role = 'provincial_manager'
    WHEN 'provincial_manager' THEN _target_role IN ('deputy_provincial_primary','deputy_provincial_middle','deputy_provincial_high')
    WHEN 'deputy_provincial_primary' THEN _target_role = 'local_coordinator'
    WHEN 'deputy_provincial_middle' THEN _target_role = 'local_coordinator'
    WHEN 'deputy_provincial_high' THEN _target_role = 'local_coordinator'
    WHEN 'local_coordinator' THEN _target_role IN ('deputy_local_primary','deputy_local_middle','deputy_local_high')
    ELSE false
  END;
END;
$$;

DROP POLICY IF EXISTS "Promoters can update roles" ON public.user_roles;
CREATE POLICY "Promoters can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.is_promoter(auth.uid()) AND user_id <> auth.uid())
  WITH CHECK (
    public.is_promoter(auth.uid())
    AND user_id <> auth.uid()
    AND public.can_assign_role(auth.uid(), role)
  );

-- 2. Restrict deputy profile updates to membership fields only (via trigger)
CREATE OR REPLACE FUNCTION public.restrict_deputy_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_self boolean := (NEW.user_id = auth.uid());
  _is_privileged boolean := public.has_role(auth.uid(), 'admin'::app_role)
                          OR public.has_role(auth.uid(), 'national_secretary'::app_role)
                          OR public.has_role(auth.uid(), 'deputy_national_secretary'::app_role);
BEGIN
  IF _is_self OR _is_privileged THEN
    RETURN NEW;
  END IF;

  -- For deputy/area updates, only allow changes to membership fields
  IF (NEW.full_name IS DISTINCT FROM OLD.full_name)
     OR (NEW.employee_number IS DISTINCT FROM OLD.employee_number)
     OR (NEW.email IS DISTINCT FROM OLD.email)
     OR (NEW.phone IS DISTINCT FROM OLD.phone)
     OR (NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth)
     OR (NEW.gender IS DISTINCT FROM OLD.gender)
     OR (NEW.academy IS DISTINCT FROM OLD.academy)
     OR (NEW.directorate IS DISTINCT FROM OLD.directorate)
     OR (NEW.zone IS DISTINCT FROM OLD.zone)
     OR (NEW.mission IS DISTINCT FROM OLD.mission)
     OR (NEW.corps IS DISTINCT FROM OLD.corps)
     OR (NEW.institution IS DISTINCT FROM OLD.institution)
     OR (NEW.user_id IS DISTINCT FROM OLD.user_id)
  THEN
    RAISE EXCEPTION 'Deputies can only update membership status fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restrict_deputy_profile_updates_trg ON public.profiles;
CREATE TRIGGER restrict_deputy_profile_updates_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_deputy_profile_updates();

-- 3. Fix post-attachments storage: drop overly permissive policy
DROP POLICY IF EXISTS "Authenticated can read post attachments" ON storage.objects;

-- 4. Fix office-photos storage: scope coordinator access to own folder (file path starts with user.id)
DROP POLICY IF EXISTS "Coordinators can upload office photos" ON storage.objects;
DROP POLICY IF EXISTS "Coordinators can update office photos" ON storage.objects;
DROP POLICY IF EXISTS "Coordinators can delete office photos" ON storage.objects;

CREATE POLICY "Coordinators can upload own office photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'office-photos'
    AND has_role(auth.uid(), 'local_coordinator'::app_role)
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Coordinators can update own office photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'office-photos'
    AND has_role(auth.uid(), 'local_coordinator'::app_role)
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'office-photos'
    AND has_role(auth.uid(), 'local_coordinator'::app_role)
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Coordinators can delete own office photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'office-photos'
    AND has_role(auth.uid(), 'local_coordinator'::app_role)
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Remove sensitive security_audit_log from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.security_audit_log;

-- 6. Revoke EXECUTE on internal pgmq wrapper functions from anon/authenticated (service role only)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
