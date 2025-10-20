/**
 * Webhooks API Service
 * Handles webhook management for integrations and automation
 */

import { apiClient } from '../client';
import type { PaginationParams } from '@/types/api.types';
import type { PaginatedResponse } from '@/types/entities.types';

export type WebhookEvent =
  | 'message.created'
  | 'message.updated'
  | 'message.deleted'
  | 'conversation.created'
  | 'conversation.updated'
  | 'user.joined'
  | 'user.left'
  | 'call.started'
  | 'call.ended'
  | 'file.uploaded'
  | 'reaction.added'
  | 'member.added'
  | 'member.removed';

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt: string | null;
  failureCount: number;
  metadata: Record<string, unknown> | null;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  responseStatus: number | null;
  responseBody: string | null;
  success: boolean;
  attempt: number;
  createdAt: string;
  deliveredAt: string | null;
  error: string | null;
}

export const webhooksApi = {
  /**
   * Get all webhooks
   */
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Webhook>> => {
    const response = await apiClient.get('/webhooks', { params });
    return response.data;
  },

  /**
   * Get webhook by ID
   */
  getById: async (id: string): Promise<Webhook> => {
    const response = await apiClient.get(`/webhooks/${id}`);
    return response.data;
  },

  /**
   * Create new webhook
   */
  create: async (data: {
    url: string;
    events: WebhookEvent[];
    description?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Webhook> => {
    const response = await apiClient.post('/webhooks', data);
    return response.data;
  },

  /**
   * Update webhook
   */
  update: async (
    id: string,
    data: {
      url?: string;
      events?: WebhookEvent[];
      description?: string;
      isActive?: boolean;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Webhook> => {
    const response = await apiClient.patch(`/webhooks/${id}`, data);
    return response.data;
  },

  /**
   * Delete webhook
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/webhooks/${id}`);
  },

  /**
   * Enable webhook
   */
  enable: async (id: string): Promise<Webhook> => {
    const response = await apiClient.post(`/webhooks/${id}/enable`);
    return response.data;
  },

  /**
   * Disable webhook
   */
  disable: async (id: string): Promise<Webhook> => {
    const response = await apiClient.post(`/webhooks/${id}/disable`);
    return response.data;
  },

  /**
   * Test webhook (send test event)
   */
  test: async (id: string): Promise<{
    success: boolean;
    statusCode: number;
    responseBody: string;
    latency: number;
  }> => {
    const response = await apiClient.post(`/webhooks/${id}/test`);
    return response.data;
  },

  /**
   * Regenerate webhook secret
   */
  regenerateSecret: async (id: string): Promise<{ secret: string }> => {
    const response = await apiClient.post(`/webhooks/${id}/regenerate-secret`);
    return response.data;
  },

  /**
   * Get webhook deliveries/logs
   */
  getDeliveries: async (
    id: string,
    params?: PaginationParams & { success?: boolean; event?: WebhookEvent }
  ): Promise<PaginatedResponse<WebhookDelivery>> => {
    const response = await apiClient.get(`/webhooks/${id}/deliveries`, { params });
    return response.data;
  },

  /**
   * Get specific delivery details
   */
  getDeliveryById: async (webhookId: string, deliveryId: string): Promise<WebhookDelivery> => {
    const response = await apiClient.get(`/webhooks/${webhookId}/deliveries/${deliveryId}`);
    return response.data;
  },

  /**
   * Retry failed delivery
   */
  retryDelivery: async (webhookId: string, deliveryId: string): Promise<{
    success: boolean;
    statusCode: number;
    responseBody: string;
  }> => {
    const response = await apiClient.post(`/webhooks/${webhookId}/deliveries/${deliveryId}/retry`);
    return response.data;
  },

  /**
   * Get webhook statistics
   */
  getStats: async (id: string): Promise<{
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
    averageLatency: number;
    lastDelivery: string | null;
    deliveriesByEvent: Record<WebhookEvent, number>;
    deliveriesByDay: Array<{ date: string; count: number; success: number; failed: number }>;
  }> => {
    const response = await apiClient.get(`/webhooks/${id}/stats`);
    return response.data;
  },

  /**
   * Get available webhook events
   */
  getAvailableEvents: async (): Promise<Array<{
    event: WebhookEvent;
    description: string;
    payloadSchema: Record<string, unknown>;
  }>> => {
    const response = await apiClient.get('/webhooks/events');
    return response.data;
  },

  /**
   * Verify webhook signature
   */
  verifySignature: async (
    payload: string,
    signature: string,
    secret: string
  ): Promise<{ valid: boolean }> => {
    const response = await apiClient.post('/webhooks/verify-signature', {
      payload,
      signature,
      secret,
    });
    return response.data;
  },

  /**
   * Get webhook usage limits
   */
  getLimits: async (): Promise<{
    maxWebhooks: number;
    currentWebhooks: number;
    maxDeliveriesPerDay: number;
    deliveriesToday: number;
    resetAt: string;
  }> => {
    const response = await apiClient.get('/webhooks/limits');
    return response.data;
  },
};
