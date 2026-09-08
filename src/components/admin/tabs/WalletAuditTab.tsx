import React, { useState, useEffect } from 'react';
import { WalletTransaction } from '../../../types';
import { api } from '../../../lib/api';
import { useStore } from '../../../context/StoreContext';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export const WalletAuditTab: React.FC = () => {
  const { showToast } = useStore();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await api.getWalletTransactions();
      setTransactions(data);
    } catch (err: any) {
      showToast('خطأ', 'فشل في تحميل قيود المحافظ', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.referenceId && t.referenceId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalCredits = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#131722] to-slate-900 border border-emerald-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                دفتر الأستاذ والرقابة المالية (Financial Ledger)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                سجل القيود المحاسبية الذري لكافة عمليات الإيداع، الشراء، الاسترداد، والتسويات اليدوية
              </p>
            </div>
          </div>

          <button
            onClick={loadTransactions}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث القيود
          </button>
        </div>

        {/* Ledger Balance Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-slate-400 block text-[11px]">إجمالي الإيداعات (Credit +):</span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              +{totalCredits.toLocaleString()} SDG
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-slate-400 block text-[11px]">إجمالي المشتريات (Debit -):</span>
            <span className="text-lg font-black text-red-400 font-mono">
              -{totalDebits.toLocaleString()} SDG
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-slate-400 block text-[11px]">الرصيد الفعلي في التداول:</span>
            <span className="text-lg font-black text-white font-mono">
              {(totalCredits - totalDebits).toLocaleString()} SDG
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
            placeholder="بحث برقم القيد، الوصف، أو الرقم المرجعي..."
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          {[
            { id: 'all', label: 'جميع القيود' },
            { id: 'topup', label: 'تغذية' },
            { id: 'recharge_purchase', label: 'شحن ألعاب' },
            { id: 'account_purchase', label: 'شراء حسابات' },
            { id: 'refund', label: 'استرداد (Refund)' },
            { id: 'admin_adjustment', label: 'تسوية إدارية' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setTypeFilter(btn.id)}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                typeFilter === btn.id
                  ? 'bg-emerald-500 text-black font-black shadow-md'
                  : 'bg-black/30 hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl bg-[#131722] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-black/40 border-b border-white/10 text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">رقم القيد</th>
                <th className="py-3.5 px-4">نوع المعاملة</th>
                <th className="py-3.5 px-4">الوصف المالي</th>
                <th className="py-3.5 px-4">المبلغ</th>
                <th className="py-3.5 px-4">الرصيد اللاحق</th>
                <th className="py-3.5 px-4">المرجع</th>
                <th className="py-3.5 px-4">الوقت والتاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    لا توجد قيود مالية مطابقة
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{tx.id}</td>

                      {/* Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            tx.type === 'topup'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : tx.type === 'refund'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : tx.type === 'admin_adjustment'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          <span>
                            {tx.type === 'topup'
                              ? 'تغذية محفظة'
                              : tx.type === 'refund'
                              ? 'استرداد تلقائي'
                              : tx.type === 'admin_adjustment'
                              ? 'تسوية رصيد'
                              : tx.type === 'recharge_purchase'
                              ? 'شحن رقمي'
                              : 'شراء حساب'}
                          </span>
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-white font-medium">{tx.description}</td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono font-black text-sm whitespace-nowrap">
                        <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                          {isPositive ? '+' : ''}
                          {tx.amount.toLocaleString()} SDG
                        </span>
                      </td>

                      {/* Balance After */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {tx.balanceAfter !== undefined
                          ? `${tx.balanceAfter.toLocaleString()} SDG`
                          : '-'}
                      </td>

                      {/* Reference */}
                      <td className="py-3.5 px-4 font-mono text-amber-300/90 text-[11px]">
                        {tx.referenceId || '-'}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleString('ar-SD')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
