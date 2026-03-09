
-- Allow coordinators to view request_status_history for requests assigned to their deputies
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
      AND ur.promoted_by = auth.uid()
  )
);

-- Allow coordinators to view requests assigned to their deputies
CREATE POLICY "Coordinators can view deputy requests"
ON public.requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = requests.assigned_to
      AND ur.promoted_by = auth.uid()
  )
);
