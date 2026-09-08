import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { api } from '../lib/api';
import { AdminSidebar, AdminTab } from './admin/AdminSidebar';
import { AdminHeader } from './admin/AdminHeader';
import { OverviewTab } from './admin/tabs/OverviewTab';
import { TopUpRequestsTab } from './admin/tabs/TopUpRequestsTab';
import { RechargeOrdersTab } from './admin/tabs/RechargeOrdersTab';
import { UsersTab } from './admin/tabs/UsersTab';
import { AgentsTab } from './admin/tabs/AgentsTab';
import { GamesTab } from './admin/tabs/GamesTab';
import { PackagesTab } from './admin/tabs/PackagesTab';
import { AccountsTab } from './admin/tabs/AccountsTab';
import { PaymentMethodsTab } from './admin/tabs/PaymentMethodsTab';
import { CurrencyTab } from './admin/tabs/CurrencyTab';
import { WhiteLabelTab } from './admin/tabs/WhiteLabelTab';
import { SectionsTab } from './admin/tabs/SectionsTab';
import { NotificationsTab } from './admin/tabs/NotificationsTab';
import { AuditLogsTab } from './admin/tabs/AuditLogsTab';
import { WalletAuditTab } from './admin/tabs/WalletAuditTab';
import { NewsOffersTab } from './admin/tabs/NewsOffersTab';
import { ShieldCheck, Lock } from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { currentUser, refreshData, showToast } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Pending counts for badges
  const [pendingTopUps, setPendingTopUps] = useState<number>(0);
  const [pendingRecharges, setPendingRecharges] = useState<number>(0);

  useEffect(() => {
    loadBadgeCounts();
  }, [activeTab]);

  const loadBadgeCounts = async () => {
    try {
      const [topUps, recharges] = await Promise.all([
        api.getTopUpRequests(true).catch(() => []),
        api.getRechargeOrders(true).catch(() => []),
      ]);
      setPendingTopUps(topUps.filter((t) => t.status === 'Pending').length);
      setPendingRecharges(
        recharges.filter((r) => r.status === 'Pending' || r.status === 'Processing').length
      );
    } catch (e) {
      // ignore
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      await loadBadgeCounts();
      showToast('تم التحديث', 'تم تحديث كافة بيانات لوحة الإدارة', 'success');
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // RBAC check: Only super_admin can access the full admin dashboard
  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-3xl bg-[#131722] border border-red-500/30 space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">منطقة إدارية محمية</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            هذه اللوحة مخصصة للمدير العام (Super Admin) فقط. يمكنك تبديل الحساب من القائمة العلوية
            لتجربة الصلاحيات الإدارية الكاملة.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingTopUpsCount={pendingTopUps}
        pendingRechargesCount={pendingRecharges}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <AdminHeader
          onToggleSidebar={() => setIsOpenMobile(true)}
          onRefreshAll={handleRefreshAll}
          isRefreshing={isRefreshing}
        />

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'overview' && <OverviewTab onNavigateTab={setActiveTab} />}
          {activeTab === 'topups' && <TopUpRequestsTab />}
          {activeTab === 'recharge' && <RechargeOrdersTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'agents' && <AgentsTab />}
          {activeTab === 'offers' && <NewsOffersTab />}
          {activeTab === 'wallet' && <WalletAuditTab />}
          {activeTab === 'games' && <GamesTab onNavigateTab={setActiveTab} />}
          {activeTab === 'packages' && <PackagesTab />}
          {activeTab === 'accounts' && <AccountsTab />}
          {activeTab === 'payment_methods' && <PaymentMethodsTab />}
          {activeTab === 'currency' && <CurrencyTab />}
          {activeTab === 'customization' && <WhiteLabelTab />}
          {activeTab === 'sections' && <SectionsTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'audit_logs' && <AuditLogsTab />}
        </main>
      </div>
    </div>
  );
};
