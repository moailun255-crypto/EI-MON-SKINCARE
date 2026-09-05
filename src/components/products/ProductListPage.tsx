import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory } from '../../types';
import { formatMMK } from '../../utils/format';
import { CATEGORY_LABELS } from '../../utils/translations';
import {
  Boxes,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react';

export const ProductListPage: React.FC = () => {
  const {
    products,
    deleteProduct,
    adjustStock,
    setActiveTab,
    setSelectedProductForEdit,
    useMyanmarDigits,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const handleEdit = (product: Product) => {
    setSelectedProductForEdit(product);
    setActiveTab('add-product');
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setConfirmDeleteId(null);
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

      {/* Products Table (Desktop) / Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Table View on md+ screens */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 tracking-wider">
                <th className="py-3 px-4">ပစ္စည်းအမည်</th>
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
                const profitMMK = p.sellingPrice - p.costPrice;
                const profitPct = Math.round((profitMMK / p.sellingPrice) * 100);
                const isLow = p.stock <= p.minStockAlert && p.stock > 0;
                const isOut = p.stock <= 0;

                return (
                  <tr key={p.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4">
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
                          onClick={() => adjustStock(p.id, -1)}
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
                          onClick={() => adjustStock(p.id, 1)}
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
          {filteredProducts.map((p) => {
            const isLow = p.stock <= p.minStockAlert && p.stock > 0;
            const isOut = p.stock <= 0;
            return (
              <div key={p.id} className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
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
                      onClick={() => adjustStock(p.id, -1)}
                      className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-xs w-6 text-center">{p.stock}</span>
                    <button
                      onClick={() => adjustStock(p.id, 1)}
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
      </div>

      {/* Confirmation modal for delete */}
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
                ဤပစ္စည်းကို စာရင်းမှ လုံးဝဖျက်ပစ်ပါမည်။
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
    </div>
  );
};
