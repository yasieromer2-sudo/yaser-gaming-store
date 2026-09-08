import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  UserCheck, 
  KeyRound, 
  Lock, 
  Building2, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  Phone,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { User, Agent } from '../../types';

interface AgentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents?: Agent[];
}

export const AgentLoginModal: React.FC<AgentLoginModalProps> = ({
  isOpen,
  onClose,
  agents = [],
}) => {
  const { availableUsers, switchUserRole, showToast } = useStore();
  const agentUsers = availableUsers.filter((u) => u.role === 'agent');
  const [selectedAgentUserId, setSelectedAgentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  React.useEffect(() => {
    if (agentUsers.length > 0 && !selectedAgentUserId) {
      setSelectedAgentUserId(agentUsers[0].id);
    }
  }, [agentUsers, selectedAgentUserId]);

  if (!isOpen) return null;

  const handleAgentLogin = async (userIdToLogin: string) => {
    try {
      setIsLoading(true);
      await switchUserRole(userIdToLogin);
      onClose();
    } catch (err: any) {
      showToast('خطأ في تسجيل دخول الوكيل', err.message || 'تعذر التحقق من حساب الوكيل', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div 
        id="agent-login-modal"
        className="w-full max-w-lg bg-zinc-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  بوابة دخول الوكلاء المعتمدين
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  آمن ومشفر
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                تسجيل الدخول والتحقق الآمن لإدارة عمليات شحن المحفظة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>اختر حساب الوكيل المعتمد للدخول:</span>
            </label>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {agentUsers.length > 0 ? (
                agentUsers.map((usr) => {
                  const matchingAgent = agents.find((a) => a.id === usr.agentId);
                  const isSelected = selectedAgentUserId === usr.id;

                  return (
                    <button
                      key={usr.id}
                      type="button"
                      onClick={() => setSelectedAgentUserId(usr.id)}
                      className={`w-full text-right p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-md'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={usr.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={usr.name}
                          className="w-10 h-10 rounded-lg object-cover border border-emerald-500/30"
                        />
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{usr.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-emerald-400 font-mono">
                              {usr.agentId}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 text-zinc-300">
                              <Building2 className="w-3 h-3 text-emerald-400" />
                              {matchingAgent?.bankName || 'بنك الخرطوم (بنكك)'}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-zinc-400">{usr.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-700'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-zinc-400">
                  لا توجد حسابات وكلاء مسجلة حالياً في النظام
                </div>
              )}
            </div>
          </div>

          {/* Security Assurance Notice */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>حماية RBAC مشددة على السيرفر:</span>
            </div>
            <p className="leading-relaxed">
              عند تسجيل الدخول كوكيل، يتيح لك النظام معالجة وتأكيد طلبات التغذية المسندة إليك فقط، ولا يمكنك الوصول لإعدادات المتجر الإدارية أو بيانات الوكلاء الآخرين.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              id="submit-agent-login-btn"
              onClick={() => handleAgentLogin(selectedAgentUserId)}
              disabled={isLoading || !selectedAgentUserId}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الدخول والتحقق...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>دخول لوحة الوكيل المعتمد</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
