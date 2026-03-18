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
      const { count } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .eq('status', 'submitted');
      setUnreadCount(count || 0);
    } else {
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

  // Post notifications - distinct sound using higher pitch
  useEffect(() => {
    if (!userId) return;
    const postChannel = supabase
      .channel('post-notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_recipients', filter: `user_id=eq.${userId}` },
        () => {
          // Play a distinct notification using Web Audio API
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
            // Second tone
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.frequency.value = 1100;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
            osc2.start(ctx.currentTime + 0.15);
            osc2.stop(ctx.currentTime + 0.6);
          } catch {}
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(postChannel); };
  }, [userId]);

  return { unreadCount, refetch: fetchUnreadCount };
};
