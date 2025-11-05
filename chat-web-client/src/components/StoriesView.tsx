import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ArrowLeft, Plus, X, Send, MoreVertical, Loader2, Upload } from 'lucide-react';
import { Input } from './ui/input';
import { useActiveStories, useMyStories, useViewStory, useReplyToStory, useUploadStory, useDeleteStory } from '@/hooks';
import { useAuthStore } from '@/lib/stores';
import { formatDistanceToNow } from 'date-fns';
import type { Story } from '@/types/entities.types';

interface StoriesViewProps {
  onBack: () => void;
}

interface StoryGroup {
  userId: string;
  username: string;
  avatarUrl: string | null;
  stories: Story[];
  unseenCount: number;
}

export function StoriesView({ onBack }: StoriesViewProps) {
  const { user } = useAuthStore();
  const { data: activeStories = [], isLoading: isLoadingActive } = useActiveStories();
  const { data: myStories = [], isLoading: isLoadingMy } = useMyStories();
  const viewStory = useViewStory();
  const replyToStory = useReplyToStory();
  const uploadStory = useUploadStory();
  const deleteStory = useDeleteStory();

  const [selectedUser, setSelectedUser] = useState<StoryGroup | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  // Auto-progress story every 5 seconds
  useEffect(() => {
    if (!selectedUser || !selectedUser.stories[currentStoryIndex]) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2; // Progress 2% every 100ms = 5 seconds total
      });
    }, 100);

    return () => clearInterval(timer);
  }, [selectedUser, currentStoryIndex]);

  // Mark story as viewed when opened
  useEffect(() => {
    if (selectedUser && selectedUser.stories[currentStoryIndex]) {
      const story = selectedUser.stories[currentStoryIndex];
      // Only mark as viewed if it's not our own story
      if (story.userId !== user?.id) {
        viewStory.mutate(story.id);
      }
    }
  }, [selectedUser, currentStoryIndex, user?.id]);

  const handleStorySelect = useCallback((storyGroup: StoryGroup) => {
    if (storyGroup.stories.length > 0) {
      setSelectedUser(storyGroup);
      setCurrentStoryIndex(0);
      setProgress(0);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (selectedUser && currentStoryIndex < selectedUser.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      // Move to next user's stories or close
      const currentIndex = activeStories.findIndex((s) => s.userId === selectedUser?.userId);
      if (currentIndex !== -1 && currentIndex < activeStories.length - 1) {
        handleStorySelect(activeStories[currentIndex + 1]);
      } else {
        setSelectedUser(null);
      }
    }
  }, [selectedUser, currentStoryIndex, activeStories, handleStorySelect]);

  const handlePrevious = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      // Move to previous user's stories
      const currentIndex = activeStories.findIndex((s) => s.userId === selectedUser?.userId);
      if (currentIndex > 0) {
        const prevUser = activeStories[currentIndex - 1];
        setSelectedUser(prevUser);
        setCurrentStoryIndex(prevUser.stories.length - 1);
        setProgress(0);
      }
    }
  }, [currentStoryIndex, activeStories, selectedUser]);

  const handleReply = async () => {
    if (!selectedUser || !replyText.trim()) return;

    const currentStory = selectedUser.stories[currentStoryIndex];
    await replyToStory.mutateAsync({
      storyId: currentStory.id,
      message: replyText.trim(),
    });

    setReplyText('');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(file);
    try {
      await uploadStory.mutateAsync({
        file,
        privacy: 'public',
      });
    } finally {
      setUploadingFile(null);
      event.target.value = ''; // Reset input
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      await deleteStory.mutateAsync(storyId);
      setSelectedUser(null);
    }
  };

  // Render loading state
  if (isLoadingActive || isLoadingMy) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Story viewer overlay
  if (selectedUser) {
    const currentStory = selectedUser.stories[currentStoryIndex];
    if (!currentStory) return null;

    const isMyStory = currentStory.userId === user?.id;
    const timeAgo = formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true });

    return (
      <div className="h-full bg-black text-white relative">
        {/* Story Progress Bars */}
        <div className="absolute top-0 left-0 right-0 p-2 z-20 flex gap-1">
          {selectedUser.stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width:
                    idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-4 left-0 right-0 px-4 pt-3 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-10 h-10 ring-2 ring-white">
              <AvatarImage src={selectedUser.avatarUrl || undefined} />
              <AvatarFallback>{selectedUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{selectedUser.username}</p>
              <p className="text-xs text-white/70">{timeAgo}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isMyStory && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => handleDeleteStory(currentStory.id)}
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setSelectedUser(null)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Story Content */}
        <div className="h-full flex items-center justify-center">
          {currentStory.contentType === 'image' && currentStory.contentUrl ? (
            <img
              src={currentStory.contentUrl}
              alt="Story"
              className="max-h-full max-w-full object-contain"
            />
          ) : currentStory.contentType === 'video' && currentStory.contentUrl ? (
            <video
              src={currentStory.contentUrl}
              className="max-h-full max-w-full object-contain"
              autoPlay
              loop
              muted
            />
          ) : currentStory.contentType === 'text' ? (
            <div
              className="w-full h-full flex items-center justify-center p-8"
              style={{ backgroundColor: currentStory.backgroundColor || '#4F46E5' }}
            >
              <p className="text-3xl text-center font-medium">{currentStory.textContent}</p>
            </div>
          ) : null}
        </div>

        {/* Navigation Areas */}
        <button className="absolute left-0 top-0 bottom-0 w-1/3 z-10" onClick={handlePrevious} />
        <button className="absolute right-0 top-0 bottom-0 w-1/3 z-10" onClick={handleNext} />

        {/* Reply Input (only for others' stories) */}
        {!isMyStory && (
          <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
            <div className="flex gap-2">
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
                placeholder="Reply to story..."
                className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
              />
              <Button
                size="icon"
                className="bg-white text-black hover:bg-white/90"
                onClick={handleReply}
                disabled={!replyText.trim() || replyToStory.isPending}
              >
                {replyToStory.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Story list view
  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold">Stories</h2>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Add Story */}
        <div>
          <h3 className="mb-3 font-semibold">Your Story</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {/* Add Story Button */}
            <label
              htmlFor="story-upload"
              className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
            >
              <div className="relative">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-background">
                  {uploadingFile ? (
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
              <span className="text-xs">Add Story</span>
              <input
                id="story-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadingFile !== null}
              />
            </label>

            {/* User's existing stories */}
            {myStories.length > 0 &&
              myStories.map((story) => (
                <button
                  key={story.id}
                  onClick={() =>
                    handleStorySelect({
                      userId: user!.id,
                      username: 'You',
                      avatarUrl: user?.avatarUrl || null,
                      stories: myStories,
                      unseenCount: 0,
                    })
                  }
                  className="relative shrink-0"
                >
                  <Avatar className="w-16 h-16 ring-2 ring-gray-400">
                    <AvatarImage
                      src={
                        story.contentType === 'image'
                          ? story.contentUrl || undefined
                          : user?.avatarUrl || undefined
                      }
                    />
                    <AvatarFallback>
                      {story.contentType === 'text' ? '💬' : '📷'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs mt-1 block text-center">
                    {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
                  </span>
                </button>
              ))}
          </div>
        </div>

        {/* Recent Stories from Contacts */}
        {activeStories.length > 0 && (
          <div>
            <h3 className="mb-3 font-semibold">Recent</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {activeStories.map((storyGroup) => {
                const latestStory = storyGroup.stories[0];
                const hasUnseen = storyGroup.unseenCount > 0;

                return (
                  <button
                    key={storyGroup.userId}
                    onClick={() => handleStorySelect(storyGroup)}
                    className="relative rounded-lg overflow-hidden aspect-[9/16] group"
                  >
                    {latestStory.contentType === 'image' && latestStory.contentUrl ? (
                      <img
                        src={latestStory.contentUrl}
                        alt={storyGroup.username}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : latestStory.contentType === 'text' ? (
                      <div
                        className="w-full h-full flex items-center justify-center p-4"
                        style={{ backgroundColor: latestStory.backgroundColor || '#4F46E5' }}
                      >
                        <p className="text-white text-sm text-center line-clamp-3">
                          {latestStory.textContent}
                        </p>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />

                    <div className="absolute top-2 left-2">
                      <Avatar
                        className={`w-8 h-8 ring-2 ${
                          hasUnseen ? 'ring-blue-600' : 'ring-gray-400'
                        }`}
                      >
                        <AvatarImage src={storyGroup.avatarUrl || undefined} />
                        <AvatarFallback>
                          {storyGroup.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-sm font-medium truncate">{storyGroup.username}</p>
                      <p className="text-white/70 text-xs">
                        {formatDistanceToNow(new Date(latestStory.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    {hasUnseen && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {storyGroup.unseenCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {activeStories.length === 0 && myStories.length === 0 && (
          <div className="text-center py-12">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No stories yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to share a story with your contacts!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
