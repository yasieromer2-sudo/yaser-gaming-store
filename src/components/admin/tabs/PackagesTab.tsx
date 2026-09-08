import React, { useState, useEffect } from 'react';
import { Game, RechargePackage } from '../../../types';
import { api } from '../../../lib/api';
import { useStore } from '../../../context/StoreContext';
import {
  ShoppingBag,
  PlusCircle,
  Edit2,
  Trash2,
  Sparkles,
  Gamepad2,
  DollarSign,
  Zap,
  ArrowRight
} from 'lucide-react';

export const PackagesTab: React.FC = () => {
  const { showToast, refreshData, settings } = useStore();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingPackage, setEditingPackage] = useState<RechargePackage | null>(null);

  const [form, setForm] = useState({
    name: '100 + 10 مجاناً',
    diamonds: 110,
    priceSDG: 4500,
    priceUSD: 1.5,
    badge: 'الأكثر طلباً',
    icon: '💎',
  });

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      const data = await api.getGames();
      setGames(data);
      if (data.length > 0 && !selectedGameId) {
        setSelectedGameId(data[0].id);
      }
    } catch (err: any) {
      showToast('خطأ', 'فشل في تحميل الألعاب', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const currentGame = games.find((g) => g.id === selectedGameId);
  const packages = currentGame?.packages || [];

  const handleSavePackage = async () => {
    if (!selectedGameId || !form.name.trim()) {
      showToast('تنبيه', 'يرجى إكمال بيانات الباقة', 'warning');
      return;
    }

    try {
      if (editingPackage) {
        await api.updateRechargePackage(selectedGameId, editingPackage.id, form);
        showToast('تم التحديث', `تم تحديث باقة ${form.name}`, 'success');
      } else {
        await api.createRechargePackage(selectedGameId, form);
        showToast('تمت الإضافة', `تمت إضافة باقة جديدة إلى ${currentGame?.name}`, 'success');
      }

      setShowModal(false);
      setEditingPackage(null);
      resetForm();
      await loadGames();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const handleDeletePackage = async (pkg: RechargePackage) => {
    if (!confirm(`هل أنت متأكد من حذف باقة "${pkg.name}"؟`)) return;
    try {
      await api.deleteRechargePackage(selectedGameId, pkg.id);
      showToast('تم الحذف', `تم حذف الباقة بنجاح`, 'info');
      await loadGames();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      diamonds: 100,
      priceSDG: 5000,
      priceUSD: 1.6,
      badge: '',
      icon: '💎',
    });
  };

  const openEdit = (pkg: RechargePackage) => {
    setEditingPackage(pkg);
    setForm({
      name: pkg.name,
      diamonds: pkg.diamonds,
      priceSDG: pkg.priceSDG,
      priceUSD: pkg.priceUSD,
      badge: pkg.badge || '',
      icon: pkg.icon || '💎',
    });
    setShowModal(true);
  };

  // Auto calculate USD from SDG based on store exchange rate
  const handleSdgChange = (sdgVal: number) => {
    const rate = settings?.usdToSdgRate || 3100;
    const usdVal = parseFloat((sdgVal / rate).toFixed(2));
    setForm({ ...form, priceSDG: sdgVal, priceUSD: usdVal });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-[#131722] to-slate-900 border border-cyan-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">إدارة باقات الشحن والأسعار</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديد كميات الجواهر، الشدات، الروبوكس، وأسعارها بالـ SDG والـ USD مع شارات التمييز
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              setEditingPackage(null);
              setShowModal(true);
            }}
            disabled={!selectedGameId}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 self-start sm:self-auto disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            إضافة باقة جديدة لـ {currentGame?.name || 'اللعبة'}
          </button>
        </div>

        {/* Game Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-white/10 scrollbar-none">
          {games.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGameId(g.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedGameId === g.id
                  ? 'bg-cyan-500 text-black shadow-md font-black'
                  : 'bg-black/40 hover:bg-white/5 text-slate-300'
              }`}
            >
              <img
                src={g.icon}
                alt={g.name}
                className="w-4 h-4 rounded-md object-cover"
                referrerPolicy="no-referrer"
              />
              <span>{g.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                {g.packages ? g.packages.length : 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs rounded-3xl bg-[#131722] border border-white/10">
            لا توجد باقات معرفة لهذه اللعبة حتى الآن. اضغط على "إضافة باقة جديدة" لإنشاء أول باقة.
          </div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.id}
              className="p-5 rounded-3xl bg-[#131722] border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg relative group"
            >
              {/* Badge if exists */}
              {pkg.badge && (
                <span className="absolute top-4 left-4 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                  {pkg.badge}
                </span>
              )}

              <div className="space-y-3">
                <div className="text-3xl">{pkg.icon || '💎'}</div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">{pkg.name}</h3>
                  <div className="text-xs text-cyan-400 font-bold mt-0.5">
                    {pkg.diamonds.toLocaleString()} نقطة / جوهرة
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-0.5">
                  <div className="text-lg font-black text-white font-mono">
                    {pkg.priceSDG.toLocaleString()} <span className="text-xs font-sans text-slate-400">SDG</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    ~ ${pkg.priceUSD} USD
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => openEdit(pkg)}
                  className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>تعديل</span>
                </button>
                <button
                  onClick={() => handleDeletePackage(pkg)}
                  className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors"
                  title="حذف الباقة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#131722] border border-white/15 p-6 space-y-4 shadow-2xl text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white">
                {editingPackage ? 'تعديل باقة الشحن' : `إضافة باقة شحن لـ ${currentGame?.name}`}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-white">اسم الباقة الظاهر للعميل:</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: 310 + 31 مجاناً"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-white">الكمية (النقاط/الجواهر):</label>
                  <input
                    type="number"
                    value={form.diamonds}
                    onChange={(e) => setForm({ ...form, diamonds: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-white">رمز الأيقونة (Emoji):</label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-white">السعر بالجنيه (SDG):</label>
                  <input
                    type="number"
                    value={form.priceSDG}
                    onChange={(e) => handleSdgChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-white">السعر بالدولار (USD):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.priceUSD}
                    onChange={(e) => setForm({ ...form, priceUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">شارة ترويجية (اختياري):</label>
                <input
                  type="text"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  placeholder="مثال: الأكثر مبيعاً، خصم 20%"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                onClick={handleSavePackage}
                className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black shadow-md transition-transform active:scale-95"
              >
                {editingPackage ? 'حفظ التعديلات' : 'إضافة الباقة'}
              </button>
              <button
                onClick={() => setShowModal(false)}
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
