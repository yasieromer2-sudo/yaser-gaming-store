import React, { useState, useEffect } from 'react';
import { User, Wallet } from '../../../types';
import { api } from '../../../lib/api';
import { useStore } from '../../../context/StoreContext';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  User as UserIcon,
  Ban,
  CheckCircle2,
  DollarSign,
  Wallet as WalletIcon,
  RefreshCw,
  Eye,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';

export const UsersTab: React.FC = () => {
  const { showToast, refreshData } = useStore();
  const [users, setUsers] = useState<User[]>([]);
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'agent' | 'super_admin'>('all');

  // Balance adjust modal
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('25000');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustReason, setAdjustReason] = useState<string>('تعديل إداري معتمد');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      showToast('خطأ', 'فشل في تحميل المستخدمين', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.role === 'super_admin') {
      showToast('محظور', 'لا يمكن تعديل حالة حساب المدير العام', 'warning');
      return;
    }
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await api.toggleUserStatus(user.id, newStatus);
      showToast(
        'تم تغيير الحالة',
        `تم ${newStatus === 'active' ? 'تفعيل' : 'تعطيل'} حساب ${user.name} بنجاح`,
        'success'
      );
      await loadUsers();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const handleExecuteAdjust = async () => {
    if (!targetUser) return;
    const num = parseFloat(adjustAmount);
    if (isNaN(num) || num <= 0) {
      showToast('تنبيه', 'يرجى إدخال مبلغ صالح للتعديل', 'warning');
      return;
    }
    const finalAmount = adjustType === 'add' ? num : -num;

    setIsAdjusting(true);
    try {
      await api.adjustWalletBalance(targetUser.id, finalAmount, adjustReason.trim() || 'تعديل إداري');
      showToast(
        'تم التعديل المالي بنجاح',
        `تم ${adjustType === 'add' ? 'إيداع' : 'خصم'} ${num.toLocaleString()} SDG من محفظة ${targetUser.name} مع توثيق الحركة في الـ Ledger`,
        'success'
      );
      setShowAdjustModal(false);
      setTargetUser(null);
      setAdjustReason('تعديل إداري معتمد');
      await loadUsers();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ في التعديل المالي', err.message, 'error');
    } finally {
      setIsAdjusting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#131722] to-slate-900 border border-emerald-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">إدارة المستخدمين والصلاحيات (RBAC)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة الحسابات، تعديل الأرصدة يدويًا مع التوثيق المالي، وتفعيل أو تعطيل الحسابات
              </p>
            </div>
          </div>

          <button
            onClick={loadUsers}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث القائمة
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#131722] border border-white/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، البريد الإلكتروني، أو User ID..."
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'user', label: 'العملاء' },
            { id: 'agent', label: 'وكلاء الشحن' },
            { id: 'super_admin', label: 'المدراء' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setRoleFilter(btn.id as any)}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                roleFilter === btn.id
                  ? 'bg-emerald-500 text-black font-black shadow-md'
                  : 'bg-black/30 hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-[#131722] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-black/40 border-b border-white/10 text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">المستخدم</th>
                <th className="py-3.5 px-4">User ID المعرف</th>
                <th className="py-3.5 px-4">البريد الإلكتروني</th>
                <th className="py-3.5 px-4">رقم الهاتف</th>
                <th className="py-3.5 px-4">الصلاحية (Role)</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">تاريخ الانضمام</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    لا يوجد مستخدمين مطابقين
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.status !== 'suspended';
                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-extrabold text-white">{u.name}</div>
                            <div className="text-[10px] text-slate-400">{u.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* UID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{u.uid}</td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">{u.email}</td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-emerald-400/90 text-[11px] dir-ltr text-right">
                        {u.phone ? u.phone : <span className="text-slate-500 text-[10px] italic">غير مسجل</span>}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {u.role === 'super_admin' ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                            Super Admin
                          </span>
                        ) : u.role === 'agent' ? (
                          <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                            وكيل معتمد (Agent)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[10px] font-bold">
                            عميل متجر (User)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            حساب مفعل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            معطل (Suspended)
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString('ar-SD')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Adjust Balance Button */}
                          <button
                            onClick={() => {
                              setTargetUser(u);
                              setShowAdjustModal(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1"
                            title="تعديل رصيد المحفظة"
                          >
                            <WalletIcon className="w-3 h-3" />
                            <span>تعديل الرصيد</span>
                          </button>

                          {/* Toggle Status Button */}
                          {u.role !== 'super_admin' && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isActive
                                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              }`}
                              title={isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Balance Modal */}
      {showAdjustModal && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#131722] border border-white/15 p-6 space-y-4 shadow-2xl text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <WalletIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">
                  تعديل الرصيد المالي للمستخدم
                </h3>
                <span className="text-[11px] text-slate-400">
                  {targetUser.name} ({targetUser.uid})
                </span>
              </div>
            </div>

            {/* Type: Add or Deduct */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAdjustType('add')}
                className={`py-2 rounded-xl font-bold border transition-colors ${
                  adjustType === 'add'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-black/30 border-white/5 text-slate-400'
                }`}
              >
                + إضافة رصيد (Credit)
              </button>
              <button
                onClick={() => setAdjustType('deduct')}
                className={`py-2 rounded-xl font-bold border transition-colors ${
                  adjustType === 'deduct'
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-black/30 border-white/5 text-slate-400'
                }`}
              >
                - خصم رصيد (Debit)
              </button>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="font-bold text-white">المبلغ بالجنيه السوداني (SDG):</label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-base font-bold"
              />
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="font-bold text-white">
                سبب التعديل المالي (يتم توثيقه في سجل الـ Ledger):
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="مثال: تعويض شحنة، تسوية يدوية، مكافأة وكيل"
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
              />
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 leading-relaxed text-[11px]">
              <strong>توثيق مالي صارم:</strong> سيتم تسجيل هذه الحركة في جدول المعاملات وتحديث الرصيد
              مع حفظ اسم المدير الذي قام بالإجراء وتوقيت العملية.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleExecuteAdjust}
                disabled={isAdjusting}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black shadow-md transition-transform active:scale-95"
              >
                {isAdjusting ? 'جارٍ التنفيذ...' : 'تأكيد التعديل المالي'}
              </button>
              <button
                onClick={() => setShowAdjustModal(false)}
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
