import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatCompletionDto, AIModel, MessageTone } from './dto/chat-completion.dto';
import { EnhanceMessageDto } from './dto/enhance-message.dto';
import { TranslateMessageDto, Language } from './dto/translate-message.dto';
import { SmartReplyDto } from './dto/smart-reply.dto';
import { SummarizeDto, SummaryType } from './dto/summarize.dto';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

@Injectable()
export class AiService {
  private aiProvider: string;

  // OpenAI Configuration (commented out, kept for future use)
  // private openaiApiKey: string | undefined;
  // private openaiApiUrl = 'https://api.openai.com/v1/chat/completions';

  // Groq Configuration (FREE alternative)
  private groqApiKey: string | undefined;
  private groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(private configService: ConfigService) {
    this.aiProvider = this.configService.get<string>('AI_PROVIDER') || 'groq';

    // OpenAI setup (commented out)
    // this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    // if (!this.openaiApiKey) {
    //   console.warn('⚠️  OPENAI_API_KEY not configured. AI features will not work.');
    // }

    // Groq setup (active)
    this.groqApiKey = this.configService.get<string>('GROQ_API_KEY');

    if (this.aiProvider === 'groq') {
      if (!this.groqApiKey) {
        console.warn('⚠️  GROQ_API_KEY not configured. Get your free key at https://console.groq.com');
        console.warn('⚠️  AI features will not work until you add GROQ_API_KEY to .env file');
      } else {
        console.log('✅ Groq AI provider initialized (FREE tier)');
      }
    }
  }

