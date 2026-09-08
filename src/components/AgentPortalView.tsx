import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../context/StoreContext';
import { WalletTopUpRequest, Agent } from '../types';
import { api } from '../lib/api';
import {
  UserCheck,
  ShieldCheck,
  RefreshCw,
  Lock,
  Sparkles,
  ArrowRight,
  LogOut,
  Building2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { AgentStatsCards } from './agent/AgentStatsCards';
import { AgentBankCard } from './agent/AgentBankCard';
import { AgentRequestsTable } from './agent/AgentRequestsTable';
import { AgentRequestDetailsModal } from './agent/AgentRequestDetailsModal';
import { AgentApproveModal } from './agent/AgentApproveModal';
import { AgentRejectModal } from './agent/AgentRejectModal';
import { AgentLoginModal } from './agent/AgentLoginModal';

export const AgentPortalView: React.FC = () => {
  const { currentUser, showToast, refreshData, setActiveTab, availableUsers } = useStore();
  const [requests, setRequests] = useState<WalletTopUpRequest[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [agentProfile, setAgentProfile] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'bank_info'>('requests');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('ALL');

  // Modals state
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState<WalletTopUpRequest | null>(null);
  const [selectedRequestForApprove, setSelectedRequestForApprove] = useState<WalletTopUpRequest | null>(null);
  const [selectedRequestForReject, setSelectedRequestForReject] = useState<WalletTopUpRequest | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const loadAgentData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [reqs, agentsList] = await Promise.all([
        api.getAgentTopUpRequests(),
        api.getAgents(),
      ]);
      setRequests(reqs);
      setAllAgents(agentsList);

      // Identify active agent record
      const found = agentsList.find(
        (a) => a.id === currentUser?.agentId || a.id === currentUser?.id
      );
      setAgentProfile(found || agentsList[0] || null);
    } catch (err: any) {
      showToast('خطأ في الاتصال', err.message || 'فشل في تحميل بيانات طلبات الوكيل', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, showToast]);

  useEffect(() => {
    loadAgentData();
  }, [loadAgentData]);

  // Handle Approve
  const handleConfirmApprove = async (requestId: string, notes?: string) => {
    try {
      const updated = await api.approveTopUpRequest(requestId, notes);
      showToast(
        'تم تأكيد الإيداع بنجاح!',
        `تم إضافة مبلغ ${updated.amount.toLocaleString()} SDG إلى محفظة ${updated.userName} (${updated.userUid}) فورياً.`,
        'success'
      );
      // Reload state
      await loadAgentData();
      await refreshData();
    } catch (err: any) {
      showToast('فشل تأكيد الإيداع', err.message, 'error');
      throw err;
    }
  };

  // Handle Reject
  const handleConfirmReject = async (requestId: string, reason: string) => {
    try {
      const updated = await api.rejectTopUpRequest(requestId, reason);
      showToast(
        'تم رفض طلب الشحن',
        `تم تحديث حالة الطلب ${updated.id} إلى (مرفوض) مع إرسال سبب الرفض للعميل.`,
        'info'
      );
      // Reload state
      await loadAgentData();
      await refreshData();
    } catch (err: any) {
      showToast('فشل رفض الطلب', err.message, 'error');
      throw err;
    }
  };

  // RBAC Access Control Guard
  if (currentUser?.role !== 'agent' && currentUser?.role !== 'super_admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 text-center">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">
            بوابة الوكلاء المعتمدين محمية
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            هذه المنطقة مخصصة لوكلاء الشحن المعتمدين في النظام. حسابك الحالي مسجل كـ ({currentUser?.name}) بدور ({currentUser?.role}).
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>تسجيل الدخول كوكيل معتمد</span>
            </button>
            <button
              onClick={() => setActiveTab('recharge')}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              العودة للمتجر
            </button>
          </div>
        </div>

        {/* Agent Login Modal */}
        <AgentLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          agents={allAgents}
        />
      </div>
    );
  }

  // Calculate high-precision metrics
  const pendingRequests = requests.filter((r) => r.status?.toLowerCase() === 'pending');
  const approvedRequests = requests.filter((r) => r.status?.toLowerCase() === 'completed' || r.status?.toLowerCase() === 'approved');
  const rejectedRequests = requests.filter((r) => r.status?.toLowerCase() === 'rejected');
  const totalAmountProcessed = approvedRequests.reduce((sum, r) => sum + r.amount, 0);

  const stats = {
    pendingCount: pendingRequests.length,
    approvedCount: approvedRequests.length,
    rejectedCount: rejectedRequests.length,
    totalCount: requests.length,
    totalAmountProcessed,
    commissionRate: 1.5,
  };

  return (
    <div id="agent-portal-view" className="space-y-6 max-w-7xl mx-auto p-3 sm:p-4 md:p-6 animate-fadeIn">
      {/* Top Agent Bar: Identity & Actions */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-950 border border-zinc-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Agent Brand info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={agentProfile?.avatar || currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={agentProfile?.name || currentUser?.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500/40 shadow"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-black" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white">
                بوابة الوكيل: {agentProfile?.name || currentUser?.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                معتمد
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              معرف الوكيل: <span className="font-mono text-zinc-200 font-semibold">{currentUser?.agentId || agentProfile?.id || '-'}</span> • مراجعة التحويلات البنكية وإيداع أرصدة المحافظ فورياً
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="تبديل الوكيل"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">تبديل الوكيل</span>
          </button>

          <button
            onClick={loadAgentData}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>

          <button
            onClick={() => setActiveTab('recharge')}
            className="px-3 py-2 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="العودة للمتجر"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="hidden md:inline">واجهة المتجر</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'requests'
              ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>طلبات الشحن والعمليات</span>
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-black">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('bank_info')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'bank_info'
              ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>بيانات الحساب البنكي والعمولات</span>
        </button>
      </div>

      {/* Tab 1: Requests & Operations */}
      {activeSubTab === 'requests' && (
        <div className="space-y-6">
          {/* Key Statistics KPI Cards */}
          <AgentStatsCards
            stats={stats}
            activeFilter={activeStatusFilter}
            onFilterClick={(status) => setActiveStatusFilter(status)}
          />

          {/* Requests Table with Filters & Pagination */}
          <AgentRequestsTable
            requests={requests}
            isLoading={isLoading}
            onRefresh={loadAgentData}
            activeStatusFilter={activeStatusFilter}
            onStatusFilterChange={(st) => setActiveStatusFilter(st)}
            onViewDetails={(req) => setSelectedRequestForDetails(req)}
            onApprove={(req) => setSelectedRequestForApprove(req)}
            onReject={(req) => setSelectedRequestForReject(req)}
          />
        </div>
      )}

      {/* Tab 2: Bank Info & Commission */}
      {activeSubTab === 'bank_info' && (
        <div className="space-y-6">
          <AgentBankCard
            agent={agentProfile}
            agentName={currentUser?.name}
            onCopySuccess={(txt) => showToast('تم النسخ', `تم نسخ ${txt} بنجاح إلى الحافظة`, 'info')}
          />

          {/* Commission Breakdown card */}
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>نظام عمولات الوكيل وتسوية الأرباح</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-xs text-zinc-400 block mb-1">نسبة العمولة التقديرية</span>
                <div className="text-xl font-bold text-white">1.5%</div>
                <span className="text-[11px] text-zinc-400">على كل عملية شحن معتمدة</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-xs text-zinc-400 block mb-1">إجمالي الأرباح المكتسبة</span>
                <div className="text-xl font-bold text-cyan-400">
                  {Math.round((totalAmountProcessed * 1.5) / 100).toLocaleString()} SDG
                </div>
                <span className="text-[11px] text-zinc-400">محسوبة من {approvedRequests.length} عملية ناجحة</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-xs text-zinc-400 block mb-1">حالة تسوية الحساب</span>
                <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>الحساب منتظم ومحدث</span>
                </div>
                <span className="text-[11px] text-zinc-400">تسويات دورية آلية مع الإدارة</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400 leading-relaxed">
              <span className="text-zinc-200 font-semibold ml-1">تنبيه أمني للوكلاء:</span>
              يتحمل الوكيل المعتمد مسؤولية التأكد التام من وصول الحوالات البنكية لحسابه قبل النقر على زر (تأكيد الإيداع). كل عملية إيداع تسجل فوراً في السجل المالي وسجل التدقيق الأمني ولا يمكن التراجع عنها إلا عبر الإدارة العامة.
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Request Details Modal */}
      <AgentRequestDetailsModal
        isOpen={Boolean(selectedRequestForDetails)}
        request={selectedRequestForDetails}
        onClose={() => setSelectedRequestForDetails(null)}
        onApproveClick={(req) => setSelectedRequestForApprove(req)}
        onRejectClick={(req) => setSelectedRequestForReject(req)}
      />

      {/* Modal 2: Confirmation Approve Modal */}
      <AgentApproveModal
        isOpen={Boolean(selectedRequestForApprove)}
        request={selectedRequestForApprove}
        onClose={() => setSelectedRequestForApprove(null)}
        onConfirm={handleConfirmApprove}
      />

      {/* Modal 3: Rejection Modal with Reasons */}
      <AgentRejectModal
        isOpen={Boolean(selectedRequestForReject)}
        request={selectedRequestForReject}
        onClose={() => setSelectedRequestForReject(null)}
        onConfirmReject={handleConfirmReject}
      />

      {/* Modal 4: Agent Login Modal */}
      <AgentLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        agents={allAgents}
      />
    </div>
  );
};
