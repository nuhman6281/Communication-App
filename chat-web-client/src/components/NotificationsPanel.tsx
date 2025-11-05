import { useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Bell,
  X,
  MessageSquare,
  Users,
  Phone,
  Video,
  CheckCheck,
  Trash2,
  Settings,
  Loader2,
} from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '@/hooks';
import { formatDistanceToNow } from 'date-fns';
import type { Notification, NotificationType } from '@/types/entities.types';

interface NotificationsPanelProps {
  onClose: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationsPanel({ onClose, onNotificationClick }: NotificationsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Fetch notifications with filter
  const { data, isLoading } = useNotifications({
    isRead: filter === 'unread' ? false : undefined,
  });

  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.items || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'message':
      case 'mention':
      case 'group_mention':
        return <MessageSquare className="w-4 h-4" />;
      case 'call_missed':
      case 'call_incoming':
        return <Phone className="w-4 h-4" />;
      case 'group_invite':
      case 'channel_post':
        return <Users className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    onNotificationClick?.(notification);
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <div className="w-full max-w-md h-full flex flex-col bg-background border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h2 className="text-lg">Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="bg-blue-600 hover:bg-blue-700">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {unreadCount > 0 && (
        <div className="px-4 py-2 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            {markAllAsRead.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4 mr-2" />
            )}
            Mark all as read
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Bell className="w-12 h-12 mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => {
              const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              });

              // Extract avatar from notification data if available
              const avatarUrl = notification.data?.avatarUrl as string | undefined;
              const conversationId = notification.data?.conversationId as string | undefined;

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 text-left transition-colors group ${
                    !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  {avatarUrl ? (
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback>{notification.title.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="truncate font-medium">{notification.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    disabled={deleteNotification.isPending}
                  >
                    {deleteNotification.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
