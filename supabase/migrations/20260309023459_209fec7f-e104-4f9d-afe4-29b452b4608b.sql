
-- Create a function to check if a user is a local coordinator in the same area as a deputy
CREATE OR REPLACE FUNCTION public.is_area_coordinator(_coordinator_id uuid, _deputy_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles cur
    JOIN public.profiles cp ON cp.user_id = cur.user_id
    JOIN public.profiles dp ON dp.user_id = _deputy_user_id
    JOIN public.user_roles dur ON dur.user_id = _deputy_user_id
    WHERE cur.user_id = _coordinator_id
      AND cur.role = 'local_coordinator'
      AND dur.role IN ('deputy_local_primary', 'deputy_local_middle', 'deputy_local_high')
      AND cp.academy = dp.academy
      AND cp.directorate = dp.directorate
  )
$$;

-- Update the "Coordinators can view deputy requests" policy to also match by area
DROP POLICY IF EXISTS "Coordinators can view deputy requests" ON public.requests;
CREATE POLICY "Coordinators can view deputy requests"
ON public.requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = requests.assigned_to
      AND (ur.promoted_by = auth.uid() OR public.is_area_coordinator(auth.uid(), ur.user_id))
  )
);

-- Update the "Coordinators can view deputy request history" policy
DROP POLICY IF EXISTS "Coordinators can view deputy request history" ON public.request_status_history;
CREATE POLICY "Coordinators can view deputy request history"
ON public.request_status_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.requests r
    JOIN public.user_roles ur ON ur.user_id = r.assigned_to
    WHERE r.id = request_status_history.request_id
      AND (ur.promoted_by = auth.uid() OR public.is_area_coordinator(auth.uid(), ur.user_id))
  )
);
