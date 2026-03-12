import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSound } from './useNotificationSound';
import type { AppRole } from '@/lib/role-hierarchy';

const INBOX_ROLES: AppRole[] = ['deputy_local_primary', 'deputy_local_middle', 'deputy_local_high'];

export const useRealtimeNotifications = (userId: string | undefined, role?: AppRole | null) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { play } = useNotificationSound();
  const isInboxRole = role ? INBOX_ROLES.includes(role) : false;

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    if (isInboxRole) {
      // Count requests assigned to this user that are still 'submitted'
      const { count } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .eq('status', 'submitted');
      setUnreadCount(count || 0);
    } else {
      // For other roles, count unread notifications
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    }
  }, [userId, isInboxRole]);

  useEffect(() => {
    if (!userId) return;
    fetchUnreadCount();

    if (isInboxRole) {
      // Subscribe to requests table changes for inbox roles
      const reqChannel = supabase
        .channel('requests-badge-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'requests', filter: `assigned_to=eq.${userId}` },
          (payload) => {
            if (payload.eventType === 'INSERT') play();
            fetchUnreadCount();
          }
        )
        .subscribe();

      // Also subscribe to join_requests for inbox roles
      const joinChannel = supabase
        .channel('join-requests-badge-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'join_requests', filter: `assigned_to=eq.${userId}` },
          (payload) => {
            if (payload.eventType === 'INSERT') play();
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(reqChannel);
        supabase.removeChannel(joinChannel);
      };
    } else {
      // Subscribe to notifications table for other roles
      const channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          (payload) => {
            if (payload.eventType === 'INSERT') play();
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId, isInboxRole, fetchUnreadCount, play]);

  return { unreadCount, refetch: fetchUnreadCount };
};
