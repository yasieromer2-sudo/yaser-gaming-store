import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Order, RechargeOrder } from '../types';
import { api } from '../lib/api';
import {
  User as UserIcon,
  Copy,
  Edit2,
  Check,
  ShieldCheck,
  Lock,
  FileText,
  Clock,
  Sparkles,
  Zap,
  Gamepad2,
  Bell,
  HelpCircle,
  ExternalLink,
  X,
  Phone,
  UserPlus,
  LogIn
} from 'lucide-react';
import { AuthModal } from './AuthModal';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    settings,
    refreshData,
    showToast,
    notifications,
    formatPrice
  } = useStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [userNameInput, setUserNameInput] = useState(currentUser?.name || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'recharges' | 'terms'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [recharges, setRecharges] = useState<RechargeOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [selectedDeliveredOrder, setSelectedDeliveredOrder] = useState<Order | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');

  useEffect(() => {
    if (currentUser) {
      setUserNameInput(currentUser.name);
      loadOrders();
    }
  }, [currentUser]);

  const loadOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const [allOrders, allRecharges] = await Promise.all([
        api.getOrders(),
        api.getRechargeOrders(),
      ]);
      setOrders(allOrders);
      setRecharges(allRecharges);
    } catch (err: any) {
      // silent
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('تم النسخ', `تم نسخ ${label} بنجاح`, 'info');
  };

  const handleSaveName = async () => {
    if (!userNameInput.trim()) {
      showToast('تنبيه', 'لا يمكن ترك الاسم فارغاً', 'warning');
      return;
    }
    try {
      await api.updateProfile({ name: userNameInput.trim() });
      await refreshData();
      setIsEditingName(false);
      showToast('تم الحفظ', 'تم تحديث اسم المستخدم بنجاح', 'success');
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const handleSelectAvatar = async (avatarUrl: string) => {
    try {
      await api.updateProfile({ avatar: avatarUrl });
      await refreshData();
      setShowAvatarPicker(false);
      showToast('تم الحفظ', 'تم تحديث الصورة الشخصية بنجاح', 'success');
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Profile Hero Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-[#131722] border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with click-to-change */}
          <div className="relative group">
            <img
              src={currentUser?.avatar || PRESET_AVATARS[0]}
              alt={currentUser?.name}
              className="w-24 h-24 rounded-3xl object-cover border-2 border-emerald-500/60 shadow-xl"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="absolute -bottom-2 -left-2 p-2 rounded-xl bg-emerald-500 text-black shadow-lg hover:bg-emerald-400 transition-transform active:scale-95"
              title="تغيير الصورة الشخصية"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Details & ID */}
          <div className="flex-1 text-center sm:text-right space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={userNameInput}
                    onChange={(e) => setUserNameInput(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-black/50 border border-emerald-500 text-white font-bold text-sm focus:outline-none"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-2 rounded-xl bg-emerald-500 text-black font-bold"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="p-2 rounded-xl bg-white/10 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-black text-white">{currentUser?.name}</h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-slate-400 hover:text-white"
                    title="تعديل الاسم"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400">
              <span className="font-mono">{currentUser?.email}</span>
              {currentUser?.phone && (
                <span className="flex items-center gap-1 font-mono text-slate-300" dir="ltr">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  {currentUser.phone}
                </span>
              )}
            </div>

            {/* Permanent Unique User ID with 1-Click Copy */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[11px] text-slate-400">معرف العميل (User ID):</span>
                <span className="font-mono font-black text-sm text-emerald-400">
                  {currentUser?.uid}
                </span>
                <button
                  onClick={() => copyToClipboard(currentUser?.uid || '', 'User ID')}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                  title="نسخ User ID"
                  id="copy-user-id-btn"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-[10px] text-slate-400 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                🔒 ثابت ومعتمد لعمليات التغذية والشحن
              </span>

              {/* Register / Login quick actions */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setAuthModalMode('register');
                    setShowAuthModal(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>تسجيل حساب جديد</span>
                </button>
                <button
                  onClick={() => {
                    setAuthModalMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs flex items-center gap-1"
                >
                  <LogIn className="w-3 h-3" />
                  <span>تبديل الحساب</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Picker Dropdown / Drawer */}
        {showAvatarPicker && (
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 animate-in fade-in">
            <h4 className="text-xs font-bold text-slate-300">اختر صورة شخصية جديدة:</h4>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {PRESET_AVATARS.map((av, idx) => (
                <img
                  key={idx}
                  src={av}
                  alt=""
                  onClick={() => handleSelectAvatar(av)}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-transparent hover:border-emerald-500 cursor-pointer transition-transform hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Sub-Tabs (My Orders, Recharges, Terms & Conditions) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'orders'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            الحسابات المشتراة ({orders.filter((o) => o.type === 'account_purchase').length})
          </button>
          <button
            onClick={() => setActiveSubTab('recharges')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'recharges'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            طلبات الشحن ({recharges.length})
          </button>
          <button
            onClick={() => setActiveSubTab('terms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'terms'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            شروط الاستخدام والخصوصية
          </button>
        </div>

        {/* Tab 1: Purchased Accounts */}
        {activeSubTab === 'orders' && (
          <div className="space-y-3">
            {orders.filter((o) => o.type === 'account_purchase').length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#131722] border border-white/5 text-center text-slate-400">
                <Gamepad2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-300">لم تقم بشراء أي حساب بعد</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  تصفح عروض الحسابات في المتجر، وستظهر بيانات الحسابات المشتراة وتفاصيلها هنا دائماً.
                </p>
              </div>
            ) : (
              orders
                .filter((o) => o.type === 'account_purchase')
                .map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-[#131722] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">{order.itemTitle}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          {order.gameName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
                        <span>رقم الطلب: {order.id}</span>
                        <span>•</span>
                        <span>{new Date(order.createdAt).toLocaleDateString('ar-SD')}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">
                          {order.amountSDG.toLocaleString()} SDG
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedDeliveredOrder(order)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      عرض بيانات تسجيل الدخول
                    </button>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Tab 2: Recharge Orders */}
        {activeSubTab === 'recharges' && (
          <div className="space-y-3">
            {recharges.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#131722] border border-white/5 text-center text-slate-400">
                <Zap className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-300">لا توجد طلبات شحن سابقة</p>
              </div>
            ) : (
              recharges.map((rch) => (
                <div
                  key={rch.id}
                  className="p-4 rounded-2xl bg-[#131722] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">
                        {rch.gameName} - {rch.packageName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rch.status === 'Completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : rch.status === 'Processing'
                            ? 'bg-sky-500/20 text-sky-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {rch.status === 'Completed'
                          ? 'مكتمل'
                          : rch.status === 'Processing'
                          ? 'جاري الشحن...'
                          : rch.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
                      <span>رقم الطلب: {rch.id}</span>
                      <span>معرف اللاعب: {rch.playerId}</span>
                      <span className="text-emerald-400 font-bold">{rch.amountSDG.toLocaleString()} SDG</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(rch.createdAt).toLocaleDateString('ar-SD')}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Terms & Privacy */}
        {activeSubTab === 'terms' && (
          <div className="p-6 rounded-3xl bg-[#131722] border border-white/10 space-y-6 text-xs text-slate-300 leading-relaxed">
            <div className="space-y-2">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                شروط استخدام المتجر
              </h4>
              <p className="bg-black/40 p-4 rounded-2xl border border-white/5">
                {settings?.termsOfService}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                سياسة الخصوصية
              </h4>
              <p className="bg-black/40 p-4 rounded-2xl border border-white/5">
                {settings?.privacyPolicy}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delivered Account Credentials Modal */}
      {selectedDeliveredOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#131722] border border-emerald-500/40 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-base text-white">بيانات تسجيل الدخول للحساب</h3>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 font-mono text-xs text-white">
              <div className="text-slate-400 text-[11px]">اسم الحساب: {selectedDeliveredOrder.itemTitle}</div>
              <div>
                <span className="text-slate-400">نوع التسجيل: </span>
                <span className="text-emerald-300 font-bold">
                  {selectedDeliveredOrder.deliveredDetails?.loginType}
                </span>
              </div>
              <div className="pt-2 border-t border-white/10">
                <span className="text-slate-400 block mb-1">تفاصيل الدخول:</span>
                <div className="p-2.5 rounded-xl bg-white/5 text-amber-300 break-all leading-relaxed font-bold">
                  {selectedDeliveredOrder.deliveredDetails?.deliveryDetails}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  copyToClipboard(
                    `${selectedDeliveredOrder.deliveredDetails?.loginType}\n${selectedDeliveredOrder.deliveredDetails?.deliveryDetails}`,
                    'بيانات الحساب'
                  );
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Copy className="w-3.5 h-3.5" />
                نسخ البيانات
              </button>
              <button
                onClick={() => setSelectedDeliveredOrder(null)}
                className="px-4 py-3 rounded-xl bg-white/10 text-white text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register / Login Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </div>
  );
};
