import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Search, Plus, MoreVertical, Users, Hash, Volume2, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useConversations } from '@/hooks';
import { Skeleton } from './ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateGroup: () => void;
  onSearch?: () => void;
}

export function ConversationList({ selectedId, onSelect, onCreateGroup, onSearch }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'direct' | 'groups' | 'channels'>('all');

  // Fetch conversations from API
  const { data, isLoading, error } = useConversations({
    type: filter === 'all' ? undefined : filter === 'direct' ? 'direct' : filter === 'groups' ? 'group' : 'channel',
    search: searchQuery || undefined,
  });

  // Format timestamp helper
  const formatTimestamp = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  // Get conversation name helper
  const getConversationName = (conversation: any) => {
    if (conversation.type === 'direct') {
      // For direct conversations, get the other participant's name
      return conversation.participants?.[0]?.username || 'Unknown User';
    }
    return conversation.name || 'Unnamed';
  };

  // Get conversation avatar helper
  const getConversationAvatar = (conversation: any) => {
    if (conversation.type === 'direct') {
      return conversation.participants?.[0]?.avatarUrl;
    }
    return conversation.avatarUrl;
  };

  // Get online status for direct conversations
  const isOnline = (conversation: any) => {
    if (conversation.type === 'direct') {
      return conversation.participants?.[0]?.isOnline || false;
    }
    return false;
  };

  const filteredConversations = data?.items || [];

  const getConversationIcon = (type: string) => {
    if (type === 'group') return <Users className="w-3 h-3" />;
    if (type === 'channel') return <Hash className="w-3 h-3" />;
    return null;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Messages</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>New Message</DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateGroup}>Create Group</DropdownMenuItem>
              <DropdownMenuItem>Create Channel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={onSearch}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'direct', 'groups', 'channels'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize shrink-0"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Search className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-red-500">Failed to load conversations</p>
            <p className="text-xs mt-1">{error.message}</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Search className="w-12 h-12 mb-2 opacity-50" />
            <p>No conversations found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => {
              const convName = getConversationName(conversation);
              const convAvatar = getConversationAvatar(conversation);
              const convOnline = isOnline(conversation);

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelect(conversation.id)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left ${
                    selectedId === conversation.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={convAvatar} />
                      <AvatarFallback>{convName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {convOnline && conversation.type === 'direct' && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {getConversationIcon(conversation.type) && (
                          <span className="text-muted-foreground">
                            {getConversationIcon(conversation.type)}
                          </span>
                        )}
                        <span className="truncate font-medium">{convName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatTimestamp(conversation.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge className="shrink-0 bg-blue-600 hover:bg-blue-700">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>

                    {conversation.type === 'group' && conversation.memberCount && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {conversation.memberCount} members
                      </p>
                    )}
                    {conversation.type === 'channel' && conversation.subscriberCount && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {conversation.subscriberCount} subscribers
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}