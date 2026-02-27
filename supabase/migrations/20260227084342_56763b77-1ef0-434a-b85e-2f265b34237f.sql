
-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to auto-assign request to local coordinator
CREATE OR REPLACE FUNCTION public.auto_assign_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _profile RECORD;
  _coordinator_id uuid;
  _deputy_role app_role;
BEGIN
  -- Get sender profile
  SELECT academy, directorate, corps INTO _profile
  FROM public.profiles WHERE user_id = NEW.user_id;

  -- If profile incomplete, skip assignment
  IF _profile.academy IS NULL OR _profile.directorate IS NULL OR _profile.corps IS NULL THEN
    RETURN NEW;
  END IF;

  -- Map corps to deputy role
  _deputy_role := CASE _profile.corps
    WHEN 'primary' THEN 'deputy_local_primary'::app_role
    WHEN 'middle_school' THEN 'deputy_local_middle'::app_role
    WHEN 'high_school' THEN 'deputy_local_high'::app_role
    ELSE 'deputy_local_primary'::app_role
  END;

  -- Find matching local_coordinator or deputy with same academy + directorate
  SELECT ur.user_id INTO _coordinator_id
  FROM public.user_roles ur
  JOIN public.profiles p ON p.user_id = ur.user_id
  WHERE ur.role IN ('local_coordinator'::app_role, _deputy_role)
    AND p.academy = _profile.academy
    AND p.directorate = _profile.directorate
  LIMIT 1;

  IF _coordinator_id IS NOT NULL THEN
    NEW.assigned_to := _coordinator_id;
    -- Create notification for coordinator
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (_coordinator_id, 'طلب جديد', 'تم استلام طلب جديد رقم ' || NEW.tracking_number, '/incoming-requests');
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trg_auto_assign_request
BEFORE INSERT ON public.requests
FOR EACH ROW EXECUTE FUNCTION public.auto_assign_request();

-- Allow coordinators to insert into request_status_history
CREATE POLICY "Coordinators can insert status history"
ON public.request_status_history FOR INSERT
TO authenticated
WITH CHECK (
  is_promoter(auth.uid())
);

-- Allow coordinators to update assigned requests
CREATE POLICY "Coordinators can update assigned requests"
ON public.requests FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());
