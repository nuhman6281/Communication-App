/**
 * Push Notification Service
 * Handles Web Push API integration, service worker registration, and push subscriptions
 */

import { notificationsApi } from '../api/endpoints/notifications.api';

// VAPID public key for push notifications
// Generate with: npx web-push generate-vapid-keys
// Replace with your own key in production
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib27SBgz0ssW95r7lCk9I_6YbHYUDiPrfSjYX0R3NvLqcZX8LJQ1CZTG9IQ';

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class PushNotificationService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;

  /**
   * Initialize push notifications
   * Registers service worker and requests notification permission
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('[Push] Service workers not supported');
        return false;
      }

      // Check if push notifications are supported
      if (!('PushManager' in window)) {
        console.warn('[Push] Push notifications not supported');
        return false;
      }

      // Register service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register(
        '/service-worker.js',
        { scope: '/' }
      );

      console.log('[Push] Service worker registered:', this.serviceWorkerRegistration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Check current permission
      const permission = Notification.permission;
      console.log('[Push] Current permission:', permission);

      if (permission === 'granted') {
        // Subscribe to push notifications
        await this.subscribeToPush();
        return true;
      } else if (permission === 'default') {
        // Will request permission when user triggers notification action
        return true;
      } else {
        // Permission denied
        console.warn('[Push] Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('[Push] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    try {
      if (!('Notification' in window)) {
        console.warn('[Push] Notifications not supported');
        return 'denied';
      }

      const permission = await Notification.requestPermission();
      console.log('[Push] Permission result:', permission);

      if (permission === 'granted') {
        // Subscribe to push notifications
        await this.subscribeToPush();
      }

      return permission;
    } catch (error) {
      console.error('[Push] Permission request failed:', error);
      return 'denied';
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      if (!this.serviceWorkerRegistration) {
        console.warn('[Push] Service worker not registered');
        return null;
      }

      // Check if already subscribed
      const existingSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('[Push] Already subscribed:', existingSubscription);
        this.pushSubscription = existingSubscription;

        // Send to backend
        await this.sendSubscriptionToBackend(existingSubscription);
        return existingSubscription;
      }

      // Convert VAPID key to Uint8Array
      const convertedVapidKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      // Subscribe to push notifications
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log('[Push] Push subscription created:', subscription);
      this.pushSubscription = subscription;

      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscription);

      return subscription;
    } catch (error) {
      console.error('[Push] Subscription failed:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.pushSubscription) {
        const subscription = await this.serviceWorkerRegistration?.pushManager.getSubscription();
        if (!subscription) {
          console.warn('[Push] No active subscription');
          return true;
        }
        this.pushSubscription = subscription;
      }

      // Unsubscribe from push manager
      const success = await this.pushSubscription.unsubscribe();
      console.log('[Push] Unsubscribed:', success);

      if (success) {
        // Remove from backend
        await notificationsApi.disablePush();
        this.pushSubscription = null;
      }

      return success;
    } catch (error) {
      console.error('[Push] Unsubscribe failed:', error);
      return false;
    }
  }

  /**
   * Get current subscription status
   */
  async getSubscription(): Promise<PushSubscription | null> {
    try {
      if (!this.serviceWorkerRegistration) {
        return null;
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      this.pushSubscription = subscription;
      return subscription;
    } catch (error) {
      console.error('[Push] Get subscription failed:', error);
      return null;
    }
  }

  /**
   * Check if push notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
    const permission = Notification.permission;
    const subscription = await this.getSubscription();
    return permission === 'granted' && subscription !== null;
  }

  /**
   * Show local notification (without push)
   */
  async showNotification(options: PushNotificationOptions): Promise<void> {
    try {
      if (!this.serviceWorkerRegistration) {
        console.warn('[Push] Service worker not registered');

        // Fallback to browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(options.title, {
            body: options.body,
            icon: options.icon,
            badge: options.badge,
            tag: options.tag,
            data: options.data,
            requireInteraction: options.requireInteraction,
          });
        }
        return;
      }

      // Show notification via service worker
      await this.serviceWorkerRegistration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/logo.png',
        badge: options.badge || '/badge.png',
        tag: options.tag || 'default',
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        actions: options.actions,
      });
    } catch (error) {
      console.error('[Push] Show notification failed:', error);
    }
  }

  /**
   * Listen for messages from service worker
   */
  listenForMessages(callback: (message: any) => void): () => void {
    const handler = (event: MessageEvent) => {
      console.log('[Push] Message from service worker:', event.data);
      callback(event.data);
    };

    navigator.serviceWorker.addEventListener('message', handler);

    // Return cleanup function
    return () => {
      navigator.serviceWorker.removeEventListener('message', handler);
    };
  }

  /**
   * Send subscription to backend
   */
  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
      // Extract subscription details
      const subscriptionJSON = subscription.toJSON();
      const deviceToken = JSON.stringify(subscriptionJSON);

      // Send to backend
      await notificationsApi.enablePush(deviceToken, 'web');
      console.log('[Push] Subscription sent to backend');
    } catch (error) {
      console.error('[Push] Failed to send subscription to backend:', error);
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();

// Export class for testing
export { PushNotificationService };
