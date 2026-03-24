
-- Helper function to derive corps from mission
CREATE OR REPLACE FUNCTION public.derive_corps_from_mission(_mission text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _mission IN ('teacher_primary', 'inspector_primary') THEN 'primary'
    WHEN _mission IN ('teacher_middle', 'inspector_middle') THEN 'middle_school'
    WHEN _mission IN ('teacher_high', 'inspector_high') THEN 'high_school'
    ELSE 'primary'
  END;
$$;

-- Update auto_assign_request to fallback to mission when corps is null
CREATE OR REPLACE FUNCTION public.auto_assign_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _profile RECORD;
  _coordinator_id uuid;
  _deputy_role app_role;
  _effective_corps text;
BEGIN
  SELECT academy, directorate, corps, mission INTO _profile
  FROM public.profiles WHERE user_id = NEW.user_id;

  IF _profile.academy IS NULL OR _profile.directorate IS NULL THEN
    RETURN NEW;
  END IF;

  _effective_corps := COALESCE(_profile.corps::text, public.derive_corps_from_mission(_profile.mission));

  IF _effective_corps IS NULL THEN
    RETURN NEW;
  END IF;

  _deputy_role := CASE _effective_corps
    WHEN 'primary' THEN 'deputy_local_primary'::app_role
    WHEN 'middle_school' THEN 'deputy_local_middle'::app_role
    WHEN 'high_school' THEN 'deputy_local_high'::app_role
    ELSE 'deputy_local_primary'::app_role
  END;

  SELECT ur.user_id INTO _coordinator_id
  FROM public.user_roles ur
  JOIN public.profiles p ON p.user_id = ur.user_id
  WHERE ur.role = _deputy_role
    AND p.academy = _profile.academy
    AND p.directorate = _profile.directorate
  LIMIT 1;

  IF _coordinator_id IS NOT NULL THEN
    NEW.assigned_to := _coordinator_id;
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (_coordinator_id, 'طلب جديد', 'تم استلام طلب جديد رقم ' || NEW.tracking_number, '/incoming-requests');
  END IF;

  RETURN NEW;
END;
$function$;

-- Update auto_assign_join_request with same logic
CREATE OR REPLACE FUNCTION public.auto_assign_join_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _profile RECORD;
  _deputy_role app_role;
  _deputy_id uuid;
  _effective_corps text;
BEGIN
  SELECT academy, directorate, corps, mission INTO _profile
  FROM public.profiles WHERE user_id = NEW.user_id;

  IF _profile.academy IS NULL OR _profile.directorate IS NULL THEN
    RETURN NEW;
  END IF;

  _effective_corps := COALESCE(_profile.corps::text, public.derive_corps_from_mission(_profile.mission));

  IF _effective_corps IS NULL THEN
    RETURN NEW;
  END IF;

  _deputy_role := CASE _effective_corps
    WHEN 'primary' THEN 'deputy_local_primary'::app_role
    WHEN 'middle_school' THEN 'deputy_local_middle'::app_role
    WHEN 'high_school' THEN 'deputy_local_high'::app_role
    ELSE 'deputy_local_primary'::app_role
  END;

  SELECT ur.user_id INTO _deputy_id
  FROM public.user_roles ur
  JOIN public.profiles p ON p.user_id = ur.user_id
  WHERE ur.role = _deputy_role
    AND p.academy = _profile.academy
    AND p.directorate = _profile.directorate
  LIMIT 1;

  IF _deputy_id IS NOT NULL THEN
    NEW.assigned_to := _deputy_id;
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (_deputy_id, 'طلب انضمام جديد', 'تلقيت طلب انضمام جديد', '/join-requests');
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix existing unassigned requests
UPDATE public.requests r
SET assigned_to = sub.deputy_id
FROM (
  SELECT req.id as request_id, ur.user_id as deputy_id
  FROM public.requests req
  JOIN public.profiles rp ON rp.user_id = req.user_id
  JOIN public.user_roles ur ON ur.role = (
    CASE public.derive_corps_from_mission(COALESCE(rp.corps::text, rp.mission))
      WHEN 'primary' THEN 'deputy_local_primary'::app_role
      WHEN 'middle_school' THEN 'deputy_local_middle'::app_role
      WHEN 'high_school' THEN 'deputy_local_high'::app_role
      ELSE 'deputy_local_primary'::app_role
    END
  )
  JOIN public.profiles dp ON dp.user_id = ur.user_id
    AND dp.academy = rp.academy
    AND dp.directorate = rp.directorate
  WHERE req.assigned_to IS NULL
) sub
WHERE r.id = sub.request_id;
