import { useState, useEffect } from 'react';
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
import { Link2, Copy, Check, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GenerateInviteLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onGenerate?: () => Promise<{ inviteCode: string; expiresAt: string }>;
}

export function GenerateInviteLinkDialog({
  open,
  onOpenChange,
  workspaceId,
  onGenerate,
}: GenerateInviteLinkDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate link when dialog opens
  useEffect(() => {
    if (open && !inviteLink) {
      handleGenerate();
    }
  }, [open]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      if (onGenerate) {
        const result = await onGenerate();
        const link = `${window.location.origin}/join/${result.inviteCode}`;
        setInviteLink(link);
        setExpiresAt(result.expiresAt);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate invite link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = () => {
    setInviteLink(null);
    setExpiresAt(null);
    setError(null);
    setIsCopied(false);
    onOpenChange(false);
  };

  const formatExpiry = (expiryDate: string) => {
    try {
      const date = new Date(expiryDate);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        return `Expires in ${diffDays} days`;
      } else if (diffDays === 1) {
        return 'Expires tomorrow';
      } else {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours > 0) {
          return `Expires in ${diffHours} hours`;
        }
        return 'Expires soon';
      }
    } catch {
      return 'Expires soon';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Generate Invite Link
          </DialogTitle>
          <DialogDescription>
            Create a shareable link that anyone can use to join your workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Invite Link Display */}
          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-sm text-muted-foreground">
                Generating invite link...
              </span>
            </div>
          ) : inviteLink ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="invite-link">Shareable Invite Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-link"
                    value={inviteLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {expiresAt && (
                  <p className="text-xs text-muted-foreground">
                    {formatExpiry(expiresAt)}
                  </p>
                )}
              </div>

              {/* Regenerate Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate New Link
              </Button>

              {/* Info Box */}
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <p className="text-sm font-medium">How it works</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Share this link with people you want to invite</li>
                  <li>Anyone with the link can join your workspace</li>
                  <li>The link expires automatically for security</li>
                  <li>You can generate a new link anytime</li>
                  <li>Track who joined via the members list</li>
                </ul>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {inviteLink && (
            <Button onClick={handleCopy}>
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
