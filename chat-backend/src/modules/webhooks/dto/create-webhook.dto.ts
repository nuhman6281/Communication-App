import { IsString, IsUrl, IsArray, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookEvent } from '../entities/webhook.entity';

export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook URL', example: 'https://example.com/webhook' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Events to subscribe to', enum: WebhookEvent, isArray: true })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @ApiPropertyOptional({ description: 'Webhook description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Secret for HMAC signature' })
  @IsOptional()
  @IsString()
  secret?: string;
}
