import React, { useState } from 'react';
import { 
  XCircle, 
  X, 
  AlertCircle, 
  Loader2, 
  FileQuestion, 
  DollarSign, 
  User 
} from 'lucide-react';
import { WalletTopUpRequest } from '../../types';

interface AgentRejectModalProps {
  isOpen: boolean;
  request: WalletTopUpRequest | null;
  onClose: () => void;
  onConfirmReject: (requestId: string, reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  'المبلغ لم يصل للحساب البنكي بعد مراجعة الكشف',
  'إثبات الدفع (الإشعار) غير صحيح أو غير واضح',
  'المبلغ المحول في الإشعار مختلف عن قيمة الطلب',
  'الرقم المرجعي للتحويل غير مطابق',
  'إشعار تحويل مكرر تم استخدامه مسبقاً',
];

export const AgentRejectModal: React.FC<AgentRejectModalProps> = ({
  isOpen,
  request,
  onClose,
  onConfirmReject,
}) => {
  const [reason, setReason] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReason.trim() || reason;
    try {
      setIsSubmitting(true);
      await onConfirmReject(request.id, finalReason);
      setCustomReason('');
      onClose();
    } catch (err) {
      // handled in parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        id="agent-reject-modal"
        className="w-full max-w-lg bg-zinc-900 border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-gradient-to-r from-rose-950/40 via-zinc-900 to-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                رفض طلب شحن المحفظة
              </h3>
              <p className="text-xs text-rose-400/80">
                طلب شحن رقم: <span className="font-mono text-zinc-300">{request.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Quick Details */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-zinc-400 block mb-0.5">العميل:</span>
              <span className="text-white font-medium">{request.userName} ({request.userUid})</span>
            </div>
            <div className="text-left">
              <span className="text-zinc-400 block mb-0.5">المبلغ:</span>
              <span className="text-rose-400 font-bold">{request.amount.toLocaleString()} SDG</span>
            </div>
          </div>

          {/* Preset Reasons */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-300 font-semibold block">
              اختر سبب الرفض السريع:
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {PRESET_REASONS.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setReason(r);
                    setCustomReason('');
                  }}
                  className={`w-full text-right p-2.5 rounded-xl text-xs transition-all border flex items-center justify-between ${
                    reason === r && !customReason
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-medium'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <span>{r}</span>
                  {reason === r && !customReason && (
                    <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mr-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom reason */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium block">
              أو اكتب سبباً مخصصاً للرفض:
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="اكتب توضيحاً دقيقاً لسبب رفض الطلب..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:border-rose-500/50 resize-none"
            />
          </div>

          {/* Info notice */}
          <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60 text-[11px] text-zinc-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>سيتم إرسال إشعار فوري للعميل بالسبب المسجل، وتحديث حالة الطلب إلى (مرفوض) بسجلات النظام.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              تراجع
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="confirm-reject-btn"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الرفض...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>تأكيد رفض الطلب</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