  /**
   * Generic chat completion method
   */
  async chatCompletion(dto: ChatCompletionDto): Promise<string> {
    this.validateApiKey();

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant for a chat application.',
      },
      ...(dto.context || []).map((msg) => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: dto.prompt,
      },
    ];

    const response = await this.callOpenAI({
      model: dto.model,
      messages,
      temperature: dto.temperature,
      max_tokens: dto.maxTokens,
    });

    return response.choices[0].message.content;
  }

  /**
   * Generate smart replies for a message
   */
  async generateSmartReplies(dto: SmartReplyDto): Promise<string[]> {
    this.validateApiKey();

    const systemPrompt = `Generate ${dto.count} brief, natural, and contextually appropriate reply suggestions for the given message.
    Return ONLY the reply suggestions, one per line, without numbering or additional text.
    Keep each reply under 50 characters and make them diverse in tone and content.`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (dto.context) {
      messages.push({
        role: 'system',
        content: `Context: ${dto.context}`,
      });
    }

    messages.push({
      role: 'user',
      content: dto.message,
    });

    const response = await this.callOpenAI({
      model: AIModel.GPT_3_5_TURBO,
      messages,
      temperature: 0.8,
      max_tokens: 150,
    });

    const replies = response.choices[0].message.content
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .slice(0, dto.count);

    return replies;
  }

  /**
   * Enhance message with specified tone
   */
  async enhanceMessage(dto: EnhanceMessageDto): Promise<string> {
    this.validateApiKey();

    const toneInstructions = {
      [MessageTone.PROFESSIONAL]:
        'Rewrite the message in a professional, business-appropriate tone. Maintain clarity and formality.',
      [MessageTone.CASUAL]:
        'Rewrite the message in a casual, friendly, and relaxed tone. Make it conversational.',
      [MessageTone.FORMAL]:
        'Rewrite the message in a formal, polished tone suitable for official communication.',
      [MessageTone.FRIENDLY]:
        'Rewrite the message in a warm, friendly, and approachable tone.',
    };

    const systemPrompt = `${toneInstructions[dto.tone]}
    Return ONLY the rewritten message without any additional commentary or explanation.
    Keep the core meaning intact while adjusting the tone.`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (dto.context) {
      messages.push({
        role: 'system',
        content: `Context: ${dto.context}`,
      });
    }

    messages.push({
      role: 'user',
      content: dto.message,
    });

    const response = await this.callOpenAI({
      // NOTE: Using GPT-3.5-turbo for now (cost-effective, good accuracy)
      // TODO: Upgrade to GPT-4 for better quality when billing is set up
      // model: AIModel.GPT_4,  // Premium option - requires paid account
      model: AIModel.GPT_3_5_TURBO,  // Current: Good balance of cost and quality
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0].message.content.trim();
  }

  /**
   * Translate message to target language
   */
  async translateMessage(dto: TranslateMessageDto): Promise<{ translation: string; detectedLanguage: string }> {
    this.validateApiKey();

    const languageNames = {
      [Language.EN]: 'English',
      [Language.ES]: 'Spanish',
      [Language.FR]: 'French',
      [Language.DE]: 'German',
      [Language.IT]: 'Italian',
      [Language.PT]: 'Portuguese',
      [Language.RU]: 'Russian',
      [Language.ZH]: 'Chinese',
      [Language.JA]: 'Japanese',
      [Language.KO]: 'Korean',
      [Language.AR]: 'Arabic',
      [Language.HI]: 'Hindi',
    };

    const systemPrompt = `Translate the given text to ${languageNames[dto.targetLanguage]}.
    Return ONLY the translation without any additional text.
    Preserve formatting, emojis, and special characters.`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: dto.message },
    ];

    const response = await this.callOpenAI({
      model: AIModel.GPT_3_5_TURBO,
      messages,
      temperature: 0.3,
      max_tokens: 500,
    });

    // Simple language detection (could be enhanced with a dedicated service)
    const detectedLanguage = this.detectLanguage(dto.message);

    return {
      translation: response.choices[0].message.content.trim(),
      detectedLanguage,
    };
  }

  /**
   * Summarize text or conversation
   */
  async summarize(dto: SummarizeDto): Promise<string> {
    this.validateApiKey();

    const summaryInstructions = {
      [SummaryType.BRIEF]: 'Provide a brief, concise summary in 1-2 sentences.',
      [SummaryType.DETAILED]:
        'Provide a detailed summary covering all key points and important details.',
      [SummaryType.BULLET_POINTS]:
        'Provide a summary as a bulleted list of key points. Use bullet points (•).',
      [SummaryType.ACTION_ITEMS]:
        'Extract and list all action items, decisions, and next steps. Use bullet points (•).',
    };

    const summaryType = dto.type || SummaryType.BRIEF;
    const systemPrompt = `${summaryInstructions[summaryType]}
    ${dto.context ? `Context: ${dto.context}` : ''}`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: dto.text },
    ];

    const response = await this.callOpenAI({
      // NOTE: Using GPT-3.5-turbo for now (cost-effective, good accuracy)
      // TODO: Upgrade to GPT-4 for better quality when billing is set up
      // model: AIModel.GPT_4,  // Premium option - requires paid account
      model: AIModel.GPT_3_5_TURBO,  // Current: Good balance of cost and quality
      messages,
      temperature: 0.5,
      max_tokens: 500,
    });

    return response.choices[0].message.content.trim();
  }

  /**
   * Moderate content for spam/abuse
   */
  async moderateContent(content: string): Promise<{ flagged: boolean; categories: string[] }> {
    this.validateApiKey();

    try {
      // Use Groq AI for content moderation (OpenAI moderation API not available with Groq)
      const moderationPrompt = `Analyze the following content for harmful material.
Respond ONLY with a JSON object in this exact format:
{"flagged": true/false, "categories": ["category1", "category2"]}

Categories to check: hate, harassment, violence, self-harm, sexual, spam

Content to analyze: "${content}"

JSON response:`;

      const apiUrl = this.aiProvider === 'groq' ? this.groqApiUrl : this.groqApiUrl;
      const apiKey = this.aiProvider === 'groq' ? this.groqApiKey : this.groqApiKey;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a content moderation AI. Respond ONLY with valid JSON.',
            },
            {
              role: 'user',
              content: moderationPrompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`Moderation API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Parse AI response
      const jsonMatch = aiResponse.match(/\{.*\}/s);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          flagged: result.flagged || false,
          categories: result.categories || [],
        };
      }

      // Return safe default if parsing fails
      return { flagged: false, categories: [] };
    } catch (error) {
      console.error('Content moderation failed:', error);
      // Return safe default if moderation fails
      return { flagged: false, categories: [] };
    }
  }

  /**
   * Call AI API (supports both OpenAI and Groq)
   */
  private async callOpenAI(payload: any): Promise<OpenAIResponse> {
    try {
      // Determine which API to use
      let apiUrl: string;
      let apiKey: string | undefined;

      if (this.aiProvider === 'groq') {
        apiUrl = this.groqApiUrl;
        apiKey = this.groqApiKey;

        // Groq uses Llama models, map OpenAI models to Groq equivalents
        if (payload.model === 'gpt-3.5-turbo' || payload.model === 'gpt-4') {
          payload.model = 'llama-3.3-70b-versatile'; // Groq's best free model (updated model)
        }
      } else {
        // OpenAI (commented out for now)
        throw new BadRequestException(
          'OpenAI provider is currently disabled. Using Groq (free) instead. Change AI_PROVIDER=groq in .env if not already set.'
        );
        // apiUrl = this.openaiApiUrl;
        // apiKey = this.openaiApiKey;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error?.message || response.statusText;
        const errorType = error.error?.type;
        const errorCode = error.error?.code;

        console.error('OpenAI API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          type: errorType,
          code: errorCode,
        });

        // Provide user-friendly error messages based on provider
        if (this.aiProvider === 'groq') {
          if (errorCode === 'invalid_api_key' || response.status === 401) {
            throw new BadRequestException(
              'Invalid Groq API key. Please check GROQ_API_KEY in .env file. Get a free key at https://console.groq.com'
            );
          }

          if (errorCode === 'rate_limit_exceeded' || response.status === 429) {
            throw new BadRequestException(
              'Groq rate limit exceeded (30 requests/minute on free tier). Please wait a minute and try again.'
            );
          }

          throw new BadRequestException(`Groq AI error: ${errorMessage}`);
        } else {
          // OpenAI error messages (kept for when switching back)
          if (errorCode === 'insufficient_quota') {
            throw new BadRequestException(
              'OpenAI API quota exceeded. Please add credits at https://platform.openai.com/settings/organization/billing'
            );
          }

          if (errorCode === 'invalid_api_key') {
            throw new BadRequestException('Invalid OpenAI API key. Please check your configuration.');
          }

          throw new Error(`OpenAI API error: ${errorMessage}`);
        }
      }

      return await response.json();
    } catch (error) {
      console.error(`${this.aiProvider.toUpperCase()} API call failed:`, error);

      // Provide more specific error messages
      if (error.message && (error.message.includes('API error') || error.message.includes('AI error'))) {
        throw new BadRequestException(error.message);
      }

      if (this.aiProvider === 'groq') {
        throw new BadRequestException(
          'Groq AI service temporarily unavailable. Please check your GROQ_API_KEY in .env and try again. Get a free key at https://console.groq.com'
        );
      } else {
        throw new BadRequestException(
          'AI service currently unavailable. Please check the API configuration and try again.'
        );
      }
    }
  }

  /**
   * Simple language detection
   */
  private detectLanguage(text: string): string {
    // Simple heuristic-based detection
    // In production, use a proper language detection library
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const hasCyrillic = /[\u0400-\u04FF]/.test(text);
    const hasCJK = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(text);

    if (hasArabic) return 'ar';
    if (hasCyrillic) return 'ru';
    if (hasCJK) {
      // Simplified detection
      if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
      if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
      return 'zh';
    }

    return 'en'; // Default to English
  }

  /**
   * Validate API key exists
   */
  private validateApiKey(): void {
    if (this.aiProvider === 'groq') {
      if (!this.groqApiKey || this.groqApiKey === 'your-groq-api-key-here') {
        throw new BadRequestException(
          'Groq API key not configured. Get your FREE API key at https://console.groq.com and add it to .env as GROQ_API_KEY',
        );
      }
    } else {
      // OpenAI validation (commented out)
      throw new BadRequestException(
        'OpenAI provider is disabled. Please use Groq (free) by setting AI_PROVIDER=groq in .env',
      );
      // if (!this.openaiApiKey) {
      //   throw new BadRequestException(
      //     'OpenAI API key not configured. Please contact administrator.',
      //   );
      // }
    }
  }
}
