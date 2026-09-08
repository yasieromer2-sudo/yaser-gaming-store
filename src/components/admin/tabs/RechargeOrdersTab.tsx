import React, { useState, useEffect } from 'react';
import { RechargeOrder } from '../../../types';
import { api } from '../../../lib/api';
import { useStore } from '../../../context/StoreContext';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Copy,
  RefreshCw,
  Eye,
  AlertTriangle,
  RotateCcw,
  User,
  Gamepad2
} from 'lucide-react';

export const RechargeOrdersTab: React.FC = () => {
  const { showToast, refreshData } = useStore();
  const [orders, setOrders] = useState<RechargeOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Processing' | 'Completed' | 'Failed'>('all');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<RechargeOrder | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<'Completed' | 'Failed' | 'Processing'>('Completed');
  const [statusReason, setStatusReason] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await api.getRechargeOrders(true);
      setOrders(data);
    } catch (err: any) {
      showToast('خطأ', 'فشل في تحميل طلبات الشحن', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      await api.updateRechargeStatus(selectedOrder.id, targetStatus, statusReason.trim() || undefined);
      if (targetStatus === 'Failed') {
        showToast(
          'تم تحديث الحالة واسترداد المبلغ تلقائياً!',
          `تم تمييز الطلب كـ فاشل، واسترداد مبلغ ${selectedOrder.amountSDG.toLocaleString()} SDG إلى محفظة العميل فورياً`,
          'warning'
        );
      } else if (targetStatus === 'Completed') {
        showToast(
          'تم تأكيد نجاح الشحن!',
          `تم تمييز طلب ${selectedOrder.gameName} كـ مكتمل وإشعار العميل بتسليم الباقة بنجاح`,
          'success'
        );
      } else {
        showToast('تم التحديث', `تم نقل الطلب إلى قيد المعالجة (Processing)`, 'info');
      }

      setShowStatusModal(false);
      setSelectedOrder(null);
      setStatusReason('');
      await loadOrders();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ في التحديث', err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('تم النسخ', `تم نسخ ${label} بنجاح`, 'info');
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.playerId.toLowerCase().includes(q) ||
        o.gameName.toLowerCase().includes(q) ||
        o.packageName.toLowerCase().includes(q) ||
        o.userId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length;
  const completedCount = orders.filter((o) => o.status === 'Completed').length;
  const failedCount = orders.filter((o) => o.status === 'Failed').length;
  const totalVolume = orders
    .filter((o) => o.status === 'Completed')
    .reduce((acc, o) => acc + o.amountSDG, 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-[#131722] to-slate-900 border border-purple-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">إدارة طلبات الشحن الرقمي</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة شحن الألعاب عبر الـ Player ID مع ميزة الاسترداد المالي التلقائي (Auto-Refund) عند التعثر
              </p>
            </div>
          </div>

          <button
            onClick={loadOrders}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث الطلبات
          </button>
        </div>

        {/* Quick Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-slate-400 block text-[11px]">قيد المعالجة:</span>
            <span className="text-lg font-black text-amber-400">{pendingCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-slate-400 block text-[11px]">الشحنات المكتملة:</span>
            <span className="text-lg font-black text-emerald-400">{completedCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-slate-400 block text-[11px]">الطلبات المستردة/الفاشلة:</span>
            <span className="text-lg font-black text-red-400">{failedCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-slate-400 block text-[11px]">إجمالي مبيعات الشحن:</span>
            <span className="text-lg font-black text-white font-mono">
              {totalVolume.toLocaleString()} SDG
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#131722] border border-white/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الطلب، Player ID، اسم اللعبة، أو الباقة..."
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'Processing', label: 'قيد التنفيذ' },
            { id: 'Completed', label: 'مكتمل' },
            { id: 'Failed', label: 'فاشل / مسترد' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setStatusFilter(btn.id as any)}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                statusFilter === btn.id
                  ? 'bg-purple-600 text-white shadow-md font-black'
                  : 'bg-black/30 hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl bg-[#131722] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-black/40 border-b border-white/10 text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">رقم الطلب</th>
                <th className="py-3.5 px-4">اللعبة والباقة</th>
                <th className="py-3.5 px-4">Player ID المعرف</th>
                <th className="py-3.5 px-4">السيرفر/المنطقة</th>
                <th className="py-3.5 px-4">المبلغ</th>
                <th className="py-3.5 px-4">التاريخ</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    لا توجد طلبات شحن مطابقة
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isDone = order.status === 'Completed';
                  const isFail = order.status === 'Failed';
                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      {/* Order ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{order.id}</span>
                          <button
                            onClick={() => copyText(order.id, 'رقم الطلب')}
                            className="text-slate-500 hover:text-white"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Game & Package */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-white flex items-center gap-1.5">
                          <Gamepad2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>{order.gameName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {order.packageName}
                        </div>
                      </td>

                      {/* Player ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-sm text-emerald-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                            {order.playerId}
                          </span>
                          <button
                            onClick={() => copyText(order.playerId, 'Player ID')}
                            className="text-slate-500 hover:text-white"
                            title="نسخ معرف اللاعب"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Server */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {order.serverOrRegion || 'تلقائي / عام'}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <div>{order.amountSDG.toLocaleString()} SDG</div>
                        <div className="text-[10px] text-slate-500">~ ${order.amountUSD} USD</div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleString('ar-SD', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            مكتمل
                          </span>
                        ) : isFail ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            <RotateCcw className="w-3 h-3" />
                            فشل وتم الاسترداد
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                            <Clock className="w-3 h-3" />
                            قيد التنفيذ
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setTargetStatus(isDone ? 'Failed' : 'Completed');
                            setShowStatusModal(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold transition-colors"
                        >
                          تعديل الحالة
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#131722] border border-white/15 p-6 space-y-4 shadow-2xl text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-white">
                  تحديث حالة طلب الشحن #{selectedOrder.id}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {selectedOrder.gameName} - {selectedOrder.packageName} ({selectedOrder.playerId})
                </span>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Target status selector */}
            <div className="space-y-1.5">
              <label className="font-bold text-white">اختر الحالة الجديدة:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Completed', label: 'مكتمل (Success)', color: 'emerald' },
                  { id: 'Processing', label: 'قيد التنفيذ', color: 'amber' },
                  { id: 'Failed', label: 'فشل واسترداد', color: 'red' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setTargetStatus(s.id as any)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      targetStatus === s.id
                        ? s.id === 'Completed'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : s.id === 'Failed'
                          ? 'bg-red-500/20 border-red-500 text-red-300'
                          : 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-black/40 border-white/5 text-slate-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notice for Failed refund */}
            {targetStatus === 'Failed' && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>آلية الاسترداد المالي التلقائي (Atomic Auto-Refund):</span>
                </div>
                <p>
                  عند اختيار "فشل"، سيقوم النظام تلقائياً بإرجاع كامل مبلغ الشحن (
                  <strong>{selectedOrder.amountSDG.toLocaleString()} SDG</strong>) إلى محفظة
                  المستخدم وتسجيل حركة استرداد في الـ Ledger فورياً.
                </p>
              </div>
            )}

            {/* Status note/reason */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">
                {targetStatus === 'Failed'
                  ? 'سبب الفشل (يظهر للعميل في الإشعار):'
                  : 'ملاحظات أو مرجع مزود الـ API (اختياري):'}
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder={
                  targetStatus === 'Failed'
                    ? 'مثال: تعذر العثور على اللاعب بالـ Player ID، أو حساب غير نشط'
                    : 'مثال: رقم العملية من مزود الشحن المباشر'
                }
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold shadow-md transition-transform active:scale-95"
              >
                {isUpdating ? 'جارٍ الحفظ...' : 'تأكيد وحفظ التغيير'}
              </button>
              <button
                onClick={() => setShowStatusModal(false)}
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
