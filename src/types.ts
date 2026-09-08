export type UserRole = 'super_admin' | 'agent' | 'user';

export interface User {
  id: string;
  uid: string; // Permanent Unique ID e.g. UID-928174
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  passwordHash?: string;
  role: UserRole;
  agentId?: string; // If user is an agent, matches Agent.id
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number; // In SDG
  currency: 'SDG';
  updatedAt: string;
}

export type TransactionType =
  | 'Wallet Top-up'
  | 'Game Purchase'
  | 'Game Recharge'
  | 'Refund'
  | 'Adjustment';

export interface WalletTransaction {
  id: string; // e.g. TXN-89312
  userId: string;
  type: TransactionType;
  amount: number; // positive for credit, negative for debit
  balanceBefore: number;
  balanceAfter: number;
  date: string;
  time: string;
  source: string;
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded';
  referenceId?: string;
  notes?: string;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  username?: string;
  password?: string;
  status: 'available' | 'unavailable';
  userId?: string;
  isOnline?: boolean;
  paymentMethods: string[]; // method IDs e.g. ['bankak', 'mycash', 'okash']
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  whatsappNumber: string;
  paymentInstructions: string;
  totalProcessedAmount: number;
  successfulOrders: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  iconName: string;
  color: string;
  description: string;
  isActive: boolean;
  isEnabled?: boolean;
  accountNumber?: string;
  accountName?: string;
  instructions?: string;
  icon?: string;
}

export interface WalletTopUpRequest {
  id: string; // e.g. REQ-73412
  userId: string;
  userName: string;
  userUid: string;
  agentId: string;
  agentName: string;
  amount: number;
  paymentMethod: string;
  transferReference?: string;
  receiptUrl?: string;
  receiptImage?: string;
  status: 'Pending' | 'Completed' | 'Rejected' | 'Approved';
  createdAt: string;
  completedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectedReason?: string;
  rejectionReason?: string;
  adminNotes?: string;
  whatsappOpened: boolean;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
  icon: string;
  banner: string;
  category: string;
  developer: string;
  description: string;
  isActive: boolean;
  rechargeEnabled: boolean;
  accountsEnabled: boolean;
  order: number;
}

export interface RechargePackage {
  id: string;
  gameId: string;
  name: string;
  diamondsOrPoints: string;
  priceSDG: number;
  priceUSD: number;
  badge?: string;
  icon: string;
  isActive: boolean;
  order: number;
  diamonds?: number | string;
}

export interface RechargeOrder {
  id: string; // e.g. RCH-90234
  userId: string;
  userUid: string;
  userName: string;
  gameId: string;
  gameName: string;
  packageId: string;
  packageName: string;
  playerId: string;
  serverOrRegion?: string;
  amountSDG: number;
  amountUSD: number;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled';
  createdAt: string;
  completedAt?: string;
  transactionId: string;
  notes?: string;
}

export interface GameAccount {
  id: string;
  gameId: string;
  gameName: string;
  title: string;
  level: number;
  description: string;
  skinsCount: number;
  keyItems: string[];
  priceUSD: number;
  priceSDG: number;
  images: string[];
  status: 'available' | 'reserved' | 'sold' | 'hidden';
  accountCredentialsHidden: {
    loginType: string;
    deliveryDetails: string;
  };
  buyerId?: string;
  soldAt?: string;
  orderId?: string;
  rank?: string;
  accountDetails?: string;
  credentials?: string;
}

export interface Order {
  id: string; // e.g. ORD-29384
  userId: string;
  userUid: string;
  type: 'account_purchase' | 'recharge';
  itemId: string;
  itemTitle: string;
  gameName: string;
  amountSDG: number;
  amountUSD: number;
  status: 'Completed' | 'Pending' | 'Cancelled' | 'Refunded';
  createdAt: string;
  transactionId: string;
  deliveredDetails?: any;
}

export type NotificationType =
  | 'topup_confirmed'
  | 'topup_rejected'
  | 'topup_requested'
  | 'recharge_created'
  | 'recharge_processing'
  | 'recharge_completed'
  | 'recharge_failed'
  | 'recharge_refunded'
  | 'account_purchased'
  | 'order_confirmed'
  | 'refund'
  | 'broadcast'
  | 'offer_new'
  | 'system_alert'
  | 'success'
  | 'info'
  | 'warning'
  | 'error';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  body?: string; // alias for message
  type: NotificationType;
  data?: Record<string, any>;
  targetUrl?: string;
  targetScreen?: string;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  pushStatus?: 'sent' | 'failed' | 'pending' | 'no_subscription';
  eventId?: string;
}

export type AppNotification = Notification;

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  keys: PushSubscriptionKeys;
  userAgent?: string;
  deviceName?: string;
  createdAt: string;
  lastUsedAt: string;
  isActive: boolean;
}

export interface StoreSection {
  id: string;
  key: string; // 'profile' | 'wallet' | 'accounts' | 'recharge' | custom string
  title: string;
  icon: string; // lucide icon identifier
  order: number;
  isVisible: boolean;
  isDefault: boolean;
  badge?: string;
  customContent?: string;
  isEnabled?: boolean;
  isCustom?: boolean;
  route?: string;
}

export interface StoreBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkSection: string;
  isActive: boolean;
  badge: string;
  order: number;
}

export interface CurrencySetting {
  code: string;
  name: string;
  symbol: string;
  rateToSDG: number; // 1 USD = X SDG
  isDefault: boolean;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  storeDescription: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  themeMode: 'dark' | 'light' | 'cyber';
  usdToSdgRate: number; // default e.g. 2650 SDG per 1 USD
  baseCurrency: 'SDG';
  whatsappSupportNumber: string;
  contactEmail: string;
  termsOfService: string;
  privacyPolicy: string;
  announcementText?: string;
  showAnnouncement: boolean;
  maintenanceMode: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export type OfferType = 'FEATURED_OFFER' | 'DISCOUNT' | 'NEWS' | 'ANNOUNCEMENT';
export type OfferStatus = 'Published' | 'Draft' | 'Expired' | 'Hidden';

export interface OfferItem {
  id: string; // e.g. OFF-92814
  title: string;
  subtitle?: string;
  image: string;
  imageUrl?: string;
  badgeText?: string;
  description: string;
  type: OfferType;
  oldPrice?: number;
  newPrice?: number;
  discountPercentage?: number;
  discountPercent?: number;
  startDate?: string;
  endDate?: string;
  validUntil?: string;
  isFeatured?: boolean;
  ctaText?: string;
  actionLabel?: string;
  ctaLink?: string;
  actionUrl?: string;
  ctaAction?: 'recharge' | 'accounts' | 'wallet' | 'custom';
  status: OfferStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
