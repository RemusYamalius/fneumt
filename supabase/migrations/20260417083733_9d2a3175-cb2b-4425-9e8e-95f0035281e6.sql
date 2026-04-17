DROP POLICY IF EXISTS "Anyone can insert audit logs" ON public.security_audit_log;

-- Allow inserts but prevent identity spoofing:
-- - anon users: must have user_id = NULL
-- - authenticated users: must use their own auth.uid() or NULL
CREATE POLICY "Restricted audit log insert"
ON public.security_audit_log
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);