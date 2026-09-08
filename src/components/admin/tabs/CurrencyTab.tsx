import React, { useState } from 'react';
import { useStore } from '../../../context/StoreContext';
import { api } from '../../../lib/api';
import {
  DollarSign,
  TrendingUp,
  RefreshCw,
  Calculator,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const CurrencyTab: React.FC = () => {
  const { settings, showToast, refreshData } = useStore();
  const [rate, setRate] = useState<number>(settings?.usdToSdgRate || 3100);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Currency Converter Simulator
  const [calcUsd, setCalcUsd] = useState<number>(10);
  const [calcSdg, setCalcSdg] = useState<number>(31000);

  const handleUpdateRate = async () => {
    if (rate <= 0) {
      showToast('تنبيه', 'يرجى إدخال سعر صرف صالح', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      await api.updateStoreSettings({
        usdToSdgRate: rate,
      });
      showToast(
        'تم تحديث سعر الصرف',
        `سعر الصرف الجديد: 1 USD = ${rate.toLocaleString()} SDG. تم تحديث جميع أسعار الباقات فورياً`,
        'success'
      );
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCalcUsdChange = (val: number) => {
    setCalcUsd(val);
    setCalcSdg(Math.round(val * rate));
  };

  const handleCalcSdgChange = (val: number) => {
    setCalcSdg(val);
    setCalcUsd(parseFloat((val / rate).toFixed(2)));
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#131722] to-slate-900 border border-emerald-500/20 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">إدارة أسعار العملات وسعر الصرف</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تحديد سعر صرف الدولار مقابل الجنيه السوداني (USD / SDG) لتسعير الباقات والحسابات تلقائياً
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rate Setting Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#131722] border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>سعر الصرف المعتمد في المتجر</span>
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
              1 USD = {rate.toLocaleString()} SDG
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">
              قيمة الدولار الواحد بالجنيه السوداني:
            </label>
            <div className="relative">
              <input
                type="number"
                value={rate}
                onChange={(e) => {
                  const r = parseFloat(e.target.value) || 0;
                  setRate(r);
                  setCalcSdg(Math.round(calcUsd * r));
                }}
                className="w-full px-4 py-3.5 rounded-2xl bg-black/40 border border-white/15 text-white font-mono text-xl font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                SDG
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              عند تعديل السعر، سيتم تطبيقه على عمليات التحويل وحساب أسعار الشحن في المتجر فورياً.
            </p>
          </div>

          {/* Quick presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-bold block">مستويات شائعة سريعة:</span>
            <div className="flex flex-wrap gap-2">
              {[2800, 2950, 3000, 3100, 3200, 3300].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setRate(preset);
                    setCalcSdg(Math.round(calcUsd * preset));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors ${
                    rate === preset
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {preset.toLocaleString()} SDG
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleUpdateRate}
            disabled={isSaving}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-lg shadow-emerald-500/20 transition-transform active:scale-95"
          >
            {isSaving ? 'جارٍ الحفظ...' : 'حفظ واعتماد سعر الصرف'}
          </button>
        </div>

        {/* Currency Converter Simulator */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#131722] border border-white/10 space-y-6">
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <span>حاسبة ومحاكي تحويل الأسعار</span>
          </h3>
          <p className="text-xs text-slate-400">
            تأكد من قيمة الباقة بالدولار والجنيه قبل تسعير المنتجات
          </p>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">المبلغ بالدولار (USD):</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={calcUsd}
                  onChange={(e) => handleCalcUsdChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-white font-mono text-base font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400 font-mono">
                  USD $
                </span>
              </div>
            </div>

            <div className="flex justify-center text-slate-500">
              <ArrowRightLeft className="w-5 h-5 rotate-90" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">المعادل بالجنيه (SDG):</label>
              <div className="relative">
                <input
                  type="number"
                  value={calcSdg}
                  onChange={(e) => handleCalcSdgChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400 font-mono">
                  SDG
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>سعر الصرف المستخدم في الحاسبة:</span>
                <span className="font-mono text-white font-bold">1 USD = {rate} SDG</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>تكلفة شحن باقة 5$:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {(5 * rate).toLocaleString()} SDG
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
