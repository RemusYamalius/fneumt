-- 1) Create security_audit_log table
CREATE TABLE public.security_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'login_failed', 'login_success', 'logout',
    'account_deletion_requested', 'rate_limit_exceeded',
    'role_changed', 'password_changed', 'password_reset_requested',
    'unauthorized_access', 'signup_success', 'signup_failed'
  ))
);

-- Indexes for fast filtering
CREATE INDEX idx_security_audit_created_at ON public.security_audit_log (created_at DESC);
CREATE INDEX idx_security_audit_event_type ON public.security_audit_log (event_type);
CREATE INDEX idx_security_audit_severity ON public.security_audit_log (severity);
CREATE INDEX idx_security_audit_user_id ON public.security_audit_log (user_id);

-- 2) Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- 3) Policies
-- Anyone (even anon) can insert — needed to log failed login attempts before auth
CREATE POLICY "Anyone can insert audit logs"
ON public.security_audit_log
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can view audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- No UPDATE or DELETE policies = nobody can modify or delete (immutable log)

-- 4) RPC function to log events safely
CREATE OR REPLACE FUNCTION public.log_security_event(
  _event_type text,
  _severity text DEFAULT 'info',
  _metadata jsonb DEFAULT '{}'::jsonb,
  _user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _log_id uuid;
  _effective_user_id uuid;
BEGIN
  -- Use provided user_id, or auth.uid() if available
  _effective_user_id := COALESCE(_user_id, auth.uid());

  INSERT INTO public.security_audit_log (user_id, event_type, severity, metadata)
  VALUES (_effective_user_id, _event_type, _severity, _metadata)
  RETURNING id INTO _log_id;

  RETURN _log_id;
END;
$$;