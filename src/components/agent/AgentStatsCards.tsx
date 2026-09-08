import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  TrendingUp, 
  Percent, 
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface AgentStatsCardsProps {
  stats: {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalCount: number;
    totalAmountProcessed: number;
    commissionRate?: number;
  };
  onFilterClick?: (status: 'Pending' | 'Completed' | 'Rejected' | 'ALL') => void;
  activeFilter?: string;
}

export const AgentStatsCards: React.FC<AgentStatsCardsProps> = ({
  stats,
  onFilterClick,
  activeFilter = 'ALL',
}) => {
  const commissionRate = stats.commissionRate ?? 1.5;
  const estimatedCommission = Math.round((stats.totalAmountProcessed * commissionRate) / 100);

  const cards = [
    {
      id: 'stat-pending',
      title: 'طلبات معلقة',
      value: stats.pendingCount,
      subtext: 'تحتاج مراجعة فورية',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      activeBorder: 'ring-2 ring-amber-500',
      statusTarget: 'Pending' as const,
      badge: stats.pendingCount > 0 ? `${stats.pendingCount} جديد` : 'محدّث',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'stat-approved',
      title: 'تمت الموافقة',
      value: stats.approvedCount,
      subtext: 'تم شحن المحفظة بنجاح',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      activeBorder: 'ring-2 ring-emerald-500',
      statusTarget: 'Completed' as const,
      badge: 'إيداع مكتمل',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'stat-rejected',
      title: 'تم الرفض',
      value: stats.rejectedCount,
      subtext: 'لأسباب عدم وصول التحويل',
      icon: XCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      activeBorder: 'ring-2 ring-rose-500',
      statusTarget: 'Rejected' as const,
      badge: 'مرفوض',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'stat-total',
      title: 'إجمالي العمليات',
      value: stats.totalCount,
      subtext: 'كافة الطلبات المسندة إليك',
      icon: Layers,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      activeBorder: 'ring-2 ring-cyan-500',
      statusTarget: 'ALL' as const,
      badge: 'سجل العمليات',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
  ];

  return (
    <div id="agent-stats-container" className="space-y-4">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = activeFilter === card.statusTarget;

          return (
            <button
              key={card.id}
              id={card.id}
              onClick={() => onFilterClick && onFilterClick(card.statusTarget)}
              className={`text-right p-3.5 sm:p-4 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
                isSelected ? card.activeBorder : ''
              } bg-zinc-900/80 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 shadow-lg`}
            >
              {/* Subtle top indicator */}
              <div className="flex items-start justify-between mb-2.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${card.badgeColor}`}>
                  {card.badge}
                </span>
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${card.bgColor} ${card.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-zinc-400 font-medium block">
                  {card.title}
                </span>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {card.value.toLocaleString()}
                </div>
                <span className="text-[11px] text-zinc-400 truncate block">
                  {card.subtext}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Financial Overview Cards (Processed Amounts & Commission) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div id="stat-amount-processed" className="p-4 rounded-xl bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>إجمالي المبالغ المعالجة</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
              {stats.totalAmountProcessed.toLocaleString()} <span className="text-xs font-normal text-zinc-400">SDG</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              إجمالي المبالغ التي تم إيداعها وتأكيدها لحسابات العملاء
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div id="stat-commission" className="p-4 rounded-xl bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              <Percent className="w-3.5 h-3.5 text-cyan-400" />
              <span>أرباح وعمولة الوكيل التقديرية ({commissionRate}%)</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-400 tracking-tight">
              {estimatedCommission.toLocaleString()} <span className="text-xs font-normal text-zinc-400">SDG</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              تحسب بناءً على العمليات المعتمدة بنجاح
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
