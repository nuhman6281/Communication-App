import { Image, Play } from 'lucide-react';

interface StoryReplyMessageProps {
  message: {
    content?: string;
    metadata?: {
      storyReply?: boolean;
      storyId?: string;
      storyType?: 'text' | 'image' | 'video';
      storyMediaUrl?: string;
      storyContent?: string;
    };
  };
}

export function StoryReplyMessage({ message }: StoryReplyMessageProps) {
  const metadata = message.metadata;

  if (!metadata?.storyReply) {
    return null;
  }

  const { storyType, storyMediaUrl, storyContent } = metadata;

  return (
    <div className="flex flex-col gap-2">
      {/* Story Preview Card */}
      <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Story Thumbnail */}
        <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
          {storyType === 'image' && storyMediaUrl ? (
            <img
              src={storyMediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          ) : storyType === 'video' && storyMediaUrl ? (
            <>
              <img
                src={storyMediaUrl}
                alt="Story"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-4 h-4 text-white" fill="white" />
              </div>
            </>
          ) : storyType === 'text' ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-1">
              <p className="text-white text-[8px] text-center line-clamp-3">{storyContent}</p>
            </div>
          ) : (
            <Image className="w-6 h-6 text-gray-400 mx-auto my-5" />
          )}
        </div>

        {/* Story Label */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">Replied to your story</p>
          {storyType === 'text' && (
            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{storyContent}</p>
          )}
        </div>
      </div>

      {/* Reply Message */}
      <div className="text-sm">{message.content}</div>
    </div>
  );
}
