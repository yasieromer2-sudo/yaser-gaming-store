import fs from 'fs';
import path from 'path';
import webpush from 'web-push';
import type { Response } from 'express';
import { db } from './db';
import type {
  Notification,
  NotificationType,
  PushSubscriptionRecord,
  PushSubscriptionKeys,
  User,
  WalletTopUpRequest,
  RechargeOrder,
  GameAccount,
  Order,
  OfferItem
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const VAPID_FILE = path.join(DATA_DIR, 'vapid.json');

interface VapidKeysConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

class NotificationServiceEngine {
  private vapidKeys!: VapidKeysConfig;
  private sseClients: Map<string, Set<Response>> = new Map();

  constructor() {
    this.initVapid();
    this.initDbListeners();
  }

  private initDbListeners(): void {
    db.on('topup:confirmed', ({ request, balanceAfter, agentUser }) => {
      this.notifyTopUpApproved(request, balanceAfter, agentUser).catch(e =>
        console.error('[NotificationService] topup:confirmed error:', e)
      );
    });

    db.on('topup:rejected', ({ request, reason, agentUser }) => {
      this.notifyTopUpRejected(request, reason, agentUser).catch(e =>
        console.error('[NotificationService] topup:rejected error:', e)
      );
    });

    db.on('topup:created', ({ request }) => {
      this.notifyNewTopUpForAgent(request).catch(e =>
        console.error('[NotificationService] topup:created error:', e)
      );
    });

    db.on('recharge:created', ({ order }) => {
      this.notifyRechargeCreated(order).catch(e =>
        console.error('[NotificationService] recharge:created error:', e)
      );
    });

    db.on('recharge:updated', ({ order, status, reason }) => {
      if (status === 'Completed') {
        this.notifyRechargeCompleted(order).catch(e =>
          console.error('[NotificationService] recharge:updated Completed error:', e)
        );
      } else if (status === 'Failed') {
        this.notifyRechargeFailed(order, reason).catch(e =>
          console.error('[NotificationService] recharge:updated Failed error:', e)
        );
      }
    });

    db.on('account:purchased', ({ order, account }) => {
      this.notifyAccountPurchased(order, account).catch(e =>
        console.error('[NotificationService] account:purchased error:', e)
      );
    });

    db.on('offer:created', ({ offer }) => {
      this.notifyNewOffer(offer).catch(e =>
        console.error('[NotificationService] offer:created error:', e)
      );
    });
  }

  private initVapid(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let publicKey = process.env.VAPID_PUBLIC_KEY;
    let privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:yasieromer2@gmail.com';

    if (!publicKey || !privateKey) {
      if (fs.existsSync(VAPID_FILE)) {
        try {
          const raw = fs.readFileSync(VAPID_FILE, 'utf-8');
          const parsed = JSON.parse(raw);
          publicKey = parsed.publicKey;
          privateKey = parsed.privateKey;
        } catch (err) {
          console.warn('[NotificationService] Error reading vapid.json, generating new keys...');
        }
      }

      if (!publicKey || !privateKey) {
        const generated = webpush.generateVAPIDKeys();
        publicKey = generated.publicKey;
        privateKey = generated.privateKey;
        try {
          fs.writeFileSync(
            VAPID_FILE,
            JSON.stringify({ publicKey, privateKey, subject }, null, 2),
            'utf-8'
          );
        } catch (err) {
          console.error('[NotificationService] Failed to save vapid.json:', err);
        }
      }
    }

    this.vapidKeys = { publicKey, privateKey, subject };

    webpush.setVapidDetails(this.vapidKeys.subject, this.vapidKeys.publicKey, this.vapidKeys.privateKey);
    console.log('[NotificationService] VAPID configured successfully.');
  }

  public getVapidPublicKey(): string {
    return this.vapidKeys.publicKey;
  }

  // -------------------------------------------------------------
  // SSE REAL-TIME IN-APP CONNECTION MANAGEMENT
  // -------------------------------------------------------------
  public addSseClient(userId: string, res: Response): void {
    if (!this.sseClients.has(userId)) {
      this.sseClients.set(userId, new Set());
    }
    this.sseClients.get(userId)!.add(res);

    res.on('close', () => {
      this.removeSseClient(userId, res);
    });
  }

  public removeSseClient(userId: string, res: Response): void {
    const clients = this.sseClients.get(userId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        this.sseClients.delete(userId);
      }
    }
  }

  public sendSseEvent(userId: string, payload: any): void {
    const clients = this.sseClients.get(userId);
    if (clients && clients.size > 0) {
      const dataStr = `data: ${JSON.stringify(payload)}\n\n`;
      clients.forEach(res => {
        try {
          res.write(dataStr);
        } catch (e) {
          // ignore closed socket
        }
      });
    }
  }

  // -------------------------------------------------------------
  // SUBSCRIPTION MANAGEMENT (Supports Multi-Device per User)
  // -------------------------------------------------------------
  public async saveSubscription(
    userId: string,
    subData: { endpoint: string; keys: PushSubscriptionKeys },
    userAgent?: string,
    deviceName?: string
  ): Promise<PushSubscriptionRecord> {
    return db.atomic(() => {
      const subscriptions = db.getData().pushSubscriptions || [];
      const now = new Date().toISOString();

      let existing = subscriptions.find(s => s.endpoint === subData.endpoint);
      if (existing) {
        existing.userId = userId;
        existing.keys = subData.keys;
        existing.userAgent = userAgent || existing.userAgent;
        existing.deviceName = deviceName || existing.deviceName;
        existing.lastUsedAt = now;
        existing.isActive = true;
        return existing;
      }

      const newRecord: PushSubscriptionRecord = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        userId,
        endpoint: subData.endpoint,
        keys: subData.keys,
        userAgent: userAgent || 'Browser Device',
        deviceName: deviceName || 'جهاز المتصفح',
        createdAt: now,
        lastUsedAt: now,
        isActive: true,
      };

      subscriptions.push(newRecord);
      db.getData().pushSubscriptions = subscriptions;
      return newRecord;
    });
  }

  public async removeSubscription(userId: string, endpoint: string): Promise<boolean> {
    return db.atomic(() => {
      const subscriptions = db.getData().pushSubscriptions || [];
      const sub = subscriptions.find(s => s.endpoint === endpoint && s.userId === userId);
      if (sub) {
        sub.isActive = false;
        return true;
      }
      return false;
    });
  }

  public getUserSubscriptions(userId: string): PushSubscriptionRecord[] {
    const subscriptions = db.getData().pushSubscriptions || [];
    return subscriptions.filter(s => s.userId === userId && s.isActive);
  }

  // -------------------------------------------------------------
  // CORE NOTIFICATION DISPATCHER WITH IDEMPOTENCY
  // -------------------------------------------------------------
  public async createAndSend(params: {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, any>;
    targetUrl?: string;
    eventId?: string;
    tag?: string;
    renotify?: boolean;
  }): Promise<Notification> {
    const data = db.getData();

    // 1. Idempotency Check: prevent duplicate notifications
    if (params.eventId) {
      const existing = data.notifications.find(
        n => n.userId === params.userId && n.eventId === params.eventId
      );
      if (existing) {
        return existing;
      }
    }

    const now = new Date().toISOString();
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const newNotification: Notification = {
      id: notifId,
      userId: params.userId,
      title: params.title.trim(),
      message: params.body.trim(),
      body: params.body.trim(),
      type: params.type,
      data: params.data || {},
      targetUrl: params.targetUrl || '/',
      targetScreen: params.targetUrl || '/',
      read: false,
      readAt: null,
      createdAt: now,
      pushStatus: 'pending',
      eventId: params.eventId,
    };

    // Save to Database atomically
    await db.atomic(() => {
      data.notifications.push(newNotification);
    });

    // 2. Immediate In-App Dispatch via SSE (zero latency for foreground users)
    this.sendSseEvent(params.userId, {
      type: 'NOTIFICATION_CREATED',
      notification: newNotification,
    });

    // 3. Dispatch Real Web Push to all active devices of the user
    this.dispatchWebPush(newNotification, {
      tag: params.tag || params.eventId || notifId,
      renotify: params.renotify ?? false,
    }).catch(err => {
      console.warn(`[NotificationService] Web Push delivery warning for ${params.userId}:`, err?.message);
    });

    return newNotification;
  }

  private async dispatchWebPush(
    notification: Notification,
    options?: { tag?: string; renotify?: boolean }
  ): Promise<void> {
    const activeSubs = this.getUserSubscriptions(notification.userId);

    if (activeSubs.length === 0) {
      notification.pushStatus = 'no_subscription';
      return;
    }

    const settings = db.getData().storeSettings;
    const storeName = settings?.storeName || 'متجر الألعاب';
    const storeLogo = settings?.logoUrl || '/icon-192.png';

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: storeLogo,
      badge: '/badge-72.png',
      tag: options?.tag || notification.eventId || notification.id,
      renotify: options?.renotify ?? false,
      silent: false,
      vibrate: [200, 100, 200], // Native vibration pattern on Android
      data: {
        id: notification.id,
        targetUrl: notification.targetUrl || '/',
        type: notification.type,
        storeName,
        meta: notification.data,
      },
      actions: [
        { action: 'open', title: 'فتح التفاصيل' }
      ]
    });

    let successCount = 0;
    const staleEndpoints: string[] = [];

    await Promise.all(
      activeSubs.map(async sub => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, payload, {
            TTL: 86400, // 24 hours delivery window
            urgency: 'high',
            topic: options?.tag ? options.tag.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) : undefined,
          });

          successCount++;
        } catch (err: any) {
          // Check for expired/unsubscribed status (404 Not Found or 410 Gone)
          if (err.statusCode === 404 || err.statusCode === 410) {
            staleEndpoints.push(sub.endpoint);
          } else {
            console.warn(`[NotificationService] Error sending to endpoint ${sub.endpoint.slice(0, 35)}...:`, err.message);
          }
        }
      })
    );

    // Prune stale/expired subscriptions safely
    if (staleEndpoints.length > 0) {
      await db.atomic(() => {
        const allSubs = db.getData().pushSubscriptions || [];
        allSubs.forEach(s => {
          if (staleEndpoints.includes(s.endpoint)) {
            s.isActive = false;
          }
        });
      });
    }

    // Update push status on notification
    notification.pushStatus = successCount > 0 ? 'sent' : 'failed';
  }

  // -------------------------------------------------------------
  // SPECIFIC REAL-WORLD SYSTEM EVENT HELPERS
  // -------------------------------------------------------------

  // Section 8: Agent confirms top-up
  public async notifyTopUpApproved(
    request: WalletTopUpRequest,
    balanceAfter: number,
    agentUser: User
  ): Promise<Notification> {
    return this.createAndSend({
      userId: request.userId,
      title: 'تم تأكيد شحن المحفظة',
      body: `تم إضافة ${request.amount.toLocaleString()} SDG إلى محفظتك بنجاح بواسطة ${agentUser.name}. رصيدك الحالي: ${balanceAfter.toLocaleString()} SDG.`,
      type: 'topup_confirmed',
      targetUrl: '/?tab=wallet',
      eventId: `topup-approved-${request.id}`,
      data: {
        requestId: request.id,
        amount: request.amount,
        balanceAfter,
        agentName: agentUser.name,
      },
    });
  }

  // Section 7: Agent rejects top-up
  public async notifyTopUpRejected(
    request: WalletTopUpRequest,
    reason: string,
    agentUser: User
  ): Promise<Notification> {
    return this.createAndSend({
      userId: request.userId,
      title: 'تم رفض طلب شحن المحفظة',
      body: `تم رفض طلب الشحن رقم ${request.id} بمبلغ ${request.amount.toLocaleString()} SDG. السبب: ${reason}`,
      type: 'topup_rejected',
      targetUrl: '/?tab=wallet',
      eventId: `topup-rejected-${request.id}`,
      data: {
        requestId: request.id,
        amount: request.amount,
        reason,
        agentName: agentUser.name,
      },
    });
  }

  // Section 9: New top-up assigned to Agent
  public async notifyNewTopUpForAgent(request: WalletTopUpRequest): Promise<Notification | null> {
    const users = db.getData().users;
    // Find the specific agent account linked to request.agentId
    const agentAccount = users.find(u => u.role === 'agent' && u.agentId === request.agentId);

    if (!agentAccount) {
      console.warn(`[NotificationService] Agent account not found for agentId: ${request.agentId}`);
      return null;
    }

    return this.createAndSend({
      userId: agentAccount.id,
      title: 'طلب شحن جديد',
      body: `لديك طلب شحن جديد بقيمة ${request.amount.toLocaleString()} SDG من العميل ${request.userName}.`,
      type: 'topup_requested',
      targetUrl: '/?tab=agent',
      eventId: `topup-new-agent-${request.id}`,
      data: {
        requestId: request.id,
        amount: request.amount,
        customerName: request.userName,
        paymentMethod: request.paymentMethod,
      },
    });
  }

  // Section 7: User Game Recharge Created
  public async notifyRechargeCreated(order: RechargeOrder): Promise<Notification> {
    return this.createAndSend({
      userId: order.userId,
      title: '⚡ جاري تنفيذ طلب الشحن',
      body: `تم استلام طلب شحن ${order.packageName} للعبة ${order.gameName} (معرف اللاعب: ${order.playerId}). جاري المعالجة.`,
      type: 'recharge_created',
      targetUrl: '/?tab=recharge',
      eventId: `recharge-created-${order.id}`,
      data: {
        orderId: order.id,
        gameName: order.gameName,
        packageName: order.packageName,
        playerId: order.playerId,
        amountSDG: order.amountSDG,
      },
    });
  }

  // Section 7: Recharge Completed
  public async notifyRechargeCompleted(order: RechargeOrder): Promise<Notification> {
    return this.createAndSend({
      userId: order.userId,
      title: '✅ اكتمل الشحن بنجاح!',
      body: `تم تسليم ${order.packageName} لحسابك (${order.playerId}) في لعبة ${order.gameName} بنجاح. نتمنى لك تجربة ممتعة!`,
      type: 'recharge_completed',
      targetUrl: '/?tab=recharge',
      eventId: `recharge-completed-${order.id}`,
      data: {
        orderId: order.id,
        gameName: order.gameName,
        packageName: order.packageName,
        playerId: order.playerId,
      },
    });
  }

  // Section 7: Recharge Failed with automatic refund
  public async notifyRechargeFailed(order: RechargeOrder, reason?: string): Promise<Notification> {
    return this.createAndSend({
      userId: order.userId,
      title: '🔄 تم استرداد مبلغ الشحن إلى محفظتك',
      body: `تعذر شحن ${order.packageName} للمعرف ${order.playerId}. تم استرداد كامل المبلغ ${order.amountSDG.toLocaleString()} SDG إلى رصيدك تلقائيًا. السبب: ${reason || 'تعذر الاتصال بخادم اللعبة'}`,
      type: 'recharge_refunded',
      targetUrl: '/?tab=wallet',
      eventId: `recharge-failed-${order.id}`,
      data: {
        orderId: order.id,
        gameName: order.gameName,
        amountSDG: order.amountSDG,
        reason,
      },
    });
  }

  // Section 7: Account Purchased
  public async notifyAccountPurchased(order: Order, account: GameAccount): Promise<Notification> {
    return this.createAndSend({
      userId: order.userId,
      title: '🎉 تم شراء الحساب بنجاح!',
      body: `تم شراء حساب ${account.title} في لعبة ${account.gameName} بقيمة ${order.amountSDG.toLocaleString()} SDG. تفاصيل الدخول متاحة في ملفك الشخصي.`,
      type: 'account_purchased',
      targetUrl: '/?tab=profile',
      eventId: `account-purchased-${order.id}`,
      data: {
        orderId: order.id,
        accountId: account.id,
        title: account.title,
        gameName: account.gameName,
      },
    });
  }

  // Section 13: Super Admin Broadcast
  public async notifyAdminBroadcast(params: {
    title: string;
    body: string;
    type?: NotificationType;
    targetRole?: 'all' | 'agents' | 'users';
    targetUserId?: string;
    targetUrl?: string;
    adminUserId: string;
  }): Promise<number> {
    const data = db.getData();
    const admin = data.users.find(u => u.id === params.adminUserId);
    if (!admin || admin.role !== 'super_admin') {
      throw new Error('غير مصرح لك بإرسال إعلانات إدارية');
    }

    let recipients: User[] = [];
    if (params.targetUserId) {
      const single = data.users.find(u => u.id === params.targetUserId);
      if (single) recipients = [single];
    } else if (params.targetRole === 'agents') {
      recipients = data.users.filter(u => u.role === 'agent' && u.status === 'active');
    } else if (params.targetRole === 'users') {
      recipients = data.users.filter(u => u.role === 'user' && u.status === 'active');
    } else {
      recipients = data.users.filter(u => u.status === 'active');
    }

    const broadcastEventId = `broadcast-${Date.now()}`;

    // Send notifications in parallel batches
    let sentCount = 0;
    for (const recipient of recipients) {
      try {
        await this.createAndSend({
          userId: recipient.id,
          title: params.title,
          body: params.body,
          type: params.type || 'broadcast',
          targetUrl: params.targetUrl || '/',
          eventId: `${broadcastEventId}-${recipient.id}`,
        });
        sentCount++;
      } catch (err) {
        console.warn(`[NotificationService] Failed broadcast for ${recipient.id}:`, err);
      }
    }

    // Add Audit Log
    await db.atomic(() => {
      data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: admin.id,
        userName: admin.name,
        action: 'NOTIFICATION_BROADCAST_SENT',
        target: params.targetUserId || params.targetRole || 'ALL',
        details: `إرسال تعميم إداري "${params.title}" لـ ${sentCount} مستخدم`,
        timestamp: new Date().toISOString(),
      });
    });

    return sentCount;
  }

  // Section 7: New Offer Alert
  public async notifyNewOffer(offer: OfferItem): Promise<void> {
    if (offer.status !== 'Published') return;
    const users = db.getData().users.filter(u => u.role === 'user' && u.status === 'active');
    const offerEventId = `offer-${offer.id}`;

    for (const user of users.slice(0, 50)) {
      this.createAndSend({
        userId: user.id,
        title: `🔥 عرض جديد: ${offer.title}`,
        body: offer.subtitle || offer.description.slice(0, 90),
        type: 'offer_new',
        targetUrl: '/?tab=offers',
        eventId: `${offerEventId}-${user.id}`,
        data: { offerId: offer.id },
      }).catch(() => {});
    }
  }
}

export const notificationService = new NotificationServiceEngine();
