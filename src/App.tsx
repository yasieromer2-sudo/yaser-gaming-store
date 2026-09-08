import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/ToastContainer';
import { RechargeView } from './components/RechargeView';
import { AccountsView } from './components/AccountsView';
import { OffersView } from './components/OffersView';
import { WalletView } from './components/WalletView';
import { ProfileView } from './components/ProfileView';
import { AgentPortalView } from './components/AgentPortalView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { NotificationsView } from './components/NotificationsView';
import { usePushNotifications } from './hooks/usePushNotifications';
import { MessageCircle, ShieldCheck, Gamepad2, Heart } from 'lucide-react';

const StoreAppContent: React.FC = () => {
  const { activeTab, setActiveTab, isLoading, settings, currentUser, refreshData, showToast } = useStore();

  usePushNotifications({
    userId: currentUser?.id,
    onNotificationReceived: (notif) => {
      showToast(notif.title, notif.message, 'info');
      refreshData();
    },
    onNavigate: (url) => {
      if (url.includes('wallet')) setActiveTab('wallet');
      else if (url.includes('offers')) setActiveTab('offers');
      else if (url.includes('accounts')) setActiveTab('accounts');
      else if (url.includes('recharge')) setActiveTab('recharge');
      else if (url.includes('agent')) setActiveTab('agent');
      else if (url.includes('admin')) setActiveTab('admin');
      else if (url.includes('notifications')) setActiveTab('notifications');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center animate-pulse mb-4 text-2xl">
          🎮
        </div>
        <h3 className="text-white font-black text-lg">جاري تحميل المتجر...</h3>
        <p className="text-xs text-slate-400 mt-1">تحديث إعدادات الهوية والباقات اللحظية</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Dynamic Header */}
      <Header />

      {/* Floating Notifications */}
      <ToastContainer />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-20 md:pb-24">
        {activeTab === 'recharge' && <RechargeView />}
        {activeTab === 'accounts' && <AccountsView />}
        {activeTab === 'offers' && <OffersView />}
        {activeTab === 'wallet' && <WalletView />}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'agent' && <AgentPortalView />}
        {activeTab === 'admin' && <AdminDashboardView />}
        {activeTab === 'notifications' && <NotificationsView />}

        {/* Footer info & WhatsApp Support link */}
        <footer className="mt-12 mb-4 pt-8 pb-4 border-t border-white/10 text-center space-y-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-slate-400">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              {settings?.storeName || 'متجر الألعاب'}
            </span>
            <span>•</span>
            <span>نظام الشحن الفوري الآمن والمحفظة الرقمية</span>
            {settings?.contactWhatsapp && (
              <>
                <span>•</span>
                <a
                  href={`https://wa.me/${settings.contactWhatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-emerald-400 hover:underline font-bold"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  دعم العملاء المباشر
                </a>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-600">
            جميع الحقوق محفوظة © {new Date().getFullYear()} - منصة White-Label للألعاب والخدمات الرقمية
          </p>
        </footer>
      </main>

      {/* Mobile/Desktop Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <StoreAppContent />
    </StoreProvider>
  );
}
