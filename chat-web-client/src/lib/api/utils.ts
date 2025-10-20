/**
 * API Utilities
 * Shared helper functions for API transformations
 */

import type { PaginatedResponse } from '@/types/entities.types';

/**
 * Transform backend pagination response to frontend PaginatedResponse type
 *
 * Backend structure:
 * { items/messages/conversations: [...], pagination: { page, limit, total, totalPages } }
 *
 * Frontend structure:
 * { items: [...], currentPage, limit, total, totalPages }
 */
export function transformPaginatedResponse<T>(data: any, itemsKey: string = 'items'): PaginatedResponse<T> {
  const items = data[itemsKey] || data.items || [];
  const pagination = data.pagination || {};

  return {
    items,
    total: pagination.total || data.total || 0,
    currentPage: pagination.page || data.page || 1,
    limit: pagination.limit || data.limit || 50,
    totalPages: pagination.totalPages || data.totalPages || 1,
  };
}
