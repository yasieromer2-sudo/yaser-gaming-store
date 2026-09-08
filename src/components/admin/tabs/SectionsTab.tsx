import React, { useState } from 'react';
import { useStore } from '../../../context/StoreContext';
import { StoreSection } from '../../../types';
import { api } from '../../../lib/api';
import {
  Layers,
  PlusCircle,
  Eye,
  EyeOff,
  Trash2,
  MoveUp,
  MoveDown,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const SectionsTab: React.FC = () => {
  const { sections, showToast, refreshData } = useStore();
  const [localSections, setLocalSections] = useState<StoreSection[]>(sections);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newSection, setNewSection] = useState({
    title: '',
    icon: 'Sparkles',
    route: '',
  });

  const handleToggle = async (sec: StoreSection) => {
    try {
      await api.updateSection(sec.id, { isEnabled: !sec.isEnabled });
      showToast(
        'تم التعديل',
        `قسم "${sec.title}" الآن ${!sec.isEnabled ? 'مفعل وظاهر في القائمة' : 'مخفي'}`,
        'success'
      );
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const handleAdd = async () => {
    if (!newSection.title.trim()) {
      showToast('تنبيه', 'يرجى كتابة عنوان القسم', 'warning');
      return;
    }

    try {
      await api.createSection({
        title: newSection.title,
        icon: newSection.icon || 'Sparkles',
        route: newSection.route || `/section-${Date.now()}`,
        isEnabled: true,
        order: sections.length + 1,
        isCustom: true,
      });
      showToast('تمت الإضافة', `تمت إضافة قسم "${newSection.title}" إلى المتجر`, 'success');
      setShowAddModal(false);
      setNewSection({ title: '', icon: 'Sparkles', route: '' });
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const handleDelete = async (sec: StoreSection) => {
    if (!sec.isCustom) {
      showToast('محظور', 'لا يمكن حذف الأقسام الأساسية للمتجر، يمكنك إخفاؤها فقط', 'warning');
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف قسم "${sec.title}"؟`)) return;

    try {
      await api.deleteSection(sec.id);
      showToast('تم الحذف', 'تم حذف القسم المخصص', 'info');
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-[#131722] to-slate-900 border border-indigo-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">إدارة أقسام وواجهات المتجر</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                التحكم بالأقسام الافتراضية الأربعة (الشحن، سوق الحسابات، المحفظة، الملف الشخصي) وإضافة أقسام مخصصة جديدة
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            إضافة قسم مخصص جديد
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {sections.map((sec, index) => (
          <div
            key={sec.id}
            className="p-5 rounded-3xl bg-[#131722] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                <span className="font-mono text-sm">{index + 1}</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-white">{sec.title}</h3>
                  {sec.isCustom ? (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                      قسم مخصص
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 text-[10px] font-bold">
                      قسم أساسي
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                  Route: {sec.route} | Icon: {sec.icon}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => handleToggle(sec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
                  sec.isEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {sec.isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{sec.isEnabled ? 'ظاهر بالمتجر' : 'مخفي'}</span>
              </button>

              {sec.isCustom && (
                <button
                  onClick={() => handleDelete(sec)}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors"
                  title="حذف القسم المخصص"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#131722] border border-white/15 p-6 space-y-4 shadow-2xl text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white">إضافة قسم مخصص لمتجر الألعاب</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-white">عنوان القسم (الظاهر في شريط التنقل):</label>
                <input
                  type="text"
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  placeholder="مثال: بطاقات الهدايا (Gift Cards)، العروض الخاصة"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">المسار (Route Identifier):</label>
                <input
                  type="text"
                  value={newSection.route}
                  onChange={(e) => setNewSection({ ...newSection, route: e.target.value })}
                  placeholder="gift-cards"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                onClick={handleAdd}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md transition-transform active:scale-95"
              >
                إضافة القسم
              </button>
              <button
                onClick={() => setShowAddModal(false)}
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
