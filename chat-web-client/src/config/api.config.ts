/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  wsURL: import.meta.env.VITE_WS_URL || 'http://localhost:3001',
  storageURL: import.meta.env.VITE_STORAGE_URL || 'http://localhost:9000/chatapp-media',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'ChatApp',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  maxFileSize: Number(import.meta.env.VITE_MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
  maxVideoSize: Number(import.meta.env.VITE_MAX_VIDEO_SIZE) || 100 * 1024 * 1024, // 100MB
} as const;

export const FEATURE_FLAGS = {
  e2eEncryption: import.meta.env.VITE_ENABLE_E2E_ENCRYPTION === 'true',
  videoCalls: import.meta.env.VITE_ENABLE_VIDEO_CALLS !== 'false',
  stories: import.meta.env.VITE_ENABLE_STORIES !== 'false',
  aiFeatures: import.meta.env.VITE_ENABLE_AI_FEATURES !== 'false',
} as const;
