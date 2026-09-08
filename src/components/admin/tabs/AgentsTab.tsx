import React, { useState, useEffect } from 'react';
import { Agent } from '../../../types';
import { api } from '../../../lib/api';
import { useStore } from '../../../context/StoreContext';
import {
  UserCheck,
  PlusCircle,
  Edit2,
  Trash2,
  Key,
  Building2,
  MessageCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Eye,
  Lock
} from 'lucide-react';

export const AgentsTab: React.FC = () => {
  const { showToast, refreshData } = useStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState<Agent | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('AgentPass@2025');

  // Form state
  const [agentForm, setAgentForm] = useState({
    name: '',
    bankName: 'بنك الخرطوم (Bankak)',
    accountNumber: '',
    accountHolder: '',
    whatsappNumber: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
    paymentInstructions: 'يرجى إرسال إشعار التحويل البنكي الواضح عبر الواتساب فور إتمام التحويل',
    status: 'available' as 'available' | 'unavailable',
    password: '',
  });

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAgents();
      setAgents(data);
    } catch (err: any) {
      showToast('خطأ', 'فشل في تحميل قائمة الوكلاء', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAgent = async () => {
    if (!agentForm.name || !agentForm.accountNumber || !agentForm.accountHolder) {
      showToast('تنبيه', 'يرجى إكمال بيانات الوكيل والحساب البنكي', 'warning');
      return;
    }

    try {
      if (editingAgent) {
        await api.updateAgent(editingAgent.id, {
          ...editingAgent,
          ...agentForm,
        });
        showToast('تم التحديث', `تم تحديث بيانات الوكيل ${agentForm.name} بنجاح`, 'success');
      } else {
        await api.createAgent({
          ...agentForm,
          isOnline: agentForm.status === 'available',
          paymentMethods: ['bankak', 'mycash'],
        });
        showToast('تمت الإضافة', `تم إنشاء وكيل جديد (${agentForm.name}) وحساب دخول مستقل له`, 'success');
      }

      setShowAddModal(false);
      setEditingAgent(null);
      resetForm();
      await loadAgents();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    if (!confirm(`هل أنت متأكد من حذف الوكيل "${agent.name}" نهائياً؟`)) return;
    try {
      await api.deleteAgent(agent.id);
      showToast('تم الحذف', `تم حذف الوكيل ${agent.name}`, 'info');
      await loadAgents();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    const newStatus = agent.status === 'available' ? 'unavailable' : 'available';
    try {
      await api.updateAgent(agent.id, { ...agent, status: newStatus, isOnline: newStatus === 'available' });
      showToast(
        'تم تغيير الحالة',
        `الوكيل ${agent.name} الآن ${newStatus === 'available' ? 'متاح لاستقبال الشحنات' : 'غير متاح حالياً'}`,
        'success'
      );
      await loadAgents();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!showResetPasswordModal) return;
    try {
      await api.resetAgentPassword(showResetPasswordModal.id, newPasswordInput);
      showToast('تمت إعادة التعيين', `تم تعيين كلمة المرور الجديدة للوكيل ${showResetPasswordModal.name}`, 'success');
      setShowResetPasswordModal(null);
      setNewPasswordInput('AgentPass@2025');
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const resetForm = () => {
    setAgentForm({
      name: '',
      bankName: 'بنك الخرطوم (Bankak)',
      accountNumber: '',
      accountHolder: '',
      whatsappNumber: '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
      paymentInstructions: 'يرجى إرسال إشعار التحويل البنكي الواضح عبر الواتساب فور إتمام التحويل',
      status: 'available',
      password: '',
    });
  };

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setAgentForm({
      name: agent.name,
      bankName: agent.bankName,
      accountNumber: agent.accountNumber,
      accountHolder: agent.accountHolder,
      whatsappNumber: agent.whatsappNumber,
      avatar: agent.avatar,
      paymentInstructions: agent.paymentInstructions || '',
      status: agent.status,
      password: agent.password || '',
    });
    setShowAddModal(true);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('تم النسخ', `تم نسخ ${label} بنجاح`, 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-blue-950/40 via-[#131722] to-slate-900 border border-blue-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">إدارة شبكة وكلاء الشحن المعتمدين</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تكوين حسابات الوكلاء المستقلة، ربط حساباتهم البنكية، أرقام الواتساب، ومتابعة إجمالي مبيعاتهم
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              setEditingAgent(null);
              setShowAddModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            إضافة وكيل معتمد جديد
          </button>
        </div>
      </div>

      {/* Agents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const isAvailable = agent.status === 'available';
          const cleanPhone = agent.whatsappNumber.replace(/[^0-9]/g, '');
          const waLink = `https://wa.me/${cleanPhone}`;

          return (
            <div
              key={agent.id}
              className="p-5 rounded-3xl bg-[#131722] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4 shadow-lg"
            >
              {/* Top part: Avatar, Name, Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-white/10 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{agent.name}</h3>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      {agent.id}
                    </span>
                  </div>
                </div>

                {/* Status Toggle Badge */}
                <button
                  onClick={() => handleToggleStatus(agent)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                    isAvailable
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                  }`}
                  title="انقر لتغيير حالة الإتاحة"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                    }`}
                  />
                  <span>{isAvailable ? 'متاح الآن' : 'غير متاح'}</span>
                </button>
              </div>

              {/* Bank Details Box */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    البنك:
                  </span>
                  <span className="font-bold text-white truncate max-w-[150px]">
                    {agent.bankName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">رقم الحساب:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-emerald-400">
                      {agent.accountNumber}
                    </span>
                    <button
                      onClick={() => copyText(agent.accountNumber, 'رقم الحساب')}
                      className="text-slate-500 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">اسم صاحب الحساب:</span>
                  <span className="font-bold text-white">{agent.accountHolder}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-slate-400">رقم WhatsApp:</span>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-emerald-400 hover:underline font-mono text-[11px]"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{agent.whatsappNumber}</span>
                  </a>
                </div>
              </div>

              {/* Stats: Processed Volume & Orders */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 text-center">
                  <span className="text-[10px] text-slate-400 block">إجمالي الشحنات</span>
                  <span className="font-mono font-black text-sm text-white">
                    {(agent.totalProcessedAmount || 0).toLocaleString()} SDG
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 text-center">
                  <span className="text-[10px] text-slate-400 block">الطلبات الناجحة</span>
                  <span className="font-mono font-black text-sm text-emerald-400">
                    {agent.successfulOrders || 0}
                  </span>
                </div>
              </div>

              {/* Actions toolbar */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => openEditModal(agent)}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>

                <button
                  onClick={() => setShowResetPasswordModal(agent)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 text-xs font-bold transition-colors"
                  title="إعادة تعيين كلمة مرور الوكيل"
                >
                  <Key className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteAgent(agent)}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors"
                  title="حذف الوكيل"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#131722] border border-white/15 p-6 space-y-4 shadow-2xl text-xs text-slate-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white">
                {editingAgent ? 'تعديل بيانات الوكيل المعتمد' : 'إضافة وكيل شحن معتمد جديد'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Name */}
              <div className="space-y-1">
                <label className="font-bold text-white">اسم الوكيل الكامل:</label>
                <input
                  type="text"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  placeholder="مثال: وكالة الأمان للشحن الرقمي"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>

              {/* Bank Name */}
              <div className="space-y-1">
                <label className="font-bold text-white">اسم البنك:</label>
                <input
                  type="text"
                  value={agentForm.bankName}
                  onChange={(e) => setAgentForm({ ...agentForm, bankName: e.target.value })}
                  placeholder="بنك الخرطوم (Bankak)"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>

              {/* Account Number */}
              <div className="space-y-1">
                <label className="font-bold text-white">رقم الحساب البنكي:</label>
                <input
                  type="text"
                  value={agentForm.accountNumber}
                  onChange={(e) => setAgentForm({ ...agentForm, accountNumber: e.target.value })}
                  placeholder="مثال: 3291884"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                />
              </div>

              {/* Account Holder */}
              <div className="space-y-1">
                <label className="font-bold text-white">اسم صاحب الحساب كما بالبنك:</label>
                <input
                  type="text"
                  value={agentForm.accountHolder}
                  onChange={(e) => setAgentForm({ ...agentForm, accountHolder: e.target.value })}
                  placeholder="الاسم الرباعي الرسمي"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>

              {/* WhatsApp */}
              <div className="space-y-1">
                <label className="font-bold text-white">رقم الواتساب مع المفتاح الدولي:</label>
                <input
                  type="text"
                  value={agentForm.whatsappNumber}
                  onChange={(e) => setAgentForm({ ...agentForm, whatsappNumber: e.target.value })}
                  placeholder="+249912345678"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                />
              </div>

              {/* Avatar */}
              <div className="space-y-1">
                <label className="font-bold text-white">رابط صورة الوكيل / الشعار:</label>
                <input
                  type="text"
                  value={agentForm.avatar}
                  onChange={(e) => setAgentForm({ ...agentForm, avatar: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                />
              </div>

              {/* Initial Password (if new) */}
              {!editingAgent && (
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-white">
                    كلمة مرور تسجيل دخول الوكيل للبوابة:
                  </label>
                  <input
                    type="text"
                    value={agentForm.password}
                    onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400">
                    سيتم إنشاء حساب مستقل للوكيل بصلاحية Agent ليتمكن من تسجيل الدخول وفحص طلباته
                    فقط
                  </span>
                </div>
              )}

              {/* Payment Instructions */}
              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-white">تعليمات الدفع للعملاء:</label>
                <textarea
                  value={agentForm.paymentInstructions}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, paymentInstructions: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-white/10">
              <button
                onClick={handleSaveAgent}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-md transition-transform active:scale-95"
              >
                {editingAgent ? 'حفظ التعديلات' : 'إضافة الوكيل واعتماده'}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#131722] border border-white/15 p-6 space-y-4 shadow-2xl text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">إعادة تعيين كلمة مرور الوكيل</h3>
                <span className="text-[11px] text-slate-400">{showResetPasswordModal.name}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-white">كلمة المرور الجديدة:</label>
              <input
                type="text"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono font-bold"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleResetPassword}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black shadow-md"
              >
                تحديث كلمة المرور
              </button>
              <button
                onClick={() => setShowResetPasswordModal(null)}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
