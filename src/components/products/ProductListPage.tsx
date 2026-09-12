import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory } from '../../types';
import { formatMMK } from '../../utils/format';
import { CATEGORY_LABELS } from '../../utils/translations';
import { ClearAllProductsModal } from './ClearAllProductsModal';
import {
  Boxes,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Plus,
  Minus,
  CheckSquare,
  Square,
  AlertTriangle,
  Sparkles,
  Check,
  X,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';

export const ProductListPage: React.FC = () => {
  const {
    products,
    deleteProduct,
    deleteMultipleProducts,
    adjustStock,
    setActiveTab,
    setSelectedProductForEdit,
    useMyanmarDigits,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const [stockNotice, setStockNotice] = useState<{ type: 'success' | 'warn'; text: string } | null>(null);

  const handleAdjustStockWithFeedback = (product: Product, delta: number) => {
    if (delta < 0 && product.stock <= 0) {
      setStockNotice({
        type: 'warn',
        text: `[${product.nameMy}] လက်ကျန် (0) ဖြစ်နေသဖြင့် ထပ်မံလျှော့၍မရပါ (Stock already zero)`,
      });
      setTimeout(() => setStockNotice(null), 3000);
      return;
    }

    adjustStock(product.id, delta);
    const newStock = Math.max(0, product.stock + delta);
    setStockNotice({
      type: 'success',
      text: `[${product.nameMy}] လက်ကျန် (${product.stock} ➔ ${newStock}) သို့ ပြင်ဆင်ပြီးပါပြီ`,
    });
    setTimeout(() => setStockNotice(null), 2500);
  };

  // Filtered product list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchTerm === '' ||
        p.nameMy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm);

      const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;

      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && p.stock <= p.minStockAlert && p.stock > 0) ||
        (stockFilter === 'out' && p.stock <= 0);

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  // Inventory analytics
  const totalStockCount = products.reduce((sum, p) => sum + p.stock, 0);
  const totalInventoryCost = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

  // Batch selection helpers
  const isAllSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.includes(p.id));

  const isSomeSelected =
    filteredProducts.some((p) => selectedIds.includes(p.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Remove all filtered products from selection
      const filteredIdSet = new Set(filteredProducts.map((p) => p.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      // Add all filtered products to selection
      const allFilteredIds = filteredProducts.map((p) => p.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleEdit = (product: Product) => {
    setSelectedProductForEdit(product);
    setActiveTab('add-product');
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    setConfirmDeleteId(null);
    setDeleteNotice('ကုန်ပစ္စည်းကို စနစ်နှင့် Cloud မှ အပြီးအပိုင် ဖျက်ပစ်ပြီးပါပြီ (Deleted)');
    setTimeout(() => setDeleteNotice(null), 3500);
  };

  const handleBatchDelete = () => {
    const count = selectedIds.length;
    deleteMultipleProducts(selectedIds);
    setSelectedIds([]);
    setIsBatchDeleteModalOpen(false);
    setDeleteNotice(`ကုန်ပစ္စည်း ${count} ခုကို စနစ်နှင့် Cloud မှ အောင်မြင်စွာ ဖျက်ပစ်ပြီးပါပြီ`);
    setTimeout(() => setDeleteNotice(null), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600" />
            <span>ကုန်ပစ္စည်း စီမံခန့်ခွဲမှုစနစ်</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            EI MON SKINCARE • အလှကုန်ပစ္စည်းစာရင်း၊ ဝယ်ရင်း/ရောင်းစျေး နှင့် ပစ္စည်းလက်ကျန် စီမံခန့်ခွဲရန်
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {products.length > 0 && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
              title="ကုန်ပစ္စည်းအားလုံး ရှင်းလင်းမည် (Clear All Products)"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>ကုန်ပစ္စည်းအားလုံး ရှင်းလင်းမည်</span>
            </button>
          )}

          <button
            onClick={() => {
              setSelectedProductForEdit(null);
              setActiveTab('add-product');
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ကုန်ပစ္စည်းအသစ် ထည့်သွင်းမည်</span>
          </button>
        </div>
      </div>

      {/* Delete Feedback Banner */}
      {deleteNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-3 px-4 flex items-center justify-between gap-2 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs font-bold">{deleteNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stock Adjustment Feedback Banner */}
      {stockNotice && (
        <div
          className={`rounded-2xl p-3 px-4 flex items-center justify-between gap-2 shadow-xs animate-fadeIn ${
            stockNotice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {stockNotice.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <p className="text-xs font-bold">{stockNotice.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setStockNotice(null)}
            className="p-1 cursor-pointer opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-stone-500 text-[11px] font-semibold">
            ပစ္စည်းအမျိုးအစား စုစုပေါင်း
          </p>
          <p className="text-lg sm:text-2xl font-black text-stone-900 mt-1">
            {products.length}{' '}
            <span className="text-xs font-medium text-stone-400">
              မျိုး
            </span>
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-stone-500 text-[11px] font-semibold">
            လက်ကျန်ပစ္စည်း အခုရေစုစုပေါင်း
          </p>
          <p className="text-lg sm:text-2xl font-black text-stone-900 mt-1">
            {totalStockCount}{' '}
            <span className="text-xs font-medium text-stone-400">
              ခု
            </span>
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-stone-500 text-[11px] font-semibold">
            ကုန်ပစ္စည်း ဝယ်ရင်းတန်ဖိုး
          </p>
          <p className="text-base sm:text-xl font-black text-stone-800 mt-1">
            {formatMMK(totalInventoryCost, useMyanmarDigits)}
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-stone-500 text-[11px] font-semibold">
            လက်ကျန် သတိပေးချက်
          </p>
          <p
            className={`text-lg sm:text-2xl font-black mt-1 ${
              lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {lowStockCount}{' '}
            <span className="text-xs font-medium text-stone-400">
              ခု
            </span>
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ပစ္စည်းအမည် သို့မဟုတ် ဘားကုဒ် ရှာဖွေပါ..."
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ProductCategory)}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
          >
            <option value="all">အမျိုးအစားအားလုံး</option>
            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
              <option key={cat} value={cat}>
                {label.my}
              </option>
            ))}
          </select>

          {/* Stock status filter */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                stockFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              အားလုံး
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                stockFilter === 'low'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              လက်ကျန်နည်း
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                stockFilter === 'out'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              ပစ္စည်းပြတ်
            </button>
          </div>
        </div>
      </div>

      {/* Batch Action Bar (Appears when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-3 px-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-black flex items-center justify-center text-xs shadow-2xs">
              {selectedIds.length}
            </span>
            <div>
              <p className="text-xs font-black text-rose-950">
                ရွေးချယ်ထားသော ကုန်ပစ္စည်း {selectedIds.length} ခု
              </p>
              <p className="text-[10px] text-rose-700">
                ({selectedIds.length} items selected for batch delete)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-100/70 text-xs font-bold transition-colors cursor-pointer"
            >
              ရွေးချယ်မှု ပယ်ဖျက်မည်
            </button>
            <button
              onClick={() => setIsBatchDeleteModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ရွေးထားသည်များ ဖျက်မည် ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Products Table (Desktop) / Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="p-10 sm:p-14 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
              <Boxes className="w-8 h-8" />
            </div>

            {products.length === 0 ? (
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="font-bold text-stone-900 text-base sm:text-lg">
                  ကုန်ပစ္စည်းစာရင်း မရှိသေးပါ
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  ဆိုင်တွင် ကုန်ပစ္စည်းစာရင်း မရှိသေးပါ။ သင့်ဆိုင်၏ အလှကုန်ပစ္စည်းများကို စတင်ထည့်သွင်းနိုင်ပါပြီ။
                </p>
                <div className="pt-3 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedProductForEdit(null);
                      setActiveTab('add-product');
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>ကုန်ပစ္စည်းအသစ် ထည့်မည်</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-bold text-stone-900 text-base">
                  ရှာဖွေမှုနှင့် ကိုက်ညီသော ကုန်ပစ္စည်း မရှိပါ
                </h3>
                <p className="text-xs text-stone-500">
                  စာလုံးပေါင်း သို့မဟုတ် စစ်ထုတ်မှု ရွေးချယ်ချက်များကို စစ်ဆေးပေးပါ
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setStockFilter('all');
                  }}
                  className="mt-3 px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-bold cursor-pointer"
                >
                  ရှာဖွေမှု အားလုံး ရှင်းလင်းမည်
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Table View on md+ screens */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 tracking-wider">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeSelected;
                        }}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-stone-300 cursor-pointer"
                        title="အားလုံး ရွေးမည် (Select All)"
                      />
                    </th>
                    <th className="py-3 px-3">ပစ္စည်းအမည်</th>
                    <th className="py-3 px-3">အမျိုးအစား</th>
                    <th className="py-3 px-3">ဘားကုဒ်</th>
                    <th className="py-3 px-3 text-right">ဝယ်ရင်းစျေး</th>
                    <th className="py-3 px-3 text-right">ရောင်းစျေး</th>
                    <th className="py-3 px-3 text-right">အမြတ်ငွေ</th>
                    <th className="py-3 px-3 text-center">လက်ကျန်</th>
                    <th className="py-3 px-4 text-right">လုပ်ဆောင်ချက်</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {filteredProducts.map((p) => {
                    const isSelected = selectedIds.includes(p.id);
                    const profitMMK = p.sellingPrice - p.costPrice;
                    const profitPct = Math.round((profitMMK / p.sellingPrice) * 100);
                    const isLow = p.stock <= p.minStockAlert && p.stock > 0;
                    const isOut = p.stock <= 0;

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-rose-50/50' : 'hover:bg-rose-50/20'
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(p.id)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-stone-300 cursor-pointer"
                          />
                        </td>

                        <td className="py-3 px-3">
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 truncate max-w-sm">
                              {p.nameMy}
                            </p>
                            <p className="text-[10px] text-stone-500 truncate mt-0.5">
                              {p.volume}
                            </p>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[11px]">
                            {CATEGORY_LABELS[p.category]?.my || p.category}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-stone-700 font-bold">
                          {p.barcode}
                        </td>

                        <td className="py-3 px-3 text-right font-semibold text-stone-600">
                          {formatMMK(p.costPrice, useMyanmarDigits)}
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-rose-700">
                          {formatMMK(p.sellingPrice, useMyanmarDigits)}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <span className="font-bold text-emerald-700">
                            +{formatMMK(profitMMK, useMyanmarDigits)}
                          </span>
                          <span className="text-[10px] text-emerald-600 block">
                            ({profitPct}%)
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleAdjustStockWithFeedback(p, -1)}
                              className="w-5 h-5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs cursor-pointer"
                              title="-1"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span
                              className={`font-black px-2 py-0.5 rounded text-xs min-w-[32px] ${
                                isOut
                                  ? 'bg-red-100 text-red-700'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.stock}
                            </span>
                            <button
                              onClick={() => handleAdjustStockWithFeedback(p, 1)}
                              className="w-5 h-5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs cursor-pointer"
                              title="+1"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          {isLow && (
                            <span className="text-[9px] font-bold text-amber-600 block mt-0.5">
                              သတိပေး: {p.minStockAlert}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEdit(p)}
                              className="p-1.5 rounded-lg text-stone-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ပြင်ဆင်မည်"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(p.id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="ဖျက်မည်"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Card View on Mobile (sm/xs) */}
            <div className="md:hidden divide-y divide-stone-100">
              {/* Mobile Select All Bar */}
              <div className="p-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-stone-300"
                  />
                  <span>အားလုံး ရွေးမည် (Select All)</span>
                </label>
                <span className="text-[11px] text-stone-400">
                  {filteredProducts.length} မျိုး
                </span>
              </div>

              {filteredProducts.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                const isLow = p.stock <= p.minStockAlert && p.stock > 0;
                const isOut = p.stock <= 0;
                return (
                  <div
                    key={p.id}
                    className={`p-3.5 space-y-2 transition-colors ${
                      isSelected ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(p.id)}
                        className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500 border-stone-300 cursor-pointer shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                            {CATEGORY_LABELS[p.category]?.my || p.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isOut
                                ? 'bg-red-100 text-red-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            လက်ကျန်: {p.stock}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-stone-900 mt-1 line-clamp-1">
                          {p.nameMy}
                        </h4>
                        <p className="text-[10px] text-stone-400">
                          ဘားကုဒ်: {p.barcode} • {p.volume}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-50 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 block">ရောင်းစျေး</span>
                        <span className="font-extrabold text-rose-700">
                          {formatMMK(p.sellingPrice, useMyanmarDigits)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAdjustStockWithFeedback(p, -1)}
                          className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-xs w-6 text-center">{p.stock}</span>
                        <button
                          onClick={() => handleAdjustStockWithFeedback(p, 1)}
                          className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleEdit(p)}
                          className="p-1.5 ml-2 rounded-lg bg-stone-100 text-stone-700 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Confirmation modal for single delete */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                ကုန်ပစ္စည်းကို ဖျက်မည်မှာ သေချာပါသလား?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                ဤပစ္စည်းကို ဒေတာဘေ့စ်နှင့် စာရင်းမှ လုံးဝဖျက်ပစ်ပါမည်။
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                မဖျက်တော့ပါ
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                ဟုတ်ကဲ့ ဖျက်မည်
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal for batch delete */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                ရွေးချယ်ထားသော ကုန်ပစ္စည်း {selectedIds.length} ခု ဖျက်မည်
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                ရွေးချယ်ထားသော ပစ္စည်း {selectedIds.length} မျိုးလုံးကို စာရင်းမှ လုံးဝဖျက်ပစ်မည်မှာ သေချာပါသလား?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                မဖျက်တော့ပါ
              </button>
              <button
                onClick={handleBatchDelete}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                ဖျက်မည် ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Products Modal */}
      {isClearAllModalOpen && (
        <ClearAllProductsModal
          onClose={() => setIsClearAllModalOpen(false)}
          onSuccess={() => setSelectedIds([])}
        />
      )}
    </div>
  );
};

