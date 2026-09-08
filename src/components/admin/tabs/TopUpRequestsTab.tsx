import React, { useState, useEffect } from 'react';
import {
  WalletTopUpRequest,
  Agent
} from '../../../types';
import { api } from '../../../lib/api';
import { useStore } from '../../../context/StoreContext';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowDownCircle,
  Copy,
  ExternalLink,
  MessageCircle,
  Eye,
  RefreshCw,
  Building2,
  User,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export const TopUpRequestsTab: React.FC = () => {
  const { showToast, refreshData } = useStore();
  const [requests, setRequests] = useState<WalletTopUpRequest[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Completed' | 'Rejected'>('all');

  // Action modals
  const [selectedReq, setSelectedReq] = useState<WalletTopUpRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showActionModal, setShowActionModal] = useState<'approve' | 'reject' | null>(null);
  const [actionNote, setActionNote] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const [reqs, agts] = await Promise.all([
        api.getTopUpRequests(true),
        api.getAgents(),
      ]);
      setRequests(reqs);
      setAgents(agts);
    } catch (err: any) {
      showToast('خطأ في تحميل الطلبات', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    setIsProcessing(true);
    try {
      await api.approveTopUpRequest(selectedReq.id, actionNote.trim() || undefined);
      showToast(
        'تم تأكيد التغذية بنجاح!',
        `تم إضافة ${selectedReq.amount.toLocaleString()} SDG إلى محفظة ${selectedReq.userName} (${selectedReq.userUid}) مع قيد العملية في الـ Ledger`,
        'success'
      );
      setShowActionModal(null);
      setSelectedReq(null);
      setActionNote('');
      await loadRequests();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ في اعتماد الطلب', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    if (!actionNote.trim()) {
      showToast('تنبيه', 'يرجى كتابة سبب الرفض لتوضيحه للعميل', 'warning');
      return;
    }
    setIsProcessing(true);
    try {
      await api.rejectTopUpRequest(selectedReq.id, actionNote.trim());
      showToast('تم رفض الطلب', `تم رفض طلب التغذية #${selectedReq.id} وإشعار العميل`, 'info');
      setShowActionModal(null);
      setSelectedReq(null);
      setActionNote('');
      await loadRequests();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ في رفض الطلب', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('تم النسخ', `تم نسخ ${label} بنجاح`, 'info');
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    // Status filter
    if (statusFilter !== 'all' && r.status !== statusFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        r.userUid.toLowerCase().includes(q) ||
        (r.transferReference && r.transferReference.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const completedCount = requests.filter((r) => r.status === 'Completed').length;
  const totalCredited = requests
    .filter((r) => r.status === 'Completed')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Stats Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#131722] to-slate-900 border border-amber-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">إدارة طلبات تغذية المحافظ</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                مراجعة إشعارات التحويل البنكي (بنكك، ماي كاش، أوكاش) واعتماد الإيداع المالي في المحافظ
              </p>
            </div>
          </div>

          <button
            onClick={loadRequests}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث القائمة
          </button>
        </div>

        {/* Quick summary numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-slate-400 block text-[11px]">الطلبات المعلقة:</span>
            <span className="text-lg font-black text-amber-400">{pendingCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-slate-400 block text-[11px]">الطلبات المعتمدة:</span>
            <span className="text-lg font-black text-emerald-400">{completedCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 col-span-2">
            <span className="text-slate-400 block text-[11px]">إجمالي المبالغ المشحونة:</span>
            <span className="text-lg font-black text-white font-mono">
              {totalCredited.toLocaleString()} SDG
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#131722] border border-white/10">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الطلب، اسم العميل، User ID، أو رقم العملية..."
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'Pending', label: `معلق (${pendingCount})` },
            { id: 'Completed', label: 'معتمد' },
            { id: 'Rejected', label: 'مرفوض' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setStatusFilter(btn.id as any)}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                statusFilter === btn.id
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-black/30 hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-3xl bg-[#131722] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-black/40 border-b border-white/10 text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">رقم الطلب</th>
                <th className="py-3.5 px-4">المستخدم</th>
                <th className="py-3.5 px-4">الوكيل المختار</th>
                <th className="py-3.5 px-4">المبلغ</th>
                <th className="py-3.5 px-4">وسيلة الدفع والتحويل</th>
                <th className="py-3.5 px-4">التاريخ والوقت</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    لا توجد طلبات تطابق معايير البحث الحالية
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const targetAgent = agents.find((a) => a.id === req.agentId);
                  const isPending = req.status === 'Pending';
                  return (
                    <tr key={req.id} className="hover:bg-white/5 transition-colors">
                      {/* Request ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{req.id}</span>
                          <button
                            onClick={() => copyText(req.id, 'رقم الطلب')}
                            className="text-slate-500 hover:text-white"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-white">{req.userName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{req.userUid}</div>
                      </td>

                      {/* Agent */}
                      <td className="py-3.5 px-4">
                        <div className="text-white font-bold">
                          {targetAgent?.name || req.agentId}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {targetAgent?.bankName || 'حساب بنكي'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono font-black text-sm text-emerald-400">
                        {req.amount.toLocaleString()} SDG
                      </td>

                      {/* Method & Ref */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 font-bold text-[11px] block w-fit">
                          {req.paymentMethod}
                        </span>
                        {req.transferReference && (
                          <div className="text-[10px] font-mono text-amber-300/90 mt-0.5 truncate max-w-[120px]">
                            مرجع: {req.transferReference}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                        {new Date(req.createdAt).toLocaleString('ar-SD', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {req.status === 'Completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            تم الاعتماد
                          </span>
                        ) : req.status === 'Rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            <XCircle className="w-3 h-3" />
                            مرفوض
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                            <Clock className="w-3 h-3" />
                            قيد الانتظار
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedReq(req);
                              setShowDetailsModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                            title="تفاصيل التحويل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedReq(req);
                                  setShowActionModal('approve');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>موافقة</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedReq(req);
                                  setShowActionModal('reject');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-[11px] font-bold flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>رفض</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#131722] border border-white/15 p-6 space-y-5 text-xs text-slate-300 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <ArrowDownCircle className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    تفاصيل طلب التغذية #{selectedReq.id}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    تاريخ الطلب: {new Date(selectedReq.createdAt).toLocaleString('ar-SD')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Content info */}
            <div className="space-y-3 divide-y divide-white/5">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">اسم العميل:</span>
                <span className="font-bold text-white">{selectedReq.userName}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">معرف العميل (User ID):</span>
                <span className="font-mono font-bold text-amber-400">{selectedReq.userUid}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">المبلغ المطلوب شحنه:</span>
                <span className="font-mono font-black text-base text-emerald-400">
                  {selectedReq.amount.toLocaleString()} SDG
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">وسيلة الدفع:</span>
                <span className="font-bold text-white">{selectedReq.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">رقم مرجع التحويل / الإشعار:</span>
                <span className="font-mono text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
                  {selectedReq.transferReference || 'لم يتم إدخال مرجع نصي'}
                </span>
              </div>
              {selectedReq.notes && (
                <div className="py-2">
                  <span className="text-slate-400 block mb-1">ملاحظات العملية:</span>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-amber-300">
                    {selectedReq.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve / Reject Dialog */}
      {showActionModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#131722] border border-white/15 p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  showActionModal === 'approve'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {showActionModal === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">
                  {showActionModal === 'approve'
                    ? 'تأكيد اعتماد التغذية وإضافة الرصيد'
                    : 'رفض طلب التغذية البنكية'}
                </h3>
                <span className="text-slate-400 text-[11px]">
                  طلب #{selectedReq.id} - بمبلغ {selectedReq.amount.toLocaleString()} SDG
                </span>
              </div>
            </div>

            {showActionModal === 'approve' ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200/90 leading-relaxed space-y-1">
                <div className="font-bold">تنبيه المعاملة المالية:</div>
                <p>
                  بالموافقة، سيتم إضافة <strong>{selectedReq.amount.toLocaleString()} SDG</strong>{' '}
                  فورياً إلى محفظة <strong>{selectedReq.userName}</strong>، وتوليد قيد مالي في الـ
                  Ledger وإرسال إشعار فوري للعميل.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200/90 leading-relaxed">
                سيتم وضع علامة "مرفوض" على الطلب وإشعار العميل بسبب الرفض حتى يتمكن من مراجعة البنك
                أو تصحيح الإشعار.
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">
                {showActionModal === 'approve'
                  ? 'ملاحظات العملية (اختياري):'
                  : 'سبب الرفض (إلزامي لتوضيحه للعميل):'}
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  showActionModal === 'approve'
                    ? 'مثال: تم التأكد من وصول الحوالة بحساب بنكك بنجاح'
                    : 'مثال: الإشعار غير واضح أو لم تصل الحوالة إلى الحساب البنكي حتى الآن'
                }
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={showActionModal === 'approve' ? handleApprove : handleReject}
                disabled={isProcessing}
                className={`flex-1 py-3 rounded-xl font-extrabold shadow-md transition-transform active:scale-95 ${
                  showActionModal === 'approve'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    : 'bg-red-500 hover:bg-red-400 text-white'
                }`}
              >
                {isProcessing
                  ? 'جارٍ التنفيذ...'
                  : showActionModal === 'approve'
                  ? 'تأكيد وإيداع الرصيد'
                  : 'رفض الطلب نهائياً'}
              </button>
              <button
                onClick={() => setShowActionModal(null)}
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
