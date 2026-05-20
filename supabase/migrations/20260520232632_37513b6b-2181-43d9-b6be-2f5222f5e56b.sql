CREATE POLICY "Supreme accounts can view all requests"
  ON public.requests FOR SELECT
  USING (
    public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  );

CREATE POLICY "Supreme accounts can update any request"
  ON public.requests FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  );

CREATE POLICY "Supreme accounts can view status history"
  ON public.request_status_history FOR SELECT
  USING (
    public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  );

CREATE POLICY "Supreme accounts can view all attachments"
  ON public.attachments FOR SELECT
  USING (
    public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  );

CREATE POLICY "Supreme accounts can manage all comments"
  ON public.comments FOR ALL
  USING (
    public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  );