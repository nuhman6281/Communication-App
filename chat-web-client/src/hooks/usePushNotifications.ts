/**
 * Push Notifications Hook
 * React hook for managing web push notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService } from '@/lib/services/push-notification.service';

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isInitializing: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  showNotification: (title: string, options?: NotificationOptions) => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Check if push notifications are supported
        const supported = 'serviceWorker' in navigator &&
          'PushManager' in window &&
          'Notification' in window;

        setIsSupported(supported);

        if (!supported) {
          console.warn('[usePushNotifications] Push notifications not supported');
          setIsInitializing(false);
          return;
        }

        // Get current permission
        setPermission(Notification.permission);

        // Initialize service
        const initialized = await pushNotificationService.initialize();
        console.log('[usePushNotifications] Initialized:', initialized);

        // Check subscription status
        const subscribed = await pushNotificationService.isEnabled();
        setIsSubscribed(subscribed);

        setIsInitializing(false);
      } catch (error) {
        console.error('[usePushNotifications] Initialization error:', error);
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  // Listen for permission changes
  useEffect(() => {
    if (!isSupported) return;

    const interval = setInterval(() => {
      if (Notification.permission !== permission) {
        setPermission(Notification.permission);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSupported, permission]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const newPermission = await pushNotificationService.requestPermission();
      setPermission(newPermission);

      // Update subscription status
      if (newPermission === 'granted') {
        const subscribed = await pushNotificationService.isEnabled();
        setIsSubscribed(subscribed);
      }

      return newPermission;
    } catch (error) {
      console.error('[usePushNotifications] Request permission error:', error);
      return 'denied';
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      // Request permission first if not granted
      if (permission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          return false;
        }
      }

      // Subscribe
      const subscription = await pushNotificationService.subscribeToPush();
      const success = subscription !== null;
      setIsSubscribed(success);
      return success;
    } catch (error) {
      console.error('[usePushNotifications] Subscribe error:', error);
      return false;
    }
  }, [permission, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const success = await pushNotificationService.unsubscribe();
      setIsSubscribed(!success);
      return success;
    } catch (error) {
      console.error('[usePushNotifications] Unsubscribe error:', error);
      return false;
    }
  }, []);

  // Show local notification
  const showNotification = useCallback(async (
    title: string,
    options?: NotificationOptions
  ): Promise<void> => {
    try {
      await pushNotificationService.showNotification({
        title,
        body: options?.body || '',
        icon: options?.icon,
        badge: options?.badge,
        tag: options?.tag,
        data: options?.data,
        requireInteraction: options?.requireInteraction,
      });
    } catch (error) {
      console.error('[usePushNotifications] Show notification error:', error);
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isInitializing,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
  };
}

// Hook for listening to service worker messages
export function useServiceWorkerMessages(
  callback: (message: any) => void
): void {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const cleanup = pushNotificationService.listenForMessages(callback);

    return () => {
      cleanup();
    };
  }, [callback]);
}
