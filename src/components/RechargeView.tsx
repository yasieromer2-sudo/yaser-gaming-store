import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Game,
  RechargePackage,
  RechargeOrder
} from '../types';
import { api } from '../lib/api';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Wallet,
  Coins,
  Gamepad2,
  Flame,
  ArrowLeft,
  Percent
} from 'lucide-react';

export const RechargeView: React.FC = () => {
  const {
    currentUser,
    banners,
    offers,
    settings,
    refreshData,
    showToast,
    setActiveTab,
    selectedCurrency,
    formatPrice
  } = useStore();

  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<RechargePackage | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [serverOrRegion, setServerOrRegion] = useState<string>('الشرق الأوسط (MENA)');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [lastOrder, setLastOrder] = useState<RechargeOrder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load games from backend
  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      const data = await api.getGames();
      setGames(data);
      if (data.length > 0 && !selectedGame) {
        setSelectedGame(data[0]);
        loadPackages(data[0].id);
      }
    } catch (err: any) {
      showToast('خطأ', 'فشل في تحميل قائمة الألعاب', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPackages = async (gameId: string) => {
    try {
      const pkgs = await api.getPackages(gameId);
      setPackages(pkgs);
      setSelectedPackage(pkgs[0] || null);
    } catch (err: any) {
      showToast('خطأ', 'فشل في تحميل باقات الشحن', 'error');
    }
  };

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    setSelectedPackage(null);
    loadPackages(game.id);
  };

  const handleRechargeSubmit = async () => {
    if (!selectedGame || !selectedPackage) {
      showToast('تنبيه', 'يرجى اختيار اللعبة وباقة الشحن', 'warning');
      return;
    }

    if (!playerId.trim()) {
      showToast('تنبيه', 'يرجى إدخال Player ID / معرف اللاعب في اللعبة', 'warning');
      return;
    }

    const userBalance = currentUser?.wallet?.balance || 0;
    if (userBalance < selectedPackage.priceSDG) {
      showToast('رصيد غير كافٍ', `رصيد محفظتك (${userBalance.toLocaleString()} SDG) غير كافٍ لشحن هذه الباقة. يرجى تغذية المحفظة أولاً.`, 'error');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeRecharge = async () => {
    if (!selectedGame || !selectedPackage) return;
    setIsSubmitting(true);

    try {
      const order = await api.createRechargeOrder({
        gameId: selectedGame.id,
        packageId: selectedPackage.id,
        playerId: playerId.trim(),
        serverOrRegion,
      });

      setLastOrder(order);
      setShowConfirmModal(false);
      await refreshData();
      showToast('نجاح الشحن!', `تم استلام طلب شحن ${selectedPackage.name} بنجاح وجاري المعالجة.`, 'success');
    } catch (err: any) {
      showToast('فشل الشحن', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userBalance = currentUser?.wallet?.balance || 0;
  const balanceAfter = selectedPackage ? userBalance - selectedPackage.priceSDG : userBalance;
  const isBalanceEnough = selectedPackage ? userBalance >= selectedPackage.priceSDG : true;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Promo Banner Carousel */}
      {banners.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40">
          <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-black shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                {banners[0].badge}
              </span>
              <h2 className="text-xl md:text-3xl font-black text-white leading-tight">
                {banners[0].title}
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                {banners[0].subtitle}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <button
                onClick={() => setActiveTab('wallet')}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95"
              >
                <Wallet className="w-4 h-4" />
                تغذية المحفظة الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Section Header */}
      {offers.filter((o) => o.status === 'Published').length > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-[#131722] to-slate-900 border border-amber-500/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Flame className="w-4 h-4 fill-current" />
              </span>
              <div>
                <h3 className="text-sm font-black text-white">أقوى العروض والتخفيضات النشطة</h3>
                <p className="text-[11px] text-slate-400">خصومات فورية وباقات مضاعفة لفترة محدودة</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('offers')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1 shadow-md transition-transform active:scale-95"
            >
              <span>عرض الكل</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {offers
              .filter((o) => o.status === 'Published')
              .slice(0, 3)
              .map((offer) => (
                <div
                  key={offer.id}
                  onClick={() => setActiveTab('offers')}
                  className="cursor-pointer group p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-amber-500/40 transition-all flex items-center gap-3"
                >
                  <img
                    src={offer.imageUrl}
                    alt={offer.title}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10 group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      {offer.badgeText && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-black">
                          {offer.badgeText}
                        </span>
                      )}
                      {offer.discountPercent && (
                        <span className="px-1.5 py-0.5 rounded-md bg-red-600/80 text-white text-[9px] font-bold flex items-center gap-0.5">
                          <Percent className="w-2.5 h-2.5" />
                          {offer.discountPercent}%
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                      {offer.title}
                    </h4>
                    {offer.subtitle && (
                      <p className="text-[10px] text-slate-400 truncate">{offer.subtitle}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Main Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            شحن الألعاب الفوري
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            اختر اللعبة، حدد الباقة، وأدخل الـ Player ID الخاص بك للشحن التلقائي
          </p>
        </div>
      </div>

      {/* 1. Games Horizontal / Grid Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-mono flex items-center justify-center">
            1
          </span>
          اختر اللعبة:
        </label>
        {games.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#131722] border border-white/5 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 text-zinc-400 mx-auto flex items-center justify-center">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">لا توجد ألعاب مضافة حالياً</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              يمكن لمدير المتجر إضافة ألعاب جديدة وباقات الشحن المرتبطة بها مباشرة من لوحة الإدارة.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {games.map((game) => {
              const isSelected = selectedGame?.id === game.id;
              return (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game)}
                  className={`group relative flex items-center gap-3 p-3 rounded-2xl border text-right transition-all duration-200 ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      : 'bg-[#131722] border-white/5 hover:border-white/20 hover:bg-[#181d2b]'
                  }`}
                >
                  <img
                    src={game.icon}
                    alt={game.name}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-white truncate">{game.name}</h4>
                    <span className="text-[10px] text-slate-400 block">{game.category}</span>
                  </div>
                  {isSelected && (
                    <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Packages Grid */}
      {selectedGame && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-mono flex items-center justify-center">
                2
              </span>
              اختر باقة الشحن لـ {selectedGame.name}:
            </label>
            <span className="text-[11px] text-slate-400">{packages.length} باقة متاحة</span>
          </div>

          {packages.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-[#131722] border border-white/5 space-y-2">
              <p className="text-xs text-slate-400">لا توجد باقات شحن نشطة لهذه اللعبة حالياً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                const canAfford = userBalance >= pkg.priceSDG;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`cursor-pointer relative p-4 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-500/20 to-indigo-500/10 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-[#131722] border-white/5 hover:border-white/15 hover:bg-[#181e2e]'
                    }`}
                  >
                    {/* Badge */}
                    {pkg.badge && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-black">
                        {pkg.badge}
                      </span>
                    )}

                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0 p-2 rounded-xl bg-white/5 border border-white/10">
                        {pkg.icon || '💎'}
                      </span>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-white">{pkg.name}</h4>
                        <p className="text-xs text-slate-400 font-mono">{pkg.diamondsOrPoints}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-black text-emerald-400">
                          {formatPrice(pkg.priceSDG, pkg.priceUSD)}
                        </span>
                        {selectedCurrency === 'SDG' && (
                          <span className="text-[10px] text-slate-400 block">
                            ~ ${pkg.priceUSD.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          canAfford
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {canAfford ? 'رصيد كافٍ' : 'رصيد غير كافٍ'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Player Details & Live Preview Form */}
      {selectedGame && selectedPackage && (
        <div className="p-5 md:p-6 rounded-3xl bg-[#131722] border border-white/10 space-y-4 shadow-xl">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-mono flex items-center justify-center">
              3
            </span>
            معلومات حساب اللاعب:
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">
                معرف اللاعب (Player ID / UID):
              </label>
              <input
                type="text"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                placeholder="مثال: 981245892"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400">
                تأكد من كتابة الـ ID بشكل صحيح لتجنب وصول الشحن لحساب آخر.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">الخادم / المنطقة:</label>
              <select
                value={serverOrRegion}
                onChange={(e) => setServerOrRegion(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="الشرق الأوسط (MENA)">الشرق الأوسط (MENA)</option>
                <option value="أوروبا (Europe)">أوروبا (Europe)</option>
                <option value="عالمي (Global)">عالمي (Global)</option>
              </select>
            </div>
          </div>

          {/* Pricing & Balance Calculation Summary Card */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>اللعبة والباقة:</span>
              <span className="font-bold text-white">
                {selectedGame.name} - {selectedPackage.name}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>سعر العملية:</span>
              <span className="font-bold text-emerald-400">
                {formatPrice(selectedPackage.priceSDG, selectedPackage.priceUSD)}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>رصيد محفظتك الحالي:</span>
              <span className="font-bold text-white">{userBalance.toLocaleString()} SDG</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between font-bold">
              <span className="text-slate-200">الرصيد المتبقي بعد الشحن:</span>
              <span className={balanceAfter >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {balanceAfter.toLocaleString()} SDG
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {isBalanceEnough ? (
              <button
                onClick={handleRechargeSubmit}
                disabled={!playerId.trim()}
                className="w-full sm:flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                id="recharge-confirm-btn"
              >
                <Zap className="w-4 h-4 fill-current" />
                تأكيد الشحن الفوري الآن
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('wallet')}
                className="w-full sm:flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
              >
                <Wallet className="w-4 h-4" />
                رصيدك غير كافٍ - تغذية المحفظة الآن
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedGame && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#131722] border border-white/15 shadow-2xl space-y-5 text-right">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">تأكيد عملية الشحن</h3>
                <p className="text-xs text-slate-400">يرجى مراجعة التفاصيل قبل الخصم من المحفظة</p>
              </div>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-black/40 border border-white/5 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">اللعبة:</span>
                <span className="font-bold text-white">{selectedGame.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">باقة الشحن:</span>
                <span className="font-bold text-white">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">معرف اللاعب (Player ID):</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{playerId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">المبلغ المخصوم:</span>
                <span className="font-black text-white text-sm">
                  {formatPrice(selectedPackage.priceSDG, selectedPackage.priceUSD)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">الرصيد بعد العملية:</span>
                <span className="font-bold text-slate-200">{balanceAfter.toLocaleString()} SDG</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={executeRecharge}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    نعم، خصم وشحن الآن
                  </>
                )}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Order Details Modal */}
      {lastOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#131722] border border-emerald-500/40 shadow-2xl space-y-4 text-right">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-black text-xl text-white">تم إرسال الشحن بنجاح!</h3>
              <p className="text-xs text-slate-300">
                رقم طلب الشحن: <span className="font-mono text-emerald-400">{lastOrder.id}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">اللعبة:</span>
                <span className="font-bold text-white">{lastOrder.gameName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">الباقة:</span>
                <span className="font-bold text-white">{lastOrder.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">معرف اللاعب:</span>
                <span className="font-mono font-bold text-emerald-400">{lastOrder.playerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">الحالة الحالية:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300">
                  {lastOrder.status === 'Processing' ? 'جاري التنفيذ الفوري...' : lastOrder.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setLastOrder(null)}
                className="w-full py-3 rounded-xl bg-emerald-500 text-black font-extrabold text-xs shadow-md"
              >
                تم، العودة للشحن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
