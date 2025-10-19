import { useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { ArrowLeft, Plus, X, Send, MoreVertical } from 'lucide-react';
import { Input } from './ui/input';

interface StoriesViewProps {
  onBack: () => void;
}

const mockStories = [
  {
    id: '1',
    user: 'You',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
    stories: [],
    hasNew: false,
  },
  {
    id: '2',
    user: 'Sarah Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    stories: [
      { id: 's1', type: 'image', content: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400', timestamp: '2h ago' },
      { id: 's2', type: 'text', content: 'Great day at the beach! 🏖️', bg: '#4F46E5', timestamp: '1h ago' },
    ],
    hasNew: true,
  },
  {
    id: '3',
    user: 'Michael Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    stories: [
      { id: 's3', type: 'image', content: 'https://images.unsplash.com/photo-1682687221038-404670fc746f?w=400', timestamp: '4h ago' },
    ],
    hasNew: true,
  },
  {
    id: '4',
    user: 'Emma Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    stories: [
      { id: 's4', type: 'image', content: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=400', timestamp: '6h ago' },
    ],
    hasNew: false,
  },
];

export function StoriesView({ onBack }: StoriesViewProps) {
  const [selectedUser, setSelectedUser] = useState<typeof mockStories[1] | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleStorySelect = (user: typeof mockStories[1]) => {
    if (user.stories.length > 0) {
      setSelectedUser(user);
      setCurrentStoryIndex(0);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (selectedUser && currentStoryIndex < selectedUser.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      setSelectedUser(null);
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    }
  };

  if (selectedUser) {
    const currentStory = selectedUser.stories[currentStoryIndex];

    return (
      <div className="h-full bg-black text-white relative">
        {/* Story Progress Bars */}
        <div className="absolute top-0 left-0 right-0 p-2 z-20 flex gap-1">
          {selectedUser.stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-4 left-0 right-0 px-4 pt-3 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-10 h-10 ring-2 ring-white">
              <AvatarImage src={selectedUser.avatar} />
              <AvatarFallback>{selectedUser.user.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm">{selectedUser.user}</p>
              <p className="text-xs text-white/70">{currentStory.timestamp}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <MoreVertical className="w-5 h-5" />
            </Button>
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
          {currentStory.type === 'image' ? (
            <img
              src={currentStory.content}
              alt="Story"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center p-8"
              style={{ backgroundColor: currentStory.bg }}
            >
              <p className="text-3xl text-center">{currentStory.content}</p>
            </div>
          )}
        </div>

        {/* Navigation Areas */}
        <button
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          onClick={handlePrevious}
        />
        <button
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
          onClick={handleNext}
        />

        {/* Reply Input */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
          <div className="flex gap-2">
            <Input
              placeholder="Reply to story..."
              className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
            />
            <Button size="icon" className="bg-white text-black hover:bg-white/90">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl">Stories</h2>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Add Story */}
        <div>
          <h3 className="mb-3">Your Story</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            <button className="flex flex-col items-center gap-2 shrink-0">
              <div className="relative">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=You" />
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-background">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              </div>
              <span className="text-xs">Add Story</span>
            </button>
          </div>
        </div>

        {/* Recent Stories */}
        <div>
          <h3 className="mb-3">Recent</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {mockStories
              .filter((user) => user.id !== '1' && user.stories.length > 0)
              .map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleStorySelect(user)}
                  className="relative rounded-lg overflow-hidden aspect-[9/16] group"
                >
                  {user.stories[0].type === 'image' ? (
                    <img
                      src={user.stories[0].content}
                      alt={user.user}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center p-4"
                      style={{ backgroundColor: user.stories[0].bg }}
                    >
                      <p className="text-white text-sm text-center line-clamp-3">
                        {user.stories[0].content}
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />
                  <div className="absolute top-2 left-2">
                    <Avatar
                      className={`w-8 h-8 ring-2 ${
                        user.hasNew ? 'ring-blue-600' : 'ring-gray-400'
                      }`}
                    >
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.user.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-sm truncate">{user.user}</p>
                    <p className="text-white/70 text-xs">{user.stories[0].timestamp}</p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
