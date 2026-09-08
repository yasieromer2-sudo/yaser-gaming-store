import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Wallet,
  StoreSettings,
  StoreSection,
  StoreBanner,
  Notification,
  OfferItem
} from '../types';
import { api } from '../lib/api';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface StoreContextType {
  currentUser: (User & { wallet: Wallet }) | null;
  settings: StoreSettings | null;
  sections: StoreSection[];
  banners: StoreBanner[];
  offers: OfferItem[];
  notifications: Notification[];
  unreadNotifsCount: number;
  markAllNotifsRead: () => Promise<void>;
  markNotifRead: (id: string) => Promise<void>;
  deleteNotif: (id: string) => Promise<void>;
  clearReadNotifs: () => Promise<void>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toasts: ToastMessage[];
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  switchUserRole: (userId: string) => Promise<void>;
  availableUsers: User[];
  refreshData: () => Promise<void>;
  loginUser: (identifier: string, password: string) => Promise<void>;
  registerUser: (data: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  isLoading: boolean;
  selectedCurrency: 'SDG' | 'USD';
  setSelectedCurrency: (curr: 'SDG' | 'USD') => void;
  formatPrice: (amountSDG: number, amountUSD?: number) => string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<(User & { wallet: Wallet }) | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [sections, setSections] = useState<StoreSection[]>([]);
  const [banners, setBanners] = useState<StoreBanner[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<string>('recharge');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCurrency, setSelectedCurrency] = useState<'SDG' | 'USD'>('SDG');

  const showToast = useCallback((title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Apply White-Label dynamic CSS variables & Document details
  const applyTheme = useCallback((s: StoreSettings) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', s.primaryColor || '#10b981');
    root.style.setProperty('--accent', s.accentColor || '#6366f1');
    if (s.fontFamily) {
      root.style.setProperty('--font-family', `'${s.fontFamily}', system-ui, sans-serif`);
    }

    if (s.themeMode === 'cyber') {
      root.style.setProperty('--bg-main', '#07090e');
      root.style.setProperty('--bg-card', '#0f1422');
    } else if (s.themeMode === 'light') {
      root.style.setProperty('--bg-main', '#f8fafc');
      root.style.setProperty('--bg-card', '#ffffff');
    } else {
      root.style.setProperty('--bg-main', '#0b0e14');
      root.style.setProperty('--bg-card', '#131722');
    }

    document.title = s.storeName ? `${s.storeName} - منصة الألعاب الرقمية` : 'Gaming Store';
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [stgs, secs, bans, user, notifs, offs] = await Promise.all([
        api.getStoreSettings(),
        api.getStoreSections(),
        api.getStoreBanners(),
        api.getCurrentUser(),
        api.getNotifications(),
        api.getOffers().catch(() => []),
      ]);

      let usersList: User[] = [];
      try {
        if (user.role === 'super_admin') {
          usersList = await api.getAllUsers();
        } else {
          usersList = await api.getDemoUsers();
        }
      } catch {
        usersList = await api.getDemoUsers().catch(() => []);
      }

      setSettings(stgs);
      applyTheme(stgs);
      setSections(secs);
      setBanners(bans);
      setOffers(offs);
      setCurrentUser(user);
      setNotifications(notifs);
      setAvailableUsers(usersList);
    } catch (err: any) {
      console.error('Error refreshing store data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [applyTheme]);

  const loginUser = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ identifier, password });
      await refreshData();
      showToast('مرحباً بك مجدداً', `تم تسجيل الدخول بنجاح (${res.user.name})`, 'success');
      if (res.user.role === 'super_admin') {
        setActiveTab('admin');
      } else if (res.user.role === 'agent') {
        setActiveTab('agent');
      } else {
        setActiveTab('recharge');
      }
    } catch (err: any) {
      showToast('خطأ في تسجيل الدخول', err.message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      await refreshData();
      showToast(
        'تم إنشاء الحساب بنجاح',
        `أهلاً بك يا ${res.user.name}! معرفك الرقمي الثابت: ${res.user.uid}`,
        'success'
      );
      setActiveTab('recharge');
    } catch (err: any) {
      showToast('تعذر التسجيل', err.message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const switchUserRole = async (userId: string) => {
    api.setActiveUserId(userId);
    setIsLoading(true);
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
      const notifs = await api.getNotifications();
      setNotifications(notifs);

      // Route view conveniently
      if (user.role === 'super_admin') {
        setActiveTab('admin');
        showToast('تم التبديل للوحة الإدارة', `أهلاً بك بصلاحيات المدير العام (Super Admin)`, 'info');
      } else if (user.role === 'agent') {
        setActiveTab('agent');
        showToast('تم التبديل لبوابة الوكيل', `أهلاً بك كوكيل شحن معتمد (${user.name})`, 'info');
      } else {
        setActiveTab('recharge');
        showToast('تم التبديل لحساب العميل', `تم تسجيل الدخول كمستخدم: ${user.name}`, 'info');
      }
    } catch (err: any) {
      showToast('خطأ في التبديل', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const markAllNotifsRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const markNotifRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err: any) {
      console.error(err);
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast('تم الحذف', 'تم حذف الإشعار بنجاح', 'info');
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const clearReadNotifs = async () => {
    try {
      const res = await api.clearReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.read));
      showToast('تم التنظيف', `تم حذف ${res.clearedCount} إشعار مقروء بنجاح`, 'info');
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const formatPrice = (amountSDG: number, amountUSD?: number) => {
    if (selectedCurrency === 'USD') {
      const usdVal = amountUSD !== undefined && amountUSD > 0
        ? amountUSD
        : (settings?.usdToSdgRate ? (amountSDG / settings.usdToSdgRate).toFixed(2) : '0');
      return `$${Number(usdVal).toLocaleString()}`;
    }
    return `${amountSDG.toLocaleString()} SDG`;
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        settings,
        sections,
        banners,
        offers,
        notifications,
        unreadNotifsCount,
        markAllNotifsRead,
        markNotifRead,
        deleteNotif,
        clearReadNotifs,
        activeTab,
        setActiveTab,
        toasts,
        showToast,
        removeToast,
        switchUserRole,
        availableUsers,
        refreshData,
        loginUser,
        registerUser,
        isLoading,
        selectedCurrency,
        setSelectedCurrency,
        formatPrice,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
