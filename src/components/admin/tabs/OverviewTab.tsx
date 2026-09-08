import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Wallet,
  ArrowDownCircle,
  TrendingUp,
  Zap,
  Gamepad2,
  Clock,
  DollarSign,
  ChevronRight,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../../../lib/api';
import { AdminTab } from '../AdminSidebar';

interface OverviewTabProps {
  onNavigateTab: (tab: AdminTab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigateTab }) => {
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'month'>('7days');
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeChartMetric, setActiveChartMetric] = useState<'sales' | 'topUps' | 'revenue'>('sales');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminAnalytics(timeRange);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = analytics?.chartData || [];
  const maxChartValue = Math.max(
    ...chartData.map((d: any) => d[activeChartMetric] || 0),
    1000
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Controls: Welcome & Time Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#131722] border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">لوحة الإحصائيات الشاملة</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              مباشر (Live Sync)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            متابعة حركة المبيعات، طلبات الشحن، تغذية المحافظ، والعمليات المالية لمتجر الألعاب
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/10 text-xs">
          {[
            { id: 'today', label: 'اليوم' },
            { id: '7days', label: 'آخر 7 أيام' },
            { id: '30days', label: 'آخر 30 يوماً' },
            { id: 'month', label: 'هذا الشهر' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeRange(item.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                timeRange === item.id
                  ? 'bg-amber-500 text-black shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 9 Statistical Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Total Users */}
        <div className="p-5 rounded-3xl bg-[#131722] border border-white/10 hover:border-white/20 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي المستخدمين</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {analytics?.totalUsers?.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>حسابات مسجلة وموثقة</span>
            <button
              onClick={() => onNavigateTab('users')}
              className="text-blue-400 hover:underline flex items-center gap-0.5 font-bold"
            >
              <span>إدارة</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 2. New Users */}
        <div className="p-5 rounded-3xl bg-[#131722] border border-white/10 hover:border-white/20 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">المستخدمون الجدد</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-300">
            +{analytics?.newUsers?.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-400">خلال الفترة المحددة ({timeRange})</div>
        </div>

        {/* 3. Total Wallet Balance */}
        <div className="p-5 rounded-3xl bg-[#131722] border border-white/10 hover:border-white/20 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي الرصيد في المحافظ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {analytics?.totalWalletBalance?.toLocaleString() || '0'}{' '}
            <span className="text-xs font-sans text-slate-400">SDG</span>
          </div>
          <div className="text-[11px] text-slate-400">أموال مودعة متاحة للشراء والشحن</div>
        </div>

        {/* 4. Total Top-Ups */}
        <div className="p-5 rounded-3xl bg-[#131722] border border-white/10 hover:border-white/20 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي تغذية المحافظ</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {analytics?.totalTopUpAmount?.toLocaleString() || '0'}{' '}
            <span className="text-xs font-sans text-slate-400">SDG</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>عمليات معتمدة من الوكلاء</span>
            <button
              onClick={() => onNavigateTab('topups')}
              className="text-indigo-400 hover:underline flex items-center gap-0.5 font-bold"
            >
              <span>الطلبات</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 5. Total Sales */}
        <div className="p-5 rounded-3xl bg-[#131722] border border-white/10 hover:border-white/20 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي المبيعات</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {analytics?.totalSales?.toLocaleString() || '0'}{' '}
            <span className="text-xs font-sans text-slate-400">SDG</span>
          </div>
          <div className="text-[11px] text-slate-400">شحن الألعاب الرقمية + مبيعات الحسابات</div>
        </div>

        {/* 6. Total Recharge Count */}
        <div className="p-5 rounded-3xl bg-[#131722] border border-white/10 hover:border-white/20 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي طلبات الشحن</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {analytics?.totalRechargeOrders?.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>جواهر، شدات، ونقاط ألعاب</span>
            <button
              onClick={() => onNavigateTab('recharge')}
              className="text-purple-400 hover:underline flex items-center gap-0.5 font-bold"
            >
              <span>سجل الشحن</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 7. Available Game Accounts */}
        <div className="p-5 rounded-3xl bg-[#131722] border border-white/10 hover:border-white/20 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الحسابات المتاحة للبيع</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-300">
            {analytics?.availableAccounts?.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>حسابات جاهزة للتسليم الفوري</span>
            <button
              onClick={() => onNavigateTab('accounts')}
              className="text-emerald-400 hover:underline flex items-center gap-0.5 font-bold"
            >
              <span>السوق</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 8. Pending Requests */}
        <div className="p-5 rounded-3xl bg-[#131722] border border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300">الطلبات المعلقة للتحقق</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {analytics?.pendingRequests?.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-amber-200/80 flex items-center justify-between">
            <span>
              {analytics?.pendingTopUps || 0} تغذية + {analytics?.pendingRecharges || 0} شحن
            </span>
            <button
              onClick={() => onNavigateTab('topups')}
              className="text-amber-400 hover:underline font-bold"
            >
              مراجعة فورية
            </button>
          </div>
        </div>

        {/* 9. Estimated Profits */}
        <div className="p-5 rounded-3xl bg-[#131722] border border-white/10 hover:border-white/20 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الأرباح التقديرية</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {analytics?.estimatedProfits?.toLocaleString() || '0'}{' '}
            <span className="text-xs font-sans text-slate-400">SDG</span>
          </div>
          <div className="text-[11px] text-slate-400">هامش ربح تجاري تقديري بنسبة 15%</div>
        </div>
      </div>

      {/* Interactive Activity & Revenue Chart */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#131722] border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <span>مخطط النشاط المالي والمبيعات اليومية</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة تصاعد العمليات الحجمية عبر الأيام للفترة المختارة
            </p>
          </div>

          {/* Metric switch buttons */}
          <div className="flex items-center gap-2">
            {[
              { id: 'sales', label: 'المبيعات (SDG)' },
              { id: 'topUps', label: 'تغذية المحافظ (SDG)' },
              { id: 'revenue', label: 'صافي الربح التقديري' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveChartMetric(m.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeChartMetric === m.id
                    ? 'bg-amber-500 text-black font-black'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Chart Visualization */}
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
            لا توجد بيانات كافية للفترة المحددة
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-64 flex items-end gap-2 pt-6 pb-2 border-b border-white/10">
              {chartData.map((d: any, index: number) => {
                const val = d[activeChartMetric] || 0;
                const heightPercent = Math.max(Math.min((val / maxChartValue) * 100, 100), 5);
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-12 bg-black/90 text-white text-[10px] font-mono px-2.5 py-1 rounded-lg border border-white/20 whitespace-nowrap z-20 shadow-xl transition-opacity">
                      <div className="font-bold">{d.label}</div>
                      <div>{val.toLocaleString()} SDG</div>
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[32px] rounded-t-xl transition-all duration-300 group-hover:brightness-125 ${
                        activeChartMetric === 'sales'
                          ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                          : activeChartMetric === 'topUps'
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                          : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                      }`}
                    />

                    {/* Day label */}
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-[40px]">
                      {d.label.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
              <span>الأدنى: 0 SDG</span>
              <span>الأعلى في هذه الفترة: {maxChartValue.toLocaleString()} SDG</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Access Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigateTab('topups')}
          className="p-5 rounded-3xl bg-[#131722] hover:bg-[#181e2b] border border-white/10 hover:border-amber-500/40 text-right transition-all group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowDownCircle className="w-5 h-5" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <h4 className="font-extrabold text-sm text-white">إدارة طلبات التغذية البنكية</h4>
          <p className="text-xs text-slate-400">
            فحص إشعارات بنكك والتحويلات، والموافقة على إيداع الرصيد في محافظ المستخدمين
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('recharge')}
          className="p-5 rounded-3xl bg-[#131722] hover:bg-[#181e2b] border border-white/10 hover:border-emerald-500/40 text-right transition-all group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>
          <h4 className="font-extrabold text-sm text-white">إدارة ومراقبة طلبات الشحن</h4>
          <p className="text-xs text-slate-400">
            متابعة حالة شحن الحسابات، وتنفيذ الاسترداد المالي التلقائي في حال تعثر الطلب
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('customization')}
          className="p-5 rounded-3xl bg-[#131722] hover:bg-[#181e2b] border border-white/10 hover:border-indigo-500/40 text-right transition-all group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>
          <h4 className="font-extrabold text-sm text-white">تخصيص هوية المتجر (White-Label)</h4>
          <p className="text-xs text-slate-400">
            تغيير الألوان، الشعار، النصوص الترويجية، ومطابقة التصميم للعميل الجديد فوراً
          </p>
        </button>
      </div>
    </div>
  );
};
