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
  StoreSection,
  StoreBanner,
  StoreSettings,
  AuditLog,
  OfferItem,
  OfferStatus
} from '../types';

class ApiClient {
  private activeUserId: string = (typeof window !== 'undefined' && localStorage.getItem('gamestore_active_user_id')) || 'usr-admin';

  public setActiveUserId(userId: string) {
    this.activeUserId = userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gamestore_active_user_id', userId);
    }
  }

  public getActiveUserId(): string {
    return this.activeUserId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': this.activeUserId,
      ...(options.headers || {}),
    };

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    const json = await response.json();
    if (!json.success) {
      throw new Error(json.error || 'حدث خطأ غير متوقع');
    }
    return json.data;
  }

  // Store & Settings
  public async getStoreSettings(): Promise<StoreSettings> {
    return this.request<StoreSettings>('/store/settings');
  }

  public async updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    return this.request<StoreSettings>('/store/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  public async getStoreSections(): Promise<StoreSection[]> {
    return this.request<StoreSection[]>('/store/sections');
  }

  public async updateStoreSections(sections: StoreSection[]): Promise<StoreSection[]> {
    return this.request<StoreSection[]>('/store/sections', {
      method: 'POST',
      body: JSON.stringify({ sections }),
    });
  }

  public async updateSection(sectionId: string, updates: Partial<StoreSection>): Promise<StoreSection[]> {
    const current = await this.getStoreSections();
    const updated = current.map(s => s.id === sectionId ? { ...s, ...updates } : s);
    return this.updateStoreSections(updated);
  }

  public async createSection(section: Partial<StoreSection>): Promise<StoreSection[]> {
    const current = await this.getStoreSections();
    const newSec: StoreSection = {
      id: `sec-${Date.now()}`,
      key: (section.title || 'custom').toLowerCase().replace(/\s+/g, '-'),
      title: section.title || 'قسم جديد',
      icon: section.icon || 'Folder',
      order: current.length + 1,
      isVisible: true,
      isDefault: false,
      ...section,
    };
    return this.updateStoreSections([...current, newSec]);
  }

  public async deleteSection(sectionId: string): Promise<StoreSection[]> {
    const current = await this.getStoreSections();
    const filtered = current.filter(s => s.id !== sectionId);
    return this.updateStoreSections(filtered);
  }

  public async getStoreBanners(): Promise<StoreBanner[]> {
    return this.request<StoreBanner[]>('/store/banners');
  }

  public async updateStoreBanners(banners: StoreBanner[]): Promise<StoreBanner[]> {
    return this.request<StoreBanner[]>('/store/banners', {
      method: 'POST',
      body: JSON.stringify({ banners }),
    });
  }

  // User & Profile
  public async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    avatar?: string;
  }): Promise<{ user: User; wallet: Wallet }> {
    const res = await this.request<{ user: User; wallet: Wallet }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.user?.id) {
      this.setActiveUserId(res.user.id);
    }
    return res;
  }

  public async login(data: {
    identifier: string;
    password: string;
  }): Promise<{ user: User; wallet: Wallet }> {
    const res = await this.request<{ user: User; wallet: Wallet }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.user?.id) {
      this.setActiveUserId(res.user.id);
    }
    return res;
  }

  public async getCurrentUser(): Promise<User & { wallet: Wallet }> {
    return this.request<User & { wallet: Wallet }>('/users/me');
  }

  public async updateProfile(updates: {
    name?: string;
    phone?: string;
    avatar?: string;
  }): Promise<User> {
    return this.request<User>('/users/profile', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  }

  public async getAllUsers(): Promise<(User & { wallet: Wallet; ordersCount: number })[]> {
    return this.request<(User & { wallet: Wallet; ordersCount: number })[]>('/users');
  }

  public async getDemoUsers(): Promise<User[]> {
    return this.request<User[]>('/auth/demo-users');
  }

  // Wallet
  public async getWallet(): Promise<{ wallet: Wallet; transactions: WalletTransaction[] }> {
    return this.request<{ wallet: Wallet; transactions: WalletTransaction[] }>('/wallet');
  }

  public async getTransactions(all?: boolean): Promise<WalletTransaction[]> {
    return this.request<WalletTransaction[]>(`/wallet/transactions${all ? '?all=true' : ''}`);
  }

  public async getWalletTransactions(all?: boolean): Promise<WalletTransaction[]> {
    return this.getTransactions(all);
  }

  public async createTopUpRequest(data: {
    agentId: string;
    amount: number;
    paymentMethod: string;
    transferReference?: string;
  }): Promise<WalletTopUpRequest> {
    return this.request<WalletTopUpRequest>('/wallet/top-up-request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async adjustUserBalance(data: {
    userId: string;
    amount: number;
    reason: string;
  }): Promise<{ balance: number; transaction: WalletTransaction }> {
    return this.request<{ balance: number; transaction: WalletTransaction }>('/wallet/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async adjustWalletBalance(userId: string, amount: number, reason: string) {
    return this.adjustUserBalance({ userId, amount, reason });
  }

  // Agents
  public async getAgents(): Promise<Agent[]> {
    return this.request<Agent[]>('/agents');
  }

  public async upsertAgent(agent: Partial<Agent>): Promise<Agent> {
    return this.request<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  public async updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent> {
    return this.upsertAgent({ ...updates, id: agentId });
  }

  public async createAgent(agent: Partial<Agent>): Promise<Agent> {
    return this.upsertAgent(agent);
  }

  public async deleteAgent(agentId: string): Promise<void> {
    return this.request<void>(`/agents/${agentId}`, {
      method: 'DELETE',
    });
  }

  public async getTopUpRequests(all?: boolean): Promise<WalletTopUpRequest[]> {
    return this.request<WalletTopUpRequest[]>(`/agent/requests${all ? '?all=true' : ''}`);
  }

  public async getAgentTopUpRequests(): Promise<WalletTopUpRequest[]> {
    return this.request<WalletTopUpRequest[]>('/agent/requests');
  }

  public async getAgentRequestDetails(requestId: string): Promise<WalletTopUpRequest> {
    return this.request<WalletTopUpRequest>(`/agent/requests/${requestId}`);
  }

  public async getAgentStats(agentId?: string): Promise<{
    agentId: string;
    agentName: string;
    totalProcessedAmount: number;
    successfulOrders: number;
    pendingOrders: number;
    rejectedOrders: number;
    totalOrders: number;
  }> {
    return this.request(`/agent/stats${agentId ? `?agentId=${agentId}` : ''}`);
  }

  public async confirmTopUpRequest(requestId: string): Promise<WalletTopUpRequest> {
    return this.request<WalletTopUpRequest>(`/agent/requests/${requestId}/confirm`, {
      method: 'POST',
    });
  }

  public async approveTopUpRequest(requestId: string, notes?: string): Promise<WalletTopUpRequest> {
    return this.request<WalletTopUpRequest>(`/agent/requests/${requestId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  public async rejectTopUpRequest(requestId: string, reason?: string): Promise<WalletTopUpRequest> {
    return this.request<WalletTopUpRequest>(`/agent/requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Games & Packages
  public async getGames(all?: boolean): Promise<Game[]> {
    return this.request<Game[]>(`/games${all ? '?all=true' : ''}`);
  }

  public async upsertGame(game: Partial<Game>): Promise<Game> {
    return this.request<Game>('/games', {
      method: 'POST',
      body: JSON.stringify(game),
    });
  }

  public async updateGame(gameId: string, updates: Partial<Game>): Promise<Game> {
    return this.upsertGame({ ...updates, id: gameId });
  }

  public async createGame(game: Partial<Game>): Promise<Game> {
    return this.upsertGame(game);
  }

  public async deleteGame(gameId: string): Promise<void> {
    return this.request<void>(`/games/${gameId}`, {
      method: 'DELETE',
    });
  }

  public async getPackages(gameId?: string): Promise<RechargePackage[]> {
    return this.request<RechargePackage[]>(`/packages${gameId ? `?gameId=${gameId}` : ''}`);
  }

  public async upsertPackage(pkg: Partial<RechargePackage>): Promise<RechargePackage> {
    return this.request<RechargePackage>('/packages', {
      method: 'POST',
      body: JSON.stringify(pkg),
    });
  }

  public async updateRechargePackage(
    pkgIdOrGameId: string,
    pkgIdOrUpdates: string | Partial<RechargePackage>,
    maybeUpdates?: Partial<RechargePackage>
  ): Promise<RechargePackage> {
    if (typeof pkgIdOrUpdates === 'string' && maybeUpdates) {
      return this.upsertPackage({ ...maybeUpdates, gameId: pkgIdOrGameId, id: pkgIdOrUpdates });
    }
    return this.upsertPackage({ ...(pkgIdOrUpdates as Partial<RechargePackage>), id: pkgIdOrGameId });
  }

  public async createRechargePackage(
    gameIdOrPkg: string | Partial<RechargePackage>,
    maybePkg?: Partial<RechargePackage>
  ): Promise<RechargePackage> {
    if (typeof gameIdOrPkg === 'string' && maybePkg) {
      return this.upsertPackage({ ...maybePkg, gameId: gameIdOrPkg });
    }
    return this.upsertPackage(gameIdOrPkg as Partial<RechargePackage>);
  }

  public async deleteRechargePackage(pkgIdOrGameId: string, maybePkgId?: string): Promise<void> {
    const pkgId = maybePkgId || pkgIdOrGameId;
    return this.deletePackage(pkgId);
  }

  public async createPackage(gameId: string, pkg: Partial<RechargePackage>): Promise<RechargePackage> {
    return this.upsertPackage({ ...pkg, gameId });
  }

  public async deletePackage(pkgId: string): Promise<void> {
    return this.request<void>(`/packages/${pkgId}`, {
      method: 'DELETE',
    });
  }

  // Accounts Marketplace
  public async getAccounts(gameId?: string): Promise<GameAccount[]> {
    return this.request<GameAccount[]>(`/accounts${gameId ? `?gameId=${gameId}` : ''}`);
  }

  public async getGameAccounts(gameIdOrAll?: string | boolean): Promise<GameAccount[]> {
    const gameId = typeof gameIdOrAll === 'string' ? gameIdOrAll : undefined;
    return this.getAccounts(gameId);
  }

  public async upsertAccount(account: Partial<GameAccount>): Promise<GameAccount> {
    return this.request<GameAccount>('/accounts', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  }

  public async updateGameAccount(accountId: string, updates: Partial<GameAccount>): Promise<GameAccount> {
    return this.upsertAccount({ ...updates, id: accountId });
  }

  public async createGameAccount(account: Partial<GameAccount>): Promise<GameAccount> {
    return this.upsertAccount(account);
  }

  public async createAccount(account: Partial<GameAccount>): Promise<GameAccount> {
    return this.upsertAccount(account);
  }

  public async deleteAccount(accountId: string): Promise<void> {
    return this.request<void>(`/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  public async deleteGameAccount(accountId: string): Promise<void> {
    return this.deleteAccount(accountId);
  }

  public async purchaseAccount(accountId: string): Promise<{ order: Order; account: GameAccount }> {
    return this.request<{ order: Order; account: GameAccount }>('/accounts/purchase', {
      method: 'POST',
      body: JSON.stringify({ accountId }),
    });
  }

  // Recharge Orders
  public async createRechargeOrder(data: {
    gameId: string;
    packageId: string;
    playerId: string;
    serverOrRegion?: string;
  }): Promise<RechargeOrder> {
    return this.request<RechargeOrder>('/recharge/order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getRechargeOrders(all?: boolean): Promise<RechargeOrder[]> {
    return this.request<RechargeOrder[]>(`/recharge/orders${all ? '?all=true' : ''}`);
  }

  public async updateRechargeStatus(orderId: string, status: 'Completed' | 'Failed' | 'Processing', reason?: string): Promise<RechargeOrder> {
    return this.request<RechargeOrder>(`/recharge/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    });
  }

  // Payment Methods
  public async getPaymentMethods(): Promise<PaymentMethod[]> {
    return this.request<PaymentMethod[]>('/payment-methods');
  }

  public async upsertPaymentMethod(method: Partial<PaymentMethod>): Promise<PaymentMethod> {
    return this.request<PaymentMethod>('/payment-methods', {
      method: 'POST',
      body: JSON.stringify(method),
    });
  }

  public async deletePaymentMethod(methodId: string): Promise<void> {
    return this.request<void>(`/payment-methods/${methodId}`, {
      method: 'DELETE',
    });
  }

  // User Management
  public async toggleUserStatus(userId: string, status: 'active' | 'suspended'): Promise<User> {
    return this.request<User>(`/users/${userId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  // Agent Management
  public async resetAgentPassword(agentId: string, newPassword?: string): Promise<Agent> {
    return this.request<Agent>(`/agents/${agentId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  // Orders & Notifications
  public async getOrders(all?: boolean): Promise<Order[]> {
    return this.request<Order[]>(`/orders${all ? '?all=true' : ''}`);
  }

  public async getNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('/notifications');
  }

  public async markNotificationsRead(): Promise<void> {
    return this.request<void>('/notifications/read', {
      method: 'POST',
    });
  }

  public async markNotificationRead(id: string): Promise<void> {
    return this.request<void>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  public async deleteNotification(id: string): Promise<void> {
    return this.request<void>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  public async clearReadNotifications(): Promise<{ clearedCount: number }> {
    return this.request<{ clearedCount: number }>('/notifications/clear-read', {
      method: 'DELETE',
    });
  }

  public async getVapidPublicKey(): Promise<{ publicKey: string }> {
    return this.request<{ publicKey: string }>('/notifications/vapid-public-key');
  }

  public async subscribeToPush(data: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
    deviceName?: string;
  }): Promise<PushSubscriptionRecord> {
    return this.request<PushSubscriptionRecord>('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async unsubscribeFromPush(endpoint: string): Promise<{ success: boolean; removed: boolean }> {
    return this.request<{ success: boolean; removed: boolean }>('/notifications/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
  }

  public async sendTestNotification(): Promise<Notification> {
    return this.request<Notification>('/notifications/test', {
      method: 'POST',
    });
  }

  public async broadcastNotification(data: {
    title: string;
    message: string;
    body?: string;
    type?: string;
    targetRole?: string;
    targetUserId?: string;
    targetUrl?: string;
  }): Promise<{ sentCount: number }> {
    return this.request<{ sentCount: number }>('/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin Overview & Analytics
  public async getAdminOverview(): Promise<any> {
    return this.request<any>('/admin/overview');
  }

  public async getAdminAnalytics(timeRange?: string): Promise<any> {
    return this.request<any>(`/admin/analytics${timeRange ? `?timeRange=${timeRange}` : ''}`);
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/admin/audit-logs');
  }

  // Offers & News
  public async getOffers(all?: boolean): Promise<OfferItem[]> {
    return this.request<OfferItem[]>(`/offers${all ? '?all=true' : ''}`);
  }

  public async getOfferById(id: string): Promise<OfferItem> {
    return this.request<OfferItem>(`/offers/${id}`);
  }

  public async createOffer(offer: Partial<OfferItem>): Promise<OfferItem> {
    return this.request<OfferItem>('/offers', {
      method: 'POST',
      body: JSON.stringify(offer),
    });
  }

  public async updateOffer(id: string, updates: Partial<OfferItem>): Promise<OfferItem> {
    return this.request<OfferItem>(`/offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async deleteOffer(id: string): Promise<void> {
    return this.request<void>(`/offers/${id}`, {
      method: 'DELETE',
    });
  }

  public async updateOfferStatus(id: string, status: OfferStatus): Promise<OfferItem> {
    return this.request<OfferItem>(`/offers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }
}

export const api = new ApiClient();
