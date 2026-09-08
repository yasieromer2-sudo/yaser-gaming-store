import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Wallet,
  WalletTransaction,
  Agent,
  PaymentMethod,
  WalletTopUpRequest
} from '../types';
import { api } from '../lib/api';
import {
  Wallet as WalletIcon,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Building2,
  Smartphone,
  CreditCard,
  MessageCircle,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  X,
  FileText,
  Filter
} from 'lucide-react';

export const WalletView: React.FC = () => {
  const {
    currentUser,
    settings,
    refreshData,
    showToast,
    selectedCurrency,
    formatPrice
  } = useStore();

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('bankak');
  const [transferRef, setTransferRef] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [activeRequestDetails, setActiveRequestDetails] = useState<WalletTopUpRequest | null>(null);

  useEffect(() => {
    loadWalletData();
  }, [currentUser]);

  const loadWalletData = async () => {
    try {
      const [walletRes, agentsRes, methodsRes] = await Promise.all([
        api.getWallet(),
        api.getAgents(),
        api.getPaymentMethods(),
      ]);
      setTransactions(walletRes.transactions);
      setAgents(agentsRes);
      setPaymentMethods(methodsRes);
      if (agentsRes.length > 0 && !selectedAgent) {
        setSelectedAgent(agentsRes[0]);
      }
    } catch (err: any) {
      showToast('خطأ', 'فشل في تحميل بيانات المحفظة', 'error');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('تم النسخ', `تم نسخ ${label} بنجاح`, 'info');
  };

  // Handle WhatsApp Notification & Top-up submission
  const handleSendWhatsAppNotification = async () => {
    if (!currentUser) return;
    if (!selectedAgent) {
      showToast('تنبيه', 'يرجى اختيار وكيل الشحن', 'warning');
      return;
    }

    const amountNum = parseFloat(topUpAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('تنبيه', 'يرجى إدخال مبلغ صحيح لتغذية المحفظة', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create top-up request on backend
      const request = await api.createTopUpRequest({
        agentId: selectedAgent.id,
        amount: amountNum,
        paymentMethod: selectedPaymentMethod,
        transferReference: transferRef.trim(),
      });

      setActiveRequestDetails(request);
      setShowTopUpModal(false);
      await refreshData();
      await loadWalletData();

      // 2. Prepare structured WhatsApp message
      const paymentMethodObj = paymentMethods.find((m) => m.id === selectedPaymentMethod);
      const methodName = paymentMethodObj ? paymentMethodObj.name : selectedPaymentMethod;

      const messageText = `السلام عليكم ورحمة الله وبركاته،
أود تأكيد تغذية المحفظة في متجر ${settings?.storeName || 'الألعاب'}:

👤 اسم المستخدم: ${currentUser.name}
🆔 User ID: ${currentUser.uid}
💰 المبلغ المحول: ${amountNum.toLocaleString()} SDG
🏦 وسيلة الدفع: ${methodName}
👨‍💼 الوكيل المختار: ${selectedAgent.name}
🔢 رقم الطلب: ${request.id}
${transferRef.trim() ? `📄 رقم العملية/المرجع: ${transferRef.trim()}\n` : ''}
لقد قمت بالتحويل إلى حسابكم البنكي المعتمد، ومرفق مع الرسالة لقطة شاشة التحويل للتحقق وإضافة الرصيد إلى محفظتي.`;

      // Clean WhatsApp phone number
      const cleanPhone = selectedAgent.whatsappNumber.replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(messageText);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');

      showToast(
        'تم تجهيز الرسالة وفتح واتساب',
        'تم تسجيل طلبك. ستقوم المحفظة بتحديث الرصيد فور قيام الوكيل بمطابقة التحويل البنكي.',
        'success'
      );
    } catch (err: any) {
      showToast('خطأ في إرسال الطلب', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const userBalance = currentUser?.wallet?.balance || 0;
  const balanceUSD = settings?.usdToSdgRate
    ? (userBalance / settings.usdToSdgRate).toFixed(2)
    : '0';

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Main Wallet Balance Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[#131722] via-[#181d2c] to-[#0d1017] border border-emerald-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.5)] space-y-6">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <WalletIcon className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-400">
                المحفظة الرقمية الداخلية (Internal Wallet)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10 font-mono">
                {currentUser?.uid}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                {userBalance.toLocaleString()}
              </h2>
              <span className="text-sm md:text-lg font-extrabold text-emerald-400">
                SDG (جنيه سوداني)
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
              <span>ما يعادل: ~ ${balanceUSD} USD</span>
              <span>•</span>
              <span>سعر الصرف: 1 USD = {settings?.usdToSdgRate.toLocaleString()} SDG</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
              id="wallet-topup-btn"
            >
              <PlusCircle className="w-5 h-5" />
              تغذية المحفظة (Top-up)
            </button>
          </div>
        </div>

        {/* Security / Agent Notice */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-start gap-2.5 text-xs text-slate-300">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-400 font-bold">نظام الأمان المالي:</strong> تتم تغذية
            المحفظة حصريًا عبر شبكة وكلاء الشحن المعتمدين. يتم إضافة الرصيد بعد تحقق الوكيل الفعلي
            من الإشعار البنكي لضمان حماية المعاملات.
          </p>
        </div>
      </div>

      {/* 2. Wallet Ledger & Transactions History */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-base md:text-lg text-white">
              سجل عمليات المحفظة (Wallet Ledger)
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['all', 'Wallet Top-up', 'Game Recharge', 'Game Purchase', 'Refund'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  filterType === type
                    ? 'bg-indigo-500 text-white'
                    : 'bg-[#131722] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {type === 'all'
                  ? 'الكل'
                  : type === 'Wallet Top-up'
                  ? 'تغذية'
                  : type === 'Game Recharge'
                  ? 'شحن'
                  : type === 'Game Purchase'
                  ? 'شراء حساب'
                  : 'استرداد'}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#131722] border border-white/5 text-center text-slate-400 space-y-2">
            <WalletIcon className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-xs font-bold text-slate-300">لا توجد عمليات مسجلة في المحفظة حالياً</p>
            <p className="text-[11px] text-slate-500">
              قم بتغذية محفظتك أو تنفيذ أول عملية شحن لتظهر تفاصيل السجل المحاسبي هنا.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-[#131722] border border-white/10 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-white/5 text-slate-400 border-b border-white/10 font-bold">
                    <th className="py-3 px-4">رقم العملية (Txn ID)</th>
                    <th className="py-3 px-4">النوع والمصدر</th>
                    <th className="py-3 px-4">المبلغ</th>
                    <th className="py-3 px-4">الرصيد قبل / بعد</th>
                    <th className="py-3 px-4">التاريخ والوقت</th>
                    <th className="py-3 px-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {filteredTransactions.map((tx) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-300 font-bold whitespace-nowrap">
                          {tx.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white leading-snug">{tx.type}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{tx.source}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black whitespace-nowrap">
                          <span
                            className={`flex items-center gap-1 text-sm ${
                              isCredit ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                            {isCredit ? '+' : ''}
                            {tx.amount.toLocaleString()} SDG
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          <span>{tx.balanceBefore.toLocaleString()}</span>
                          <span className="mx-1 text-slate-600">➔</span>
                          <span className="font-bold text-slate-200">
                            {tx.balanceAfter.toLocaleString()} SDG
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          <div>{tx.date}</div>
                          <div className="text-slate-500">{tx.time}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.status === 'Completed'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                : tx.status === 'Pending'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                            }`}
                          >
                            {tx.status === 'Completed'
                              ? 'مكتملة'
                              : tx.status === 'Pending'
                              ? 'قيد المعالجة'
                              : tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. Top-Up Wallet Modal with Agent Selection & WhatsApp Flow */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto p-4 sm:p-6 rounded-3xl bg-[#131722] border border-white/15 shadow-2xl space-y-5 text-right my-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#131722] z-10 flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">تغذية المحفظة (Top-Up)</h3>
                  <p className="text-xs text-slate-400">
                    اختر الوكيل، حول المبلغ لحسابه البنكي، وأرسل الإشعار
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Select Agent */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-mono flex items-center justify-center">
                  1
                </span>
                اختر وكيل الشحن المتاح ({agents.length} وكلاء معتمدين):
              </label>

              {agents.length === 0 ? (
                <div className="p-4 text-center rounded-2xl bg-black/30 border border-white/5 space-y-1">
                  <p className="text-xs font-bold text-slate-300">لا يوجد وكلاء متاحون حالياً</p>
                  <p className="text-[11px] text-slate-400">يمكن للإدارة إضافة وكلاء معتمدين وتحديد بياناتهم البنكية من لوحة التحكم.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {agents.map((agent) => {
                    const isSelected = selectedAgent?.id === agent.id;
                    return (
                      <div
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
                        className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 shadow-md'
                            : 'bg-black/30 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={agent.avatar}
                              alt={agent.name}
                              className="w-11 h-11 rounded-xl object-cover border border-white/15 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h4 className="font-extrabold text-sm text-white">{agent.name}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-slate-300">{agent.bankName}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                  متاح الآن
                                </span>
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Show Agent Bank Details */}
            {selectedAgent && (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-sky-400" />
                    بيانات الحساب البنكي للوكيل:
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">حساب رسمي معتمد</span>
                </div>

                <div className="grid grid-cols-1 gap-2 text-slate-300">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">البنك:</span>
                    <span className="font-bold text-white">{selectedAgent.bankName}</span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">رقم الحساب:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-emerald-400">
                        {selectedAgent.accountNumber}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedAgent.accountNumber, 'رقم الحساب')}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-200"
                        title="نسخ رقم الحساب"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">اسم صاحب الحساب:</span>
                    <span className="font-bold text-white">{selectedAgent.accountHolder}</span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">رقم الواتساب:</span>
                    <span className="font-mono text-slate-200">
                      {selectedAgent.whatsappNumber}
                    </span>
                  </div>
                </div>

                {selectedAgent.paymentInstructions && (
                  <div className="pt-2 border-t border-white/5 text-[11px] text-amber-300/90 leading-relaxed bg-amber-500/10 p-2.5 rounded-xl">
                    <strong>تعليمات الوكيل:</strong> {selectedAgent.paymentInstructions}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Enter Amount & Method */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-mono flex items-center justify-center">
                  2
                </span>
                حدد مبلغ التغذية بالجنيه السوداني (SDG):
              </label>

              <div className="space-y-2">
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="المبلغ بالجنيه السوداني..."
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                />

                {/* Quick Amount Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {['10000', '25000', '50000', '100000'].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTopUpAmount(amt)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-xs font-mono font-bold"
                    >
                      +{parseInt(amt).toLocaleString()} SDG
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs text-slate-400 font-medium">وسيلة الدفع المستخدمة:</label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-colors ${
                        selectedPaymentMethod === method.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {method.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Transfer Reference */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">
                  رقم الإشعار أو مرجع التحويل البنكي (اختياري لتسريع التحقق):
                </label>
                <input
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="مثال: رقم العملية في بنكك"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Critical Requirement Notice */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>تنبيه هام جداً:</strong> الضغط على الزر وفتح واتساب لا يعني إضافة الرصيد. لا
                يُضاف الرصيد إلى محفظتك إلا بعد أن يتحقق الوكيل فعلياً من وصول المبلغ إلى حسابه البنكي
                وتأكيده للعملية من لوحة الوكيل.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSendWhatsAppNotification}
                disabled={isSubmitting || !selectedAgent || !topUpAmount}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                id="send-whatsapp-btn"
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 fill-current" />
                    إرسال إشعار الدفع عبر WhatsApp
                  </>
                )}
              </button>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Created Notification Modal */}
      {activeRequestDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#131722] border border-emerald-500/40 shadow-2xl space-y-4 text-right">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageCircle className="w-7 h-7" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-lg text-white">تم إنشاء طلب التغذية!</h3>
              <p className="text-xs text-slate-300">
                رقم الطلب الخاص بك: <span className="font-mono text-emerald-400 font-bold">{activeRequestDetails.id}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">الوكيل المسؤول:</span>
                <span className="font-bold text-white">{activeRequestDetails.agentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المبلغ:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {activeRequestDetails.amount.toLocaleString()} SDG
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">حالة الطلب:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                  بانتظار تحقق الوكيل من البنك
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              إذا لم يُفتح واتساب تلقائيًا، يمكنك التواصل مع الوكيل مباشرة وتقديم رقم الطلب.
            </p>

            <button
              onClick={() => setActiveRequestDetails(null)}
              className="w-full py-3 rounded-xl bg-emerald-500 text-black font-extrabold text-xs shadow-md"
            >
              فهمت، العودة للمحفظة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
