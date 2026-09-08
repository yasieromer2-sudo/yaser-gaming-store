import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import {
  User,
  Wallet,
  WalletTransaction,
  Agent,
  PaymentMethod,
  WalletTopUpRequest,
  Game,
  RechargePackage,
  RechargeOrder,
  GameAccount,
  Order,
  Notification,
  PushSubscriptionRecord,
  StoreSection,
  StoreBanner,
  StoreSettings,
  AuditLog,
  OfferItem,
  OfferStatus
} from '../src/types';

interface DatabaseSchema {
  users: User[];
  wallets: Record<string, Wallet>; // userId -> Wallet
  transactions: WalletTransaction[];
  agents: Agent[];
  paymentMethods: PaymentMethod[];
  topUpRequests: WalletTopUpRequest[];
  games: Game[];
  rechargePackages: RechargePackage[];
  rechargeOrders: RechargeOrder[];
  gameAccounts: GameAccount[];
  orders: Order[];
  notifications: Notification[];
  pushSubscriptions: PushSubscriptionRecord[];
  storeSections: StoreSection[];
  storeBanners: StoreBanner[];
  storeSettings: StoreSettings;
  offers: OfferItem[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'متجر الألعاب الرقمي',
  storeTagline: 'المنصة المتكاملة لشحن الألعاب وشراء الحسابات المعتمدة',
  storeDescription: 'متجر ألعاب رقمي احترافي بنظام المحفظة الإلكترونية وشبكة وكلاء شحن معتمدة.',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#10b981',
  accentColor: '#6366f1',
  fontFamily: 'Cairo',
  themeMode: 'dark',
  usdToSdgRate: 2650,
  baseCurrency: 'SDG',
  whatsappSupportNumber: '',
  contactEmail: '',
  termsOfService: 'شروط استخدام المتجر: جميع المعاملات نهائية بمجرد اكتمال الشحن أو تسليم الحساب. يتم شحن المحفظة بعد مراجعة الوكيل لإشعار التحويل البنكي الفعلي.',
  privacyPolicy: 'سياسة الخصوصية: نحمي بيانات المستخدمين ومعرفاتهم، ولا نشارك أي معلومات شخصية إلا للأغراض التشغيلية اللازمة لإتمام العمليات.',
  announcementText: '',
  showAnnouncement: false,
  maintenanceMode: false,
};

const INITIAL_SECTIONS: StoreSection[] = [
  {
    id: 'sec-1',
    key: 'recharge',
    title: 'الشحن السريع',
    icon: 'Zap',
    order: 1,
    isVisible: true,
    isDefault: true,
    badge: 'فوري'
  },
  {
    id: 'sec-2',
    key: 'accounts',
    title: 'عروض الحسابات',
    icon: 'Gamepad2',
    order: 2,
    isVisible: true,
    isDefault: true,
    badge: 'VIP'
  },
  {
    id: 'sec-offers',
    key: 'offers',
    title: 'العروض والأخبار',
    icon: 'Flame',
    order: 3,
    isVisible: true,
    isDefault: false,
    badge: 'جديد'
  },
  {
    id: 'sec-3',
    key: 'wallet',
    title: 'المحفظة',
    icon: 'Wallet',
    order: 4,
    isVisible: true,
    isDefault: true,
  },
  {
    id: 'sec-4',
    key: 'profile',
    title: 'الملف الشخصي',
    icon: 'User',
    order: 5,
    isVisible: true,
    isDefault: true,
  },
];

const INITIAL_BANNERS: StoreBanner[] = [];

const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'bankak',
    name: 'تطبيق بنكك (بنك الخرطوم)',
    code: 'BOK',
    iconName: 'Building2',
    color: '#0284c7',
    description: 'التحويل المباشر عبر حساب أو رقم هاتف بنكك مع إشعار الدفع الفوري',
    isActive: true,
  },
  {
    id: 'mycash',
    name: 'مايكاش (MyCash)',
    code: 'MYC',
    iconName: 'Smartphone',
    color: '#f59e0b',
    description: 'تحويل سريع عبر محفظة مايكاش الإلكترونية للوكيل',
    isActive: true,
  },
  {
    id: 'okash',
    name: 'أوكاش (O-Kash)',
    code: 'OKS',
    iconName: 'CreditCard',
    color: '#8b5cf6',
    description: 'خدمة الدفع والتحويل عبر أوكاش بسهولة وأمان',
    isActive: true,
  },
];

const INITIAL_AGENTS: Agent[] = [];

const INITIAL_GAMES: Game[] = [];

const INITIAL_RECHARGE_PACKAGES: RechargePackage[] = [];

