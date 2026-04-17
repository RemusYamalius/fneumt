import { supabase } from '@/integrations/supabase/client';

export type SecurityEventType =
  | 'login_failed'
  | 'login_success'
  | 'logout'
  | 'account_deletion_requested'
  | 'rate_limit_exceeded'
  | 'role_changed'
  | 'password_changed'
  | 'password_reset_requested'
  | 'unauthorized_access'
  | 'signup_success'
  | 'signup_failed';

export type SecuritySeverity = 'info' | 'warning' | 'critical';

/**
 * Log a security event. Failures are silently swallowed to never block the user flow.
 * For anonymous events (e.g. login_failed) pass userId = null.
 */
export async function logSecurityEvent(
  eventType: SecurityEventType,
  severity: SecuritySeverity = 'info',
  metadata: Record<string, any> = {},
  userId: string | null = null,
): Promise<void> {
  try {
    const enrichedMetadata = {
      ...metadata,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
      timestamp: new Date().toISOString(),
    };

    await supabase.rpc('log_security_event', {
      _event_type: eventType,
      _severity: severity,
      _metadata: enrichedMetadata,
      _user_id: userId,
    });
  } catch {
    // Silent failure — security logging must never block UX
  }
}
