import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import type { AppNotification } from '../types';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

interface UsePushNotificationsOptions {
  userId?: string;
  onNotificationReceived?: (notification: AppNotification) => void;
  onNavigate?: (url: string) => void;
}

// Convert VAPID base64 string to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications({
  userId,
  onNotificationReceived,
  onNavigate,
}: UsePushNotificationsOptions = {}) {
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [lastNotification, setLastNotification] = useState<AppNotification | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  // 1. Check support and existing registration on mount
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (!supported) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission as NotificationPermissionState);

    // Register / find existing Service Worker
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        setRegistration(reg);
        // Check if there is already an active PushSubscription
        return reg.pushManager.getSubscription();
      })
      .then((sub) => {
        setIsSubscribed(Boolean(sub));
      })
      .catch((err) => {
        console.warn('[Push] Service Worker registration failed:', err);
      });
  }, []);

  // 2. Listen to Service Worker messages (when notifications arrive while page is open)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'PUSH_NOTIFICATION_RECEIVED') {
        const notif = event.data.notification as AppNotification;
        setLastNotification(notif);
        if (onNotificationReceived) {
          onNotificationReceived(notif);
        }
      } else if (event.data.type === 'NOTIFICATION_NAVIGATE') {
        const url = event.data.targetUrl;
        if (onNavigate && url) {
          onNavigate(url);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [onNotificationReceived, onNavigate]);

  // 3. Setup real-time SSE stream for in-app instant updates while active
  useEffect(() => {
    if (!userId) {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      return;
    }

    // Connect to SSE stream
    const sseUrl = `/api/notifications/stream?userId=${encodeURIComponent(userId)}`;
    const eventSource = new EventSource(sseUrl);
    sseRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'NOTIFICATION') {
          const notif = parsed.data as AppNotification;
          setLastNotification(notif);
          if (onNotificationReceived) {
            onNotificationReceived(notif);
          }
        }
      } catch (err) {
        // Ping or parse issue
      }
    };

    eventSource.onerror = () => {
      // Reconnect handled automatically by EventSource
    };

    return () => {
      eventSource.close();
      sseRef.current = null;
    };
  }, [userId, onNotificationReceived]);

  // 4. Request Permission and Subscribe to Web Push
  const subscribe = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!isSupported) {
      return { success: false, error: 'المتصفح الحالي لا يدعم تقنية إشعارات الويب (Push Notifications)' };
    }

    setIsLoading(true);
    try {
      // Prompt user for notification permission
      const permResult = await Notification.requestPermission();
      setPermission(permResult as NotificationPermissionState);

      if (permResult !== 'granted') {
        setIsLoading(false);
        return {
          success: false,
          error:
            permResult === 'denied'
              ? 'تم رفض إذن الإشعارات من إعدادات المتصفح. يرجى تفعيل الإشعارات من شريط العنوان.'
              : 'لم يتم منح إذن الإشعارات.',
        };
      }

      // Ensure service worker is ready
      const swReg = registration || (await navigator.serviceWorker.ready);

      // Fetch VAPID public key from backend
      const { publicKey } = await api.getVapidPublicKey();
      if (!publicKey) {
        throw new Error('لم يتم استرجاع مفتاح التشفير العام VAPID من الخادم');
      }

      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Subscribe to PushManager
      const subscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error('فشل إنشاء مفاتيح الاشتراك الطرفية للمتصفح');
      }

      // Send to backend
      await api.subscribeToPush({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        userAgent: navigator.userAgent,
        deviceName: `${navigator.platform || 'الجهاز'} - ${navigator.userAgent.includes('Mobile') ? 'هاتف' : 'حاسوب'}`,
      });

      setIsSubscribed(true);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('[Push] Subscription failed:', err);
      setIsLoading(false);
      return {
        success: false,
        error: err.message || 'حدث خطأ أثناء الاشتراك في خدمة الإشعارات الفورية',
      };
    }
  }, [isSupported, registration]);

  // 5. Unsubscribe from Web Push
  const unsubscribe = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!isSupported) return { success: false, error: 'غير مدعوم' };

    setIsLoading(true);
    try {
      const swReg = registration || (await navigator.serviceWorker.ready);
      const sub = await swReg.pushManager.getSubscription();

      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        try {
          await api.unsubscribeFromPush(endpoint);
        } catch (e) {
          // Ignore server unsubscribe failure if client is already unsubscribed
        }
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('[Push] Unsubscribe error:', err);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  }, [isSupported, registration]);

  // 6. Test Push Notification
  const sendTestNotification = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.sendTestNotification();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل إرسال الإشعار التجريبي' };
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    registration,
    lastNotification,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
