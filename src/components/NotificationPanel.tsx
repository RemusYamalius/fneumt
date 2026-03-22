import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, CheckCheck, BellOff, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  userId: string;
  unreadCount: number;
  markAllRead: () => Promise<void>;
  onRefetch: () => void;
}

type Tab = 'all' | 'unread';

const relativeTime = (dateStr: string, t: Record<string, string>): string => {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t.justNow;
  if (mins < 60) return t.minutesAgo.replace('{n}', String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t.hoursAgo.replace('{n}', String(hours));
  const days = Math.floor(hours / 24);
  return t.daysAgo.replace('{n}', String(days));
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  userId,
  unreadCount,
  markAllRead,
  onRefetch,
}) => {
  const { t, dir } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>('all');
  const [open, setOpen] = useState(false);
  const ArrowIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-list', userId, tab],
    queryFn: async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (tab === 'unread') query = query.eq('is_read', false);
      const { data } = await query;
      return data || [];
    },
    staleTime: 10_000,
    enabled: open,
  });

  // Fetch unread posts count for the banner
  const { data: unreadPostsCount = 0 } = useQuery({
    queryKey: ['unread-posts-count', userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('post_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      return count || 0;
    },
    staleTime: 10_000,
    enabled: open,
  });

  const handleMarkAll = async () => {
    await markAllRead();
    queryClient.invalidateQueries({ queryKey: ['notifications-list', userId] });
    queryClient.invalidateQueries({ queryKey: ['unread-posts-count', userId] });
    onRefetch();
  };

  const handleClickNotification = async (n: any) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      queryClient.invalidateQueries({ queryKey: ['notifications-list', userId] });
      onRefetch();
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const handleGoToPosts = async () => {
    // Mark all post_recipients as read
    await supabase
      .from('post_recipients')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
    queryClient.invalidateQueries({ queryKey: ['unread-posts-count', userId] });
    queryClient.invalidateQueries({ queryKey: ['notifications-list', userId] });
    onRefetch();
    setOpen(false);
    if (location.pathname !== '/communication-hub') {
      navigate('/communication-hub');
    }
  };

  const tabs: { key: Tab; label: string }[] = useMemo(
    () => [
      { key: 'all', label: t.allNotifications },
      { key: 'unread', label: t.unreadOnly },
    ],
    [t],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in-50">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] sm:w-[380px] p-0 rounded-xl border-border/50 shadow-xl overflow-hidden"
        dir={dir}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-foreground">
            <Bell className="w-4 h-4" />
            <span className="font-semibold text-sm">{t.notifications}</span>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-xs text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {t.markAllAsRead}
            </button>
          )}
        </div>

        {/* Unread Posts Banner */}
        {unreadPostsCount > 0 && (
          <button
            onClick={handleGoToPosts}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-accent/50 hover:bg-accent transition-colors border-b border-border/50 animate-in fade-in slide-in-from-top-1"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground">
              {unreadPostsCount === 1
                ? t.unreadPostsSingle
                : (t.unreadPosts || '').replace('{n}', String(unreadPostsCount))}
            </span>
            <ArrowIcon className="w-4 h-4 text-muted-foreground ms-auto" />
          </button>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border relative bg-muted/30">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                'flex-1 py-2 text-xs font-medium transition-colors relative',
                tab === item.key
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
              {item.key === 'unread' && unreadCount > 0 && (
                <span className="ms-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {tab === item.key && (
                <span className="absolute bottom-0 inset-x-2 h-0.5 bg-primary rounded-full animate-in fade-in slide-in-from-bottom-1" />
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="p-6 flex justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-2 text-muted-foreground">
              <BellOff className="w-10 h-10 opacity-30" />
              <p className="text-sm">{t.noNotifications}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((n, i) => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  className={cn(
                    'w-full text-start px-4 py-3 transition-all group',
                    !n.is_read && 'bg-primary/5',
                    n.link ? 'cursor-pointer hover:bg-accent/50' : 'hover:bg-accent/30',
                    'animate-in fade-in slide-in-from-top-2',
                  )}
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-1.5 shrink-0">
                      {!n.is_read ? (
                        <span className="block w-2 h-2 rounded-full bg-primary animate-pulse" />
                      ) : (
                        <span className="block w-2 h-2 rounded-full bg-border" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm leading-snug',
                          !n.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {relativeTime(n.created_at, t)}
                      </p>
                    </div>
                    {n.link && (
                      <div className="mt-2 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-all group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                        <ArrowIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPanel;
