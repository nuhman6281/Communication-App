import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Search, Plus, MoreVertical, Users, Hash, Volume2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateGroup: () => void;
  onSearch?: () => void;
}

const mockConversations = [
  {
    id: '1',
    type: 'direct',
    name: 'Sarah Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    lastMessage: 'That sounds great! See you tomorrow',
    timestamp: '2m ago',
    unread: 2,
    online: true,
  },
  {
    id: '2',
    type: 'group',
    name: 'Design Team',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DT',
    lastMessage: 'Alex: Can we schedule a meeting?',
    timestamp: '15m ago',
    unread: 0,
    members: 12,
  },
  {
    id: '3',
    type: 'direct',
    name: 'Michael Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    lastMessage: 'Thanks for the update!',
    timestamp: '1h ago',
    unread: 0,
    online: true,
  },
  {
    id: '4',
    type: 'group',
    name: 'Project Alpha',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PA',
    lastMessage: 'You: Here are the latest changes',
    timestamp: '2h ago',
    unread: 5,
    members: 8,
  },
  {
    id: '5',
    type: 'channel',
    name: 'announcements',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AN',
    lastMessage: 'New company policy updates',
    timestamp: '3h ago',
    unread: 1,
    subscribers: 256,
  },
  {
    id: '6',
    type: 'direct',
    name: 'Emma Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    lastMessage: 'Perfect, let me know when you\'re ready',
    timestamp: '1d ago',
    unread: 0,
    online: false,
  },
];

export function ConversationList({ selectedId, onSelect, onCreateGroup, onSearch }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'direct' | 'groups' | 'channels'>('all');

  const filteredConversations = mockConversations.filter((conv) => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'direct' && conv.type === 'direct') ||
      (filter === 'groups' && conv.type === 'group') ||
      (filter === 'channels' && conv.type === 'channel');
    return matchesSearch && matchesFilter;
  });

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
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Search className="w-12 h-12 mb-2 opacity-50" />
            <p>No conversations found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation.id)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left ${
                  selectedId === conversation.id ? 'bg-muted' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conversation.avatar} />
                    <AvatarFallback>{conversation.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  {conversation.online && conversation.type === 'direct' && (
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
                      <span className="truncate">{conversation.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {conversation.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unread > 0 && (
                      <Badge className="shrink-0 bg-blue-600 hover:bg-blue-700">
                        {conversation.unread}
                      </Badge>
                    )}
                  </div>

                  {conversation.type === 'group' && conversation.members && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {conversation.members} members
                    </p>
                  )}
                  {conversation.type === 'channel' && conversation.subscribers && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {conversation.subscribers} subscribers
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}