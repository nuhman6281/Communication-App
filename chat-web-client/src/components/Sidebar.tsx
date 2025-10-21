import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';
import {
  MessageSquare,
  Users,
  Phone,
  Settings,
  User,
  Bell,
  Search,
  PlusCircle,
  Briefcase,
  Video,
  Image as ImageIcon,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: any) => void;
  onNotificationsClick?: () => void;
  onCallHistoryClick?: () => void;
  onSearchClick?: () => void;
}

export function Sidebar({ currentView, onViewChange, onNotificationsClick, onCallHistoryClick, onSearchClick }: SidebarProps) {
  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'Chats', badge: 5 },
    { id: 'stories', icon: ImageIcon, label: 'Stories' },
    { id: 'workspace', icon: Briefcase, label: 'Workspaces' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <TooltipProvider>
      <div className="w-16 md:w-20 bg-slate-900 text-white flex flex-col items-center py-4 space-y-4">
        {/* Logo */}
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
          <MessageSquare className="w-6 h-6 md:w-7 md:h-7" />
        </div>

        {/* Search Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 hover:bg-white/10"
              onClick={onSearchClick}
            >
              <Search className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Search (Ctrl+K)</p>
          </TooltipContent>
        </Tooltip>

        {/* Notifications Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 relative hover:bg-white/10"
              onClick={onNotificationsClick}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                3
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Notifications</p>
          </TooltipContent>
        </Tooltip>

        {/* Call History Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 hover:bg-white/10"
              onClick={onCallHistoryClick}
            >
              <Phone className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Call History</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-8 h-px bg-white/20 my-2" />

        {/* Navigation Items */}
        <div className="flex-1 flex flex-col items-center space-y-2 w-full px-2">
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={currentView === item.id ? 'secondary' : 'ghost'}
                  size="icon"
                  className={`w-12 h-12 relative ${
                    currentView === item.id
                      ? 'bg-white/10 hover:bg-white/20'
                      : 'hover:bg-white/10'
                  }`}
                  onClick={() => onViewChange(item.id)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* User Avatar */}
        <Avatar className="w-10 h-10 cursor-pointer ring-2 ring-white/20 hover:ring-white/40 transition-all">
          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>

        {/* Status Indicator */}
        <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 -mt-2"></div>
      </div>
    </TooltipProvider>
  );
}