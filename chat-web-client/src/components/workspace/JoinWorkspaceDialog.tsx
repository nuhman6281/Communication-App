import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { useJoinWorkspace } from '@/hooks/useWorkspaces';
import { useWorkspaceActions } from '@/lib/stores';

interface JoinWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  inviteCode: string;
}

export function JoinWorkspaceDialog({
  open,
  onOpenChange,
}: JoinWorkspaceDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const { setCurrentWorkspace, addWorkspace } = useWorkspaceActions();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  const joinWorkspaceMutation = useJoinWorkspace();

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);

      const inviteCode = data.inviteCode.trim();

      const result = await joinWorkspaceMutation.mutateAsync(inviteCode);

      // Add to local store
      addWorkspace(result.workspace);

      // Switch to new workspace
      setCurrentWorkspace(result.workspace.id);

      // Close dialog and reset form
      onOpenChange(false);
      reset();
      setPreview(null);
    } catch (err: any) {
      console.error('Failed to join workspace:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to join workspace. Please check the invite code and try again.'
      );
    }
  };

  const handleClose = () => {
    if (!joinWorkspaceMutation.isPending) {
      onOpenChange(false);
      reset();
      setError(null);
      setPreview(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Join Workspace</DialogTitle>
          <DialogDescription>
            Enter an invite code to join an existing workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Invite Code */}
          <div className="space-y-2">
            <Label htmlFor="inviteCode">
              Invite Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="inviteCode"
              placeholder="e.g., abc123xyz"
              {...register('inviteCode', {
                required: 'Invite code is required',
                minLength: {
                  value: 6,
                  message: 'Invite code must be at least 6 characters',
                },
                pattern: {
                  value: /^[a-zA-Z0-9-]+$/,
                  message: 'Invalid invite code format',
                },
              })}
              disabled={joinWorkspaceMutation.isPending}
            />
            {errors.inviteCode && (
              <p className="text-sm text-destructive">
                {errors.inviteCode.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Ask your workspace admin for an invite code
            </p>
          </div>

          {/* Workspace Preview (if available) */}
          {preview && (
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {preview.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{preview.name}</h4>
                    {preview.isVerified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{preview.memberCount} members</span>
                  </div>
                </div>
              </div>
              {preview.description && (
                <p className="text-sm text-muted-foreground">
                  {preview.description}
                </p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {joinWorkspaceMutation.isSuccess && !error && (
            <Alert className="border-green-500 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Successfully joined workspace!
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={joinWorkspaceMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={joinWorkspaceMutation.isPending}>
              {joinWorkspaceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Join Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
