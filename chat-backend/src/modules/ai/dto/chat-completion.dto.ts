import { IsString, IsOptional, IsArray, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AIModel {
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GPT_4 = 'gpt-4',
  GPT_4_TURBO = 'gpt-4-turbo-preview',
}

export enum MessageTone {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  FORMAL = 'formal',
  FRIENDLY = 'friendly',
}

export class ChatCompletionDto {
  @ApiProperty({ description: 'User prompt or message' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'AI model to use', enum: AIModel })
  @IsOptional()
  @IsEnum(AIModel)
  model?: AIModel = AIModel.GPT_3_5_TURBO;

  @ApiPropertyOptional({ description: 'Conversation context/history' })
  @IsOptional()
  @IsArray()
  context?: Array<{ role: string; content: string }>;

  @ApiPropertyOptional({ description: 'Temperature (0-2)', minimum: 0, maximum: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number = 0.7;

  @ApiPropertyOptional({ description: 'Maximum tokens to generate' })
  @IsOptional()
  @IsNumber()
  maxTokens?: number = 500;
}
