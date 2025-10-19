import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  async createWebhook(
    @CurrentUser('sub') userId: string,
    @Body() createWebhookDto: CreateWebhookDto,
  ) {
    return this.webhooksService.createWebhook(userId, createWebhookDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all webhooks' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved successfully' })
  async getWebhooks(@CurrentUser('sub') userId: string) {
    return this.webhooksService.getWebhooks(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook by ID' })
  @ApiResponse({ status: 200, description: 'Webhook retrieved successfully' })
  async getWebhook(
    @Param('id', ParseUUIDPipe) webhookId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.webhooksService.getWebhook(webhookId, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully' })
  async updateWebhook(
    @Param('id', ParseUUIDPipe) webhookId: string,
    @CurrentUser('sub') userId: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ) {
    return this.webhooksService.updateWebhook(webhookId, userId, updateWebhookDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully' })
  async deleteWebhook(
    @Param('id', ParseUUIDPipe) webhookId: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.webhooksService.deleteWebhook(webhookId, userId);
    return { message: 'Webhook deleted successfully' };
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get webhook logs' })
  @ApiResponse({ status: 200, description: 'Webhook logs retrieved successfully' })
  async getWebhookLogs(
    @Param('id', ParseUUIDPipe) webhookId: string,
    @CurrentUser('sub') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.webhooksService.getWebhookLogs(webhookId, userId, page, limit);
  }
}

