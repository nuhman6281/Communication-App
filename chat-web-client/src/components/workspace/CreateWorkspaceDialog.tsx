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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCreateWorkspace } from '@/hooks/useWorkspaces';
import { useWorkspaceActions } from '@/lib/stores';
import type { CreateWorkspaceData } from '@/types/entities.types';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  name: string;
  slug: string;
  description: string;
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const { setCurrentWorkspace, addWorkspace } = useWorkspaceActions();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>();

  const createWorkspaceMutation = useCreateWorkspace();

  // Auto-generate slug from name
  const name = watch('name');
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);

      const workspaceData: CreateWorkspaceData = {
        name: data.name.trim(),
        slug: data.slug.trim() || generateSlug(data.name),
        description: data.description.trim() || undefined,
      };

      const newWorkspace = await createWorkspaceMutation.mutateAsync(
        workspaceData
      );

      // Add to local store
      addWorkspace(newWorkspace);

      // Switch to new workspace
      setCurrentWorkspace(newWorkspace.id);

      // Close dialog and reset form
      onOpenChange(false);
      reset();
    } catch (err: any) {
      console.error('Failed to create workspace:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to create workspace. Please try again.'
      );
    }
  };

  const handleClose = () => {
    if (!createWorkspaceMutation.isPending) {
      onOpenChange(false);
      reset();
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your team's conversations,
            channels, and groups.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Workspace Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Workspace Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Acme Corporation"
              {...register('name', {
                required: 'Workspace name is required',
                minLength: {
                  value: 3,
                  message: 'Name must be at least 3 characters',
                },
                maxLength: {
                  value: 50,
                  message: 'Name must be less than 50 characters',
                },
              })}
              disabled={createWorkspaceMutation.isPending}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Workspace Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              Workspace URL <span className="text-muted-foreground">(optional)</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">workspace.com/</span>
              <Input
                id="slug"
                placeholder={name ? generateSlug(name) : 'acme-corp'}
                {...register('slug', {
                  pattern: {
                    value: /^[a-z0-9-]*$/,
                    message: 'Only lowercase letters, numbers, and hyphens',
                  },
                  minLength: {
                    value: 3,
                    message: 'Slug must be at least 3 characters',
                  },
                  maxLength: {
                    value: 50,
                    message: 'Slug must be less than 50 characters',
                  },
                })}
                disabled={createWorkspaceMutation.isPending}
              />
            </div>
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
            {name && !watch('slug') && (
              <p className="text-xs text-muted-foreground">
                Will use: {generateSlug(name)}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Brief description of your workspace..."
              rows={3}
              {...register('description', {
                maxLength: {
                  value: 500,
                  message: 'Description must be less than 500 characters',
                },
              })}
              disabled={createWorkspaceMutation.isPending}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {createWorkspaceMutation.isSuccess && !error && (
            <Alert className="border-green-500 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Workspace created successfully!
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createWorkspaceMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createWorkspaceMutation.isPending}>
              {createWorkspaceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
