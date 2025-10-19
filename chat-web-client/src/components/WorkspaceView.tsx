import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ArrowLeft, Plus, Search, Users, Hash, Lock, Globe } from 'lucide-react';

interface WorkspaceViewProps {
  onBack: () => void;
}

const mockWorkspaces = [
  {
    id: '1',
    name: 'Acme Corporation',
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=AC',
    members: 256,
    channels: 42,
    role: 'Admin',
  },
  {
    id: '2',
    name: 'Design Team',
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=DT',
    members: 18,
    channels: 12,
    role: 'Member',
  },
  {
    id: '3',
    name: 'Tech Startup',
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=TS',
    members: 45,
    channels: 23,
    role: 'Owner',
  },
];

const mockChannels = [
  { id: '1', name: 'general', type: 'public', members: 256, unread: 5 },
  { id: '2', name: 'announcements', type: 'public', members: 256, unread: 2 },
  { id: '3', name: 'design', type: 'public', members: 42, unread: 0 },
  { id: '4', name: 'engineering', type: 'private', members: 28, unread: 12 },
  { id: '5', name: 'marketing', type: 'public', members: 35, unread: 0 },
  { id: '6', name: 'leadership', type: 'private', members: 8, unread: 3 },
];

export function WorkspaceView({ onBack }: WorkspaceViewProps) {
  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl">Workspaces</h2>
          <Button size="sm" className="ml-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Workspace
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* My Workspaces */}
        <div>
          <h3 className="mb-4">My Workspaces</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockWorkspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={workspace.logo} />
                    <AvatarFallback>{workspace.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate mb-1">{workspace.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {workspace.role}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{workspace.members}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    <span>{workspace.channels}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Workspace Channels */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <h3>Acme Corporation Channels</h3>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Channel
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search channels..." className="pl-9" />
          </div>

          {/* Channels List */}
          <div className="space-y-2">
            {mockChannels.map((channel) => (
              <button
                key={channel.id}
                className="w-full p-3 flex items-center gap-3 hover:bg-muted rounded-lg text-left transition-colors"
              >
                <div className="flex-shrink-0">
                  {channel.type === 'private' ? (
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Hash className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="truncate">{channel.name}</span>
                    {channel.type === 'private' && (
                      <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {channel.members} members
                  </p>
                </div>
                {channel.unread > 0 && (
                  <Badge className="bg-blue-600 hover:bg-blue-700">
                    {channel.unread}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Workspace Members */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <h3>Members</h3>
            <Button size="sm" variant="outline">
              Invite People
            </Button>
          </div>

          <div className="space-y-2">
            {[
              { name: 'Sarah Johnson', role: 'Admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', online: true },
              { name: 'Michael Chen', role: 'Member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael', online: true },
              { name: 'Emma Wilson', role: 'Member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', online: false },
              { name: 'James Brown', role: 'Member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', online: false },
            ].map((member, idx) => (
              <div
                key={idx}
                className="p-3 flex items-center gap-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
              >
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  {member.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
