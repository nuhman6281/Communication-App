import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Modal, ModalHeader, ModalBody } from './ui/modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Camera, Loader2, Hash } from 'lucide-react';
import { useCreateChannel } from '@/hooks';
import { toast } from 'sonner';

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated?: (channelId: string) => void;
}

export function CreateChannelDialog({
  open,
  onOpenChange,
  onChannelCreated,
}: CreateChannelDialogProps) {
  const [channelName, setChannelName] = useState('');
  const [channelHandle, setChannelHandle] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [channelType, setChannelType] = useState<'public' | 'private'>('public');
  const [channelCategory, setChannelCategory] = useState<'news' | 'entertainment' | 'technology' | 'sports' | 'education' | 'business' | 'other'>('other');

  // Create channel mutation
  const createChannelMutation = useCreateChannel();

  const handleCreate = async () => {
    if (!channelName.trim()) {
      toast.error('Please enter a channel name');
      return;
    }

    if (!channelHandle.trim()) {
      toast.error('Please enter a channel handle');
      return;
    }

    // Validate handle format
    const handleRegex = /^[a-z0-9_]+$/;
    if (!handleRegex.test(channelHandle)) {
      toast.error('Handle can only contain lowercase letters, numbers, and underscores');
      return;
    }

    if (channelHandle.length < 3 || channelHandle.length > 50) {
      toast.error('Handle must be between 3 and 50 characters');
      return;
    }

    try {
      const result = await createChannelMutation.mutateAsync({
        name: channelName.trim(),
        handle: channelHandle.trim(),
        description: channelDescription.trim() || undefined,
        type: channelType,
        category: channelCategory,
      });

      toast.success(`Channel "@${channelHandle}" created successfully`);
      // Use conversationId from the channel response to navigate to the conversation
      onChannelCreated?.(result.conversationId || result.id);
      onOpenChange(false);

      // Reset form
      setChannelName('');
      setChannelHandle('');
      setChannelDescription('');
      setChannelType('public');
      setChannelCategory('other');
    } catch (err: any) {
      console.error('Failed to create channel:', err);
      const errorMessage = err.response?.data?.message?.message || err.response?.data?.message || err.message || 'Failed to create channel';
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    setChannelName('');
    setChannelHandle('');
    setChannelDescription('');
    setChannelType('public');
    setChannelCategory('other');
    onOpenChange(false);
  };

  // Auto-generate handle from name
  const handleNameChange = (value: string) => {
    setChannelName(value);

    // Auto-generate handle if it hasn't been manually edited
    if (!channelHandle || channelHandle === channelName.toLowerCase().replace(/[^a-z0-9_]/g, '_')) {
      const generatedHandle = value.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 50);
      setChannelHandle(generatedHandle);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth="2xl"
      footerContent={
        <>
          <span>Press ESC to close</span>
        </>
      }
    >
      <ModalHeader>
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Create Channel</h2>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="p-6 space-y-6">
          {/* Channel Photo */}
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
            <p className="text-sm text-muted-foreground">Add channel photo</p>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="channel-name">Channel Name *</Label>
            <Input
              id="channel-name"
              placeholder="Enter channel name"
              value={channelName}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Channel Handle */}
          <div className="space-y-2">
            <Label htmlFor="channel-handle">Channel Handle *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="channel-handle"
                placeholder="channelname"
                value={channelHandle}
                onChange={(e) => setChannelHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="pl-8"
                maxLength={50}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and underscores only (3-50 characters)
            </p>
          </div>

          {/* Channel Description */}
          <div className="space-y-2">
            <Label htmlFor="channel-description">Description (Optional)</Label>
            <Textarea
              id="channel-description"
              placeholder="What's this channel about?"
              value={channelDescription}
              onChange={(e) => setChannelDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Channel Type */}
          <div className="space-y-2">
            <Label htmlFor="channel-type">Channel Type</Label>
            <Select value={channelType} onValueChange={(value: any) => setChannelType(value)}>
              <SelectTrigger id="channel-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can subscribe</SelectItem>
                <SelectItem value="private">Private - Invite only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Channel Category */}
          <div className="space-y-2">
            <Label htmlFor="channel-category">Category</Label>
            <Select value={channelCategory} onValueChange={(value: any) => setChannelCategory(value)}>
              <SelectTrigger id="channel-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="news">News</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Button */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={createChannelMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!channelName.trim() || !channelHandle.trim() || createChannelMutation.isPending}
              onClick={handleCreate}
            >
              {createChannelMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Channel'
              )}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
