import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Copy, 
  Check, 
  ArrowUpDown, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  FileText, 
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { WalletTopUpRequest } from '../../types';

interface AgentRequestsTableProps {
  requests: WalletTopUpRequest[];
  isLoading: boolean;
  onRefresh: () => void;
  onViewDetails: (request: WalletTopUpRequest) => void;
  onApprove: (request: WalletTopUpRequest) => void;
  onReject: (request: WalletTopUpRequest) => void;
  activeStatusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export const AgentRequestsTable: React.FC<AgentRequestsTableProps> = ({
  requests,
  isLoading,
  onRefresh,
  onViewDetails,
  onApprove,
  onReject,
  activeStatusFilter = 'ALL',
  onStatusFilterChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalStatusFilter, setInternalStatusFilter] = useState<string>(activeStatusFilter);
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'AMOUNT_DESC' | 'AMOUNT_ASC'>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentStatus = onStatusFilterChange ? activeStatusFilter : internalStatusFilter;
  const setStatus = (st: string) => {
    if (onStatusFilterChange) {
      onStatusFilterChange(st);
    } else {
      setInternalStatusFilter(st);
    }
    setCurrentPage(1);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtering & Sorting pipeline
  const filteredAndSortedRequests = useMemo(() => {
    let result = [...requests];

    // Status filter
    if (currentStatus !== 'ALL') {
      result = result.filter((r) => {
        const s = r.status?.toLowerCase();
        if (currentStatus === 'Pending') return s === 'pending';
        if (currentStatus === 'Completed' || currentStatus === 'Approved') return s === 'completed' || s === 'approved';
        if (currentStatus === 'Rejected') return s === 'rejected';
        return true;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.userName?.toLowerCase().includes(q) ||
          r.userUid?.toLowerCase().includes(q) ||
          (r.transferReference && r.transferReference.toLowerCase().includes(q)) ||
          r.paymentMethod?.toLowerCase().includes(q)
      );
    }

    // Date filter
    if (dateFilter !== 'ALL') {
      const now = new Date();
      result = result.filter((r) => {
        const itemDate = new Date(r.createdAt);
        if (dateFilter === 'TODAY') {
          return itemDate.toDateString() === now.toDateString();
        }
        if (dateFilter === 'WEEK') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= sevenDaysAgo;
        }
        if (dateFilter === 'MONTH') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return itemDate >= thirtyDaysAgo;
        }
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'AMOUNT_DESC') {
        return b.amount - a.amount;
      }
      if (sortBy === 'AMOUNT_ASC') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [requests, currentStatus, searchQuery, dateFilter, sortBy]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRequests.length / pageSize));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRequests.slice(start, start + pageSize);
  }, [filteredAndSortedRequests, currentPage, pageSize]);

  return (
    <div id="agent-requests-section" className="space-y-4">
      {/* Controls Bar: Search, Filters, Refresh */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-3">
        {/* Top row: Search input & Refresh button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="البحث برقم الطلب (REQ-...)، اسم العميل، معرف UID، أو الرقم المرجعي..."
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                مسح
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
            {/* Date filter dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="ALL">كل الفترات</option>
              <option value="TODAY">طلبات اليوم</option>
              <option value="WEEK">آخر 7 أيام</option>
              <option value="MONTH">هذا الشهر</option>
            </select>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="NEWEST">الأحدث أولاً</option>
              <option value="OLDEST">الأقدم أولاً</option>
              <option value="AMOUNT_DESC">المبلغ: من الأعلى</option>
              <option value="AMOUNT_ASC">المبلغ: من الأدنى</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bottom row: Status filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'كافة الطلبات', count: requests.length },
            {
              id: 'Pending',
              label: 'قيد الانتظار',
              count: requests.filter((r) => r.status?.toLowerCase() === 'pending').length,
              color: 'text-amber-400 border-amber-500/30',
            },
            {
              id: 'Completed',
              label: 'تمت الموافقة',
              count: requests.filter((r) => r.status?.toLowerCase() === 'completed' || r.status?.toLowerCase() === 'approved').length,
              color: 'text-emerald-400 border-emerald-500/30',
            },
            {
              id: 'Rejected',
              label: 'المرفوضة',
              count: requests.filter((r) => r.status?.toLowerCase() === 'rejected').length,
              color: 'text-rose-400 border-rose-500/30',
            },
          ].map((tab) => {
            const isSelected = currentStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-zinc-800 border-emerald-500/50 text-emerald-400 shadow'
                    : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Requests Table / Cards Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 font-semibold">
                <th className="py-3 px-4">رقم الطلب</th>
                <th className="py-3 px-4">العميل</th>
                <th className="py-3 px-4">المبلغ</th>
                <th className="py-3 px-4">طريقة الدفع</th>
                <th className="py-3 px-4">الرقم المرجعي / الإثبات</th>
                <th className="py-3 px-4">تاريخ الطلب</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {paginatedRequests.map((req) => {
                const isPending = req.status?.toLowerCase() === 'pending';
                const isApproved = req.status?.toLowerCase() === 'completed' || req.status?.toLowerCase() === 'approved';
                const isRejected = req.status?.toLowerCase() === 'rejected';
                const hasReceipt = Boolean(req.receiptImage || req.receiptUrl);

                return (
                  <tr 
                    key={req.id} 
                    className="hover:bg-zinc-850/50 transition-colors group"
                  >
                    {/* Request ID */}
                    <td className="py-3 px-4 font-mono font-bold text-zinc-200">
                      <div className="flex items-center gap-1.5">
                        <span>{req.id}</span>
                        <button
                          onClick={() => handleCopy(req.id, `req-${req.id}`)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white transition-opacity"
                          title="نسخ رقم الطلب"
                        >
                          {copiedId === `req-${req.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{req.userName}</div>
                      <div className="text-[11px] font-mono text-zinc-400">{req.userUid}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-400 font-mono text-sm">
                        {req.amount.toLocaleString()}
                      </span>{' '}
                      <span className="text-[10px] text-zinc-400">SDG</span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-4 text-zinc-300">
                      <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px]">
                        {req.paymentMethod}
                      </span>
                    </td>

                    {/* Ref & Receipt */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="font-mono text-[11px] text-cyan-300 truncate max-w-[130px] dir-ltr text-left">
                          {req.transferReference || '—'}
                        </div>
                        {hasReceipt && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            <FileText className="w-2.5 h-2.5" />
                            مرفق إثبات
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-zinc-400 text-[11px] whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString('ar-SD', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      <span className="text-zinc-400 font-mono">
                        {new Date(req.createdAt).toLocaleTimeString('ar-SD', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isApproved
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : isRejected
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        {isApproved && <CheckCircle2 className="w-3 h-3" />}
                        {isRejected && <XCircle className="w-3 h-3" />}
                        {isPending && <Clock className="w-3 h-3" />}
                        <span>
                          {isApproved ? 'تمت الموافقة' : isRejected ? 'مرفوض' : 'معلق'}
                        </span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewDetails(req)}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                          title="عرض التفاصيل الكاملة"
                        >
                          <Eye className="w-3 h-3" />
                          <span>تفاصيل</span>
                        </button>

                        {isPending && (
                          <>
                            <button
                              onClick={() => onApprove(req)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1 text-[11px] shadow"
                              title="تأكيد وصول المبلغ وإيداع الرصيد"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>تأكيد</span>
                            </button>
                            <button
                              onClick={() => onReject(req)}
                              className="px-2 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 transition-colors text-[11px]"
                              title="رفض الطلب"
                            >
                              <span>رفض</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-zinc-800/80">
          {paginatedRequests.map((req) => {
            const isPending = req.status?.toLowerCase() === 'pending';
            const isApproved = req.status?.toLowerCase() === 'completed' || req.status?.toLowerCase() === 'approved';
            const isRejected = req.status?.toLowerCase() === 'rejected';

            return (
              <div key={req.id} className="p-4 space-y-3 bg-zinc-900">
                {/* Header of mobile card */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">
                      {req.id}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isApproved
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : isRejected
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}>
                      {isApproved ? 'معتمد' : isRejected ? 'مرفوض' : 'معلق'}
                    </span>
                  </div>

                  <div className="font-mono text-emerald-400 font-black text-sm">
                    {req.amount.toLocaleString()} SDG
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">العميل:</span>
                    <span className="text-zinc-200 font-medium">{req.userName}</span>
                    <span className="text-[10px] font-mono text-zinc-400 block">{req.userUid}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">طريقة الدفع:</span>
                    <span className="text-zinc-300">{req.paymentMethod}</span>
                    {req.transferReference && (
                      <span className="text-[10px] font-mono text-cyan-400 block truncate dir-ltr text-left">
                        {req.transferReference}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {new Date(req.createdAt).toLocaleDateString('ar-SD', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onViewDetails(req)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs"
                    >
                      تفاصيل
                    </button>
                    {isPending && (
                      <>
                        <button
                          onClick={() => onReject(req)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-xs"
                        >
                          رفض
                        </button>
                        <button
                          onClick={() => onApprove(req)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                        >
                          تأكيد
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {paginatedRequests.length === 0 && (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 text-zinc-400 flex items-center justify-center mx-auto border border-zinc-700">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">لا توجد طلبات مطابقة للبحث أو الفلتر</h4>
              <p className="text-xs text-zinc-400 mt-1">
                جرب تغيير خيارات الفلترة أو مسح كلمات البحث للوصول لكافة العمليات.
              </p>
            </div>
            {(searchQuery || currentStatus !== 'ALL' || dateFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatus('ALL');
                  setDateFilter('ALL');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-semibold transition-colors"
              >
                إعادة ضبط جميع الفلاتر
              </button>
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {filteredAndSortedRequests.length > 0 && (
          <div className="p-3.5 sm:p-4 border-t border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
            <div>
              عرض <span className="text-white font-medium">{paginatedRequests.length}</span> من أصل{' '}
              <span className="text-white font-medium">{filteredAndSortedRequests.length}</span> طلب
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="الصفحة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="الصفحة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
