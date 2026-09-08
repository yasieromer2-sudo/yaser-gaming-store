import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { GameAccount, Game } from '../types';
import { api } from '../lib/api';
import {
  Gamepad2,
  ShieldCheck,
  Sparkles,
  Lock,
  CheckCircle2,
  Key,
  Copy,
  ExternalLink,
  Layers,
  Search,
  Wallet,
  X
} from 'lucide-react';

export const AccountsView: React.FC = () => {
  const {
    currentUser,
    refreshData,
    showToast,
    setActiveTab,
    selectedCurrency,
    formatPrice
  } = useStore();

  const [accounts, setAccounts] = useState<GameAccount[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<GameAccount | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [purchasedDelivery, setPurchasedDelivery] = useState<{
    loginType: string;
    deliveryDetails: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [accs, gms] = await Promise.all([
        api.getAccounts(),
        api.getGames(),
      ]);
      setAccounts(accs);
      setGames(gms);
    } catch (err: any) {
      showToast('خطأ', 'فشل تحميل عروض الحسابات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesGame = selectedGameFilter === 'all' || acc.gameId === selectedGameFilter;
    const matchesSearch =
      acc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.gameName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGame && matchesSearch;
  });

  const handleBuyAccount = async (account: GameAccount) => {
    if (account.status !== 'available') {
      showToast('تنبيه', 'هذا الحساب تم بيعه بالفعل لمستخدم آخر', 'warning');
      return;
    }

    const userBalance = currentUser?.wallet?.balance || 0;
    if (userBalance < account.priceSDG) {
      showToast('رصيد غير كافٍ', `رصيد محفظتك (${userBalance.toLocaleString()} SDG) غير كافٍ لشراء هذا الحساب (${account.priceSDG.toLocaleString()} SDG). يرجى تغذية محفظتك.`, 'error');
      return;
    }

    setIsPurchasing(true);
    try {
      const res = await api.purchaseAccount(account.id);
      setPurchasedDelivery(res.account.accountCredentialsHidden);
      await refreshData();
      await loadData();
      showToast('🎉 مبروك!', 'تم شراء الحساب بنجاح! بيانات الدخول ظاهرة الآن أمامك.', 'success');
    } catch (err: any) {
      showToast('فشل الشراء', err.message, 'error');
    } finally {
      setIsPurchasing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('تم النسخ', `تم نسخ ${label} إلى الحافظة بنجاح`, 'info');
  };

  const userBalance = currentUser?.wallet?.balance || 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-400" />
            سوق عروض الحسابات المعتمدة
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            حسابات ألعاب نادرة وموثقة بضمان المتجر، تسليم فوري لبيانات الدخول بعد الدفع
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن حساب، سكن، أو لفل..."
            className="w-full pr-9 pl-4 py-2 rounded-xl bg-[#131722] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Game Filters Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedGameFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedGameFilter === 'all'
              ? 'bg-indigo-500 text-white shadow-md'
              : 'bg-[#131722] text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          جميع الألعاب ({accounts.length})
        </button>
        {games.map((g) => {
          const count = accounts.filter((a) => a.gameId === g.id).length;
          return (
            <button
              key={g.id}
              onClick={() => setSelectedGameFilter(g.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedGameFilter === g.id
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-[#131722] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <img
                src={g.icon}
                alt={g.name}
                className="w-4 h-4 rounded-md object-cover"
                referrerPolicy="no-referrer"
              />
              <span>{g.name}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Accounts Grid */}
      {filteredAccounts.length === 0 ? (
        <div className="text-center py-12 rounded-3xl bg-[#131722] border border-white/5">
          <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="font-bold text-slate-300 text-sm">لا توجد حسابات معروضة حالياً</h4>
          <p className="text-xs text-slate-500 mt-1">
            جرب اختيار تصنيف آخر أو ترقب إضافة حسابات جديدة قريباً
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((account) => {
            const isSold = account.status === 'sold';
            const isAvailable = account.status === 'available';

            return (
              <div
                key={account.id}
                className="group relative rounded-3xl bg-[#131722] border border-white/10 hover:border-indigo-500/40 overflow-hidden shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Image Cover */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/50">
                  <img
                    src={account.images[0]}
                    alt={account.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131722] via-transparent to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    {isSold ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/90 text-white shadow-md">
                        مباع (Sold)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-black shadow-md">
                        متاح للشراء
                      </span>
                    )}
                  </div>

                  {/* Game & Level Tag */}
                  <div className="absolute bottom-2 right-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-black/70 text-indigo-300 border border-white/10 backdrop-blur-sm">
                      {account.gameName}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-black/70 text-amber-300 border border-white/10 backdrop-blur-sm">
                      المستوى {account.level}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-white line-clamp-2 leading-snug">
                      {account.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {account.description}
                    </p>

                    {/* Key Items / Badges */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {account.keyItems.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-slate-300 border border-white/5"
                        >
                          ★ {item}
                        </span>
                      ))}
                      {account.keyItems.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] text-slate-400">
                          +{account.keyItems.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-emerald-400">
                        {formatPrice(account.priceSDG, account.priceUSD)}
                      </span>
                      {selectedCurrency === 'SDG' && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          ~ ${account.priceUSD} USD
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedAccount(account)}
                      className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs shadow-md transition-transform active:scale-95"
                    >
                      التفاصيل والشراء
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Account Details & Purchase Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl max-h-[88vh] overflow-y-auto p-4 sm:p-6 rounded-3xl bg-[#131722] border border-white/15 shadow-2xl space-y-5 text-right my-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#131722] z-10 flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedAccount.gameName}
                </span>
                <span className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  المستوى {selectedAccount.level}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedAccount(null);
                  setPurchasedDelivery(null);
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Images Gallery */}
            <div className="space-y-2">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/60 border border-white/10">
                <img
                  src={selectedAccount.images[0]}
                  alt={selectedAccount.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {selectedAccount.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedAccount.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="w-20 h-14 rounded-xl object-cover border border-white/15 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="font-black text-lg text-white leading-tight">
                {selectedAccount.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-black/30 p-3.5 rounded-2xl border border-white/5">
                {selectedAccount.description}
              </p>
            </div>

            {/* Features & Key Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">أبرز سكنات ومميزات الحساب:</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedAccount.keyItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-200 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Guarantee Notice */}
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
              <div className="space-y-0.5">
                <span className="font-bold block">ضمان المتجر الذهبي:</span>
                <span className="text-[11px] text-indigo-200/80">
                  يتم تسليم بيانات تسجيل الدخول وتغيير الربط فور اكتمال الدفع من رصيد محفظتك، مع دعم فني فوري.
                </span>
              </div>
            </div>

            {/* If Already Purchased / Delivery Revealed */}
            {purchasedDelivery && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 space-y-3 animate-in zoom-in-95">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  بيانات تسجيل الدخول للحساب (خاص بالمشتري):
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-white break-all space-y-1">
                  <div>
                    <span className="text-slate-400">نوع التسجيل: </span>
                    <span className="text-emerald-300">{purchasedDelivery.loginType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">بيانات الحساب: </span>
                    <span className="text-amber-300 font-bold">{purchasedDelivery.deliveryDetails}</span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `${purchasedDelivery.loginType}\n${purchasedDelivery.deliveryDetails}`,
                      'بيانات الحساب'
                    )
                  }
                  className="w-full py-2 rounded-xl bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Copy className="w-3.5 h-3.5" />
                  نسخ بيانات الدخول
                </button>
              </div>
            )}

            {/* Pricing & Purchase Action */}
            <div className="sticky bottom-0 bg-[#131722] pt-3 pb-1 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
              <div>
                <span className="text-[11px] text-slate-400 block">سعر الشراء:</span>
                <span className="text-lg font-black text-emerald-400">
                  {formatPrice(selectedAccount.priceSDG, selectedAccount.priceUSD)}
                </span>
              </div>

              {selectedAccount.status === 'sold' && !purchasedDelivery ? (
                <div className="px-6 py-3 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                  تم بيع هذا الحساب مسبقاً
                </div>
              ) : purchasedDelivery ? (
                <button
                  onClick={() => {
                    setSelectedAccount(null);
                    setPurchasedDelivery(null);
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/10 text-white font-extrabold text-xs"
                >
                  إغلاق النافذة
                </button>
              ) : userBalance >= selectedAccount.priceSDG ? (
                <button
                  onClick={() => handleBuyAccount(selectedAccount)}
                  disabled={isPurchasing}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  {isPurchasing ? (
                    <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      شراء الحساب وخصم الرصيد الآن
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedAccount(null);
                    setActiveTab('wallet');
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  رصيدك غير كافٍ - شحن المحفظة
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
