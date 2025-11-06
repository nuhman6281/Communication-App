import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { soundService } from '@/lib/audio/sound.service';

interface SoundToggleProps {
  variant?: 'icon' | 'button';
  className?: string;
}

/**
 * SoundToggle Component
 *
 * Allows users to mute/unmute notification sounds.
 * Can be displayed as an icon button or full button with text.
 */
export function SoundToggle({ variant = 'icon', className }: SoundToggleProps) {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Initialize mute state from sound service
    setIsMuted(soundService.isSoundMuted());
  }, []);

  const handleToggle = () => {
    const newMutedState = soundService.toggleMute();
    setIsMuted(newMutedState);
  };

  if (variant === 'icon') {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggle}
              className={className}
              aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{isMuted ? 'Unmute notification sounds' : 'Mute notification sounds'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleToggle}
      className={className}
    >
      {isMuted ? (
        <>
          <VolumeX className="w-4 h-4 mr-2" />
          Unmute Sounds
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 mr-2" />
          Mute Sounds
        </>
      )}
    </Button>
  );
}
