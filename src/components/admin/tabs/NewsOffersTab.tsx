import React, { useState, useEffect } from 'react';
import { OfferItem, OfferType, OfferStatus } from '../../../types';
import { api } from '../../../lib/api';
import { useStore } from '../../../context/StoreContext';
import {
  Flame,
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Sparkles,
  Tag,
  Newspaper,
  Megaphone,
  Percent,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  X
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'بطاقات وعروض شحن', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80' },
  { label: 'ألعاب قتالية وإثارة', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80' },
  { label: 'بطولة وأخبار ألعاب', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80' },
  { label: 'خصم وهدايا موسمية', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80' },
];

export const NewsOffersTab: React.FC = () => {
  const { showToast, refreshData: refreshStoreData } = useStore();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | OfferType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | OfferStatus>('all');

  // Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingOffer, setEditingOffer] = useState<OfferItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form state
  const [form, setForm] = useState<{
    title: string;
    subtitle: string;
    description: string;
    type: OfferType;
    status: OfferStatus;
    imageUrl: string;
    badgeText: string;
    actionLabel: string;
    actionUrl: string;
    discountPercent: string;
    validUntil: string;
    order: number;
    isFeatured: boolean;
  }>({
    title: '',
    subtitle: '',
    description: '',
    type: 'FEATURED_OFFER',
    status: 'Published',
    imageUrl: PRESET_IMAGES[0].url,
    badgeText: 'عرض خاص',
    actionLabel: 'استفد من العرض',
    actionUrl: 'recharge',
    discountPercent: '15',
    validUntil: '',
    order: 1,
    isFeatured: true,
  });

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      setIsLoading(true);
      const data = await api.getOffers(true); // all=true includes drafts/hidden
      setOffers(data);
    } catch (err: any) {
      showToast('خطأ', 'فشل في تحميل العروض والأخبار', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingOffer(null);
    setForm({
      title: '',
      subtitle: '',
      description: '',
      type: 'FEATURED_OFFER',
      status: 'Published',
      imageUrl: PRESET_IMAGES[0].url,
      badgeText: 'عرض محدود',
      actionLabel: 'شحن فوري الآن',
      actionUrl: 'recharge',
      discountPercent: '20',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      order: offers.length + 1,
      isFeatured: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: OfferItem) => {
    setEditingOffer(item);
    setForm({
      title: item.title,
      subtitle: item.subtitle || '',
      description: item.description || '',
      type: item.type,
      status: item.status,
      imageUrl: item.imageUrl || PRESET_IMAGES[0].url,
      badgeText: item.badgeText || '',
      actionLabel: item.actionLabel || 'عرض التفاصيل',
      actionUrl: item.actionUrl || 'recharge',
      discountPercent: item.discountPercent ? String(item.discountPercent) : '',
      validUntil: item.validUntil ? item.validUntil.split('T')[0] : '',
      order: item.order || 1,
      isFeatured: !!item.isFeatured,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('تنبيه', 'يرجى إدخال عنوان العرض أو الخبر', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<OfferItem> = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        description: form.description.trim() || undefined,
        type: form.type,
        status: form.status,
        imageUrl: form.imageUrl.trim() || undefined,
        badgeText: form.badgeText.trim() || undefined,
        actionLabel: form.actionLabel.trim() || undefined,
        actionUrl: form.actionUrl.trim() || undefined,
        discountPercent: form.discountPercent ? parseFloat(form.discountPercent) : undefined,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
        order: Number(form.order) || 1,
        isFeatured: form.isFeatured,
      };

      if (editingOffer) {
        await api.updateOffer(editingOffer.id, payload);
        showToast('تم التحديث بنجاح', `تم حفظ التعديلات على "${form.title}"`, 'success');
      } else {
        await api.createOffer(payload);
        showToast('تمت الإضافة بنجاح', `تم نشر "${form.title}" بنجاح`, 'success');
      }

      setShowModal(false);
      await loadOffers();
      await refreshStoreData();
    } catch (err: any) {
      showToast('خطأ في الحفظ', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${title}"؟`)) {
      return;
    }
    try {
      await api.deleteOffer(id);
      showToast('تم الحذف', `تم حذف "${title}" من قاعدة البيانات`, 'success');
      await loadOffers();
      await refreshStoreData();
    } catch (err: any) {
      showToast('خطأ في الحذف', err.message, 'error');
    }
  };

  const handleToggleStatus = async (item: OfferItem) => {
    const nextStatus: OfferStatus =
      item.status === 'Published' ? 'Draft' : 'Published';
    try {
      await api.updateOfferStatus(item.id, nextStatus);
      showToast(
        'تم تغيير الحالة',
        `أصبح العرض الآن: ${nextStatus === 'Published' ? 'منشور للعملاء' : 'مسودة غير ظاهرة'}`,
        'info'
      );
      await loadOffers();
      await refreshStoreData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const filteredOffers = offers.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.badgeText && item.badgeText.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getTypeBadge = (type: OfferType) => {
    switch (type) {
      case 'FEATURED_OFFER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Flame className="w-3 h-3" />
            عرض مميز
          </span>
        );
      case 'DISCOUNT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Percent className="w-3 h-3" />
            تخفيض سعر
          </span>
        );
      case 'NEWS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Newspaper className="w-3 h-3" />
            خبر ألعاب
          </span>
        );
      case 'ANNOUNCEMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Megaphone className="w-3 h-3" />
            إعلان رسمي
          </span>
        );
    }
  };

  const getStatusBadge = (status: OfferStatus) => {
    switch (status) {
      case 'Published':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            منشور نشط
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
            <Clock className="w-3 h-3" />
            مسودة
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
            منتهي الصلاحية
          </span>
        );
      case 'Hidden':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-600/30 text-zinc-400 border border-zinc-600/30">
            مخفي
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#131722] to-slate-900 border border-amber-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-inner">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">إدارة العروض والأخبار (News & Offers)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                إنشاء وتعديل العروض الترويجية، التخفيضات اللحظية، والأخبار الرسمية الموجهة للعملاء
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadOffers}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              إضافة عرض / خبر جديد
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
            <div className="text-[11px] text-slate-400 font-bold">إجمالي العناصر</div>
            <div className="text-xl font-black text-white mt-1 font-mono">{offers.length}</div>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
            <div className="text-[11px] text-emerald-400 font-bold">العروض المنشورة</div>
            <div className="text-xl font-black text-emerald-400 mt-1 font-mono">
              {offers.filter((o) => o.status === 'Published').length}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
            <div className="text-[11px] text-amber-400 font-bold">عروض التخفيض</div>
            <div className="text-xl font-black text-amber-400 mt-1 font-mono">
              {offers.filter((o) => o.type === 'DISCOUNT' || o.type === 'FEATURED_OFFER').length}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
            <div className="text-[11px] text-blue-400 font-bold">الأخبار والإعلانات</div>
            <div className="text-xl font-black text-blue-400 mt-1 font-mono">
              {offers.filter((o) => o.type === 'NEWS' || o.type === 'ANNOUNCEMENT').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#131722] border border-white/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالعنوان، الشعار، أو التفاصيل..."
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-300 font-bold text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">كل الأنواع</option>
            <option value="FEATURED_OFFER">عروض مميزة</option>
            <option value="DISCOUNT">تخفيضات</option>
            <option value="NEWS">أخبار</option>
            <option value="ANNOUNCEMENT">إعلانات رسمية</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-300 font-bold text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">كل الحالات</option>
            <option value="Published">منشور</option>
            <option value="Draft">مسودة</option>
            <option value="Expired">منتهي</option>
            <option value="Hidden">مخفي</option>
          </select>
        </div>
      </div>

      {/* Grid of Offers */}
      {filteredOffers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#131722] border border-white/10 space-y-3">
          <Flame className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">لا توجد عروض أو أخبار مطابقة</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            قم بإضافة عروض جديدة لجذب العملاء وتنشيط مبيعات شحن الألعاب
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs inline-flex items-center gap-2 mt-2"
          >
            <PlusCircle className="w-4 h-4" />
            إضافة أول عرض الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffers.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl bg-[#131722] border border-white/10 overflow-hidden shadow-xl flex flex-col hover:border-amber-500/40 transition-all duration-300"
            >
              {/* Image banner & overlay tags */}
              <div className="relative h-44 w-full bg-black/60 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131722] via-transparent to-black/60" />

                {/* Top tags */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {getTypeBadge(item.type)}
                  {item.badgeText && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black shadow-md">
                      {item.badgeText}
                    </span>
                  )}
                </div>

                {/* Status badge */}
                <div className="absolute top-3 left-3">{getStatusBadge(item.status)}</div>

                {/* Discount banner if applicable */}
                {item.discountPercent && (
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-red-600 text-white font-black text-xs flex items-center gap-1 shadow-lg">
                    <Percent className="w-3.5 h-3.5" />
                    خصم {item.discountPercent}%
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-base text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                      {item.title}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500">#{item.order}</span>
                  </div>

                  {item.subtitle && (
                    <p className="text-xs font-medium text-amber-300/90 line-clamp-1">
                      {item.subtitle}
                    </p>
                  )}

                  {item.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Expiry & CTA metadata */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  {item.validUntil ? (
                    <div className="flex items-center gap-1 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>ينتهي: {new Date(item.validUntil).toLocaleDateString('ar-SD')}</span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">عرض مستمر</span>
                  )}

                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-slate-400">
                    الوجهة: {item.actionUrl || 'recharge'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      item.status === 'Published'
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10'
                    }`}
                  >
                    {item.status === 'Published' ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>منشور للعملاء</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>تحويل لمنشور</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/10"
                    title="تعديل العرض"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/30"
                    title="حذف العرض نهائياً"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-[#131722] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">
                    {editingOffer ? 'تعديل بيانات العرض / الخبر' : 'إضافة عرض أو خبر جديد'}
                  </h3>
                  <p className="text-xs text-slate-400">تخزين آمن ومباشر في قاعدة البيانات</p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">
                    عنوان العرض أو الخبر <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="مثال: خصم 20% على شحن ببجي موبايل"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">نوع المحتوى (Type)</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as OfferType })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="FEATURED_OFFER">عرض مميز (Featured Offer)</option>
                    <option value="DISCOUNT">تخفيض سعر (Discount)</option>
                    <option value="NEWS">خبر ألعاب (Gaming News)</option>
                    <option value="ANNOUNCEMENT">إعلان رسمي (Official Announcement)</option>
                  </select>
                </div>
              </div>

              {/* Subtitle & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">نص فرعي ترويجي (Subtitle)</label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="مثال: لفترة محدودة لجميع اللاعبين"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">نص الشعار البارز (Badge)</label>
                  <input
                    type="text"
                    value={form.badgeText}
                    onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
                    placeholder="مثال: خصم حصري، جديد، موصى به"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">التفاصيل والشروط</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="اكتب وصف العرض، طريقة الاستفادة، أو تفاصيل الخبر..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Discount Percent & Valid Until */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">نسبة الخصم % (إن وجد)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                    placeholder="مثال: 20"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">تاريخ انتهاء الصلاحية</label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* CTA Label & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">نص زر الإجراء (CTA Label)</label>
                  <input
                    type="text"
                    value={form.actionLabel}
                    onChange={(e) => setForm({ ...form, actionLabel: e.target.value })}
                    placeholder="مثال: شحن فوري، تصفح الحسابات"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">القسم الموجه إليه (Destination Tab)</label>
                  <select
                    value={form.actionUrl}
                    onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="recharge">قسم شحن الألعاب (Recharge)</option>
                    <option value="accounts">سوق الحسابات (Accounts)</option>
                    <option value="wallet">المحفظة الرقمية (Wallet)</option>
                    <option value="offers">قسم العروض والأخبار (Offers)</option>
                  </select>
                </div>
              </div>

              {/* Image URL with Preset Pickers */}
              <div className="space-y-2">
                <label className="font-bold text-slate-300">رابط صورة البانر (Image URL)</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">نماذج صور جاهزة:</span>
                  {PRESET_IMAGES.map((p, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setForm({ ...form, imageUrl: p.url })}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 font-bold"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status, Order & Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">الحالة (Status)</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as OfferStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Published">منشور (Published)</option>
                    <option value="Draft">مسودة (Draft)</option>
                    <option value="Hidden">مخفي (Hidden)</option>
                    <option value="Expired">منتهي (Expired)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">ترتيب الظهور</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is-featured-checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-black/40 border-white/20 focus:ring-0"
                  />
                  <label htmlFor="is-featured-checkbox" className="font-bold text-slate-300 select-none">
                    تمييز في الواجهة الرئيسية
                  </label>
                </div>
              </div>

              {/* Form submit buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingOffer ? 'حفظ التعديلات' : 'نشر العرض'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
