import React, { useState } from 'react';
import { useStore } from '../../../context/StoreContext';
import { api } from '../../../lib/api';
import {
  Bell,
  Send,
  Users,
  User,
  UserCheck,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Megaphone
} from 'lucide-react';

export const NotificationsTab: React.FC = () => {
  const { notifications, availableUsers, showToast, refreshData } = useStore();
  const [isSending, setIsSending] = useState<boolean>(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    target: 'all' as 'all' | 'agents' | 'specific',
    targetUserId: '',
  });

  const handleBroadcast = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      showToast('تنبيه', 'يرجى كتابة عنوان ونص الإشعار', 'warning');
      return;
    }
    if (form.target === 'specific' && !form.targetUserId) {
      showToast('تنبيه', 'يرجى اختيار المستخدم المستهدف', 'warning');
      return;
    }

    setIsSending(true);
    try {
      const res = await api.broadcastNotification({
        title: form.title,
        message: form.message,
        type: form.type,
        targetRole: form.target === 'agents' ? 'agent' : form.target === 'all' ? 'all' : undefined,
        targetUserId: form.target === 'specific' ? form.targetUserId : undefined,
        targetUrl: '/?tab=notifications',
      });

      showToast(
        'تم بث التعميم وإرسال Push Notification!',
        `تم إرسال الإشعار لـ ${res.sentCount} مستخدم بنجاح`,
        'success'
      );

      setForm({
        title: '',
        message: '',
        type: 'info',
        target: 'all',
        targetUserId: '',
      });
      await refreshData();
    } catch (err: any) {
      showToast('خطأ في الإرسال', err.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#131722] to-slate-900 border border-amber-500/20 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">مركز التعميمات والإشعارات الإدارية</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              إرسال تنبيهات جماعية لكافة المستخدمين أو إشعارات مخصصة لحساب معين بخصوص العروض أو التحديثات
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Broadcast Form */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#131722] border border-white/10 space-y-5">
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-400" />
            <span>إنشاء تعميم أو إشعار فوري</span>
          </h3>

          <div className="space-y-4 text-xs">
            {/* Target Audience */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">الجمهور المستهدف:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, target: 'all' })}
                  className={`p-2.5 rounded-2xl border text-center font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    form.target === 'all'
                      ? 'bg-amber-500 text-black font-black shadow-md'
                      : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="text-[11px]">الجميع (عام)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, target: 'agents' })}
                  className={`p-2.5 rounded-2xl border text-center font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    form.target === 'agents'
                      ? 'bg-indigo-500 text-white font-black shadow-md'
                      : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="text-[11px]">الوكلاء فقط</span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, target: 'specific' })}
                  className={`p-2.5 rounded-2xl border text-center font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    form.target === 'specific'
                      ? 'bg-amber-500 text-black font-black shadow-md'
                      : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="text-[11px]">مستخدم محدد</span>
                </button>
              </div>
            </div>

            {/* Specific User Select */}
            {form.target === 'specific' && (
              <div className="space-y-1">
                <label className="font-bold text-slate-300">اختر المستخدم المستهدف:</label>
                <select
                  value={form.targetUserId}
                  onChange={(e) => setForm({ ...form, targetUserId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                >
                  <option value="">-- اختر من قائمة المستخدمين --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.uid}) - {u.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notification Type */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">نوع الإشعار:</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'info', label: 'معلومة', color: 'blue' },
                  { id: 'success', label: 'نجاح / عرض', color: 'emerald' },
                  { id: 'warning', label: 'تنبيه', color: 'amber' },
                  { id: 'error', label: 'هام / عاجل', color: 'red' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.id as any })}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      form.type === t.id
                        ? 'bg-white/10 border-white text-white shadow-sm'
                        : 'bg-black/30 border-white/5 text-slate-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="font-bold text-slate-300">عنوان الإشعار:</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: خصم 20% على شحن جواهر فري فاير بمناسبة نهاية الأسبوع!"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-bold"
              />
            </div>

            {/* Message */}
            <div className="space-y-1">
              <label className="font-bold text-slate-300">نص الرسالة أو التعميم:</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                placeholder="اكتب التفاصيل الكاملة هنا لتظهر للعملاء في صندوق الإشعارات..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
              />
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span>
                سيصل هذا التعميم كإشعار فوري حقيقي (Web Push Notification) مع اهتزاز وصوت لجميع الأجهزة المشتركة حتى وإن كان التطبيق مغلقاً.
              </span>
            </div>

            <button
              onClick={handleBroadcast}
              disabled={isSending}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-lg shadow-amber-500/20 transition-transform active:scale-95"
            >
              {isSending ? 'جارٍ البث...' : 'إرسال الإشعار فورياً'}
            </button>
          </div>
        </div>

        {/* Notification History Log */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#131722] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>سجل الإشعارات الأخير في النظام</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {notifications.length} إشعار
            </span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">لا توجد إشعارات مسجلة</div>
            ) : (
              notifications.slice(0, 15).map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      {n.type === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : n.type === 'warning' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      )}
                      <span>{n.title}</span>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(n.createdAt).toLocaleTimeString('ar-SD')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
