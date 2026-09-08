import React, { useState } from 'react';
import { 
  Building2, 
  Copy, 
  Check, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink, 
  UserCheck 
} from 'lucide-react';
import { Agent } from '../../types';

interface AgentBankCardProps {
  agent: Agent | null;
  agentName?: string;
  onCopySuccess?: (text: string) => void;
}

export const AgentBankCard: React.FC<AgentBankCardProps> = ({
  agent,
  agentName,
  onCopySuccess,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (onCopySuccess) onCopySuccess(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const displayName = agent?.name || agentName || 'الوكيل المعتمد';
  const bankName = agent?.bankName || 'الحساب البنكي المعتمد';
  const accountNumber = agent?.accountNumber || '-';
  const accountHolder = agent?.accountHolder || displayName;
  const whatsapp = agent?.whatsappNumber || '';

  return (
    <div 
      id="agent-banking-card" 
      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-zinc-800 shadow-xl relative overflow-hidden"
    >
      {/* Decorative accent glow */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        {/* Agent Info & Avatar */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={agent?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={displayName}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl object-cover border-2 border-emerald-500/40 shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center border-2 border-zinc-900 shadow">
              <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {displayName}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-2.5 h-2.5" />
                وكيل معتمد
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              معرف الوكيل في النظام: <span className="text-zinc-200 font-mono font-medium">{agent?.id || '-'}</span>
            </p>
          </div>
        </div>

        {/* WhatsApp & Quick Actions */}
        {whatsapp ? (
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>واتساب الوكيل ({whatsapp})</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        ) : null}
      </div>

      {/* Bank Account Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        {/* Bank Name */}
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <span className="text-[11px] text-zinc-400 block mb-1">
            البنك المعتمد للاستقبال
          </span>
          <div className="flex items-center gap-2 font-medium text-white text-sm">
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{bankName}</span>
          </div>
        </div>

        {/* Account Number with Copy */}
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-zinc-400">
              رقم الحساب البنكي
            </span>
            <button
              onClick={() => handleCopy(accountNumber, 'acc')}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              {copiedKey === 'acc' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>نسخ</span>
                </>
              )}
            </button>
          </div>
          <div className="font-mono font-bold text-white text-base tracking-wide text-left dir-ltr">
            {accountNumber}
          </div>
        </div>

        {/* Account Holder Name */}
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <span className="text-[11px] text-zinc-400 block mb-1">
            اسم صاحب الحساب
          </span>
          <div className="flex items-center gap-2 font-medium text-white text-sm">
            <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">{accountHolder}</span>
          </div>
        </div>
      </div>

      {/* Instructions / Security Notice */}
      {agent?.paymentInstructions && (
        <div className="mt-3 p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-xs text-zinc-400 leading-relaxed">
          <span className="text-zinc-200 font-semibold ml-1">تعليمات التحويل للعملاء:</span>
          {agent.paymentInstructions}
        </div>
      )}
    </div>
  );
};
