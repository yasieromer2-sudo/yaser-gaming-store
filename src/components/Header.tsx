import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { api } from '../lib/api';
import {
  Wallet,
  Bell,
  CheckCheck,
  ShieldCheck,
  UserCheck,
  User as UserIcon,
  ChevronDown,
  Layers,
  Sparkles,
  DollarSign,
  UserPlus,
  LogIn
} from 'lucide-react';
import { AuthModal } from './AuthModal';

export const Header: React.FC = () => {
  const {
    currentUser,
    settings,
    notifications,
    unreadNotifsCount,
    activeTab,
    setActiveTab,
    availableUsers,
    switchUserRole,
    selectedCurrency,
    setSelectedCurrency,
    showToast,
  } = useStore();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');

  const handleNotificationClick = async () => {
    setShowNotifMenu(!showNotifMenu);
    if (!showNotifMenu && unreadNotifsCount > 0) {
      // Mark as read
      try {
        if (currentUser?.id) {
          await api.markNotificationsRead();
        }
      } catch (e) {
        // silent
      }
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'super_admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <ShieldCheck className="w-3 h-3" />
          المدير العام (Super Admin)
        </span>
      );
    }
    if (role === 'agent') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          <UserCheck className="w-3 h-3" />
          وكيل شحن معتمد (Agent)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        <UserIcon className="w-3 h-3" />
        عميل (Customer)
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0b0e14]/90 backdrop-blur-md">
      {/* Announcement Bar if enabled */}
      {settings?.showAnnouncement && settings?.announcementText && (
        <div className="bg-gradient-to-r from-emerald-600/30 via-indigo-600/30 to-emerald-600/30 border-b border-white/5 py-1.5 px-4 text-center text-xs text-slate-200 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
          <span className="truncate">{settings.announcementText}</span>
        </div>
      )}

      {/* Backdrop for closing open menus */}
      {(showUserMenu || showNotifMenu) && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifMenu(false);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Store Logo & Branding (White-Label Dynamic) */}
        <div
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none min-w-0"
          onClick={() => setActiveTab('recharge')}
          id="store-branding-btn"
        >
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.storeName}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-white/15 shadow-sm shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-sm shrink-0">
              🎮
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-white flex items-center gap-1.5 truncate">
              <span className="truncate">{settings?.storeName || 'متجر الألعاب'}</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-white/10 text-emerald-400 border border-white/10 shrink-0">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 line-clamp-1 hidden md:block max-w-xs">
              {settings?.storeTagline || 'شحن فوري وحسابات ألعاب معتمدة'}
            </p>
          </div>
        </div>

        {/* Right Section: Currency Toggle, Wallet Balance, Notifications, User Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0 relative z-50">
          {/* Currency Toggle */}
          <div className="flex items-center bg-white/5 p-0.5 sm:p-1 rounded-xl border border-white/10 text-[11px] sm:text-xs">
            <button
              onClick={() => setSelectedCurrency('SDG')}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg font-bold transition-all ${
                selectedCurrency === 'SDG'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SDG
            </button>
            <button
              onClick={() => setSelectedCurrency('USD')}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg font-bold transition-all ${
                selectedCurrency === 'USD'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              USD
            </button>
          </div>

          {/* Quick Wallet Pill */}
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border transition-all ${
              activeTab === 'wallet'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-white/5 border-white/10 text-slate-200 hover:border-emerald-500/50 hover:bg-emerald-500/10'
            }`}
            id="header-wallet-btn"
          >
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <div className="text-right">
              <span className="text-[9px] sm:text-[10px] hidden sm:block text-slate-400 leading-none">المحفظة</span>
              <span className="text-[11px] sm:text-xs font-black text-white whitespace-nowrap">
                {currentUser?.wallet
                  ? selectedCurrency === 'USD'
                    ? `$${(currentUser.wallet.balance / (settings?.usdToSdgRate || 2650)).toFixed(1)}`
                    : `${currentUser.wallet.balance.toLocaleString()} SDG`
                  : '0 SDG'}
              </span>
            </div>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="relative p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
              id="notifications-btn"
              title="الإشعارات"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute left-0 top-12 w-80 max-w-[calc(100vw-1.5rem)] max-h-96 overflow-y-auto bg-[#131722] border border-white/15 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    الإشعارات الأخيرة
                  </h4>
                  <button
                    onClick={() => {
                      setShowNotifMenu(false);
                      setActiveTab('notifications');
                    }}
                    className="text-[11px] text-emerald-400 hover:underline font-bold"
                  >
                    عرض الكل ({notifications.length})
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">لا توجد إشعارات حالياً</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setShowNotifMenu(false);
                          if (n.targetUrl?.includes('wallet') || n.title.includes('محفظ') || n.title.includes('تغذية')) {
                            setActiveTab('wallet');
                          } else if (n.targetUrl?.includes('offers') || n.title.includes('عرض')) {
                            setActiveTab('offers');
                          } else {
                            setActiveTab('notifications');
                          }
                        }}
                        className={`p-2.5 rounded-xl text-xs border cursor-pointer transition-colors ${
                          n.read ? 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10' : 'bg-emerald-500/10 border-emerald-500/30 text-white hover:bg-emerald-500/15'
                        }`}
                      >
                        <div className="font-bold mb-1 flex items-center justify-between">
                          <span className="truncate max-w-[190px]">{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal shrink-0">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2.5 pt-2 border-t border-white/10 text-center">
                  <button
                    onClick={() => {
                      setShowNotifMenu(false);
                      setActiveTab('notifications');
                    }}
                    className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>فتح مركز الإشعارات الفورية</span>
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Account / Role Switcher Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 sm:pr-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              id="user-profile-menu-btn"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                alt={currentUser?.name}
                className="w-7 h-7 rounded-lg object-cover border border-white/20 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="hidden sm:block text-right">
                <span className="text-xs font-bold text-white block leading-tight truncate max-w-[85px]">
                  {currentUser?.name || 'مستخدم'}
                </span>
                <span className="text-[10px] text-emerald-400 block leading-none font-mono">
                  {currentUser?.uid}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Role Switcher & Account Menu */}
            {showUserMenu && (
              <div className="absolute left-0 top-12 w-72 max-w-[calc(100vw-1.5rem)] bg-[#131722] border border-white/15 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={currentUser?.avatar}
                      alt={currentUser?.name}
                      className="w-10 h-10 rounded-xl object-cover border border-emerald-500/50 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{currentUser?.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">{currentUser?.uid}</p>
                    </div>
                  </div>
                  <div>{currentUser && getRoleBadge(currentUser.role)}</div>
                </div>

                {/* Direct Role Switcher (For seamless testing of all roles) */}
                <div className="mb-3">
                  <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    تبديل الحساب والدور (تجربة سريعة):
                  </div>
                  <div className="space-y-1.5">
                    {availableUsers.map((u) => {
                      const isCurrent = u.id === currentUser?.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUserRole(u.id);
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-right p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            isCurrent
                              ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <div className="truncate">
                            <span className="block truncate">{u.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{u.role}</span>
                          </div>
                          {isCurrent && <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Links for current role */}
                <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                  {currentUser?.role === 'super_admin' && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-right p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      فتح لوحة تحكم المدير العام
                    </button>
                  )}
                  {currentUser?.role === 'agent' && (
                    <button
                      onClick={() => {
                        setActiveTab('agent');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-right p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      لوحة تحكم الوكيل (Agent Dashboard)
                    </button>
                  )}
                  {currentUser?.role !== 'agent' && currentUser?.role !== 'super_admin' && (
                    <button
                      onClick={() => {
                        setActiveTab('agent');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-right p-2 rounded-xl hover:bg-white/10 text-emerald-400 font-semibold flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      بوابة الوكلاء المعتمدين
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-right p-2 rounded-xl hover:bg-white/10 text-slate-300 flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    الملف الشخصي وإعدادات الحساب
                  </button>

                  <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        setAuthModalMode('register');
                        setShowAuthModal(true);
                        setShowUserMenu(false);
                      }}
                      className="py-1.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>تسجيل جديد</span>
                    </button>
                    <button
                      onClick={() => {
                        setAuthModalMode('login');
                        setShowAuthModal(true);
                        setShowUserMenu(false);
                      }}
                      className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>دخول</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register / Login Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </header>
  );
};
