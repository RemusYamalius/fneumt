import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSound } from './useNotificationSound';

export const useRealtimeNotifications = (userId: string | undefined) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { play } = useNotificationSound();

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchUnreadCount();

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          play();
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUnreadCount, play]);

  return { unreadCount, refetch: fetchUnreadCount };
};
