import React, { useState } from 'react';
import {
  Menu,
  Bell,
  LogOut,
  User,
  DollarSign,
  Store,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { api } from '../../lib/api';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  onRefreshAll: () => Promise<void>;
  isRefreshing?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleSidebar,
  onRefreshAll,
  isRefreshing = false,
}) => {
  const {
    currentUser,
    settings,
    notifications,
    unreadNotifsCount,
    setActiveTab,
    switchUserRole,
    availableUsers,
    showToast,
    refreshData
  } = useStore();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleMarkAllNotifsRead = async () => {
    try {
      await api.markNotificationsRead();
      await refreshData();
      showToast('تم التحديث', 'تم تمييز جميع الإشعارات كمقروءة', 'success');
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0f131d]/95 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left side: Hamburger & Store Identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white lg:hidden border border-white/10"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="font-extrabold text-white text-sm">
            {settings?.storeName || 'لوحة تحكم المتجر'}
          </span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-400 font-medium">المدير العام (Super Admin)</span>
        </div>
      </div>

      {/* Right side: Actions, Currency, Notifs, Admin User */}
      <div className="flex items-center gap-2.5">
        {/* Currency badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">1 USD =</span>
          <span className="font-bold text-white">
            {settings?.usdToSdgRate.toLocaleString()} SDG
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefreshAll}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
        </button>

        {/* Storefront View Button */}
        <button
          onClick={() => setActiveTab('recharge')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors"
          title="فتح واجهة متجر العملاء"
        >
          <Store className="w-3.5 h-3.5" />
          <span>المتجر</span>
        </button>

        {/* Notifications Drawer */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
            title="الإشعارات"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-mono font-bold flex items-center justify-center animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute left-0 sm:right-auto sm:left-0 mt-2 w-80 max-h-96 rounded-2xl bg-[#131722] border border-white/15 shadow-2xl overflow-hidden z-50 flex flex-col">
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
                <span className="text-xs font-bold text-white">الإشعارات والتنبيهات</span>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={handleMarkAllNotifsRead}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>

              <div className="overflow-y-auto max-h-72 p-2 space-y-1.5 divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">لا توجد إشعارات حالياً</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl text-xs space-y-1 transition-colors ${
                        n.read ? 'bg-transparent text-slate-400' : 'bg-white/5 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        {n.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : n.type === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        )}
                        <span>{n.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{n.message}</p>
                      <span className="text-[9px] text-slate-500 font-mono block">
                        {new Date(n.createdAt).toLocaleTimeString('ar-SD')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current Super Admin Badge & User switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={currentUser?.name}
              className="w-7 h-7 rounded-xl object-cover border border-amber-500/50"
              referrerPolicy="no-referrer"
            />
            <div className="hidden md:block text-right">
              <span className="font-extrabold text-xs text-white block leading-tight">
                {currentUser?.name || 'المدير العام'}
              </span>
              <span className="text-[9px] font-mono text-amber-400 block leading-none">
                Super Admin
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#131722] border border-white/15 shadow-2xl p-3 z-50 space-y-3">
              <div className="pb-2 border-b border-white/10">
                <span className="text-xs font-extrabold text-white block">{currentUser?.name}</span>
                <span className="text-[11px] text-slate-400 font-mono block">{currentUser?.email}</span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                  {currentUser?.uid}
                </span>
              </div>

              {/* Fast role switcher for testing & multi-role simulation */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-300 uppercase block">
                  تبديل حساب المستخدم (RBAC)
                </span>
                <div className="space-y-1">
                  {availableUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUserRole(u.id);
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-right transition-colors ${
                        u.id === currentUser?.id
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold'
                          : 'bg-black/30 hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        <span className="truncate max-w-[120px]">{u.name}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
