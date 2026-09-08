import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCheck,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Wallet,
  Gamepad2,
  Sparkles,
  Megaphone,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Radio,
  Send,
  Loader2,
} from 'lucide-react';
import type { AppNotification as Notification } from '../types';

export const NotificationsView: React.FC = () => {
  const {
    currentUser,
    notifications,
    unreadNotifsCount,
    markAllNotifsRead,
    markNotifRead,
    deleteNotif,
    clearReadNotifs,
    setActiveTab,
    showToast,
  } = useStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'wallet' | 'recharge' | 'offers'>('all');
  const [isTesting, setIsTesting] = useState(false);

  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading: isPushLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications({
    userId: currentUser?.id,
    onNotificationReceived: (notif) => {
      showToast(notif.title, notif.message, 'info');
    },
    onNavigate: (url) => {
      if (url.includes('wallet')) setActiveTab('wallet');
      else if (url.includes('offers')) setActiveTab('offers');
      else if (url.includes('accounts')) setActiveTab('accounts');
      else if (url.includes('recharge')) setActiveTab('recharge');
      else if (url.includes('agent')) setActiveTab('agent');
      else if (url.includes('admin')) setActiveTab('admin');
    },
  });

  const handleTogglePush = async () => {
    if (isSubscribed) {
      const res = await unsubscribe();
      if (res.success) {
        showToast('تم إيقاف الإشعارات', 'تم إيقاف استلام الإشعارات الفورية على هذا الجهاز', 'info');
      } else {
        showToast('خطأ', res.error || 'فشل إلغاء الاشتراك', 'error');
      }
    } else {
      const res = await subscribe();
      if (res.success) {
        showToast('تم تفعيل الإشعارات بنجاح!', 'ستصلك الآن تنبيهات الشحن والتغذية والعروض مباشرة', 'success');
      } else {
        showToast('تنبيه الإشعارات', res.error || 'تعذر تفعيل الإشعارات', 'warning');
      }
    }
  };

  const handleSendTest = async () => {
    setIsTesting(true);
    try {
      const res = await sendTestNotification();
      if (res.success) {
        showToast('تم إرسال الإشعار', 'تم إرسال إشعار فوري تجريبي لجهازك بنجاح!', 'success');
      } else {
        showToast('فشل الإرسال', res.error || 'تأكد من تفعيل الإشعارات أولاً', 'error');
      }
    } finally {
      setIsTesting(false);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'wallet') {
      return (
        n.type === 'wallet_topup' ||
        n.type === 'topup_approved' ||
        n.type === 'topup_rejected' ||
        n.title.includes('محفظ') ||
        n.title.includes('تغذية') ||
        n.title.includes('رصيد')
      );
    }
    if (activeFilter === 'recharge') {
      return (
        n.type === 'recharge_status' ||
        n.type === 'recharge_completed' ||
        n.type === 'recharge_failed' ||
        n.type === 'account_purchase' ||
        n.title.includes('شحن') ||
        n.title.includes('حساب')
      );
    }
    if (activeFilter === 'offers') {
      return (
        n.type === 'offer' ||
        n.type === 'news' ||
        n.type === 'broadcast' ||
        n.title.includes('عرض') ||
        n.title.includes('خصم')
      );
    }
    return true;
  });

  const getNotifIcon = (notif: Notification) => {
    const t = notif.type;
    if (t === 'topup_approved' || (t === 'success' && notif.title.includes('تغذية'))) {
      return <Wallet className="w-5 h-5 text-emerald-400" />;
    }
    if (t === 'topup_rejected' || (t === 'error' && notif.title.includes('رفض'))) {
      return <XCircle className="w-5 h-5 text-rose-400" />;
    }
    if (t === 'recharge_completed' || notif.title.includes('اكتمال')) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    }
    if (t === 'recharge_failed' || notif.title.includes('استرداد') || t === 'warning') {
      return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    }
    if (t === 'offer' || t === 'news' || notif.title.includes('عرض')) {
      return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
    if (t === 'broadcast') {
      return <Megaphone className="w-5 h-5 text-amber-400" />;
    }
    return <Info className="w-5 h-5 text-blue-400" />;
  };

  const handleCardClick = (notif: Notification) => {
    if (!notif.read) {
      markNotifRead(notif.id);
    }
    const targetUrl = notif.targetUrl || '';
    if (targetUrl.includes('wallet') || notif.title.includes('محفظ') || notif.title.includes('تغذية')) {
      setActiveTab('wallet');
    } else if (targetUrl.includes('offers') || notif.title.includes('عرض')) {
      setActiveTab('offers');
    } else if (targetUrl.includes('accounts') || notif.title.includes('حساب')) {
      setActiveTab('accounts');
    } else if (targetUrl.includes('recharge') || notif.title.includes('شحن')) {
      setActiveTab('recharge');
    } else if (targetUrl.includes('agent')) {
      setActiveTab('agent');
    } else if (targetUrl.includes('admin')) {
      setActiveTab('admin');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      {/* Top Banner / Push Service Control Center */}
      <div className="p-5 sm:p-7 rounded-3xl bg-[#131722] border border-white/10 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <BellRing className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>مركز الإشعارات والتنبيهات الفورية</span>
                {unreadNotifsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-xs font-black">
                    {unreadNotifsCount} جديدة
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة تحديثات طلبات الشحن، تغذية الرصيد، والعروض الخاصة لحظياً
              </p>
            </div>
          </div>

          {/* Quick Hardware Push Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePush}
              disabled={isPushLoading || !isSupported}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
                isSubscribed
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black font-black'
              } disabled:opacity-50`}
              id="toggle-push-btn"
            >
              {isPushLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSubscribed ? (
                <BellOff className="w-4 h-4" />
              ) : (
                <BellRing className="w-4 h-4" />
              )}
              <span>{isSubscribed ? 'إيقاف الإشعارات' : 'تفعيل الإشعارات الفورية'}</span>
            </button>

            {isSubscribed && (
              <button
                onClick={handleSendTest}
                disabled={isTesting}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="إرسال إشعار تجريبي حقيقي للتأكد من وصوله للنظام والجهاز"
                id="test-push-btn"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-emerald-400" />}
                <span>تجربة إشعار</span>
              </button>
            )}
          </div>
        </div>

        {/* Real Status Indicator Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/5 text-xs">
          <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 block">حالة الجهاز / المتصفح:</span>
              <span className="font-bold truncate block">
                {!isSupported
                  ? 'غير مدعوم في هذا المتصفح'
                  : isSubscribed
                  ? '✅ مسجل ونشط (Push Active)'
                  : permission === 'denied'
                  ? '❌ محظور من المتصفح'
                  : '⚠️ غير مفعل حالياً'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 block">قناة الإشعارات المباشرة:</span>
              <span className="font-bold text-emerald-400 truncate block">
                إشعارات المتجر (صوت + اهتزاز)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 block">التشفير ومصدر الخدمة:</span>
              <span className="font-bold text-slate-200 truncate block font-mono text-[11px]">
                VAPID Web-Push Standards
              </span>
            </div>
          </div>
        </div>

        {permission === 'denied' && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              تم حظر الإشعارات في هذا المتصفح سابقاً. لتلقي التنبيهات، يرجى النقر على أيقونة القفل بجانب رابط الموقع في شريط العناوين والسماح بالإشعارات (Notifications).
            </span>
          </div>
        )}
      </div>

      {/* Filter Tabs & Batch Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
          {[
            { id: 'all', label: 'كافة الإشعارات', count: notifications.length },
            { id: 'unread', label: 'غير المقروءة', count: unreadNotifsCount },
            { id: 'wallet', label: 'المحفظة والرصيد', count: null },
            { id: 'recharge', label: 'الشحن والطلبات', count: null },
            { id: 'offers', label: 'العروض والأخبار', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'bg-[#131722] hover:bg-white/5 border border-white/10 text-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeFilter === tab.id ? 'bg-black text-emerald-400' : 'bg-white/10 text-white'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 text-xs">
          {unreadNotifsCount > 0 && (
            <button
              onClick={markAllNotifsRead}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold flex items-center gap-1.5 transition-colors"
              title="تحديد كافة الإشعارات كمقروءة"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>قراءة الكل</span>
            </button>
          )}

          {notifications.some((n) => n.read) && (
            <button
              onClick={clearReadNotifs}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-rose-400 font-medium flex items-center gap-1.5 transition-colors"
              title="حذف الإشعارات المقروءة لتنظيف القائمة"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح المقروءة</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#131722] border border-white/5 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-sm">لا توجد إشعارات في هذا التصنيف</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              عند إتمام أي عملية شحن أو تغذية رصيد أو نشر عروض جديدة، ستظهر تفاصيلها فورياً هنا وعلى جهازك.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleCardClick(n)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex items-start gap-3.5 ${
                n.read
                  ? 'bg-[#131722]/80 border-white/5 hover:border-white/15 text-slate-300'
                  : 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50 text-white shadow-lg shadow-emerald-950/30'
              }`}
            >
              {/* Unread indicator dot */}
              {!n.read && (
                <span className="absolute top-4 left-4 w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
              )}

              {/* Icon Container */}
              <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                {getNotifIcon(n)}
              </div>

              {/* Content Body */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5 truncate">
                    <span>{n.title}</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleDateString('ar-SD', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-normal">{n.message}</p>

                {/* Footer Action Hint */}
                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 group-hover:underline">
                    <span>عرض التفاصيل</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>

                  {/* Quick Card Controls */}
                  <div
                    className="flex items-center gap-2 opacity-80 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!n.read && (
                      <button
                        onClick={() => markNotifRead(n.id)}
                        className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[10px]"
                      >
                        تمييز كمقروء
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotif(n.id)}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                      title="حذف هذا الإشعار"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
