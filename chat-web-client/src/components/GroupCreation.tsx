import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Checkbox } from './ui/checkbox';
import { Skeleton } from './ui/skeleton';
import { ArrowLeft, Camera, Search, X, Loader2 } from 'lucide-react';
import { useSearchUsers, useCreateGroup } from '@/hooks';
import { toast } from 'sonner';

interface GroupCreationProps {
  onBack: () => void;
  onGroupCreated?: (groupId: string) => void;
}

export function GroupCreation({ onBack, onGroupCreated }: GroupCreationProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  // Search users with React Query
  const {
    data: searchResults,
    isLoading: searchLoading,
  } = useSearchUsers({
    query: searchQuery,
    limit: 50,
  });

  // Create group mutation
  const createGroupMutation = useCreateGroup();

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const users = searchResults?.items || [];

  const selectedUsers = users.filter((user) =>
    selectedMembers.includes(user.id)
  );

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      const result = await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        memberIds: selectedMembers,
        type: 'private',
        privacy: 'invite_only', // Use correct enum value: 'open' | 'approval_required' | 'invite_only'
      });

      toast.success(`Group "${groupName}" created successfully`);
      // Use conversationId from the group response to navigate to the conversation
      onGroupCreated?.(result.conversationId || result.id);
      onBack();
    } catch (err: any) {
      console.error('Failed to create group:', err);
      const errorMessage = err.response?.data?.message?.message || err.response?.data?.message || err.message || 'Failed to create group';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={step === 2 ? () => setStep(1) : onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl">{step === 1 ? 'Add Members' : 'Group Details'}</h2>
          {step === 1 && selectedMembers.length > 0 && (
            <Button size="sm" className="ml-auto" onClick={() => setStep(2)}>
              Next ({selectedMembers.length})
            </Button>
          )}
        </div>
      </div>

      {step === 1 ? (
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {selectedUsers.map((user) => {
                const displayName = user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username;

                return (
                  <div key={user.id} className="flex flex-col items-center gap-1 shrink-0">
                    <div className="relative">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <button
                        onClick={() => toggleMember(user.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs max-w-[60px] truncate">{displayName.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Contacts List */}
          <div className="space-y-1">
            {!searchQuery ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">Start typing to search for users</p>
              </div>
            ) : searchLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mb-2 opacity-50" />
                <p>No users found for "{searchQuery}"</p>
              </div>
            ) : (
              users.map((user) => {
                const isSelected = selectedMembers.includes(user.id);
                const displayName = user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username;

                return (
                  <button
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Checkbox checked={isSelected} />
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="truncate font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
          {/* Group Photo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Add group photo</p>
          </div>

          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name *</Label>
            <Input
              id="group-name"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Group Description */}
          <div className="space-y-2">
            <Label htmlFor="group-description">Description (Optional)</Label>
            <Textarea
              id="group-description"
              placeholder="What's this group about?"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Members Preview */}
          <div className="space-y-2">
            <Label>Members ({selectedMembers.length})</Label>
            <div className="border border-border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
              {selectedUsers.map((user) => {
                const displayName = user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username;

                return (
                  <div key={user.id} className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{displayName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create Button */}
          <Button
            className="w-full"
            disabled={!groupName.trim() || createGroupMutation.isPending}
            onClick={handleCreate}
          >
            {createGroupMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Group'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
