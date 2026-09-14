import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  X,
  Plus,
  Trash2,
  FolderPlus,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { CategoryItem } from '../../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (categoryId: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
}) => {
  const { categories, addCategory, deleteCategory, resetCategoriesToDefault, products } = useStore();
  const [newCatName, setNewCatName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.nameMy.toLowerCase().includes(q) ||
        (c.group && c.group.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // Map each category ID to product count
  const productCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  }, [products]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCatName.trim();
    if (!clean) return;
    const newId = addCategory(clean);
    setNewCatName('');
    showToast(`အမျိုးအစားသစ် "${clean}" ကို အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ`);
    if (onSelectCategory) {
      onSelectCategory(newId);
    }
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    const name = categoryToDelete.nameMy;
    deleteCategory(categoryToDelete.id);
    setCategoryToDelete(null);
    showToast(`"${name}" အမျိုးအစားကို ဖျက်ပစ်ပြီးပါပြီ`);
  };

  const handleResetDefaults = () => {
    if (window.confirm('မူလသတ်မှတ်ထားသော အမျိုးအစားများ အားလုံးကို ပြန်လည်ထားရှိရန် သေချာပါသလား?')) {
      resetCategoriesToDefault();
      showToast('မူလ အမျိုးအစားများကို ပြန်လည်သတ်မှတ်ပြီးပါပြီ');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
                အမျိုးအစားများ စီမံခန့်ခွဲခြင်းနှင့် ဖျက်ခြင်း
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                မလိုအပ်သော အမျိုးအစားများကို ဖျက်နိုင်ပြီး၊ အသစ်များ ထည့်သွင်းနိုင်ပါသည်
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Quick Add Form */}
        <div className="p-4 bg-white border-b border-stone-100">
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="အမျိုးအစား အမည်သစ် ထည့်ပါ (ဥပမာ - မျက်နှာသစ်ဂျယ်လ်)..."
              className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50"
            />
            <button
              type="submit"
              disabled={!newCatName.trim()}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-stone-200 disabled:text-stone-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>အသစ်ထည့်မည်</span>
            </button>
          </form>

          {/* Search bar inside list */}
          <div className="relative mt-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="အမျိုးအစား စာရင်းထဲတွင် ရှာရန်..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50/30 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-stone-100">
          {filteredCategories.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs">
              ရှာဖွေတွေ့ရှိသော အမျိုးအစား မရှိပါ
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const count = productCountMap[cat.id] || 0;
              return (
                <div
                  key={cat.id}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-2 group hover:bg-stone-50/80 px-2.5 py-2 rounded-xl transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-stone-800 truncate">
                        {cat.nameMy}
                      </span>
                      {count > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold shrink-0">
                          {count} ခု ရှိသည်
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-400 text-[10px] font-medium shrink-0">
                          အသုံးမပြုပါ
                        </span>
                      )}
                    </div>
                    {cat.group && (
                      <p className="text-[11px] text-stone-400 mt-0.5 truncate">
                        အုပ်စု - {cat.group}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onSelectCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium cursor-pointer transition-colors"
                      >
                        ရွေးချယ်မည်
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(cat)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="ဤအမျိုးအစားကို ဖျက်ပစ်မည်"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {categoryToDelete && (
          <div className="p-4 bg-rose-50 border-t border-rose-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-rose-900">
                  "{categoryToDelete.nameMy}" အမျိုးအစားကို ဖျက်ရန် သေချာပါသလား?
                </h4>
                {(productCountMap[categoryToDelete.id] || 0) > 0 && (
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    သတိပြုရန် - လက်ရှိ ဤအမျိုးအစားတွင် ကုန်ပစ္စည်း{' '}
                    <span className="font-black">
                      {productCountMap[categoryToDelete.id]}
                    </span>{' '}
                    ခု ရှိနေပါသည်။ ဖျက်လိုက်ပါက ထိုပစ္စည်းများသည် အထွေထွေ/အခြား သို့ ပြောင်းလဲသွားပါမည်။
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                  >
                    သေချာပါသည်၊ ဖျက်မည်
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(null)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                  >
                    မဖျက်တော့ပါ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-stone-100 bg-stone-50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-[11px] font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>မူလအမျိုးအစားများ အားလုံး ပြန်ထားမည်</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">
              စုစုပေါင်း ({categories.length}) မျိုး
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              ပိတ်မည်
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
