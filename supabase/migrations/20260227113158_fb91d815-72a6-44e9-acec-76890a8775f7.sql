
CREATE OR REPLACE FUNCTION public.auto_assign_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  _profile RECORD;
  _coordinator_id uuid;
  _deputy_role app_role;
BEGIN
  SELECT academy, directorate, corps INTO _profile
  FROM public.profiles WHERE user_id = NEW.user_id;

  IF _profile.academy IS NULL OR _profile.directorate IS NULL OR _profile.corps IS NULL THEN
    RETURN NEW;
  END IF;

  _deputy_role := CASE _profile.corps
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
$$;
