import React, { useState } from 'react';
import { useStore } from '../../../context/StoreContext';
import { api } from '../../../lib/api';
import {
  Palette,
  Sparkles,
  Check,
  Type,
  Phone,
  Mail,
  Image as ImageIcon,
  Save,
  Eye,
  RefreshCw
} from 'lucide-react';

export const WhiteLabelTab: React.FC = () => {
  const { settings, showToast, refreshData } = useStore();
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [form, setForm] = useState({
    storeName: settings?.storeName || 'متجر الألعاب الرقمي',
    storeTagline: settings?.storeTagline || 'المنصة الرقمية لشحن الألعاب وحسابات الجيمنج',
    storeDescription: settings?.storeDescription || 'متجر رقمي احترافي لشحن ألعابك المفضلة وشراء الحسابات الموثوقة بأمان',
    logoUrl: settings?.logoUrl || '',
    faviconUrl: settings?.faviconUrl || '',
    primaryColor: settings?.primaryColor || '#10b981',
    accentColor: settings?.accentColor || '#6366f1',
    theme: settings?.themeMode || 'dark',
    fontFamily: settings?.fontFamily || 'Cairo',
    whatsappSupport: settings?.whatsappSupportNumber || '',
    supportEmail: settings?.contactEmail || '',
  });

  const presetPalettes = [
    { name: 'الزمرد والذهب (Default)', primary: '#10b981', accent: '#f59e0b' },
    { name: 'السايبر والأزرق النيوني', primary: '#06b6d4', accent: '#3b82f6' },
    { name: 'الأرجواني الملكي (Royal)', primary: '#8b5cf6', accent: '#ec4899' },
    { name: 'الناري والكريمسون (Gamer Red)', primary: '#ef4444', accent: '#f97316' },
    { name: 'الذهب والبرونز الفاخر', primary: '#f59e0b', accent: '#eab308' },
  ];

  const handleSave = async () => {
    if (!form.storeName.trim()) {
      showToast('تنبيه', 'يرجى كتابة اسم المتجر', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      await api.updateStoreSettings({
        storeName: form.storeName,
        storeTagline: form.storeTagline,
        storeDescription: form.storeDescription,
        logoUrl: form.logoUrl,
        faviconUrl: form.faviconUrl,
        primaryColor: form.primaryColor,
        accentColor: form.accentColor,
        fontFamily: form.fontFamily,
        whatsappSupportNumber: form.whatsappSupport,
        contactEmail: form.supportEmail,
      });
      showToast(
        'تم حفظ تخصيص الهوية بنجاح!',
        'تم تطبيق التعديلات والشعار والألوان على كامل واجهات المتجر فورياً',
        'success'
      );
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#131722] to-slate-900 border border-amber-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                تخصيص الهوية الرقمية (White-Label Branding)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تخصيص كامل لاسم المتجر، الشعار، الألوان، الخطوط، وتفاصيل الدعم لتسليم نسخة متجر مستقلة للعميل
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'جارٍ الحفظ...' : 'حفظ ونشر التغييرات'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Controls - 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Identity */}
          <div className="p-6 rounded-3xl bg-[#131722] border border-white/10 space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>معلومات العلامة التجارية واسم المتجر</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">اسم المتجر (Store Title):</label>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  placeholder="مثال: قمر جيمينج ستور"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">الشعار اللفظي (Tagline):</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="شحن فوري وموثوق لجميع ألعابك المفضلة"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">وصف المتجر (Description):</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">رابط الشعار (Logo URL):</label>
                  <input
                    type="text"
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">أيقونة المتصفح (Favicon URL):</label>
                  <input
                    type="text"
                    value={form.faviconUrl}
                    onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Color Palettes & Theme */}
          <div className="p-6 rounded-3xl bg-[#131722] border border-white/10 space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>ألوان الواجهة وتنسيق الثيم</span>
            </h3>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400">لوحات ألوان جاهزة بضغطة واحدة:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presetPalettes.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, primaryColor: p.primary, accentColor: p.accent })
                    }
                    className="flex items-center justify-between p-3 rounded-2xl bg-black/40 hover:bg-white/5 border border-white/5 transition-all text-xs text-right"
                  >
                    <span className="font-bold text-white">{p.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: p.primary }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: p.accent }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Hex Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">اللون الأساسي (Primary Color):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={form.primaryColor}
                    onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">اللون الثانوي (Accent Color):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={form.accentColor}
                    onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Font Family Selection */}
            <div className="pt-2 border-t border-white/5 text-xs space-y-1.5">
              <label className="font-bold text-slate-300 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-emerald-400" />
                <span>الخط العربي المعتمد في المتجر:</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Cairo', 'Alexandria', 'Tajawal'].map((font) => (
                  <button
                    key={font}
                    type="button"
                    onClick={() => setForm({ ...form, fontFamily: font })}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                      form.fontFamily === font
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-black/30 border-white/5 text-slate-400'
                    }`}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Support Channels */}
          <div className="p-6 rounded-3xl bg-[#131722] border border-white/10 space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>قنوات الدعم الفني وخدمة العملاء</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">رقم WhatsApp المعتمد للدعم:</label>
                <input
                  type="text"
                  value={form.whatsappSupport}
                  onChange={(e) => setForm({ ...form, whatsappSupport: e.target.value })}
                  placeholder="+249912345678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">البريد الإلكتروني الرسمي:</label>
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                  placeholder="support@gamestore.sd"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Card - 1 Col */}
        <div className="space-y-4">
          <div className="sticky top-20 p-6 rounded-3xl bg-[#131722] border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>معاينة الهوية (Live Preview)</span>
              </h4>
              <span className="text-[10px] text-emerald-400 font-bold">تحديث فوري</span>
            </div>

            {/* Simulated Header */}
            <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/5 space-y-3 text-center">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt={form.storeName}
                  className="w-14 h-14 mx-auto rounded-2xl object-contain bg-black/40 p-1 border border-white/10"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center font-black text-xl text-black shadow-lg"
                  style={{ backgroundColor: form.primaryColor }}
                >
                  {form.storeName.charAt(0) || 'G'}
                </div>
              )}

              <div>
                <h5 className="font-black text-white text-base">{form.storeName}</h5>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{form.tagline}</p>
              </div>

              {/* Simulated Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  style={{ backgroundColor: form.primaryColor }}
                  className="w-full py-2.5 rounded-xl text-black font-black text-xs shadow-md"
                >
                  شحن الجواهر والشدات الآن
                </button>
                <button
                  style={{ borderColor: form.accentColor, color: form.accentColor }}
                  className="w-full py-2 rounded-xl bg-transparent border text-xs font-bold"
                >
                  تصفح سوق الحسابات
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-[11px] text-slate-400 leading-relaxed">
              <strong>قوة نظام White-Label:</strong> هذا التكوين يسمح لك ببيع وتجهيز متجر كامل
              لأي عميل في دقائق معدودة، بمجرد ملء هذا النموذج وحفظه.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
