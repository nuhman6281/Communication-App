import { cn } from '@/lib/utils';
import type { PresenceStatus } from '@/types/entities.types';

interface UserStatusBadgeProps {
  status: PresenceStatus;
  size?: 'sm' | 'md' | 'lg';
  showBorder?: boolean;
  className?: string;
}

export function UserStatusBadge({
  status,
  size = 'md',
  showBorder = true,
  className,
}: UserStatusBadgeProps) {
  // Don't show badge for offline users
  if (status === 'offline') {
    return null;
  }

  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-400',
    do_not_disturb: 'bg-red-500',
    offline: 'bg-gray-400',
  };

  const borderWidth = {
    sm: 'ring-[1.5px]',
    md: 'ring-2',
    lg: 'ring-2',
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        sizeClasses[size],
        statusColors[status],
        showBorder && borderWidth[size],
        showBorder && 'ring-white dark:ring-gray-900',
        'shadow-sm',
        className
      )}
      aria-label={`Status: ${status.replace('_', ' ')}`}
      title={`Status: ${status.replace('_', ' ')}`}
    />
  );
}
