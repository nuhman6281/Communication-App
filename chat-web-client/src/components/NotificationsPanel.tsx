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
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'message' | 'mention' | 'call' | 'group' | 'system';
  title: string;
  body: string;
  avatar?: string;
  timestamp: string;
  isRead: boolean;
  conversationId?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'message',
    title: 'Sarah Johnson',
    body: 'That sounds great! See you tomorrow',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    timestamp: '2m ago',
    isRead: false,
    conversationId: '1',
  },
  {
    id: '2',
    type: 'call',
    title: 'Missed Video Call',
    body: 'Michael Chen tried to call you',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    timestamp: '15m ago',
    isRead: false,
  },
  {
    id: '3',
    type: 'mention',
    title: 'Alex mentioned you',
    body: '@you Can we schedule a meeting?',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    timestamp: '1h ago',
    isRead: false,
    conversationId: '2',
  },
  {
    id: '4',
    type: 'group',
    title: 'Design Team',
    body: 'Emma added you to the group',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DT',
    timestamp: '2h ago',
    isRead: true,
  },
  {
    id: '5',
    type: 'system',
    title: 'Storage Almost Full',
    body: 'You\'re using 9.2 GB of 10 GB',
    timestamp: '1d ago',
    isRead: true,
  },
];

interface NotificationsPanelProps {
  onClose: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationsPanel({ onClose, onNotificationClick }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter((n) =>
    filter === 'all' ? true : !n.isRead
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'mention':
        return <MessageSquare className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'group':
        return <Users className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    onNotificationClick?.(notification);
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
            onClick={markAllAsRead}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Bell className="w-12 h-12 mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 text-left transition-colors group ${
                  !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                }`}
              >
                {notification.avatar ? (
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={notification.avatar} />
                    <AvatarFallback>{notification.title.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`truncate ${!notification.isRead ? '' : ''}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {notification.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.body}
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
                    deleteNotification(notification.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
