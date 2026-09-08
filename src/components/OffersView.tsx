import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { OfferItem, OfferType } from '../types';
import {
  Flame,
  Percent,
  Newspaper,
  Megaphone,
  Search,
  Calendar,
  Sparkles,
  ArrowLeft,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Tag,
  X
} from 'lucide-react';

export const OffersView: React.FC = () => {
  const { offers, setActiveTab, settings } = useStore();
  const [selectedType, setSelectedType] = useState<'all' | OfferType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);

  // Filter only published and unexpired offers
  const activeOffers = offers.filter((o) => {
    if (o.status !== 'Published') return false;
    if (o.validUntil && new Date(o.validUntil).getTime() < Date.now()) {
      return false; // auto hide expired
    }
    if (selectedType !== 'all' && o.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.title.toLowerCase().includes(q) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(q)) ||
        (o.description && o.description.toLowerCase().includes(q)) ||
        (o.badgeText && o.badgeText.toLowerCase().includes(q))
      );
    }
    return true;
  }).sort((a, b) => (a.order || 0) - (b.order || 0));

  const featuredOffers = activeOffers.filter((o) => o.isFeatured);
  const regularOffers = activeOffers.filter((o) => !o.isFeatured || activeOffers.length <= 2);

  const handleAction = (offer: OfferItem) => {
    if (offer.actionUrl) {
      if (offer.actionUrl.startsWith('http')) {
        window.open(offer.actionUrl, '_blank');
      } else {
        setActiveTab(offer.actionUrl);
      }
    } else {
      setActiveTab('recharge');
    }
  };

  const getTypeIcon = (type: OfferType) => {
    switch (type) {
      case 'FEATURED_OFFER':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'DISCOUNT':
        return <Percent className="w-4 h-4 text-emerald-400" />;
      case 'NEWS':
        return <Newspaper className="w-4 h-4 text-blue-400" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-amber-950/30 via-[#131722] to-slate-900 border border-amber-500/20 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>العروض الحصرية وتحديثات المنصة اللحظية</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            عروض وخصومات <span className="text-amber-400">{settings?.storeName || 'الألعاب الرقمية'}</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            اغتنم أقوى التخفيضات اللحظية على باقات شحن الألعاب، متابعة أحدث بطولات وأخبار السيرفرات، وإعلانات المنصة المعتمدة.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-[#131722] border border-white/10 shadow-lg">
        {/* Type pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'FEATURED_OFFER', label: 'عروض حصرية', icon: <Flame className="w-3.5 h-3.5 text-amber-400" /> },
            { id: 'DISCOUNT', label: 'تخفيضات الأسعار', icon: <Percent className="w-3.5 h-3.5 text-emerald-400" /> },
            { id: 'NEWS', label: 'أخبار الألعاب', icon: <Newspaper className="w-3.5 h-3.5 text-blue-400" /> },
            { id: 'ANNOUNCEMENT', label: 'إعلانات رسمية', icon: <Megaphone className="w-3.5 h-3.5 text-purple-400" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                selectedType === tab.id
                  ? 'bg-amber-500 text-black shadow-md font-black'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في العروض والأخبار..."
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Featured Banners (Hero cards) */}
      {featuredOffers.length > 0 && selectedType === 'all' && !searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-black text-white">العروض المميزة</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {featuredOffers.map((item) => (
              <div
                key={item.id}
                className="relative group rounded-3xl overflow-hidden bg-[#131722] border border-amber-500/30 hover:border-amber-500/60 shadow-2xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131722] via-[#131722]/40 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    {item.badgeText && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-black shadow-lg">
                        {item.badgeText}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      {getTypeIcon(item.type)}
                      <span>مميز</span>
                    </span>
                  </div>

                  {item.discountPercent && (
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-2xl bg-red-600 text-white font-black text-sm flex items-center gap-1.5 shadow-xl">
                      <Percent className="w-4 h-4" />
                      <span>خصم {item.discountPercent}%</span>
                    </div>
                  )}

                  {/* Bottom title in banner */}
                  <div className="absolute bottom-4 right-4 left-4">
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-snug drop-shadow-md">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-xs sm:text-sm font-semibold text-amber-300 mt-1">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {item.description && (
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-2">
                    {item.validUntil ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>ينتهي العرض: {new Date(item.validUntil).toLocaleDateString('ar-SD')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>عرض متاح ومستمر</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOffer(item)}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold"
                      >
                        تفاصيل
                      </button>
                      <button
                        onClick={() => handleAction(item)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                      >
                        <span>{item.actionLabel || 'استفد الآن'}</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Offers Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-black text-white">
              {selectedType === 'all' ? 'جميع العروض والتحديثات' : 'نتائج التصفية'}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {activeOffers.length} عنصر متوفر
          </span>
        </div>

        {activeOffers.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#131722] border border-white/10 space-y-3">
            <Flame className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">لا توجد عروض حالياً</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              ترقبوا قريباً المزيد من العروض والخصومات الحصرية والأخبار فور إطلاقها!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeOffers.map((item) => (
              <div
                key={item.id}
                className="group rounded-3xl bg-[#131722] border border-white/10 hover:border-emerald-500/40 overflow-hidden shadow-xl flex flex-col justify-between transition-all duration-300"
              >
                <div>
                  <div className="relative h-44 w-full bg-black/40 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#131722] via-transparent to-black/50" />

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {item.badgeText && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black shadow-md">
                          {item.badgeText}
                        </span>
                      )}
                    </div>

                    {item.discountPercent && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-red-600 text-white font-black text-xs flex items-center gap-1 shadow-lg">
                        <Percent className="w-3.5 h-3.5" />
                        <span>خصم {item.discountPercent}%</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span className="text-[11px] font-bold text-slate-400">
                        {item.type === 'FEATURED_OFFER' && 'عرض مميز'}
                        {item.type === 'DISCOUNT' && 'تخفيض سعر'}
                        {item.type === 'NEWS' && 'خبر ألعاب'}
                        {item.type === 'ANNOUNCEMENT' && 'إعلان رسمي'}
                      </span>
                    </div>

                    <h3 className="font-black text-base text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {item.title}
                    </h3>

                    {item.subtitle && (
                      <p className="text-xs font-semibold text-amber-300/90 line-clamp-1">
                        {item.subtitle}
                      </p>
                    )}

                    {item.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-3">
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                    {item.validUntil ? (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        حتى {new Date(item.validUntil).toLocaleDateString('ar-SD')}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold">عرض مستمر</span>
                    )}

                    <button
                      onClick={() => setSelectedOffer(item)}
                      className="text-xs text-slate-300 hover:text-white font-bold"
                    >
                      التفاصيل
                    </button>
                  </div>

                  <button
                    onClick={() => handleAction(item)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    <span>{item.actionLabel || 'عرض واستفادة'}</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#131722] border border-white/15 rounded-3xl overflow-hidden shadow-2xl space-y-5">
            <div className="relative h-48 w-full bg-black">
              <img
                src={selectedOffer.imageUrl}
                alt={selectedOffer.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131722] via-[#131722]/40 to-transparent" />

              <button
                onClick={() => setSelectedOffer(null)}
                className="absolute top-3 left-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>

              {selectedOffer.badgeText && (
                <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-black shadow-lg">
                  {selectedOffer.badgeText}
                </span>
              )}
            </div>

            <div className="p-6 pt-0 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getTypeIcon(selectedOffer.type)}
                  <span className="text-xs text-amber-400 font-bold">
                    {selectedOffer.type === 'FEATURED_OFFER' && 'عرض مميز وحصري'}
                    {selectedOffer.type === 'DISCOUNT' && 'تخفيض أسعار الباقات'}
                    {selectedOffer.type === 'NEWS' && 'خبر ألعاب رسمي'}
                    {selectedOffer.type === 'ANNOUNCEMENT' && 'إعلان وتنبيه هام'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">{selectedOffer.title}</h3>
                {selectedOffer.subtitle && (
                  <p className="text-xs font-semibold text-amber-300">{selectedOffer.subtitle}</p>
                )}
              </div>

              {selectedOffer.description && (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedOffer.description}
                </div>
              )}

              {selectedOffer.validUntil && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>تاريخ انتهاء صلاحية العرض: {new Date(selectedOffer.validUntil).toLocaleDateString('ar-SD')}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs"
                >
                  إغلاق
                </button>
                <button
                  onClick={() => {
                    handleAction(selectedOffer);
                    setSelectedOffer(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <span>{selectedOffer.actionLabel || 'الانتقال للقسم'}</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
