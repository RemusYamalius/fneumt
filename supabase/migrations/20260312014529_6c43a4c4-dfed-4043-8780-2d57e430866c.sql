
-- Create join_requests table
CREATE TABLE public.join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  assigned_to uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert own join requests"
ON public.join_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own join requests"
ON public.join_requests FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Assigned deputies can view join requests"
ON public.join_requests FOR SELECT TO authenticated
USING (assigned_to = auth.uid());

CREATE POLICY "Assigned deputies can update join requests"
ON public.join_requests FOR UPDATE TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Admins can view all join requests"
ON public.join_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Promoters can view all join requests"
ON public.join_requests FOR SELECT TO authenticated
USING (public.is_promoter(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.join_requests;

-- Auto-assign trigger (similar to auto_assign_request)
CREATE OR REPLACE FUNCTION public.auto_assign_join_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _profile RECORD;
  _deputy_role app_role;
  _deputy_id uuid;
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
$$;

CREATE TRIGGER on_join_request_created
  BEFORE INSERT ON public.join_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_join_request();
