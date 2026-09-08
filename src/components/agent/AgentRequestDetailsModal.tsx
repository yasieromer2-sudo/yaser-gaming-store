import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  User, 
  Hash, 
  CreditCard, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  AlertCircle 
} from 'lucide-react';
import { WalletTopUpRequest } from '../../types';

interface AgentRequestDetailsModalProps {
  isOpen: boolean;
  request: WalletTopUpRequest | null;
  onClose: () => void;
  onApproveClick: (request: WalletTopUpRequest) => void;
  onRejectClick: (request: WalletTopUpRequest) => void;
}

export const AgentRequestDetailsModal: React.FC<AgentRequestDetailsModalProps> = ({
  isOpen,
  request,
  onClose,
  onApproveClick,
  onRejectClick,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isReceiptZoomed, setIsReceiptZoomed] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !request) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isPending = request.status?.toLowerCase() === 'pending';
  const isApproved = request.status?.toLowerCase() === 'completed' || request.status?.toLowerCase() === 'approved';
  const isRejected = request.status?.toLowerCase() === 'rejected';

  const receiptUrl = request.receiptImage || request.receiptUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div 
        id="agent-request-details-modal"
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-scaleUp"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isApproved
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : isRejected
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {isApproved && <CheckCircle2 className="w-5 h-5" />}
              {isRejected && <XCircle className="w-5 h-5" />}
              {isPending && <Clock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  تفاصيل طلب التغذية
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : isRejected
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {isApproved ? 'معتمد ومكتمل' : isRejected ? 'مرفوض' : 'قيد الانتظار'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                {request.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Amount Highlight Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400 block mb-1">المبلغ المطلوب شحنه للمحفظة</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                {request.amount.toLocaleString()} <span className="text-sm font-normal text-zinc-400">SDG</span>
              </div>
            </div>
            <div className="text-left">
              <span className="text-xs text-zinc-400 block mb-1">طريقة الدفع</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs font-medium">
                {request.paymentMethod}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Customer Name */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                اسم العميل
              </span>
              <div className="text-white font-medium text-sm">
                {request.userName}
              </div>
            </div>

            {/* Customer UID */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-zinc-400" />
                  معرف العميل (User UID)
                </span>
                <button
                  onClick={() => handleCopy(request.userUid, 'uid')}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedField === 'uid' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedField === 'uid' ? 'تم' : 'نسخ'}</span>
                </button>
              </div>
              <div className="text-zinc-200 font-mono text-sm font-semibold">
                {request.userUid}
              </div>
            </div>

            {/* Bank Transfer Reference */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                  الرقم المرجعي للإشعار
                </span>
                {request.transferReference && (
                  <button
                    onClick={() => handleCopy(request.transferReference!, 'ref')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedField === 'ref' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedField === 'ref' ? 'تم' : 'نسخ'}</span>
                  </button>
                )}
              </div>
              <div className="font-mono text-sm font-semibold text-cyan-300 text-left dir-ltr">
                {request.transferReference || 'غير مدخل بالطلب'}
              </div>
            </div>

            {/* Creation Date */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                تاريخ وتوقيت إنشاء الطلب
              </span>
              <div className="text-zinc-200 text-xs font-mono">
                {new Date(request.createdAt).toLocaleString('ar-SD', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* Rejection reason banner if rejected */}
          {isRejected && (request.rejectedReason || request.rejectionReason) && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-rose-400">
                <AlertCircle className="w-4 h-4" />
                سبب رفض الطلب المسجل:
              </span>
              <p className="leading-relaxed text-zinc-200">
                {request.rejectedReason || request.rejectionReason}
              </p>
              {request.rejectedAt && (
                <span className="text-[10px] text-zinc-400 block pt-1">
                  وقت الرفض: {new Date(request.rejectedAt).toLocaleString('ar-SD')}
                </span>
              )}
            </div>
          )}

          {/* Approval details if completed */}
          {isApproved && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                تم إيداع الرصيد بنجاح
              </span>
              <p className="text-zinc-300">
                تم اعتماد الطلب وإيداع {request.amount.toLocaleString()} SDG في محفظة العميل فورياً.
              </p>
              {request.completedAt && (
                <span className="text-[10px] text-zinc-400 block pt-1">
                  وقت الإيداع: {new Date(request.completedAt).toLocaleString('ar-SD')}
                </span>
              )}
            </div>
          )}

          {/* Payment Proof / Receipt Section */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                إثبات الدفع وإشعار التحويل البنكي
              </span>
              {receiptUrl && (
                <button
                  onClick={() => setIsReceiptZoomed(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>تكبير الإشعار</span>
                </button>
              )}
            </div>

            {receiptUrl ? (
              <div className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 p-2">
                <img
                  src={receiptUrl}
                  alt="إشعار التحويل"
                  className="w-full max-h-64 object-contain rounded-lg transition-transform group-hover:scale-[1.01] cursor-pointer"
                  onClick={() => setIsReceiptZoomed(true)}
                />
                <div 
                  onClick={() => setIsReceiptZoomed(true)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer gap-2 text-white text-xs font-medium"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>اضغط لتكبير صورة الإشعار</span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-zinc-800 text-center bg-zinc-950/40">
                <p className="text-xs text-zinc-400">
                  لم يقم العميل برفع صورة لقطة شاشة للإشعار.
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  يرجى الاعتماد على الرقم المرجعي <span className="text-cyan-400 font-mono">{request.transferReference || 'المدخل'}</span> ومطابقته بتطبيق بنكك أو مايكاش.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
          >
            إغلاق
          </button>

          {isPending && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onRejectClick(request);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all"
              >
                رفض الطلب
              </button>
              <button
                onClick={() => {
                  onClose();
                  onApproveClick(request);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تأكيد الإيداع الآن</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* High-Resolution Fullscreen Receipt Zoom Modal */}
      {isReceiptZoomed && receiptUrl && (
        <div className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-black/95 p-4 animate-fadeIn">
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-70 flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-xl shadow-2xl backdrop-blur">
            <button
              onClick={() => setZoomScale((prev) => Math.min(prev + 0.25, 3))}
              className="p-2 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              title="تكبير"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomScale((prev) => Math.max(prev - 0.25, 0.5))}
              className="p-2 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              title="تصغير"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="p-2 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              title="تدوير"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              title="فتح في نافذة جديدة"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <div className="w-px h-5 bg-zinc-700 mx-1" />
            <button
              onClick={() => {
                setIsReceiptZoomed(false);
                setZoomScale(1);
                setRotation(0);
              }}
              className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-zinc-800 transition-colors"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full h-full flex items-center justify-center overflow-auto p-8">
            <img
              src={receiptUrl}
              alt="إشعار التحويل البنكي - مكبر"
              style={{
                transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-out',
              }}
              className="max-w-[90vw] max-h-[85vh] object-contain shadow-2xl rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};
