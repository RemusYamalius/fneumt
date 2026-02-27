
-- Allow coordinators/promoters to insert notifications for request owners
CREATE POLICY "Promoters can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (is_promoter(auth.uid()));
