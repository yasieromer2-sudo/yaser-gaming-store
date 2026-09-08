import React, { useState, useEffect } from 'react';
import { Game } from '../../../types';
import { api } from '../../../lib/api';
import { useStore } from '../../../context/StoreContext';
import {
  Gamepad2,
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Package,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { AdminTab } from '../AdminSidebar';

interface GamesTabProps {
  onNavigateTab?: (tab: AdminTab) => void;
}

export const GamesTab: React.FC<GamesTabProps> = ({ onNavigateTab }) => {
  const { showToast, refreshData } = useStore();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  const [form, setForm] = useState({
    name: '',
    category: 'Battle Royale',
    icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      const data = await api.getGames();
      setGames(data);
    } catch (err: any) {
      showToast('خطأ', 'فشل في تحميل قائمة الألعاب', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGame = async () => {
    if (!form.name.trim()) {
      showToast('تنبيه', 'يرجى كتابة اسم اللعبة', 'warning');
      return;
    }

    try {
      if (editingGame) {
        await api.updateGame(editingGame.id, {
          ...editingGame,
          ...form,
        });
        showToast('تم التحديث', `تم تحديث بيانات لعبة ${form.name} بنجاح`, 'success');
      } else {
        await api.createGame({
          ...form,
          packages: [],
        });
        showToast('تمت الإضافة', `تمت إضافة لعبة ${form.name} إلى المتجر`, 'success');
      }

      setShowModal(false);
      setEditingGame(null);
      resetForm();
      await loadGames();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const handleDeleteGame = async (game: Game) => {
    if (!confirm(`هل أنت متأكد من حذف لعبة "${game.name}" وجميع باقاتها المرتبطة؟`)) return;
    try {
      await api.deleteGame(game.id);
      showToast('تم الحذف', `تم حذف لعبة ${game.name}`, 'info');
      await loadGames();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const handleToggleActive = async (game: Game) => {
    const updated = !game.isActive;
    try {
      await api.updateGame(game.id, { ...game, isActive: updated });
      showToast(
        'تم التعديل',
        `لعبة ${game.name} الآن ${updated ? 'مرئية ومتاحة للشحن' : 'مخفية مؤقتاً'}`,
        'success'
      );
      await loadGames();
      await refreshData();
    } catch (err: any) {
      showToast('خطأ', err.message, 'error');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      category: 'Battle Royale',
      icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      description: '',
      isActive: true,
    });
  };

  const openEdit = (game: Game) => {
    setEditingGame(game);
    setForm({
      name: game.name,
      category: game.category,
      icon: game.icon,
      banner: game.banner,
      description: game.description || '',
      isActive: game.isActive,
    });
    setShowModal(true);
  };

  const filteredGames = games.filter((g) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-pink-950/40 via-[#131722] to-slate-900 border border-pink-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">إدارة كتالوج الألعاب</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                إضافة ألعاب جديدة وتعديل الأيقونات والبنرات وتحديد الألعاب المعروضة في المتجر
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              setEditingGame(null);
              setShowModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            إضافة لعبة جديدة
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-[#131722] border border-white/10">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم اللعبة أو التصنيف..."
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
          />
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGames.map((game) => {
          const pkgCount = game.packages ? game.packages.length : 0;
          return (
            <div
              key={game.id}
              className="rounded-3xl bg-[#131722] border border-white/10 overflow-hidden hover:border-white/20 transition-all flex flex-col justify-between shadow-lg"
            >
              {/* Banner */}
              <div className="relative h-32 w-full overflow-hidden bg-black/60">
                <img
                  src={game.banner}
                  alt={game.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131722] via-transparent to-transparent" />

                {/* Status Toggle */}
                <button
                  onClick={() => handleToggleActive(game)}
                  className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border transition-colors ${
                    game.isActive
                      ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                      : 'bg-red-500/30 text-red-300 border-red-500/40'
                  }`}
                >
                  {game.isActive ? 'مفعلة بالمتجر' : 'مخفية'}
                </button>
              </div>

              {/* Game Info */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={game.icon}
                    alt={game.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-white/10 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-black text-sm text-white">{game.name}</h3>
                    <span className="text-[11px] text-pink-400 font-bold block mt-0.5">
                      {game.category}
                    </span>
                  </div>
                </div>

                {game.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {game.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Package className="w-3.5 h-3.5 text-pink-400" />
                    <span>{pkgCount} باقات شحن معرفة</span>
                  </div>

                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('packages')}
                      className="text-pink-400 hover:underline text-[11px] font-bold"
                    >
                      إدارة الباقات ←
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => openEdit(game)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => handleDeleteGame(game)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors"
                    title="حذف اللعبة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Game Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#131722] border border-white/15 p-6 space-y-4 shadow-2xl text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white">
                {editingGame ? 'تعديل بيانات اللعبة' : 'إضافة لعبة جديدة'}
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
                <label className="font-bold text-white">اسم اللعبة:</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: Free Fire، PUBG Mobile"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">التصنيف (Category):</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Battle Royale، Action، RPG"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">رابط الأيقونة (Icon URL):</label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">رابط البنر (Banner URL):</label>
                <input
                  type="text"
                  value={form.banner}
                  onChange={(e) => setForm({ ...form, banner: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white">وصف مختصر:</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                onClick={handleSaveGame}
                className="flex-1 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black shadow-md transition-transform active:scale-95"
              >
                {editingGame ? 'حفظ التعديلات' : 'إضافة اللعبة'}
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
