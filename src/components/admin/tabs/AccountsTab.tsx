import React, { useState, useEffect } from 'react';
import { GameAccount, Game } from '../../../types';
import { api } from '../../../lib/api';
import { useStore } from '../../../context/StoreContext';
import {
  ShieldCheck,
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Lock,
  Eye,
  Key,
  Gamepad2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const AccountsTab: React.FC = () => {
  const { showToast, refreshData, settings } = useStore();
  const [accounts, setAccounts] = useState<GameAccount[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'sold' | 'hidden'>('all');

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<GameAccount | null>(null);

  const [form, setForm] = useState({
    title: '',
    gameId: 'freefire',
    gameName: 'Free Fire',
    level: 65,
    skinsCount: 85,
    rank: 'Grandmaster / فاير باس قديم',
    priceSDG: 45000,
    priceUSD: 15,
    status: 'available' as 'available' | 'reserved' | 'sold' | 'hidden',
    images: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    accountDetails: 'حساب مربوط Gmail فقط بدون فيسبوك، جاهز للنقل الكامل',
    credentials: 'User: game_user_sd\nPass: SecP@ss2025\nBackup codes: 829102, 192834',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [accs, gms] = await Promise.all([
        api.getGameAccounts(true),
        api.getGames(),
      ]);
      setAccounts(accs);
      setGames(gms);
    } catch (err: any) {
      showToast('خطأ', 'فشل في تحميل الحسابات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!form.title.trim() || !form.priceSDG) {
      showToast('تنبيه', 'يرجى إكمال بيانات الحساب والسعر', 'warning');
      return;
    }

    try {
      const selectedGame = games.find((g) => g.id === form.gameId);
      const imagesArr = form.images.split('\n').filter((url) => url.trim().length > 0);

      const payload = {
        ...form,
        gameName: selectedGame ? selectedGame.name : form.gameName,
        images: imagesArr.length > 0 ? imagesArr : [form.images],
      };

      if (editingAccount) {
        await api.updateGameAccount(editingAccount.id, payload);
        showToast('تم التحديث', `تم تحديث الحساب #${editingAccount.id}`, 'success');
      } else {
        await api.createGameAccount(payload);
        showToast('تمت الإضافة', 'تم إضافة حساب اللعبة لسوق الحسابات', 'success');
      }

      setShowModal(false);
      setEditingAccount(null);
      resetForm();
      await loadData();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const handleDeleteAccount = async (account: GameAccount) => {
    if (!confirm(`هل أنت متأكد من حذف الحساب "${account.title}"؟`)) return;
    try {
      await api.deleteGameAccount(account.id);
      showToast('تم الحذف', 'تم حذف الحساب بنجاح', 'info');
      await loadData();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      gameId: games[0]?.id || 'freefire',
      gameName: games[0]?.name || 'Free Fire',
      level: 60,
      skinsCount: 50,
      rank: 'Heroic',
      priceSDG: 50000,
      priceUSD: 16,
      status: 'available',
      images: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      accountDetails: '',
      credentials: '',
    });
  };

  const openEdit = (acc: GameAccount) => {
    setEditingAccount(acc);
    setForm({
      title: acc.title,
      gameId: acc.gameId,
      gameName: acc.gameName,
      level: acc.level,
      skinsCount: acc.skinsCount,
      rank: acc.rank,
      priceSDG: acc.priceSDG,
      priceUSD: acc.priceUSD,
      status: acc.status as any,
      images: Array.isArray(acc.images) ? acc.images.join('\n') : acc.images,
      accountDetails: acc.accountDetails || '',
      credentials: acc.credentials || '',
    });
    setShowModal(true);
  };

  const filteredAccounts = accounts.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.gameName.toLowerCase().includes(q) ||
        a.rank.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#131722] to-slate-900 border border-emerald-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">إدارة سوق حسابات الألعاب</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                عرض وفحص الحسابات، تسليم بيانات الدخول السرية، وإدارة حالات البيع والحجز
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              setEditingAccount(null);
              setShowModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            إضافة حساب للبيع
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
            placeholder="بحث بعنوان الحساب، اللعبة، الرتبة..."
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'available', label: 'متاح للبيع' },
            { id: 'reserved', label: 'محجوز' },
            { id: 'sold', label: 'تم البيع' },
            { id: 'hidden', label: 'مخفي' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setStatusFilter(btn.id as any)}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                statusFilter === btn.id
                  ? 'bg-emerald-500 text-black font-black shadow-md'
                  : 'bg-black/30 hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((acc) => {
          const img = Array.isArray(acc.images) ? acc.images[0] : acc.images;
          return (
            <div
              key={acc.id}
              className="rounded-3xl bg-[#131722] border border-white/10 overflow-hidden hover:border-white/20 transition-all flex flex-col justify-between shadow-lg"
            >
              <div className="relative h-44 w-full bg-black/70">
                <img
                  src={img}
                  alt={acc.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131722] via-black/20 to-transparent" />

                {/* Status Badge */}
                <span
                  className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border ${
                    acc.status === 'available'
                      ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                      : acc.status === 'sold'
                      ? 'bg-red-500/30 text-red-300 border-red-500/40'
                      : acc.status === 'reserved'
                      ? 'bg-amber-500/30 text-amber-300 border-amber-500/40'
                      : 'bg-slate-500/30 text-slate-300 border-slate-500/40'
                  }`}
                >
                  {acc.status === 'available'
                    ? 'متاح للبيع'
                    : acc.status === 'sold'
                    ? 'تم البيع'
                    : acc.status === 'reserved'
                    ? 'محجوز'
                    : 'مخفي'}
                </span>

                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-black/70 text-emerald-400 text-xs font-mono font-bold border border-white/10">
                  {acc.gameName}
                </span>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="font-black text-sm text-white line-clamp-1">{acc.title}</h3>

                <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-black/40 rounded-2xl border border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-400 block">المستوى</span>
                    <span className="font-bold text-white">{acc.level}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">السكنات</span>
                    <span className="font-bold text-emerald-400">{acc.skinsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">الرتبة</span>
                    <span className="font-bold text-amber-400 truncate block px-1">
                      {acc.rank}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-base font-black text-white font-mono">
                    {acc.priceSDG.toLocaleString()} <span className="text-xs font-sans text-slate-400">SDG</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">~ ${acc.priceUSD} USD</div>
                </div>

                {acc.credentials && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">بيانات الدخول جاهزة للتسليم التلقائي للمشتري</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => openEdit(acc)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => handleDeleteAccount(acc)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors"
                    title="حذف الحساب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#131722] border border-white/15 p-6 space-y-4 shadow-2xl text-xs text-slate-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white">
                {editingAccount ? 'تعديل بيانات الحساب' : 'إضافة حساب جديد للبيع'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-white">عنوان الحساب:</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: حساب فري فاير فايرباس 1 إلى 5 مع حزمة الكوبرا"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-white">اللعبة:</label>
                  <select
                    value={form.gameId}
                    onChange={(e) => {
                      const g = games.find((x) => x.id === e.target.value);
                      setForm({
                        ...form,
                        gameId: e.target.value,
                        gameName: g?.name || form.gameName,
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                  >
                    {games.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-white">الحالة:</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                  >
                    <option value="available">متاح للبيع</option>
                    <option value="reserved">محجوز</option>
                    <option value="sold">تم البيع</option>
                    <option value="hidden">مخفي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-white">المستوى:</label>
                  <input
                    type="number"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-white">السكنات:</label>
                  <input
                    type="number"
                    value={form.skinsCount}
                    onChange={(e) =>
                      setForm({ ...form, skinsCount: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-white">الرتبة:</label>
                  <input
                    type="text"
                    value={form.rank}
                    onChange={(e) => setForm({ ...form, rank: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-white">السعر بالجنيه (SDG):</label>
                  <input
                    type="number"
                    value={form.priceSDG}
                    onChange={(e) => {
                      const sdg = parseFloat(e.target.value) || 0;
                      const rate = settings?.usdToSdgRate || 3100;
                      setForm({
                        ...form,
                        priceSDG: sdg,
                        priceUSD: parseFloat((sdg / rate).toFixed(2)),
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-white">السعر بالدولار (USD):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.priceUSD}
                    onChange={(e) =>
                      setForm({ ...form, priceUSD: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">رابط صورة الحساب أو لقطات الشاشة:</label>
                <input
                  type="text"
                  value={form.images}
                  onChange={(e) => setForm({ ...form, images: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">تفاصيل ومواصفات الحساب للعميل:</label>
                <textarea
                  value={form.accountDetails}
                  onChange={(e) => setForm({ ...form, accountDetails: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>بيانات الدخول السرية (تظهر للمشتري فقط بعد إتمام الدفع):</span>
                </label>
                <textarea
                  value={form.credentials}
                  onChange={(e) => setForm({ ...form, credentials: e.target.value })}
                  rows={2}
                  placeholder="اسم المستخدم، كلمة المرور، أكواد الأمان، أو طريقة نقل الإيميل"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-amber-500/30 text-amber-200 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                onClick={handleSaveAccount}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black shadow-md transition-transform active:scale-95"
              >
                {editingAccount ? 'حفظ التعديلات' : 'نشر الحساب في المتجر'}
              </button>
              <button
                onClick={() => setShowModal(false)}
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
