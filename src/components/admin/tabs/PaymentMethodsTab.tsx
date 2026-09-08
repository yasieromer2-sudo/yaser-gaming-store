import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '../../../types';
import { api } from '../../../lib/api';
import { useStore } from '../../../context/StoreContext';
import {
  CreditCard,
  PlusCircle,
  Edit2,
  Trash2,
  Building2,
  Copy,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';

export const PaymentMethodsTab: React.FC = () => {
  const { showToast, refreshData } = useStore();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  const [form, setForm] = useState({
    name: 'بنك الخرطوم (Bankak)',
    accountNumber: '',
    accountName: '',
    instructions: 'يرجى تحويل المبلغ وتضمين رقم العملية أو إشعار التحويل في طلب التغذية',
    icon: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=100',
    isEnabled: true,
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      setIsLoading(true);
      const data = await api.getPaymentMethods();
      setMethods(data);
    } catch (err: any) {
      showToast('خطأ', 'فشل في تحميل وسائل الدفع', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.accountNumber.trim()) {
      showToast('تنبيه', 'يرجى إكمال بيانات الحساب', 'warning');
      return;
    }

    try {
      await api.upsertPaymentMethod({
        id: editingMethod?.id,
        ...form,
      });
      showToast(
        'تم الحفظ',
        editingMethod ? 'تم تعديل وسيلة الدفع' : 'تم إضافة وسيلة دفع جديدة للمتجر',
        'success'
      );
      setShowModal(false);
      setEditingMethod(null);
      resetForm();
      await loadMethods();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const handleDelete = async (m: PaymentMethod) => {
    if (!confirm(`هل أنت متأكد من حذف وسيلة الدفع "${m.name}"؟`)) return;
    try {
      await api.deletePaymentMethod(m.id);
      showToast('تم الحذف', 'تم حذف وسيلة الدفع', 'info');
      await loadMethods();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const handleToggle = async (m: PaymentMethod) => {
    try {
      await api.upsertPaymentMethod({
        ...m,
        isEnabled: !m.isEnabled,
      });
      showToast('تم التحديث', `تم ${!m.isEnabled ? 'تفعيل' : 'تعطيل'} ${m.name}`, 'success');
      await loadMethods();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      accountNumber: '',
      accountName: '',
      instructions: 'يرجى إرفاق إشعار التحويل البنكي',
      icon: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=100',
      isEnabled: true,
    });
  };

  const openEdit = (m: PaymentMethod) => {
    setEditingMethod(m);
    setForm({
      name: m.name,
      accountNumber: m.accountNumber,
      accountName: m.accountName,
      instructions: m.instructions || '',
      icon: m.icon || '',
      isEnabled: m.isEnabled,
    });
    setShowModal(true);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('تم النسخ', `تم نسخ ${label} بنجاح`, 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#131722] to-slate-900 border border-amber-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">إدارة وسائل الدفع والحسابات الرسمية</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تكوين الحسابات البنكية للمتجر (بنكك، فوري، ماي كاش) والتعليمات الموجهة للعملاء
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              setEditingMethod(null);
              setShowModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            إضافة وسيلة دفع جديدة
          </button>
        </div>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.map((method) => (
          <div
            key={method.id}
            className="p-5 rounded-3xl bg-[#131722] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4 shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-amber-400 font-bold shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">{method.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400">{method.id}</span>
                </div>
              </div>

              <button
                onClick={() => handleToggle(method)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                  method.isEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {method.isEnabled ? 'مفعلة بالمتجر' : 'معطلة'}
              </button>
            </div>

            {/* Details */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">رقم الحساب:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-amber-400">
                    {method.accountNumber}
                  </span>
                  <button
                    onClick={() => copyText(method.accountNumber, 'رقم الحساب')}
                    className="text-slate-500 hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">اسم صاحب الحساب:</span>
                <span className="font-bold text-white">{method.accountName}</span>
              </div>

              {method.instructions && (
                <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400 leading-relaxed">
                  {method.instructions}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => openEdit(method)}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>تعديل</span>
              </button>

              <button
                onClick={() => handleDelete(method)}
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors"
                title="حذف وسيلة الدفع"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#131722] border border-white/15 p-6 space-y-4 shadow-2xl text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white">
                {editingMethod ? 'تعديل وسيلة الدفع' : 'إضافة وسيلة دفع جديدة'}
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
                <label className="font-bold text-white">اسم البنك / الخدمة:</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: بنكك (Bankak) - بنك الخرطوم"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">رقم الحساب:</label>
                <input
                  type="text"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder="مثال: 3291884"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">اسم صاحب الحساب الرسمي:</label>
                <input
                  type="text"
                  value={form.accountName}
                  onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  placeholder="الاسم الثلاثي أو الرباعي"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">تعليمات التحويل للعميل:</label>
                <textarea
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black shadow-md transition-transform active:scale-95"
              >
                {editingMethod ? 'حفظ التعديلات' : 'إضافة وسيلة الدفع'}
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
