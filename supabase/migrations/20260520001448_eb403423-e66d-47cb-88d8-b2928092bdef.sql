CREATE POLICY "Supreme accounts can update membership"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  );