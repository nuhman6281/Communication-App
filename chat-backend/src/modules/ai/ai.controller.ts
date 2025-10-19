import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Generic AI chat completion' })
  @ApiResponse({ status: 200, description: 'Chat completion response' })
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
  @ApiOperation({ summary: 'Generate smart reply suggestions (Free Tier)' })
  @ApiResponse({ status: 200, description: 'Smart replies generated' })
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
  @ApiOperation({ summary: 'Enhance message with tone adjustment (Premium Tier)' })
  @ApiResponse({ status: 200, description: 'Message enhanced successfully' })
  async enhanceMessage(
    @CurrentUser('sub') userId: string,
    @Body() enhanceMessageDto: EnhanceMessageDto,
  ) {
    // TODO: Add premium tier check here
    const enhanced = await this.aiService.enhanceMessage(enhanceMessageDto);
    return {
      original: enhanceMessageDto.message,
      enhanced,
      tone: enhanceMessageDto.tone,
    };
  }

  @Post('translate')
  @ApiOperation({ summary: 'Translate message to target language (Free Tier)' })
  @ApiResponse({ status: 200, description: 'Message translated successfully' })
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
  @ApiOperation({ summary: 'Summarize text or conversation (Premium Tier)' })
  @ApiResponse({ status: 200, description: 'Text summarized successfully' })
  async summarize(
    @CurrentUser('sub') userId: string,
    @Body() summarizeDto: SummarizeDto,
  ) {
    // TODO: Add premium tier check here
    const summary = await this.aiService.summarize(summarizeDto);
    return {
      summary,
      type: summarizeDto.type,
      originalLength: summarizeDto.text.length,
      summaryLength: summary.length,
    };
  }

  @Post('moderate')
  @ApiOperation({ summary: 'Moderate content for spam/abuse' })
  @ApiResponse({ status: 200, description: 'Content moderation result' })
  async moderateContent(
    @CurrentUser('sub') userId: string,
    @Body('content') content: string,
  ) {
    const result = await this.aiService.moderateContent(content);
    return result;
  }
}
