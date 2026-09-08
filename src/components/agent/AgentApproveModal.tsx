import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  ArrowRight, 
  CreditCard, 
  User, 
  Hash, 
  DollarSign, 
  Loader2 
} from 'lucide-react';
import { WalletTopUpRequest } from '../../types';

interface AgentApproveModalProps {
  isOpen: boolean;
  request: WalletTopUpRequest | null;
  onClose: () => void;
  onConfirm: (requestId: string, notes?: string) => Promise<void>;
}

export const AgentApproveModal: React.FC<AgentApproveModalProps> = ({
  isOpen,
  request,
  onClose,
  onConfirm,
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onConfirm(request.id, notes.trim() || undefined);
      setNotes('');
      onClose();
    } catch (err) {
      // Error handled in parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        id="agent-approve-modal"
        className="w-full max-w-lg bg-zinc-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                تأكيد إيداع رصيد المحفظة
              </h3>
              <p className="text-xs text-emerald-400/80">
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
          {/* Critical Warning Box */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300 mb-1">
                تنبيه أمني هام للوكيل المعتمد:
              </p>
              <p>
                هل تأكدت من وصول المبلغ فعلياً إلى حسابك البنكي أو تطبيق بنكك؟ سيتم إضافة الرصيد فوراً وبشكل نهائي إلى محفظة العميل في قاعدة البيانات وتحديث السجل المالي الآمن.
              </p>
            </div>
          </div>

          {/* Request Quick Summary Card */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/60">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                العميل:
              </span>
              <span className="text-white font-medium">
                {request.userName} <span className="font-mono text-zinc-400 text-[11px]">({request.userUid})</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/60">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                طريقة الدفع:
              </span>
              <span className="text-zinc-300 font-medium">{request.paymentMethod}</span>
            </div>

            {request.transferReference && (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/60">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-zinc-400" />
                  الرقم المرجعي / الإشعار:
                </span>
                <span className="font-mono text-cyan-300 font-bold dir-ltr text-left">
                  {request.transferReference}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                المبلغ المراد إيداعه:
              </span>
              <span className="text-lg font-black text-emerald-400">
                {request.amount.toLocaleString()} <span className="text-xs font-normal text-zinc-400">SDG</span>
              </span>
            </div>
          </div>

          {/* Optional notes */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-300 font-medium block">
              ملاحظات التحقق (اختياري):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تم التأكد من الإشعار البنكي بتطبيق بنكك"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="confirm-approve-btn"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الإيداع الآمن...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>تأكيد وصول المبلغ وإيداع الرصيد</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
