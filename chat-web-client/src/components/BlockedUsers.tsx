/**
 * Blocked Users Component
 * Displays list of blocked users with unblock functionality
 */

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { UserX, ShieldX, Loader2 } from 'lucide-react';
import { useBlockedUsers, useUnblockUser } from '@/hooks';
import { formatDistanceToNow } from 'date-fns';

export function BlockedUsers() {
  const { data: blockedUsers, isLoading } = useBlockedUsers();
  const unblockUser = useUnblockUser();

  const users = blockedUsers?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 border border-border rounded-lg">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ShieldX className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Blocked Users</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          You haven't blocked anyone yet. Blocked users cannot send you messages or see your online status.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {users.map((blockedUser: any) => {
          const user = blockedUser.blockedUser || blockedUser;
          const blockedAt = blockedUser.blockedAt;

          const displayName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username;

          return (
            <div
              key={user.id}
              className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback>
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{displayName}</p>
                  <UserX className="w-3 h-3 text-muted-foreground shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>@{user.username}</span>
                  {blockedAt && (
                    <>
                      <span>•</span>
                      <span>
                        Blocked {formatDistanceToNow(new Date(blockedAt), { addSuffix: true })}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => unblockUser.mutate(user.id)}
                disabled={unblockUser.isPending}
              >
                {unblockUser.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Unblocking...
                  </>
                ) : (
                  'Unblock'
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <div className="flex gap-3">
          <ShieldX className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">About Blocking</p>
            <p>
              Blocked users cannot send you messages, see your online status, or add you to groups.
              Existing conversations will remain, but they won't be able to send new messages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
