import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Briefcase,
  ChevronDown,
  Plus,
  LogIn,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useWorkspaces as useWorkspacesQuery } from '@/hooks/useWorkspaces';
import {
  useCurrentWorkspaceId,
  useCurrentWorkspace,
  useWorkspaceActions,
} from '@/lib/stores';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';
import { JoinWorkspaceDialog } from './JoinWorkspaceDialog';

export function WorkspaceSelector() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  // Get workspace data from React Query
  const { data: workspacesData, isLoading } = useWorkspacesQuery({
    page: 1,
    limit: 50,
    isActive: true,
  });

  // Get current workspace from Zustand store
  const currentWorkspaceId = useCurrentWorkspaceId();
  const currentWorkspace = useCurrentWorkspace();
  const { setCurrentWorkspace } = useWorkspaceActions();

  const workspaces = workspacesData?.workspaces || [];

  const handleWorkspaceSelect = (workspaceId: string | null) => {
    setCurrentWorkspace(workspaceId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between gap-2 h-auto py-2"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {currentWorkspace ? (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {currentWorkspace.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <Briefcase className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium text-sm truncate">
                  {currentWorkspace ? currentWorkspace.name : 'Personal'}
                </div>
                {currentWorkspace && (
                  <div className="text-xs text-muted-foreground truncate">
                    {currentWorkspace.memberCount} members
                  </div>
                )}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[280px]">
          <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Personal Mode */}
          <DropdownMenuItem
            onClick={() => handleWorkspaceSelect(null)}
            className="flex items-center gap-3"
          >
            <Briefcase className="w-4 h-4" />
            <div className="flex-1">
              <div className="font-medium">Personal</div>
              <div className="text-xs text-muted-foreground">
                Your personal chats and groups
              </div>
            </div>
            {!currentWorkspaceId && (
              <CheckCircle2 className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>

          {workspaces.length > 0 && <DropdownMenuSeparator />}

          {/* User's Workspaces */}
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleWorkspaceSelect(workspace.id)}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-xs">
                  {workspace.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{workspace.name}</span>
                  {workspace.isVerified && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {workspace.memberCount} members
                </div>
              </div>
              {currentWorkspaceId === workspace.id && (
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {/* Actions */}
          <DropdownMenuItem
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-3 text-primary"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Create Workspace</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowJoinDialog(true)}
            className="flex items-center gap-3 text-primary"
          >
            <LogIn className="w-4 h-4" />
            <span className="font-medium">Join Workspace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <CreateWorkspaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      <JoinWorkspaceDialog
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
      />
    </>
  );
}