const INITIAL_ACCOUNTS: GameAccount[] = [];

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    uid: 'UID-000001',
    name: 'المدير العام (Super Admin)',
    email: 'admin@store.local',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'super_admin',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const INITIAL_WALLETS: Record<string, Wallet> = {
  'usr-admin': {
    id: 'wlt-admin',
    userId: 'usr-admin',
    balance: 0,
    currency: 'SDG',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};

const INITIAL_TRANSACTIONS: WalletTransaction[] = [];

const INITIAL_NOTIFICATIONS: Notification[] = [];

class DatabaseEngine extends EventEmitter {
  private data: DatabaseSchema;
  private isLoaded: boolean = false;
  private lockPromise: Promise<void> = Promise.resolve();

  constructor() {
    super();
    this.data = this.getDefaultData();
    this.loadFromDisk();
  }

  private getDefaultData(): DatabaseSchema {
    return {
      users: INITIAL_USERS,
      wallets: INITIAL_WALLETS,
      transactions: INITIAL_TRANSACTIONS,
      agents: INITIAL_AGENTS,
      paymentMethods: INITIAL_PAYMENT_METHODS,
      topUpRequests: [],
      games: INITIAL_GAMES,
      rechargePackages: INITIAL_RECHARGE_PACKAGES,
      rechargeOrders: [],
      gameAccounts: INITIAL_ACCOUNTS,
      orders: [],
      notifications: INITIAL_NOTIFICATIONS,
      pushSubscriptions: [],
      storeSections: INITIAL_SECTIONS,
      storeBanners: INITIAL_BANNERS,
      storeSettings: INITIAL_SETTINGS,
      offers: [],
      auditLogs: [
        {
          id: 'log-1',
          userId: 'usr-admin',
          userName: 'المدير العام',
          action: 'STORE_INITIALIZED',
          target: 'Store System',
          details: 'تم تجهيز متجر الألعاب بنسخة Standard White-Label نظيفة وجاهزة للتشغيل.',
          timestamp: '2026-01-01T00:00:00.000Z',
        }
      ],
    };
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.getDefaultData(), ...parsed };
        if (!Array.isArray(this.data.offers)) {
          this.data.offers = [];
        }
        if (!Array.isArray(this.data.pushSubscriptions)) {
          this.data.pushSubscriptions = [];
        }
        if (!this.data.storeSections.some(s => s.key === 'offers')) {
          this.data.storeSections.push({
            id: 'sec-offers',
            key: 'offers',
            title: 'العروض والأخبار',
            icon: 'Flame',
            order: 3,
            isVisible: true,
            isDefault: false,
            badge: 'جديد'
          });
          this.data.storeSections.sort((a, b) => a.order - b.order);
        }
      } else {
        this.saveToDisk();
      }
      this.isLoaded = true;
    } catch (e) {
      console.error('Error loading database from disk, using defaults:', e);
      this.data = this.getDefaultData();
    }
  }

  private saveToDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database to disk:', e);
    }
  }

  // Atomic critical section execution helper
  public async atomic<T>(callback: () => Promise<T> | T): Promise<T> {
    const previousLock = this.lockPromise;
    let release: () => void;
    this.lockPromise = new Promise((resolve) => {
      release = resolve;
    });

    try {
      await previousLock;
      const result = await callback();
      this.saveToDisk();
      return result;
    } finally {
      release!();
    }
  }

  // Read data getters
  public getData(): DatabaseSchema {
    return this.data;
  }

  public getSettings(): StoreSettings {
    return this.data.storeSettings;
  }

  public getSections(): StoreSection[] {
    return this.data.storeSections.sort((a, b) => a.order - b.order);
  }

  public getBanners(): StoreBanner[] {
    return this.data.storeBanners.filter(b => b.isActive).sort((a, b) => a.order - b.order);
  }

  public getGames(): Game[] {
    return this.data.games.filter(g => g.isActive).sort((a, b) => a.order - b.order);
  }

  public getAllGames(): Game[] {
    return this.data.games.sort((a, b) => a.order - b.order);
  }

  public getAgents(): Agent[] {
    return this.data.agents;
  }

  public getPaymentMethods(): PaymentMethod[] {
    return this.data.paymentMethods;
  }

  public getPackages(gameId?: string): RechargePackage[] {
    if (gameId) {
      return this.data.rechargePackages.filter(p => p.gameId === gameId && p.isActive).sort((a, b) => a.order - b.order);
    }
    return this.data.rechargePackages.filter(p => p.isActive).sort((a, b) => a.order - b.order);
  }

  public getAllPackages(gameId?: string): RechargePackage[] {
    if (gameId) {
      return this.data.rechargePackages.filter(p => p.gameId === gameId).sort((a, b) => a.order - b.order);
    }
    return this.data.rechargePackages.sort((a, b) => a.order - b.order);
  }

  public getAccounts(gameId?: string): GameAccount[] {
    if (gameId) {
      return this.data.gameAccounts.filter(a => a.gameId === gameId);
    }
    return this.data.gameAccounts;
  }

  public getUser(userId: string): User | undefined {
    return this.data.users.find(u => u.id === userId || u.uid === userId);
  }

  public getWallet(userId: string): Wallet {
    if (!this.data.wallets[userId]) {
      this.data.wallets[userId] = {
        id: `wlt-${userId}`,
        userId,
        balance: 0,
        currency: 'SDG',
        updatedAt: new Date().toISOString(),
      };
      this.saveToDisk();
    }
    return this.data.wallets[userId];
  }

  public getTransactions(userId?: string): WalletTransaction[] {
    if (userId) {
      return this.data.transactions.filter(t => t.userId === userId).reverse();
    }
    return [...this.data.transactions].reverse();
  }

  public getNotifications(userId: string): Notification[] {
    return this.data.notifications.filter(n => n.userId === userId).reverse();
  }

  public getTopUpRequests(agentId?: string): WalletTopUpRequest[] {
    if (agentId) {
      return this.data.topUpRequests.filter(r => r.agentId === agentId).reverse();
    }
    return [...this.data.topUpRequests].reverse();
  }

  public getRechargeOrders(userId?: string): RechargeOrder[] {
    if (userId) {
      return this.data.rechargeOrders.filter(r => r.userId === userId).reverse();
    }
    return [...this.data.rechargeOrders].reverse();
  }

  public getOrders(userId?: string): Order[] {
    if (userId) {
      return this.data.orders.filter(o => o.userId === userId).reverse();
    }
    return [...this.data.orders].reverse();
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs].reverse();
  }

  // ATOMIC WALLET TRANSACTIONS
  public async createTopUpRequest(params: {
    userId: string;
    agentId: string;
    amount: number;
    paymentMethod: string;
    transferReference?: string;
  }): Promise<WalletTopUpRequest> {
    return this.atomic(() => {
      const user = this.data.users.find(u => u.id === params.userId);
      if (!user) throw new Error('المستخدم غير موجود');

      const agent = this.data.agents.find(a => a.id === params.agentId);
      if (!agent) throw new Error('وكيل الشحن غير موجود');

      if (params.amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');

      const requestId = `REQ-${Date.now().toString().slice(-6)}`;
      const newRequest: WalletTopUpRequest = {
        id: requestId,
        userId: user.id,
        userName: user.name,
        userUid: user.uid,
        agentId: agent.id,
        agentName: agent.name,
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        transferReference: params.transferReference || '',
        status: 'Pending',
        createdAt: new Date().toISOString(),
        whatsappOpened: true,
      };

      this.data.topUpRequests.push(newRequest);

      // Add notification to user
      this.data.notifications.push({
        id: `notif-${Date.now()}`,
        userId: user.id,
        title: 'تم إنشاء طلب تغذية المحفظة',
        message: `تم إرسال طلب تغذية بمبلغ ${params.amount.toLocaleString()} SDG إلى ${agent.name}. سيتم إضافة الرصيد بعد تحقق الوكيل.`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      });

      this.emit('topup:created', { request: newRequest });

      return newRequest;
    });
  }

  // AGENT CONFIRM TOP-UP (Atomic credit + Ledger update)
  public async confirmTopUpRequest(requestId: string, agentUserId: string, notes?: string): Promise<WalletTopUpRequest> {
    return this.atomic(() => {
      const request = this.data.topUpRequests.find(r => r.id === requestId);
      if (!request) throw new Error('طلب التغذية غير موجود');
      if (request.status !== 'Pending') {
        throw new Error(`لا يمكن تكرار معالجة الطلب: تمت معالجة هذا الطلب مسبقًا بحالة (${request.status})`);
      }

      // Check agent authorization
      const agentUser = this.data.users.find(u => u.id === agentUserId);
      if (!agentUser) throw new Error('المستخدم غير موجود');

      if (agentUser.role !== 'super_admin') {
        if (agentUser.role !== 'agent' || agentUser.agentId !== request.agentId) {
          throw new Error('غير مصرح لك: هذا الطلب مسند لوكيل آخر ولا يمكنك معالجته');
        }
      }

      // 1. Get or create wallet
      const wallet = this.getWallet(request.userId);
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + request.amount;

      // 2. Update wallet balance atomically
      wallet.balance = balanceAfter;
      wallet.updatedAt = new Date().toISOString();

      // 3. Create Transaction in Ledger
      const now = new Date();
      const timestamp = now.toISOString();
      const txnId = `TXN-${now.getFullYear()}-${Date.now().toString().slice(-6)}`;
      const txn: WalletTransaction = {
        id: txnId,
        userId: request.userId,
        type: 'Wallet Top-up',
        amount: request.amount,
        balanceBefore,
        balanceAfter,
        date: timestamp.split('T')[0],
        time: now.toTimeString().split(' ')[0],
        source: `تغذية محفظة عبر الوكيل: ${request.agentName} (${request.paymentMethod})`,
        status: 'Completed',
        referenceId: request.id,
        notes: notes || `تم تأكيد العملية بواسطة ${agentUser.name}`,
      };
      this.data.transactions.push(txn);

      // 4. Update request status to Completed/Approved
      request.status = 'Completed';
      request.completedAt = timestamp;
      request.approvedAt = timestamp;
      request.approvedBy = agentUser.id;

      // 5. Update agent stats
      const agent = this.data.agents.find(a => a.id === request.agentId);
      if (agent) {
        agent.totalProcessedAmount = (agent.totalProcessedAmount || 0) + request.amount;
        agent.successfulOrders = (agent.successfulOrders || 0) + 1;
      }

      // 6. Send Notification to User
      this.data.notifications.push({
        id: `notif-${Date.now()}`,
        userId: request.userId,
        title: '✅ تم تأكيد تغذية المحفظة!',
        message: `تم إضافة مبلغ ${request.amount.toLocaleString()} SDG إلى محفظتك بنجاح بواسطة ${request.agentName}. رصيدك الحالي: ${balanceAfter.toLocaleString()} SDG.`,
        type: 'success',
        read: false,
        createdAt: timestamp,
      });

      // 7. Audit log
      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: agentUser.id,
        userName: agentUser.name,
        action: 'TOPUP_APPROVED',
        target: request.id,
        details: `تم اعتماد وتأكيد طلب شحن بقيمة ${request.amount.toLocaleString()} SDG للمستخدم ${request.userName} (${request.userUid}) بواسطة ${agentUser.name}. الرصيد قبل: ${balanceBefore.toLocaleString()} SDG، الرصيد بعد: ${balanceAfter.toLocaleString()} SDG.`,
        timestamp,
      });

      // Emit event for real-time notification service
      this.emit('topup:confirmed', { request, balanceAfter, agentUser });

      return request;
    });
  }

  // AGENT REJECT TOP-UP
  public async rejectTopUpRequest(requestId: string, agentUserId: string, reason?: string): Promise<WalletTopUpRequest> {
    return this.atomic(() => {
      const request = this.data.topUpRequests.find(r => r.id === requestId);
      if (!request) throw new Error('طلب التغذية غير موجود');
      if (request.status !== 'Pending') {
        throw new Error(`لا يمكن تكرار معالجة الطلب: تمت معالجة هذا الطلب مسبقًا بحالة (${request.status})`);
      }

      const agentUser = this.data.users.find(u => u.id === agentUserId);
      if (!agentUser) throw new Error('المستخدم غير موجود');

      if (agentUser.role !== 'super_admin') {
        if (agentUser.role !== 'agent' || agentUser.agentId !== request.agentId) {
          throw new Error('غير مصرح لك: هذا الطلب مسند لوكيل آخر ولا يمكنك معالجته');
        }
      }

      const now = new Date();
      const timestamp = now.toISOString();
      const rejectionReason = reason?.trim() || 'لم يصل التحويل البنكي إلى الحساب';

      request.status = 'Rejected';
      request.rejectedReason = rejectionReason;
      request.completedAt = timestamp;
      request.rejectedAt = timestamp;
      request.rejectedBy = agentUser.id;

      // Send Notification to user
      this.data.notifications.push({
        id: `notif-${Date.now()}`,
        userId: request.userId,
        title: '❌ تم رفض طلب تغذية المحفظة',
        message: `تم رفض طلب التغذية رقم ${request.id} بمبلغ ${request.amount.toLocaleString()} SDG. السبب: ${rejectionReason}`,
        type: 'error',
        read: false,
        createdAt: timestamp,
      });

      // Audit log
      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: agentUser.id,
        userName: agentUser.name,
        action: 'TOPUP_REJECTED',
        target: request.id,
        details: `رفض طلب تغذية بمبلغ ${request.amount.toLocaleString()} SDG للمستخدم ${request.userName} (${request.userUid}) بواسطة ${agentUser.name}. السبب: ${rejectionReason}`,
        timestamp,
      });

      // Emit event for real-time notification service
      this.emit('topup:rejected', { request, reason: rejectionReason, agentUser });

      return request;
    });
  }

  // ATOMIC ACCOUNT PURCHASE
  public async purchaseAccount(accountId: string, userId: string): Promise<{ order: Order; account: GameAccount }> {
    return this.atomic(() => {
      const account = this.data.gameAccounts.find(a => a.id === accountId);
      if (!account) throw new Error('الحساب غير موجود');
      if (account.status !== 'available') throw new Error('عذرًا، هذا الحساب تم بيعه بالفعل لمستخدم آخر');

      const user = this.data.users.find(u => u.id === userId);
      if (!user) throw new Error('المستخدم غير موجود');

      const wallet = this.getWallet(userId);
      const price = account.priceSDG;

      if (wallet.balance < price) {
        throw new Error(`رصيدك غير كافٍ. رصيدك الحالي: ${wallet.balance.toLocaleString()} SDG، وسعر الحساب: ${price.toLocaleString()} SDG. يرجى تغذية محفظتك.`);
      }

      // Atomic Balance deduction
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore - price;
      wallet.balance = balanceAfter;
      wallet.updatedAt = new Date().toISOString();

      const now = new Date();
      const txnId = `TXN-${now.getFullYear()}-${Date.now().toString().slice(-6)}`;
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;

      // Record transaction
      const txn: WalletTransaction = {
        id: txnId,
        userId: user.id,
        type: 'Game Purchase',
        amount: -price,
        balanceBefore,
        balanceAfter,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        source: `شراء حساب ${account.gameName}: ${account.title}`,
        status: 'Completed',
        referenceId: orderId,
        notes: `نوع التسجيل: ${account.accountCredentialsHidden.loginType}`,
      };
      this.data.transactions.push(txn);

      // Change account status to sold
      account.status = 'sold';
      account.buyerId = user.id;
      account.soldAt = now.toISOString();
      account.orderId = orderId;

      // Create Order
      const order: Order = {
        id: orderId,
        userId: user.id,
        userUid: user.uid,
        type: 'account_purchase',
        itemId: account.id,
        itemTitle: account.title,
        gameName: account.gameName,
        amountSDG: price,
        amountUSD: account.priceUSD,
        status: 'Completed',
        createdAt: now.toISOString(),
        transactionId: txnId,
        deliveredDetails: {
          loginType: account.accountCredentialsHidden.loginType,
          deliveryDetails: account.accountCredentialsHidden.deliveryDetails,
        }
      };
      this.data.orders.push(order);

      // Send User Notification
      this.data.notifications.push({
        id: `notif-${Date.now()}`,
        userId: user.id,
        title: '🎉 تهانينا! تم شراء الحساب بنجاح',
        message: `تم شراء "${account.title}" بنجاح وخصم ${price.toLocaleString()} SDG من محفظتك. يمكنك الاطلاع على بيانات الدخول الآن في صفحة تفاصيل الطلب.`,
        type: 'success',
        read: false,
        createdAt: now.toISOString(),
      });

      // Audit log
      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        action: 'ACCOUNT_PURCHASED',
        target: account.id,
        details: `شراء حساب ${account.title} بقيمة ${price} SDG. Order ID: ${orderId}`,
        timestamp: now.toISOString(),
      });

      this.emit('account:purchased', { order, account });

      return { order, account };
    });
  }

  // ATOMIC RECHARGE ORDER
  public async createRechargeOrder(params: {
    userId: string;
    gameId: string;
    packageId: string;
    playerId: string;
    serverOrRegion?: string;
  }): Promise<RechargeOrder> {
    return this.atomic(() => {
      const user = this.data.users.find(u => u.id === params.userId);
      if (!user) throw new Error('المستخدم غير موجود');

      const game = this.data.games.find(g => g.id === params.gameId);
      if (!game) throw new Error('اللعبة غير موجودة');

      const pkg = this.data.rechargePackages.find(p => p.id === params.packageId);
      if (!pkg) throw new Error('باقة الشحن غير موجودة');

      if (!params.playerId || params.playerId.trim().length === 0) {
        throw new Error('يرجى إدخال Player ID / معرف اللاعب');
      }

      const wallet = this.getWallet(user.id);
      const price = pkg.priceSDG;

      if (wallet.balance < price) {
        throw new Error(`رصيدك غير كافٍ. رصيدك الحالي: ${wallet.balance.toLocaleString()} SDG، وتكلفة الشحن: ${price.toLocaleString()} SDG.`);
      }

      // Deduct balance atomically
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore - price;
      wallet.balance = balanceAfter;
      wallet.updatedAt = new Date().toISOString();

      const now = new Date();
      const txnId = `TXN-${now.getFullYear()}-${Date.now().toString().slice(-6)}`;
      const rechargeId = `RCH-${Date.now().toString().slice(-6)}`;

      // Record transaction
      const txn: WalletTransaction = {
        id: txnId,
        userId: user.id,
        type: 'Game Recharge',
        amount: -price,
        balanceBefore,
        balanceAfter,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        source: `شحن ${game.name} (${pkg.name}) إلى المعرف: ${params.playerId}`,
        status: 'Completed',
        referenceId: rechargeId,
        notes: `الخادم/المنطقة: ${params.serverOrRegion || 'تلقائي'}`,
      };
      this.data.transactions.push(txn);

      // Create Recharge Order
      const rechargeOrder: RechargeOrder = {
        id: rechargeId,
        userId: user.id,
        userUid: user.uid,
        userName: user.name,
        gameId: game.id,
        gameName: game.name,
        packageId: pkg.id,
        packageName: pkg.name,
        playerId: params.playerId,
        serverOrRegion: params.serverOrRegion || 'الشرق الأوسط / تلقائي',
        amountSDG: price,
        amountUSD: pkg.priceUSD,
        status: 'Processing', // Simulated fast processing
        createdAt: now.toISOString(),
        transactionId: txnId,
      };
      this.data.rechargeOrders.push(rechargeOrder);

      // Also create generic order entry for order history
      this.data.orders.push({
        id: `ORD-${rechargeId.replace('RCH-', '')}`,
        userId: user.id,
        userUid: user.uid,
        type: 'recharge',
        itemId: pkg.id,
        itemTitle: `${game.name} - ${pkg.name}`,
        gameName: game.name,
        amountSDG: price,
        amountUSD: pkg.priceUSD,
        status: 'Pending',
        createdAt: now.toISOString(),
        transactionId: txnId,
        deliveredDetails: {
          playerId: params.playerId,
          serverOrRegion: params.serverOrRegion,
          diamondsOrPoints: pkg.diamondsOrPoints,
        }
      });

      // Send User Notification
      this.data.notifications.push({
        id: `notif-${Date.now()}`,
        userId: user.id,
        title: '⚡ جاري شحن اللعبة',
        message: `تم استلام طلب شحن ${pkg.name} للعبة ${game.name} (Player ID: ${params.playerId}). جاري الإرسال الفوري للعبة.`,
        type: 'info',
        read: false,
        createdAt: now.toISOString(),
      });

      // Audit log
      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        action: 'RECHARGE_CREATED',
        target: rechargeId,
        details: `طلب شحن ${game.name} - ${pkg.name} بقيمة ${price} SDG للمعرف ${params.playerId}`,
        timestamp: now.toISOString(),
      });

      this.emit('recharge:created', { order: rechargeOrder });

      return rechargeOrder;
    });
  }

  // RECHARGE STATUS UPDATE (Super Admin or API webhook with automatic refund support)
  public async updateRechargeStatus(orderId: string, status: 'Completed' | 'Failed' | 'Processing', reason?: string): Promise<RechargeOrder> {
    return this.atomic(() => {
      const order = this.data.rechargeOrders.find(o => o.id === orderId);
      if (!order) throw new Error('طلب الشحن غير موجود');

      const previousStatus = order.status;
      order.status = status;
      if (status === 'Completed') {
        order.completedAt = new Date().toISOString();
        this.data.notifications.push({
          id: `notif-${Date.now()}`,
          userId: order.userId,
          title: '✅ اكتمل الشحن بنجاح!',
          message: `تم تسليم ${order.packageName} لحسابك (${order.playerId}) في لعبة ${order.gameName} بنجاح. نتمنى لك تجربة ممتعة!`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        });
      } else if (status === 'Failed' && previousStatus !== 'Failed') {
        // Automatic Refund to user wallet
        const wallet = this.getWallet(order.userId);
        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + order.amountSDG;
        wallet.balance = balanceAfter;
        wallet.updatedAt = new Date().toISOString();

        const now = new Date();
        const refundTxnId = `TXN-${now.getFullYear()}-${Date.now().toString().slice(-6)}`;
        this.data.transactions.push({
          id: refundTxnId,
          userId: order.userId,
          type: 'Refund',
          amount: order.amountSDG,
          balanceBefore,
          balanceAfter,
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().split(' ')[0],
          source: `استرداد تلقائي لفشل شحن ${order.gameName} (${order.packageName})`,
          status: 'Completed',
          referenceId: order.id,
          notes: reason || 'فشل مزود خدمة الشحن في الاتصال بخادم اللعبة',
        });

        this.data.notifications.push({
          id: `notif-${Date.now()}`,
          userId: order.userId,
          title: '🔄 تم استرداد مبلغ الشحن إلى محفظتك',
          message: `تعذر شحن ${order.packageName} للمعرف ${order.playerId}. تم استرداد كامل المبلغ ${order.amountSDG.toLocaleString()} SDG إلى رصيد محفظتك تلقائيًا.`,
          type: 'warning',
          read: false,
          createdAt: now.toISOString(),
        });
      }

      this.emit('recharge:updated', { order, status, reason });

      return order;
    });
  }

  // ADMIN WALLET ADJUSTMENT
  public async adjustUserBalance(params: {
    userId: string;
    amount: number; // positive or negative
    reason: string;
    adminUserId: string;
  }): Promise<{ balance: number; transaction: WalletTransaction }> {
    return this.atomic(() => {
      const user = this.data.users.find(u => u.id === params.userId);
      if (!user) throw new Error('المستخدم غير موجود');

      const admin = this.data.users.find(u => u.id === params.adminUserId);
      if (!admin || admin.role !== 'super_admin') {
        throw new Error('فقط المدير العام يملك صلاحية تعديل الأرصدة يدويًا');
      }

      const wallet = this.getWallet(user.id);
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + params.amount;

      if (balanceAfter < 0) {
        throw new Error('لا يمكن للرصيد أن يصبح بالسالب');
      }

      wallet.balance = balanceAfter;
      wallet.updatedAt = new Date().toISOString();

      const now = new Date();
      const txnId = `TXN-${now.getFullYear()}-${Date.now().toString().slice(-6)}`;
      const txn: WalletTransaction = {
        id: txnId,
        userId: user.id,
        type: 'Adjustment',
        amount: params.amount,
        balanceBefore,
        balanceAfter,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        source: `تعديل إداري من قبل ${admin.name}`,
        status: 'Completed',
        notes: params.reason,
      };
      this.data.transactions.push(txn);

      this.data.notifications.push({
        id: `notif-${Date.now()}`,
        userId: user.id,
        title: 'تحديث في رصيد المحفظة',
        message: `تم إجراء تعديل إداري على رصيدك (${params.amount >= 0 ? '+' : ''}${params.amount.toLocaleString()} SDG). السبب: ${params.reason}`,
        type: 'info',
        read: false,
        createdAt: now.toISOString(),
      });

      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: admin.id,
        userName: admin.name,
        action: 'BALANCE_ADJUSTMENT',
        target: user.id,
        details: `تعديل رصيد ${user.name} بمقدار ${params.amount} SDG. الرصيد الجديد: ${balanceAfter} SDG. السبب: ${params.reason}`,
        timestamp: now.toISOString(),
      });

      return { balance: balanceAfter, transaction: txn };
    });
  }

  // REGISTER NEW CUSTOMER USER
  public async registerUser(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    avatar?: string;
  }): Promise<{ user: User; wallet: Wallet }> {
    return this.atomic(() => {
      // 1. Validate full name
      const name = (input.name || '').trim();
      if (name.length < 2) {
        throw new Error('يرجى إدخال الاسم الكامل بشكل صحيح (حرفين كحد أدنى)');
      }

      // 2. Validate email
      const email = (input.email || '').trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('يرجى إدخال بريد إلكتروني صالح');
      }
      if (this.data.users.some(u => u.email.toLowerCase() === email)) {
        throw new Error('البريد الإلكتروني مستخدم مسبقاً، يرجى استخدام بريد آخر أو تسجيل الدخول');
      }

      // 3. Validate phone
      const rawPhone = (input.phone || '').trim();
      const cleanPhoneDigits = rawPhone.replace(/\D/g, '');
      if (cleanPhoneDigits.length < 8 || cleanPhoneDigits.length > 15) {
        throw new Error('يرجى إدخال رقم هاتف صالح (بين 8 و 15 رقماً)');
      }
      if (this.data.users.some(u => u.phone && u.phone.replace(/\D/g, '') === cleanPhoneDigits)) {
        throw new Error('رقم الهاتف مسجل لحساب آخر مسبقاً');
      }

      // 4. Validate password
      const password = input.password || '';
      if (password.length < 6) {
        throw new Error('كلمة المرور يجب ألا تقل عن 6 خانات');
      }
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      // 5. Generate permanent, unique User ID (UID)
      let uid = '';
      let attempts = 0;
      do {
        uid = `UID-${Math.floor(100000 + Math.random() * 900000)}`;
        attempts++;
        if (attempts > 100) {
          uid = `UID-${Date.now().toString().slice(-6)}`;
          break;
        }
      } while (this.data.users.some(u => u.uid === uid));

      const newUserId = `usr-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const defaultAvatar = input.avatar && input.avatar.trim().length > 0
        ? input.avatar.trim()
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

      const newUser: User = {
        id: newUserId,
        uid,
        name,
        email,
        phone: rawPhone,
        avatar: defaultAvatar,
        passwordHash,
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      // 6. Initialize Wallet for new user
      const newWallet: Wallet = {
        id: `wlt-${newUser.id}`,
        userId: newUser.id,
        balance: 0,
        currency: 'SDG',
        updatedAt: new Date().toISOString(),
      };

      this.data.users.push(newUser);
      this.data.wallets[newUser.id] = newWallet;

      // 7. Audit log
      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: newUser.id,
        userName: newUser.name,
        action: 'USER_REGISTERED',
        target: newUser.id,
        details: `تسجيل مستخدم جديد: ${newUser.name} برقم هاتف (${newUser.phone}) وبريد (${newUser.email}) ومعرف فريد (${newUser.uid}).`,
        timestamp: new Date().toISOString(),
      });

      const { passwordHash: _, ...safeUser } = newUser;
      return { user: safeUser as User, wallet: newWallet };
    });
  }

  // LOGIN USER (CUSTOMER / AGENT / ADMIN)
  public async loginUser(identifier: string, password: string): Promise<{ user: User; wallet: Wallet }> {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');

    const user = this.data.users.find(u => {
      const emailMatch = u.email.toLowerCase() === cleanId;
      const uidMatch = u.uid.toLowerCase() === cleanId;
      const phoneMatch = cleanDigits.length >= 8 && u.phone && u.phone.replace(/\D/g, '') === cleanDigits;
      return emailMatch || uidMatch || phoneMatch;
    });

    if (!user) {
      throw new Error('بيانات الدخول غير مطابقة لأي حساب مسجل');
    }

    if (user.status === 'suspended') {
      throw new Error('هذا الحساب موقوف إدارياً، يرجى مراجعة إدارة المتجر');
    }

    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    if (user.passwordHash) {
      if (user.passwordHash !== inputHash) {
        throw new Error('كلمة المرور غير صحيحة');
      }
    } else {
      // Legacy agent password fallback
      if (user.role === 'agent') {
        const agent = this.data.agents.find(a => a.id === user.agentId);
        if (agent && agent.password && agent.password !== password) {
          throw new Error('كلمة المرور غير صحيحة');
        }
      }
    }

    const wallet = this.getWallet(user.id);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser as User, wallet };
  }

  // UPDATE USER PROFILE
  public async updateUserProfile(
    userId: string,
    updates: { name?: string; phone?: string; avatar?: string }
  ): Promise<User> {
    return this.atomic(() => {
      const user = this.data.users.find(u => u.id === userId);
      if (!user) throw new Error('المستخدم غير موجود');

      if (updates.name !== undefined && updates.name.trim().length > 0) {
        user.name = updates.name.trim();
      }
      if (updates.avatar !== undefined && updates.avatar.trim().length > 0) {
        user.avatar = updates.avatar.trim();
      }
      if (updates.phone !== undefined) {
        const rawPhone = updates.phone.trim();
        if (rawPhone.length > 0) {
          const cleanDigits = rawPhone.replace(/\D/g, '');
          if (cleanDigits.length < 8 || cleanDigits.length > 15) {
            throw new Error('يرجى إدخال رقم هاتف صالح (بين 8 و 15 رقماً)');
          }
          const duplicate = this.data.users.some(
            u => u.id !== userId && u.phone && u.phone.replace(/\D/g, '') === cleanDigits
          );
          if (duplicate) {
            throw new Error('رقم الهاتف مسجل لحساب آخر مسبقاً');
          }
          user.phone = rawPhone;
        } else {
          user.phone = '';
        }
      }

      const { passwordHash: _, ...safeUser } = user;
      return safeUser as User;
    });
  }

  // UPDATE USER STATUS (SUPER_ADMIN ONLY)
  public async updateUserStatus(userId: string, status: 'active' | 'suspended', adminUserId: string): Promise<User> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') {
        throw new Error('فقط المدير العام يملك صلاحية تغيير حالة المستخدمين');
      }
      const user = this.data.users.find(u => u.id === userId);
      if (!user) throw new Error('المستخدم غير موجود');

      user.status = status;

      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: admin.id,
        userName: admin.name,
        action: 'USER_STATUS_UPDATED',
        target: user.id,
        details: `تم تغيير حالة المستخدم ${user.name} (${user.uid}) إلى (${status}).`,
        timestamp: new Date().toISOString(),
      });

      return user;
    });
  }

  // STORE CUSTOMIZATION SETTINGS
  public async updateStoreSettings(settings: Partial<StoreSettings>, adminUserId: string): Promise<StoreSettings> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') {
        throw new Error('فقط المدير العام يملك صلاحية تعديل إعدادات المتجر');
      }

      this.data.storeSettings = {
        ...this.data.storeSettings,
        ...settings,
      };

      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: admin.id,
        userName: admin.name,
        action: 'STORE_SETTINGS_UPDATED',
        target: 'StoreSettings',
        details: 'تم تحديث هوية وإعدادات المتجر من لوحة الإدارة.',
        timestamp: new Date().toISOString(),
      });

      return this.data.storeSettings;
    });
  }

  // STORE SECTIONS MANAGEMENT
  public async updateSections(sections: StoreSection[], adminUserId: string): Promise<StoreSection[]> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') {
        throw new Error('غير مصرح');
      }
      this.data.storeSections = sections;
      return this.data.storeSections;
    });
  }

  // STORE BANNERS MANAGEMENT
  public async updateBanners(banners: StoreBanner[], adminUserId: string): Promise<StoreBanner[]> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') throw new Error('غير مصرح');
      this.data.storeBanners = banners;
      return this.data.storeBanners;
    });
  }

  // AGENTS MANAGEMENT
  public async upsertAgent(agent: Agent, adminUserId: string): Promise<Agent> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') throw new Error('غير مصرح');

      const existingIndex = this.data.agents.findIndex(a => a.id === agent.id);
      if (existingIndex >= 0) {
        this.data.agents[existingIndex] = { ...this.data.agents[existingIndex], ...agent };
        return this.data.agents[existingIndex];
      } else {
        const newAgent: Agent = {
          ...agent,
          id: agent.id || `agent-${Date.now().toString().slice(-4)}`,
          totalProcessedAmount: 0,
          successfulOrders: 0,
        };
        this.data.agents.push(newAgent);

        // Also create a linked agent user for login
        const agentUser: User = {
          id: `usr-${newAgent.id}`,
          uid: `UID-${Math.floor(100000 + Math.random() * 900000)}`,
          name: newAgent.name,
          email: `${newAgent.id}@gamingstore.com`,
          avatar: newAgent.avatar,
          role: 'agent',
          agentId: newAgent.id,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        this.data.users.push(agentUser);

        return newAgent;
      }
    });
  }

  public async deleteAgent(agentId: string, adminUserId: string): Promise<boolean> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') throw new Error('غير مصرح');
      this.data.agents = this.data.agents.filter(a => a.id !== agentId);
      return true;
    });
  }

  // GAMES MANAGEMENT
  public async upsertGame(game: Game, adminUserId: string): Promise<Game> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') throw new Error('غير مصرح');

      const index = this.data.games.findIndex(g => g.id === game.id);
      if (index >= 0) {
        this.data.games[index] = { ...this.data.games[index], ...game };
        return this.data.games[index];
      } else {
        const newGame: Game = {
          ...game,
          id: game.id || `game-${Date.now().toString().slice(-4)}`,
          order: this.data.games.length + 1,
        };
        this.data.games.push(newGame);
        return newGame;
      }
    });
  }

  public async deleteGame(gameId: string, adminUserId: string): Promise<boolean> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') throw new Error('غير مصرح');
      this.data.games = this.data.games.filter(g => g.id !== gameId);
      return true;
    });
  }

  // RECHARGE PACKAGES MANAGEMENT
  public async upsertPackage(pkg: RechargePackage, adminUserId: string): Promise<RechargePackage> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') throw new Error('غير مصرح');

      const index = this.data.rechargePackages.findIndex(p => p.id === pkg.id);
      if (index >= 0) {
        this.data.rechargePackages[index] = { ...this.data.rechargePackages[index], ...pkg };
        return this.data.rechargePackages[index];
      } else {
        const newPkg: RechargePackage = {
          ...pkg,
          id: pkg.id || `pkg-${Date.now().toString().slice(-4)}`,
          order: this.data.rechargePackages.length + 1,
        };
        this.data.rechargePackages.push(newPkg);
        return newPkg;
      }
    });
  }

  public async deletePackage(packageId: string, adminUserId: string): Promise<boolean> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') throw new Error('غير مصرح');
      this.data.rechargePackages = this.data.rechargePackages.filter(p => p.id !== packageId);
      return true;
    });
  }

  // GAME ACCOUNTS MANAGEMENT
  public async upsertAccount(account: GameAccount, adminUserId: string): Promise<GameAccount> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') throw new Error('غير مصرح');

      const index = this.data.gameAccounts.findIndex(a => a.id === account.id);
      if (index >= 0) {
        this.data.gameAccounts[index] = { ...this.data.gameAccounts[index], ...account };
        return this.data.gameAccounts[index];
      } else {
        const newAcc: GameAccount = {
          ...account,
          id: account.id || `acc-${Date.now().toString().slice(-4)}`,
          status: 'available',
        };
        this.data.gameAccounts.push(newAcc);
        return newAcc;
      }
    });
  }

  public async deleteAccount(accountId: string, adminUserId: string): Promise<boolean> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') throw new Error('غير مصرح');
      this.data.gameAccounts = this.data.gameAccounts.filter(a => a.id !== accountId);
      return true;
    });
  }

  // PAYMENT METHODS MANAGEMENT
  public async upsertPaymentMethod(method: PaymentMethod, adminUserId: string): Promise<PaymentMethod> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') throw new Error('غير مصرح');

      const index = this.data.paymentMethods.findIndex(m => m.id === method.id);
      if (index >= 0) {
        this.data.paymentMethods[index] = { ...this.data.paymentMethods[index], ...method };
        return this.data.paymentMethods[index];
      } else {
        const newMethod: PaymentMethod = {
          ...method,
          id: method.id || `method-${Date.now().toString().slice(-4)}`,
        };
        this.data.paymentMethods.push(newMethod);
        return newMethod;
      }
    });
  }

  public async deletePaymentMethod(methodId: string, adminUserId: string): Promise<boolean> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') throw new Error('غير مصرح');
      this.data.paymentMethods = this.data.paymentMethods.filter(m => m.id !== methodId);
      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: admin.id,
        userName: admin.name,
        action: 'PAYMENT_METHOD_DELETED',
        target: methodId,
        details: `حذف وسيلة الدفع ${methodId}`,
        timestamp: new Date().toISOString(),
      });
      return true;
    });
  }

  // USERS MANAGEMENT
  public async toggleUserStatus(userId: string, status: 'active' | 'suspended', adminUserId: string): Promise<User> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') throw new Error('فقط المدير العام يملك صلاحية تعديل حالة المستخدمين');
      const user = this.data.users.find(u => u.id === userId);
      if (!user) throw new Error('المستخدم غير موجود');
      if (user.role === 'super_admin') throw new Error('لا يمكن تعطيل حساب المدير العام');
      user.status = status;
      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: admin.id,
        userName: admin.name,
        action: 'USER_STATUS_CHANGED',
        target: user.id,
        details: `تغيير حالة المستخدم ${user.name} (${user.uid}) إلى ${status === 'active' ? 'مفعل' : 'معطل'}`,
        timestamp: new Date().toISOString(),
      });
      return user;
    });
  }

  // NOTIFICATIONS BROADCAST
  public async broadcastNotification(params: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error'; targetUserId?: string }, adminUserId: string): Promise<number> {
    return this.atomic(() => {
      const admin = this.data.users.find(u => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') throw new Error('غير مصرح');
      const now = new Date().toISOString();
      let sentCount = 0;
      if (params.targetUserId) {
        this.data.notifications.push({
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          userId: params.targetUserId,
          title: params.title,
          message: params.message,
          type: params.type || 'info',
          read: false,
          createdAt: now,
        });
        sentCount = 1;
      } else {
        this.data.users.forEach(u => {
          this.data.notifications.push({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            userId: u.id,
            title: params.title,
            message: params.message,
            type: params.type || 'info',
            read: false,
            createdAt: now,
          });
          sentCount++;
        });
      }
      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: admin.id,
        userName: admin.name,
        action: 'NOTIFICATION_BROADCAST',
        target: params.targetUserId || 'ALL_USERS',
        details: `إرسال إشعار تعميمي "${params.title}" لـ ${sentCount} مستخدم`,
        timestamp: now,
      });
      return sentCount;
    });
  }

  // DETAILED ANALYTICS
  public getDetailedAnalytics(timeRange: string = '7days') {
    const data = this.data;
    const now = new Date();
    let startDate = new Date();
    if (timeRange === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '7days') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === '30days') {
      startDate.setDate(now.getDate() - 30);
    } else if (timeRange === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(now.getDate() - 7);
    }

    const totalUsers = data.users.filter(u => u.role === 'user').length;
    const newUsers = data.users.filter(u => {
      if (u.role !== 'user') return false;
      const created = new Date(u.createdAt);
      return created >= startDate;
    }).length;

    // Total balance in all user wallets
    let totalWalletBalance = 0;
    Object.values(data.wallets).forEach(w => {
      totalWalletBalance += (w.balance || 0);
    });

    // Top-ups
    const topUpsInRange = data.topUpRequests.filter(r => {
      const d = new Date(r.createdAt);
      return d >= startDate;
    });
    const completedTopUps = topUpsInRange.filter(r => r.status === 'Completed');
    const totalTopUpAmount = completedTopUps.reduce((acc, r) => acc + r.amount, 0);

    // Recharges
    const rechargesInRange = data.rechargeOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= startDate;
    });
    const completedRecharges = rechargesInRange.filter(o => o.status === 'Completed');
    const rechargeSales = completedRecharges.reduce((acc, o) => acc + o.amountSDG, 0);

    // Accounts sold
    const accountOrdersInRange = data.orders.filter(o => {
      const d = new Date(o.createdAt);
      return o.type === 'account_purchase' && o.status === 'Completed' && d >= startDate;
    });
    const accountSales = accountOrdersInRange.reduce((acc, o) => acc + o.amountSDG, 0);

    const totalSales = rechargeSales + accountSales;
    const totalRechargeOrders = rechargesInRange.length;
    const availableAccounts = data.gameAccounts.filter(a => a.status === 'available').length;
    const pendingTopUps = data.topUpRequests.filter(r => r.status === 'Pending').length;
    const pendingRecharges = data.rechargeOrders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
    const pendingRequests = pendingTopUps + pendingRecharges;
    const estimatedProfits = Math.round(totalSales * 0.15); // Standard 15% margin

    // Generate chart data series by day for the selected period
    const daysCount = timeRange === 'today' ? 1 : (timeRange === '7days' ? 7 : 30);
    const chartData = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('ar-SD', { month: 'short', day: 'numeric' });

      // Daily sales
      const dayRechargeSales = data.rechargeOrders
        .filter(o => o.createdAt.startsWith(dateStr) && o.status === 'Completed')
        .reduce((sum, o) => sum + o.amountSDG, 0);
      const dayAccountSales = data.orders
        .filter(o => o.createdAt.startsWith(dateStr) && o.type === 'account_purchase' && o.status === 'Completed')
        .reduce((sum, o) => sum + o.amountSDG, 0);
      const dayTopUps = data.topUpRequests
        .filter(r => r.createdAt.startsWith(dateStr) && r.status === 'Completed')
        .reduce((sum, r) => sum + r.amount, 0);

      const dayTotalSales = dayRechargeSales + dayAccountSales;
      chartData.push({
        date: dateStr,
        label: displayDate,
        sales: dayTotalSales,
        topUps: dayTopUps,
        recharges: dayRechargeSales,
        accounts: dayAccountSales,
        revenue: Math.round(dayTotalSales * 0.15),
      });
    }

    return {
      totalUsers,
      newUsers,
      totalWalletBalance,
      totalTopUpAmount,
      totalSales,
      totalRechargeOrders,
      availableAccounts,
      pendingRequests,
      pendingTopUps,
      pendingRecharges,
      estimatedProfits,
      usdToSdgRate: data.storeSettings.usdToSdgRate,
      chartData,
    };
  }

  // OFFERS & NEWS MANAGEMENT
  public getOffers(onlyPublishedAndActive: boolean = true): OfferItem[] {
    const all = this.data.offers || [];
    const now = Date.now();

    if (!onlyPublishedAndActive) {
      return [...all].sort(
        (a, b) =>
          (a.order || 0) - (b.order || 0) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return all
      .filter((item) => {
        if (item.status !== 'Published') return false;
        if (item.endDate) {
          const end = new Date(item.endDate).getTime();
          if (!isNaN(end) && end < now) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          (a.order || 0) - (b.order || 0) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  public getOfferById(id: string): OfferItem | undefined {
    return (this.data.offers || []).find((o) => o.id === id);
  }

  public async createOffer(
    offerData: Partial<OfferItem>,
    adminUserId: string
  ): Promise<OfferItem> {
    return this.atomic(() => {
      const admin = this.data.users.find((u) => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') {
        throw new Error('فقط المدير العام يملك صلاحية إنشاء العروض والأخبار');
      }

      if (!offerData.title || !offerData.title.trim()) {
        throw new Error('يرجى إدخال عنوان العرض أو المنشور');
      }
      if (!offerData.description || !offerData.description.trim()) {
        throw new Error('يرجى إدخال وصف المحتوى');
      }

      const id = `off-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const now = new Date().toISOString();

      let discountPercentage = offerData.discountPercentage;
      if (
        offerData.oldPrice &&
        offerData.newPrice &&
        Number(offerData.oldPrice) > Number(offerData.newPrice)
      ) {
        if (!discountPercentage) {
          discountPercentage = Math.round(
            ((Number(offerData.oldPrice) - Number(offerData.newPrice)) /
              Number(offerData.oldPrice)) *
              100
          );
        }
      }

      const finalImage =
        offerData.image?.trim() ||
        offerData.imageUrl?.trim() ||
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80';

      const newOffer: OfferItem = {
        id,
        title: offerData.title.trim(),
        subtitle: offerData.subtitle?.trim(),
        image: finalImage,
        imageUrl: finalImage,
        badgeText: offerData.badgeText?.trim(),
        description: offerData.description.trim(),
        type: offerData.type || 'FEATURED_OFFER',
        oldPrice:
          offerData.oldPrice !== undefined ? Number(offerData.oldPrice) : undefined,
        newPrice:
          offerData.newPrice !== undefined ? Number(offerData.newPrice) : undefined,
        discountPercentage:
          discountPercentage !== undefined
            ? Number(discountPercentage)
            : offerData.discountPercent !== undefined
            ? Number(offerData.discountPercent)
            : undefined,
        discountPercent:
          discountPercentage !== undefined
            ? Number(discountPercentage)
            : offerData.discountPercent !== undefined
            ? Number(offerData.discountPercent)
            : undefined,
        startDate: offerData.startDate || now,
        endDate: offerData.endDate || offerData.validUntil || undefined,
        validUntil: offerData.validUntil || offerData.endDate || undefined,
        isFeatured: offerData.isFeatured !== undefined ? Boolean(offerData.isFeatured) : false,
        ctaText: offerData.ctaText?.trim() || offerData.actionLabel?.trim(),
        actionLabel: offerData.actionLabel?.trim() || offerData.ctaText?.trim(),
        ctaLink: offerData.ctaLink?.trim() || offerData.actionUrl?.trim(),
        actionUrl: offerData.actionUrl?.trim() || offerData.ctaLink?.trim(),
        ctaAction: offerData.ctaAction || 'custom',
        status: offerData.status || 'Published',
        order: offerData.order !== undefined ? Number(offerData.order) : 1,
        createdAt: now,
        updatedAt: now,
      };

      if (!Array.isArray(this.data.offers)) {
        this.data.offers = [];
      }
      this.data.offers.push(newOffer);

      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: admin.id,
        userName: admin.name,
        action: 'OFFER_CREATED',
        target: newOffer.id,
        details: `إنشاء منشور/عرض جديد: "${newOffer.title}" بنوع (${newOffer.type}) وحالة (${newOffer.status}).`,
        timestamp: now,
      });

      this.emit('offer:created', { offer: newOffer });

      return newOffer;
    });
  }

  public async updateOffer(
    id: string,
    updates: Partial<OfferItem>,
    adminUserId: string
  ): Promise<OfferItem> {
    return this.atomic(() => {
      const admin = this.data.users.find((u) => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') {
        throw new Error('فقط المدير العام يملك صلاحية تعديل العروض والأخبار');
      }

      const offer = (this.data.offers || []).find((o) => o.id === id);
      if (!offer) {
        throw new Error('المنشور/العرض غير موجود');
      }

      if (updates.title !== undefined) offer.title = updates.title.trim();
      if (updates.subtitle !== undefined) offer.subtitle = updates.subtitle.trim();
      if (updates.image !== undefined) {
        offer.image = updates.image.trim();
        offer.imageUrl = updates.image.trim();
      } else if (updates.imageUrl !== undefined) {
        offer.image = updates.imageUrl.trim();
        offer.imageUrl = updates.imageUrl.trim();
      }
      if (updates.badgeText !== undefined) offer.badgeText = updates.badgeText.trim();
      if (updates.isFeatured !== undefined) offer.isFeatured = Boolean(updates.isFeatured);
      if (updates.description !== undefined) offer.description = updates.description.trim();
      if (updates.type !== undefined) offer.type = updates.type;
      if (updates.oldPrice !== undefined)
        offer.oldPrice = updates.oldPrice ? Number(updates.oldPrice) : undefined;
      if (updates.newPrice !== undefined)
        offer.newPrice = updates.newPrice ? Number(updates.newPrice) : undefined;
      if (updates.discountPercentage !== undefined) {
        offer.discountPercentage = updates.discountPercentage ? Number(updates.discountPercentage) : undefined;
        offer.discountPercent = offer.discountPercentage;
      } else if (updates.discountPercent !== undefined) {
        offer.discountPercentage = updates.discountPercent ? Number(updates.discountPercent) : undefined;
        offer.discountPercent = offer.discountPercentage;
      }
      if (updates.startDate !== undefined) offer.startDate = updates.startDate;
      if (updates.endDate !== undefined) {
        offer.endDate = updates.endDate;
        offer.validUntil = updates.endDate;
      } else if (updates.validUntil !== undefined) {
        offer.endDate = updates.validUntil;
        offer.validUntil = updates.validUntil;
      }
      if (updates.ctaText !== undefined) {
        offer.ctaText = updates.ctaText.trim();
        offer.actionLabel = updates.ctaText.trim();
      } else if (updates.actionLabel !== undefined) {
        offer.ctaText = updates.actionLabel.trim();
        offer.actionLabel = updates.actionLabel.trim();
      }
      if (updates.ctaLink !== undefined) {
        offer.ctaLink = updates.ctaLink.trim();
        offer.actionUrl = updates.ctaLink.trim();
      } else if (updates.actionUrl !== undefined) {
        offer.ctaLink = updates.actionUrl.trim();
        offer.actionUrl = updates.actionUrl.trim();
      }
      if (updates.ctaAction !== undefined) offer.ctaAction = updates.ctaAction;
      if (updates.status !== undefined) offer.status = updates.status;
      if (updates.order !== undefined) offer.order = Number(updates.order);

      // Recalculate discount percentage if prices provided and discount % not explicit
      if (
        offer.oldPrice &&
        offer.newPrice &&
        offer.oldPrice > offer.newPrice &&
        updates.discountPercentage === undefined
      ) {
        offer.discountPercentage = Math.round(
          ((offer.oldPrice - offer.newPrice) / offer.oldPrice) * 100
        );
      }

      offer.updatedAt = new Date().toISOString();

      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: admin.id,
        userName: admin.name,
        action: 'OFFER_UPDATED',
        target: offer.id,
        details: `تحديث منشور/عرض: "${offer.title}".`,
        timestamp: new Date().toISOString(),
      });

      return offer;
    });
  }

  public async deleteOffer(id: string, adminUserId: string): Promise<boolean> {
    return this.atomic(() => {
      const admin = this.data.users.find((u) => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') {
        throw new Error('فقط المدير العام يملك صلاحية حذف العروض والأخبار');
      }

      const idx = (this.data.offers || []).findIndex((o) => o.id === id);
      if (idx === -1) {
        throw new Error('العرض غير موجود');
      }

      const removed = this.data.offers[idx];
      this.data.offers.splice(idx, 1);

      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: admin.id,
        userName: admin.name,
        action: 'OFFER_DELETED',
        target: id,
        details: `حذف منشور/عرض: "${removed.title}".`,
        timestamp: new Date().toISOString(),
      });

      return true;
    });
  }

  public async updateOfferStatus(
    id: string,
    status: OfferStatus,
    adminUserId: string
  ): Promise<OfferItem> {
    return this.atomic(() => {
      const admin = this.data.users.find((u) => u.id === adminUserId);
      if (!admin || admin.role !== 'super_admin') {
        throw new Error('فقط المدير العام يملك صلاحية تغيير حالة العروض والأخبار');
      }

      const offer = (this.data.offers || []).find((o) => o.id === id);
      if (!offer) {
        throw new Error('العرض غير موجود');
      }

      offer.status = status;
      offer.updatedAt = new Date().toISOString();

      this.data.auditLogs.push({
        id: `log-${Date.now()}`,
        userId: admin.id,
        userName: admin.name,
        action: 'OFFER_STATUS_CHANGED',
        target: offer.id,
        details: `تغيير حالة "${offer.title}" إلى (${status}).`,
        timestamp: new Date().toISOString(),
      });

      return offer;
    });
  }

  // MARK NOTIFICATIONS AS READ
  public async markNotificationsRead(userId: string): Promise<void> {
    return this.atomic(() => {
      this.data.notifications.forEach(n => {
        if (n.userId === userId) {
          n.read = true;
          n.readAt = new Date().toISOString();
        }
      });
    });
  }

  public async markNotificationRead(id: string, userId: string): Promise<boolean> {
    return this.atomic(() => {
      const notif = this.data.notifications.find(n => n.id === id && n.userId === userId);
      if (notif) {
        notif.read = true;
        notif.readAt = new Date().toISOString();
        return true;
      }
      return false;
    });
  }

  public async deleteNotification(id: string, userId: string): Promise<boolean> {
    return this.atomic(() => {
      const index = this.data.notifications.findIndex(n => n.id === id && n.userId === userId);
      if (index !== -1) {
        this.data.notifications.splice(index, 1);
        return true;
      }
      return false;
    });
  }

  public async clearReadNotifications(userId: string): Promise<number> {
    return this.atomic(() => {
      const initialCount = this.data.notifications.length;
      this.data.notifications = this.data.notifications.filter(n => !(n.userId === userId && n.read));
      return initialCount - this.data.notifications.length;
    });
  }
}

export const db = new DatabaseEngine();
