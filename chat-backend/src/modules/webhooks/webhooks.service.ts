import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook, WebhookEvent } from './entities/webhook.entity';
import { WebhookLog } from './entities/webhook-log.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookLog)
    private webhookLogRepository: Repository<WebhookLog>,
  ) {}

  /**
   * Create a new webhook
   */
  async createWebhook(userId: string, createWebhookDto: CreateWebhookDto): Promise<Webhook> {
    const webhook = this.webhookRepository.create({
      userId,
      ...createWebhookDto,
      secret: createWebhookDto.secret || this.generateSecret(),
    });

    return this.webhookRepository.save(webhook);
  }

  /**
   * Get all webhooks for a user
   */
  async getWebhooks(userId: string): Promise<Webhook[]> {
    return this.webhookRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get webhook by ID
   */
  async getWebhook(webhookId: string, userId: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    if (webhook.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return webhook;
  }

  /**
   * Update webhook
   */
  async updateWebhook(
    webhookId: string,
    userId: string,
    updateWebhookDto: UpdateWebhookDto,
  ): Promise<Webhook> {
    const webhook = await this.getWebhook(webhookId, userId);

    Object.assign(webhook, updateWebhookDto);
    return this.webhookRepository.save(webhook);
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string, userId: string): Promise<void> {
    const webhook = await this.getWebhook(webhookId, userId);
    await this.webhookRepository.remove(webhook);
  }

  /**
   * Get webhook logs
   */
  async getWebhookLogs(
    webhookId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ logs: WebhookLog[]; total: number }> {
    await this.getWebhook(webhookId, userId); // Verify access

    const [logs, total] = await this.webhookLogRepository
      .createQueryBuilder('log')
      .where('log.webhookId = :webhookId', { webhookId })
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { logs, total };
  }

  /**
   * Trigger webhook (internal use)
   */
  async triggerWebhook(event: WebhookEvent, payload: any): Promise<void> {
    const webhooks = await this.webhookRepository.find({
      where: { isActive: true },
    });

    const relevantWebhooks = webhooks.filter((webhook) =>
      webhook.events.includes(event),
    );

    // Trigger all relevant webhooks asynchronously
    for (const webhook of relevantWebhooks) {
      this.sendWebhook(webhook, event, payload).catch((error) => {
        console.error(`Failed to trigger webhook ${webhook.id}:`, error);
      });
    }
  }

  /**
   * Send webhook HTTP request
   */
  private async sendWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    payload: any,
  ): Promise<void> {
    const webhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    const signature = this.generateSignature(webhookPayload, webhook.secret);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
        },
        body: JSON.stringify(webhookPayload),
      });

      const responseText = await response.text();

      // Log webhook execution
      await this.webhookLogRepository.save({
        webhookId: webhook.id,
        event,
        payload: webhookPayload,
        statusCode: response.status,
        response: responseText,
        success: response.ok,
      });

      // Update webhook status
      webhook.lastTriggeredAt = new Date();
      if (response.ok) {
        webhook.failureCount = 0;
      } else {
        webhook.failureCount += 1;
        if (webhook.failureCount >= 5) {
          webhook.isActive = false; // Disable after 5 failures
        }
      }
      await this.webhookRepository.save(webhook);
    } catch (error) {
      // Log error
      await this.webhookLogRepository.save({
        webhookId: webhook.id,
        event,
        payload: webhookPayload,
        statusCode: 0,
        success: false,
        error: error.message,
      });

      // Update failure count
      webhook.failureCount += 1;
      if (webhook.failureCount >= 5) {
        webhook.isActive = false;
      }
      await this.webhookRepository.save(webhook);
    }
  }

  /**
   * Generate HMAC signature
   */
  private generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Generate random secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

