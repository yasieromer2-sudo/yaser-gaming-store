import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../../types';
import { api } from '../../../lib/api';
import { useStore } from '../../../context/StoreContext';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  Clock,
  User,
  Activity
} from 'lucide-react';

export const AuditLogsTab: React.FC = () => {
  const { showToast } = useStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      showToast('خطأ', 'فشل في تحميل سجل العمليات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (actionFilter !== 'all' && l.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        (l.target && l.target.toLowerCase().includes(q)) ||
        (l.details && JSON.stringify(l.details).toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVED')) {
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
    if (action.includes('REJECTED') || action.includes('DELETED')) {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    if (action.includes('WALLET') || action.includes('REFUND')) {
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-[#131722] to-slate-900 border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">سجل العمليات والرقابة (Audit Logs)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                سجل إلكتروني غير قابل للتعديل يوثق جميع التغييرات الإدارية، الحركات المالية، والقرارات
              </p>
            </div>
          </div>

          <button
            onClick={loadLogs}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث السجل
          </button>
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
            placeholder="بحث بنوع الإجراء، اسم المسؤول، أو الهدف..."
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-white/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          {[
            { id: 'all', label: 'كافة العمليات' },
            { id: 'WALLET_ADJUSTMENT', label: 'تعديلات المحافظ' },
            { id: 'TOP_UP_APPROVED', label: 'اعتماد التغذية' },
            { id: 'RECHARGE_STATUS_UPDATED', label: 'حالات الشحن' },
            { id: 'STORE_SETTINGS_UPDATED', label: 'إعدادات الهوية' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setActionFilter(btn.id)}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                actionFilter === btn.id
                  ? 'bg-white text-black font-black shadow-md'
                  : 'bg-black/30 hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl bg-[#131722] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-black/40 border-b border-white/10 text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">نوع الإجراء (Action)</th>
                <th className="py-3.5 px-4">المسؤول / المنفذ</th>
                <th className="py-3.5 px-4">الهدف / المعرف</th>
                <th className="py-3.5 px-4">التفاصيل والبيانات</th>
                <th className="py-3.5 px-4">الوقت والتاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    لا توجد عمليات مسجلة مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    {/* Action */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* User */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.userName}</span>
                      </div>
                    </td>

                    {/* Target */}
                    <td className="py-3.5 px-4 font-mono text-amber-400">
                      {log.target || '-'}
                    </td>

                    {/* Details */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-[11px] text-slate-300 truncate font-mono bg-black/30 px-2 py-1 rounded border border-white/5">
                        {typeof log.details === 'object'
                          ? JSON.stringify(log.details)
                          : log.details}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('ar-SD')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
