import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PremiumGuard } from '@common/guards/premium.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { ChatCompletionDto } from './dto/chat-completion.dto';
import { EnhanceMessageDto } from './dto/enhance-message.dto';
import { TranslateMessageDto } from './dto/translate-message.dto';
import { SmartReplyDto } from './dto/smart-reply.dto';
import { SummarizeDto } from './dto/summarize.dto';

@ApiTags('AI Features')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard, PremiumGuard) // All AI features require Premium subscription
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Generic AI chat completion (Premium Only)' })
  @ApiResponse({ status: 200, description: 'Chat completion response' })
  @ApiResponse({ status: 403, description: 'Premium subscription required' })
  async chatCompletion(
    @CurrentUser('sub') userId: string,
    @Body() chatCompletionDto: ChatCompletionDto,
  ) {
    const response = await this.aiService.chatCompletion(chatCompletionDto);
    return {
      response,
      model: chatCompletionDto.model,
    };
  }

  @Post('smart-replies')
  @ApiOperation({ summary: 'Generate smart reply suggestions (Premium Only)' })
  @ApiResponse({ status: 200, description: 'Smart replies generated' })
  @ApiResponse({ status: 403, description: 'Premium subscription required' })
  async generateSmartReplies(
    @CurrentUser('sub') userId: string,
    @Body() smartReplyDto: SmartReplyDto,
  ) {
    const replies = await this.aiService.generateSmartReplies(smartReplyDto);
    return {
      replies,
      count: replies.length,
    };
  }

  @Post('enhance')
  @ApiOperation({ summary: 'Enhance message with tone adjustment (Premium Only)' })
  @ApiResponse({ status: 200, description: 'Message enhanced successfully' })
  @ApiResponse({ status: 403, description: 'Premium subscription required' })
  async enhanceMessage(
    @CurrentUser('sub') userId: string,
    @Body() enhanceMessageDto: EnhanceMessageDto,
  ) {
    const enhanced = await this.aiService.enhanceMessage(enhanceMessageDto);
    return {
      original: enhanceMessageDto.message,
      enhanced,
      tone: enhanceMessageDto.tone,
    };
  }

  @Post('translate')
  @ApiOperation({ summary: 'Translate message to target language (Premium Only)' })
  @ApiResponse({ status: 200, description: 'Message translated successfully' })
  @ApiResponse({ status: 403, description: 'Premium subscription required' })
  async translateMessage(
    @CurrentUser('sub') userId: string,
    @Body() translateMessageDto: TranslateMessageDto,
  ) {
    const result = await this.aiService.translateMessage(translateMessageDto);
    return {
      original: translateMessageDto.message,
      translation: result.translation,
      targetLanguage: translateMessageDto.targetLanguage,
      detectedLanguage: result.detectedLanguage,
    };
  }

  @Post('summarize')
  @ApiOperation({ summary: 'Summarize text or conversation (Premium Only)' })
  @ApiResponse({ status: 200, description: 'Text summarized successfully' })
  @ApiResponse({ status: 403, description: 'Premium subscription required' })
  async summarize(
    @CurrentUser('sub') userId: string,
    @Body() summarizeDto: SummarizeDto,
  ) {
    const summary = await this.aiService.summarize(summarizeDto);
    return {
      summary,
      type: summarizeDto.type,
      originalLength: summarizeDto.text.length,
      summaryLength: summary.length,
    };
  }

  @Post('moderate')
  @ApiOperation({ summary: 'Moderate content for spam/abuse (Premium Only)' })
  @ApiResponse({ status: 200, description: 'Content moderation result' })
  @ApiResponse({ status: 403, description: 'Premium subscription required' })
  async moderateContent(
    @CurrentUser('sub') userId: string,
    @Body('content') content: string,
  ) {
    const result = await this.aiService.moderateContent(content);
    return result;
  }
}
