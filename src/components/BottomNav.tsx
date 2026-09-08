import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  User,
  Wallet,
  Gamepad2,
  Zap,
  ShieldCheck,
  UserCheck,
  ShoppingBag,
  Sparkles,
  Gift,
  HelpCircle,
  Flame,
  Bell
} from 'lucide-react';

// Icon resolver helper for dynamic White-Label sections
export const resolveIcon = (iconName: string, className: string = 'w-5 h-5') => {
  switch (iconName.toLowerCase()) {
    case 'bell':
    case 'notifications':
    case 'notif':
      return <Bell className={className} />;
    case 'zap':
    case 'recharge':
    case 'lightning':
      return <Zap className={className} />;
    case 'gamepad2':
    case 'gamepad':
    case 'accounts':
    case 'games':
      return <Gamepad2 className={className} />;
    case 'flame':
    case 'offers':
    case 'fire':
      return <Flame className={className} />;
    case 'wallet':
      return <Wallet className={className} />;
    case 'user':
    case 'profile':
      return <User className={className} />;
    case 'shoppingbag':
    case 'shop':
      return <ShoppingBag className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'gift':
      return <Gift className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
};

export const BottomNav: React.FC = () => {
  const { sections, activeTab, setActiveTab, currentUser } = useStore();

  // Filter visible sections sorted by order
  const visibleSections = sections
    .filter((s) => s.isVisible)
    .sort((a, b) => a.order - b.order);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b0e14]/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 md:py-2">
      <div className="max-w-lg mx-auto flex items-center justify-around gap-0.5 sm:gap-1">
        {visibleSections.map((section) => {
          const isActive = activeTab === section.key;
          return (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.key)}
              className={`relative flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 sm:px-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id={`nav-btn-${section.key}`}
            >
              {/* Active neon dot glow */}
              {isActive && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              )}

              <div
                className={`p-1 sm:p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 scale-105 shadow-sm'
                    : 'hover:bg-white/5'
                }`}
              >
                {resolveIcon(section.icon, 'w-4 h-4 sm:w-5 sm:h-5')}
              </div>

              <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight truncate max-w-full text-center whitespace-nowrap">
                {section.title}
              </span>

              {/* Badge if available */}
              {section.badge && (
                <span className="absolute top-0 right-1 px-1 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black bg-emerald-500 text-black">
                  {section.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Special Tab: Agent Portal (shown if user has agent role) */}
        {currentUser?.role === 'agent' && (
          <button
            onClick={() => setActiveTab('agent')}
            className={`relative flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 sm:px-2 rounded-2xl transition-all duration-200 ${
              activeTab === 'agent'
                ? 'text-indigo-400 font-bold'
                : 'text-indigo-400/60 hover:text-indigo-300'
            }`}
          >
            {activeTab === 'agent' && (
              <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#6366f1]" />
            )}
            <div className={`p-1 sm:p-1.5 rounded-xl ${activeTab === 'agent' ? 'bg-indigo-500/20 scale-105' : ''}`}>
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-[11px] mt-0.5 truncate max-w-full text-center whitespace-nowrap">بوابة الوكيل</span>
          </button>
        )}

        {/* Special Tab: Super Admin Dashboard (shown if user has super_admin role) */}
        {currentUser?.role === 'super_admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`relative flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 sm:px-2 rounded-2xl transition-all duration-200 ${
              activeTab === 'admin'
                ? 'text-amber-400 font-bold'
                : 'text-amber-400/60 hover:text-amber-300'
            }`}
          >
            {activeTab === 'admin' && (
              <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            )}
            <div className={`p-1 sm:p-1.5 rounded-xl ${activeTab === 'admin' ? 'bg-amber-500/20 scale-105' : ''}`}>
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-[11px] mt-0.5 truncate max-w-full text-center whitespace-nowrap">لوحة الإدارة</span>
          </button>
        )}
      </div>
    </nav>
  );
};
