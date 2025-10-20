import React, { useState } from 'react';
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
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useEnhanceMessage, useTranslate, useSmartReplies, useSubscription, useRefreshProfile } from '@/hooks';
import { AIFeature } from '@/lib/utils/subscription';
import { toast } from 'sonner';
import type { ToneType, TranslationLanguage } from '@/lib/api/endpoints';

interface AIAssistantProps {
  message: string;
  onEnhance: (enhancedMessage: string) => void;
  lastReceivedMessage?: string; // For smart replies context
}

export function AIAssistant({ message, onEnhance, lastReceivedMessage }: AIAssistantProps) {
  const subscription = useSubscription();
  const { refresh: refreshProfile, isRefreshing } = useRefreshProfile();
  const enhanceMutation = useEnhanceMessage();
  const translateMutation = useTranslate();

  // Smart replies for the last received message (not current message being composed)
  const { data: smartRepliesData } = useSmartReplies(
    lastReceivedMessage || '',
    undefined // context
  );

  const smartReplies = smartRepliesData?.replies || [];
  const isLoading = enhanceMutation.isPending || translateMutation.isPending;

  // Check feature access
  const hasEnhancement = subscription.hasAccess(AIFeature.MESSAGE_ENHANCEMENT);
  const hasTranslation = subscription.hasAccess(AIFeature.BASIC_TRANSLATION);
  const hasSmartReplies = subscription.hasAccess(AIFeature.SMART_REPLIES);

  const enhanceMessage = async (tone: ToneType) => {
    // Check premium for restricted tones
    if (!hasEnhancement && (tone === 'professional' || tone === 'casual' || tone === 'formal')) {
      toast.error('Premium feature. Please upgrade to use tone enhancement.');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message to enhance');
      return;
    }

    try {
      const result = await enhanceMutation.mutateAsync({ content: message, tone });
      onEnhance(result.enhanced);
    } catch (error: any) {
      console.error('Enhancement failed:', error);
      // Error toast is handled by mutation meta
    }
  };

  const translate = async (language: TranslationLanguage) => {
    if (!message.trim()) {
      toast.error('Please enter a message to translate');
      return;
    }

    try {
      const result = await translateMutation.mutateAsync({
        content: message,
        targetLanguage: language,
      });
      onEnhance(result.translation);
    } catch (error: any) {
      console.error('Translation failed:', error);
      // Error toast is handled by mutation meta
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border-t border-border bg-muted/30">
      {/* AI Writing Assistant */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" disabled={!message.trim() || isLoading}>
            <Wand2 className="w-4 h-4 mr-2" />
            {isLoading ? 'Enhancing...' : 'Enhance'}
            {!subscription.hasPremiumFeatures && <Crown className="w-3 h-3 ml-1 text-amber-500" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <h4 className="text-sm mb-2 font-medium">Enhance with AI</h4>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => enhanceMessage('professional')}
              disabled={isLoading || !hasEnhancement}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Professional
              {!hasEnhancement && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => enhanceMessage('casual')}
              disabled={isLoading || !hasEnhancement}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Smile className="w-4 h-4 mr-2" />}
              Casual
              {!hasEnhancement && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => enhanceMessage('formal')}
              disabled={isLoading || !hasEnhancement}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Formal
              {!hasEnhancement && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => enhanceMessage('friendly')}
              disabled={isLoading || !hasEnhancement}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-2" />}
              Friendly
              {!hasEnhancement && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Translate */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" disabled={!message.trim() || isLoading}>
            <Languages className="w-4 w-4 mr-2" />
            {isLoading ? 'Translating...' : 'Translate'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="space-y-1">
            <h4 className="text-sm mb-2">Translate to</h4>
            {[
              { label: 'Spanish', code: 'es' as TranslationLanguage },
              { label: 'French', code: 'fr' as TranslationLanguage },
              { label: 'German', code: 'de' as TranslationLanguage },
              { label: 'Japanese', code: 'ja' as TranslationLanguage },
              { label: 'Chinese', code: 'zh' as TranslationLanguage },
            ].map(({ label, code }) => (
              <Button
                key={code}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => translate(code)}
                disabled={isLoading}
              >
                {label}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Smart Replies */}
      {smartReplies.length > 0 && !message.trim() && hasSmartReplies && (
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

      {/* Subscription Status & Refresh */}
      <div className="ml-auto flex items-center gap-2">
        {/* Current Tier Badge */}
        <Badge variant="outline" className="text-xs">
          {subscription.tierName}
        </Badge>

        {/* Refresh Profile Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshProfile}
          disabled={isRefreshing}
          className="h-7 px-2"
          title="Refresh subscription status"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>

        {/* Upgrade Badge - Only show for users without premium features */}
        {!subscription.hasPremiumFeatures && (
          <Badge className="premium-gradient text-white">
            <Crown className="w-3 h-3 mr-1" />
            Upgrade to Premium for more AI features
          </Badge>
        )}
      </div>
    </div>
  );
}
