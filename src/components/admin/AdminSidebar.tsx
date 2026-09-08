import React from 'react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowDownCircle,
  Zap,
  Gamepad2,
  ShoppingBag,
  CreditCard,
  DollarSign,
  Palette,
  Layers,
  Bell,
  ShieldCheck,
  FileText,
  UserCheck,
  X,
  Store,
  ChevronLeft,
  Flame
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export type AdminTab =
  | 'overview'
  | 'topups'
  | 'recharge'
  | 'users'
  | 'agents'
  | 'offers'
  | 'games'
  | 'packages'
  | 'accounts'
  | 'wallet'
  | 'payment_methods'
  | 'currency'
  | 'customization'
  | 'sections'
  | 'notifications'
  | 'audit_logs';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  pendingTopUpsCount?: number;
  pendingRechargesCount?: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingTopUpsCount = 0,
  pendingRechargesCount = 0,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const { settings, setActiveTab: setAppTab } = useStore();

  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: 'الرئيسية (Dashboard)',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'topups',
      label: 'طلبات تغذية المحافظ',
      icon: <ArrowDownCircle className="w-4 h-4 shrink-0" />,
      badge: pendingTopUpsCount,
      badgeColor: 'bg-amber-500 text-black',
    },
    {
      id: 'recharge',
      label: 'طلبات الشحن الرقمي',
      icon: <Zap className="w-4 h-4 shrink-0" />,
      badge: pendingRechargesCount,
      badgeColor: 'bg-emerald-500 text-black',
    },
    {
      id: 'users',
      label: 'المستخدمين والصلاحيات',
      icon: <Users className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'agents',
      label: 'إدارة شبكة الوكلاء',
      icon: <UserCheck className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'offers',
      label: 'العروض والأخبار (News)',
      icon: <Flame className="w-4 h-4 shrink-0 text-amber-400" />,
    },
    {
      id: 'wallet',
      label: 'الرقابة المالية والـ Ledger',
      icon: <Wallet className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'games',
      label: 'إدارة الألعاب',
      icon: <Gamepad2 className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'packages',
      label: 'باقات الشحن والأسعار',
      icon: <ShoppingBag className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'accounts',
      label: 'سوق الحسابات',
      icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'payment_methods',
      label: 'وسائل الدفع والحسابات',
      icon: <CreditCard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'currency',
      label: 'إدارة أسعار العملات',
      icon: <DollarSign className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'customization',
      label: 'تخصيص الهوية (White-Label)',
      icon: <Palette className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'sections',
      label: 'أقسام المتجر والواجهة',
      icon: <Layers className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'notifications',
      label: 'التعميمات والإشعارات',
      icon: <Bell className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'audit_logs',
      label: 'سجل العمليات (Audit Logs)',
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-72 bg-[#0d111a] border-l border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Brand & Store Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.storeName}
                className="w-10 h-10 rounded-xl object-contain bg-black/40 border border-white/10 p-1"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-base border border-amber-500/30">
                WL
              </div>
            )}
            <div>
              <h1 className="font-black text-sm text-white tracking-wide truncate max-w-[130px]">
                {settings?.storeName || 'Gaming Platform'}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-400 font-mono">
                  لوحة المدير العام
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsOpenMobile(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storefront Return Quick Button */}
        <div className="px-4 pt-3 pb-1">
          <button
            onClick={() => setAppTab('recharge')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold border border-white/5 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-400" />
              <span>معاينة المتجر للعملاء</span>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            الوظائف الإدارية والرقابية
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-black' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                      isActive ? 'bg-black text-amber-400' : (item.badgeColor || 'bg-amber-500/20 text-amber-300')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-white/10 bg-black/30">
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>White-Label Edition</span>
            <span className="font-mono text-emerald-400 font-bold">v2.5 Pro</span>
          </div>
        </div>
      </aside>
    </>
  );
};
