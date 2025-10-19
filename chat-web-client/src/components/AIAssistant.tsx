import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import {
  Sparkles,
  Wand2,
  Languages,
  MessageSquare,
  FileText,
  Smile,
  Lightbulb,
  Crown,
} from 'lucide-react';

interface AIAssistantProps {
  message: string;
  onEnhance: (enhancedMessage: string) => void;
  isPremium?: boolean;
}

export function AIAssistant({ message, onEnhance, isPremium = false }: AIAssistantProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([
    "That sounds great!",
    "Let me check and get back to you",
    "Thanks for the update",
  ]);

  const enhanceMessage = async (style: 'professional' | 'casual' | 'formal' | 'concise') => {
    if (!isPremium && style !== 'concise') {
      // Show premium prompt
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const enhanced = `[${style}] ${message}`;
      onEnhance(enhanced);
      setIsLoading(false);
    }, 1000);
  };

  const translate = async (language: string) => {
    setIsLoading(true);
    setTimeout(() => {
      onEnhance(`[Translated to ${language}] ${message}`);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border-t border-border bg-muted/30">
      {/* AI Writing Assistant */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" disabled={!message.trim()}>
            <Wand2 className="w-4 h-4 mr-2" />
            Enhance
            {!isPremium && <Crown className="w-3 h-3 ml-1 text-amber-500" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <h4 className="text-sm mb-2">Enhance with AI</h4>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => enhanceMessage('professional')}
              disabled={isLoading || !isPremium}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Professional
              {!isPremium && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => enhanceMessage('casual')}
              disabled={isLoading || !isPremium}
            >
              <Smile className="w-4 h-4 mr-2" />
              Casual
              {!isPremium && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => enhanceMessage('formal')}
              disabled={isLoading || !isPremium}
            >
              <FileText className="w-4 h-4 mr-2" />
              Formal
              {!isPremium && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => enhanceMessage('concise')}
              disabled={isLoading}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Make Concise
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Translate */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" disabled={!message.trim()}>
            <Languages className="w-4 h-4 mr-2" />
            Translate
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="space-y-1">
            <h4 className="text-sm mb-2">Translate to</h4>
            {['Spanish', 'French', 'German', 'Japanese', 'Chinese'].map((lang) => (
              <Button
                key={lang}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => translate(lang)}
                disabled={isLoading}
              >
                {lang}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Smart Replies */}
      {smartReplies.length > 0 && !message.trim() && (
        <div className="flex-1 flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground flex items-center">
            <MessageSquare className="w-3 h-3 mr-1" />
            Quick replies:
          </span>
          {smartReplies.map((reply, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => onEnhance(reply)}
            >
              {reply}
            </Button>
          ))}
        </div>
      )}

      {!isPremium && (
        <div className="ml-auto">
          <Badge className="premium-gradient text-white">
            <Crown className="w-3 h-3 mr-1" />
            Upgrade for AI features
          </Badge>
        </div>
      )}
    </div>
  );
}
