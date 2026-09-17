import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory, CategoryItem } from '../../types';
import { formatMMK } from '../../utils/format';
import { CATEGORY_LABELS } from '../../utils/translations';
import { ClearAllProductsModal } from './ClearAllProductsModal';
import { CameraScannerModal } from '../pos/CameraScannerModal';
import { CategoryManagerModal } from './CategoryManagerModal';
import { playBarcodeBeep } from '../../utils/scannerSound';
import { normalizeBarcode, isBarcodeMatch } from '../../utils/barcodeValidator';
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
  Camera,
  Barcode,
  FolderPlus,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
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
    categories,
    verifyDeletePassword,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory>('all');
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Group active categories dynamically by group name
  const groupedCategories = useMemo(() => {
    const groups: Record<string, CategoryItem[]> = {};
    categories.forEach((cat) => {
      const grp = cat.group || 'အခြား';
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push(cat);
    });
    return groups;
  }, [categories]);

  const getCategoryName = useCallback(
    (catId: string) => {
      const found = categories.find((c) => c.id === catId);
      if (found) return found.nameMy;
      return CATEGORY_LABELS[catId]?.my || catId;
    },
    [categories]
  );
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [batchPassword, setBatchPassword] = useState('');
  const [showBatchPassword, setShowBatchPassword] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [isBatchConfirmed, setIsBatchConfirmed] = useState(false);
  const [isBatchShake, setIsBatchShake] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const [stockNotice, setStockNotice] = useState<{ type: 'success' | 'warn'; text: string } | null>(null);

  // Barcode search executor (Camera & Barcode Gun)
  const handleBarcodeSearch = useCallback(
    (code: string) => {
      const clean = normalizeBarcode(code);
      if (!clean) return;

      setIsCameraScannerOpen(false);
      setSearchTerm(clean);

      const matched = products.find((p) => {
        return isBarcodeMatch(p.barcode, clean) || isBarcodeMatch(p.sku, clean);
      });

      if (matched) {
        playBarcodeBeep('success');
        setCategoryFilter('all');
        setStockFilter('all');
        setStockNotice({
          type: 'success',
          text: `🔍 ဘားကုဒ် [${clean}] ဖြင့် '${matched.nameMy}' ကို ရှာဖွေတွေ့ရှိပြီး စာရင်းတွင် ရွေးချယ်ပြသထားပါသည်`,
        });
      } else {
        playBarcodeBeep('warning');
        setStockNotice({
          type: 'warn',
          text: `⚠️ ဘားကုဒ် [${clean}] နှင့် ကိုက်ညီသော ကုန်ပစ္စည်း စာရင်းထဲ မတွေ့ရှိပါ (Barcode Not Found)`,
        });
      }
    },
    [products]
  );

  // Physical Barcode Scanner listener (USB / Bluetooth barcode gun)
  const barcodeBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const buffer = normalizeBarcode(barcodeBufferRef.current);
        barcodeBufferRef.current = '';
        if (buffer.length >= 3) {
          e.preventDefault();
          handleBarcodeSearch(buffer);
        }
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (diff > 150) {
          barcodeBufferRef.current = '';
        }
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBarcodeSearch]);

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
      const searchClean = searchTerm.trim().toLowerCase();
      const searchCleanNoZero = searchClean.replace(/^0+/, '');
      const pBarcode = (p.barcode || '').trim().toLowerCase();
      const pBarcodeNoZero = pBarcode.replace(/^0+/, '');
      const pSku = (p.sku || '').trim().toLowerCase();

      const searchNormalized = normalizeBarcode(searchTerm).toLowerCase();

      const matchesSearch =
        searchClean === '' ||
        p.nameMy.toLowerCase().includes(searchClean) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(searchClean)) ||
        pSku.includes(searchClean) ||
        pBarcode.includes(searchClean) ||
        (searchCleanNoZero.length >= 3 && pBarcodeNoZero.includes(searchCleanNoZero)) ||
        isBarcodeMatch(p.barcode, searchNormalized) ||
        isBarcodeMatch(p.sku, searchNormalized);

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

  const handleOpenBatchDeleteModal = () => {
    setBatchPassword('');
    setShowBatchPassword(false);
    setBatchError(null);
    setIsBatchConfirmed(false);
    setIsBatchShake(false);
    setIsBatchDeleteModalOpen(true);
  };

  const handleBatchDelete = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBatchError(null);

    if (!isBatchConfirmed) {
      setBatchError('ကျေးဇူးပြု၍ ဆက်လက်လုပ်ဆောင်ရန် အတည်ပြုချက် အမှန်ခြစ် ပေးပါ');
      setIsBatchShake(true);
      setTimeout(() => setIsBatchShake(false), 500);
      return;
    }

    if (!batchPassword.trim()) {
      setBatchError('ကျေးဇူးပြု၍ စီမံခန့်ခွဲသူ လျှို့ဝှက်စကားဝှက် ရိုက်ထည့်ပါ');
      setIsBatchShake(true);
      setTimeout(() => setIsBatchShake(false), 500);
      return;
    }

    if (!verifyDeletePassword(batchPassword.trim())) {
      setBatchError('လုံခြုံရေး လျှို့ဝှက်စကားဝှက် မှားယွင်းနေပါသည် (Password incorrect)');
      setIsBatchShake(true);
      setTimeout(() => setIsBatchShake(false), 500);
      return;
    }

    const count = selectedIds.length;
    deleteMultipleProducts(selectedIds);
    setSelectedIds([]);
    setIsBatchDeleteModalOpen(false);
    setBatchPassword('');
    setIsBatchConfirmed(false);
    setBatchError(null);
    setDeleteNotice(`ကုန်ပစ္စည်း ${count} ခုကို စနစ်နှင့် Cloud မှ အောင်မြင်စွာ ဖျက်ပစ်ပြီးပါပြီ`);
    setTimeout(() => setDeleteNotice(null), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-5 py-2.5 sm:py-3.5 space-y-2.5 sm:space-y-3">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-sm sm:text-base font-black text-stone-900 tracking-tight flex items-center gap-1.5">
            <Boxes className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
            <span>ကုန်ပစ္စည်း စီမံခန့်ခွဲမှုစနစ်</span>
          </h1>
          <p className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5">
            EI MON SKINCARE • အလှကုန်ပစ္စည်းစာရင်း၊ စျေးနှုန်း နှင့် လက်ကျန် စီမံခန့်ခွဲရန်
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {products.length > 0 && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="ကုန်ပစ္စည်းအားလုံး ရှင်းလင်းမည် (Clear All Products)"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>အားလုံး ရှင်းမည်</span>
            </button>
          )}

          <button
            onClick={() => {
              setSelectedProductForEdit(null);
              setActiveTab('add-product');
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>ပစ္စည်းအသစ် ထည့်မည်</span>
          </button>
        </div>
      </div>

      {/* Delete Feedback Banner */}
      {deleteNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-2.5 px-3 flex items-center justify-between gap-2 shadow-2xs animate-fadeIn text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="font-bold">{deleteNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stock Adjustment Feedback Banner */}
      {stockNotice && (
        <div
          className={`rounded-xl p-2.5 px-3 flex items-center justify-between gap-2 shadow-2xs animate-fadeIn text-xs ${
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
            <p className="font-bold">{stockNotice.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setStockNotice(null)}
            className="p-1 cursor-pointer opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards - Compact native app strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2.5">
        <div className="bg-white p-2.5 rounded-xl border border-stone-200/90 shadow-2xs">
          <p className="text-stone-500 text-[10px] font-semibold leading-tight">
            အမျိုးအစား စုစုပေါင်း
          </p>
          <p className="text-sm sm:text-base font-black text-stone-900 mt-0.5 leading-tight">
            {products.length}{' '}
            <span className="text-[10px] font-medium text-stone-400">
              မျိုး
            </span>
          </p>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-stone-200/90 shadow-2xs">
          <p className="text-stone-500 text-[10px] font-semibold leading-tight">
            လက်ကျန် အခုရေ
          </p>
          <p className="text-sm sm:text-base font-black text-stone-900 mt-0.5 leading-tight">
            {totalStockCount}{' '}
            <span className="text-[10px] font-medium text-stone-400">
              ခု
            </span>
          </p>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-stone-200/90 shadow-2xs">
          <p className="text-stone-500 text-[10px] font-semibold leading-tight">
            ဝယ်ရင်းတန်ဖိုး
          </p>
          <p className="text-xs sm:text-sm font-black text-stone-800 mt-0.5 leading-tight truncate">
            {formatMMK(totalInventoryCost, useMyanmarDigits)}
          </p>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-stone-200/90 shadow-2xs">
          <p className="text-stone-500 text-[10px] font-semibold leading-tight">
            လက်ကျန် သတိပေးချက်
          </p>
          <p
            className={`text-sm sm:text-base font-black mt-0.5 leading-tight ${
              lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {lowStockCount}{' '}
            <span className="text-[10px] font-medium text-stone-400">
              ခု
            </span>
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-stone-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
        <div className="flex flex-col sm:flex-row items-stretch gap-1.5 flex-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  handleBarcodeSearch(searchTerm);
                }
              }}
              placeholder="ပစ္စည်းအမည်၊ SKU သို့မဟုတ် ဘားကုဒ် ရှာဖွေပါ..."
              className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-stone-50/50 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                title="ရှာဖွေမှု ရှင်းလင်းမည်"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
            title="ဘားကုဒ် ကင်မရာဖြင့် စကင်ဖတ် ရှာဖွေမည် (Scan Barcode to Find Product)"
          >
            <Camera className="w-3.5 h-3.5" />
            <Barcode className="w-3.5 h-3.5" />
            <span>ဘားကုဒ် စကင်ဖတ်မည်</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Category dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={categoryFilter}
              onChange={(e) => {
                if (e.target.value === '__manage__') {
                  setShowCategoryManager(true);
                } else {
                  setCategoryFilter(e.target.value as ProductCategory);
                }
              }}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
            >
              <option value="all">အမျိုးအစားအားလုံး ({products.length})</option>
              {(Object.entries(groupedCategories) as [string, CategoryItem[]][]).map(([grpName, catList]) => (
                <optgroup key={grpName} label={grpName}>
                  {catList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameMy}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="__manage__" className="text-rose-600 font-bold">
                ⚙️ အမျိုးအစား စီမံမည် / ဖျက်မည်...
              </option>
            </select>

            <button
              type="button"
              onClick={() => setShowCategoryManager(true)}
              className="p-1.5 sm:px-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="အမျိုးအစားများ စီမံခန့်ခွဲခြင်းနှင့် မလိုအပ်သည်များ ဖျက်ခြင်း"
            >
              <FolderPlus className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">စီမံမည်</span>
            </button>
          </div>

          {/* Stock status filter */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                stockFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              အားလုံး
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                stockFilter === 'low'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              လက်ကျန်နည်း
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                stockFilter === 'out'
                  ? 'bg-red-500 text-white shadow-2xs'
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
        <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-2 px-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-2xs animate-fadeIn text-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-black flex items-center justify-center text-[11px] shadow-2xs">
              {selectedIds.length}
            </span>
            <div>
              <p className="font-bold text-rose-950">
                ရွေးချယ်ထားသော ကုန်ပစ္စည်း {selectedIds.length} ခု
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-100/70 font-bold transition-colors cursor-pointer"
            >
              ပယ်ဖျက်မည်
            </button>
            <button
              onClick={handleOpenBatchDeleteModal}
              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
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
                  <tr className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                    <th className="py-2 px-2.5 w-9 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeSelected;
                        }}
                        onChange={handleToggleSelectAll}
                        className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 border-stone-300 cursor-pointer"
                        title="အားလုံး ရွေးမည် (Select All)"
                      />
                    </th>
                    <th className="py-2 px-2.5">ပစ္စည်းအမည်</th>
                    <th className="py-2 px-2.5">အမျိုးအစား</th>
                    <th className="py-2 px-2.5">ဘားကုဒ်</th>
                    <th className="hidden lg:table-cell py-2 px-2.5 text-right">ဝယ်ရင်းစျေး</th>
                    <th className="py-2 px-2.5 text-right">ရောင်းစျေး</th>
                    <th className="hidden lg:table-cell py-2 px-2.5 text-right">အမြတ်ငွေ</th>
                    <th className="py-2 px-2.5 text-center">လက်ကျန်</th>
                    <th className="py-2 px-3 text-right">လုပ်ဆောင်ချက်</th>
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
                        <td className="py-2 px-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(p.id)}
                            className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 border-stone-300 cursor-pointer"
                          />
                        </td>

                        <td className="py-2 px-2.5">
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 truncate max-w-[200px] md:max-w-xs lg:max-w-sm">
                              {p.nameMy}
                            </p>
                          </div>
                        </td>

                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[10px]">
                            {getCategoryName(p.category)}
                          </span>
                        </td>

                        <td className="py-2 px-2.5 font-mono text-[10px] text-stone-700 font-bold whitespace-nowrap">
                          {p.barcode}
                        </td>

                        <td className="hidden lg:table-cell py-2 px-2.5 text-right font-semibold text-stone-600 whitespace-nowrap">
                          {formatMMK(p.costPrice, useMyanmarDigits)}
                        </td>

                        <td className="py-2 px-2.5 text-right font-bold text-rose-700 whitespace-nowrap">
                          {formatMMK(p.sellingPrice, useMyanmarDigits)}
                        </td>

                        <td className="hidden lg:table-cell py-2 px-2.5 text-right whitespace-nowrap">
                          <span className="font-bold text-emerald-700">
                            +{formatMMK(profitMMK, useMyanmarDigits)}
                          </span>
                          <span className="text-[9px] text-emerald-600 block">
                            ({profitPct}%)
                          </span>
                        </td>

                        <td className="py-2 px-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleAdjustStockWithFeedback(p, -1)}
                              className="w-6 h-6 rounded-md bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700 flex items-center justify-center text-xs cursor-pointer app-touch-btn"
                              title="-1"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span
                              className={`font-black px-1.5 py-0.5 rounded text-xs min-w-[28px] ${
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
                              className="w-6 h-6 rounded-md bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700 flex items-center justify-center text-xs cursor-pointer app-touch-btn"
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

                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(p)}
                              className="p-1.5 rounded-lg text-stone-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer app-touch-btn"
                              title="ပြင်ဆင်မည်"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(p.id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer app-touch-btn"
                              title="ဖျက်မည်"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Card View on Mobile (sm/xs) - Compact native mobile list */}
            <div className="md:hidden divide-y divide-stone-100">
              {/* Mobile Select All Bar */}
              <div className="p-2.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 border-stone-300"
                  />
                  <span>အားလုံး ရွေးမည် (Select All)</span>
                </label>
                <span className="text-[10px] text-stone-400">
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
                    className={`p-2.5 space-y-1.5 transition-colors ${
                      isSelected ? 'bg-rose-50/40' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(p.id)}
                        className="w-3.5 h-3.5 mt-0.5 rounded text-rose-600 focus:ring-rose-500 border-stone-300 cursor-pointer shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-700">
                            {getCategoryName(p.category)}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
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

                        <h4 className="text-xs font-bold text-stone-900 mt-0.5 line-clamp-1">
                          {p.nameMy}
                        </h4>
                        <p className="text-[9px] text-stone-400">
                          ဘားကုဒ်: {p.barcode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-50 text-xs">
                      <div>
                        <span className="text-[9px] text-stone-400 block leading-tight">ရောင်းစျေး</span>
                        <span className="font-extrabold text-rose-700 text-xs">
                          {formatMMK(p.sellingPrice, useMyanmarDigits)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAdjustStockWithFeedback(p, -1)}
                          className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs w-5 text-center">{p.stock}</span>
                        <button
                          onClick={() => handleAdjustStockWithFeedback(p, 1)}
                          className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleEdit(p)}
                          className="p-1 ml-1.5 rounded-md bg-stone-100 text-stone-700 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="p-1 rounded-md bg-red-50 text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 shrink-0 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h3 className="font-bold text-stone-900 text-base">
                  ရွေးချယ်ထားသော ကုန်ပစ္စည်း {selectedIds.length} ခု ဖျက်မည်
                </h3>
                <p className="text-xs text-red-600 font-medium">
                  {selectedIds.length === products.length
                    ? 'သတိပြုရန်: ကုန်ပစ္စည်းစာရင်း အားလုံး ဖြစ်ပါသည်'
                    : 'အစုလိုက် ဖျက်သိမ်းခြင်း (Batch Delete)'}
                </p>
              </div>
            </div>

            {/* Warning description */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex gap-2.5 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-left leading-relaxed text-[11px]">
                ရွေးချယ်ထားသော ပစ္စည်း {selectedIds.length} မျိုးလုံးကို စာရင်းနှင့် Cloud Database မှ လုံးဝဖျက်ပစ်မည်ဖြစ်ပြီး <strong>ပြန်လည်ရယူ၍ မရနိုင်ပါ</strong>။
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleBatchDelete} className="space-y-3.5">
              {/* Secondary Confirmation Checkbox */}
              <div
                onClick={() => {
                  setIsBatchConfirmed(!isBatchConfirmed);
                  setBatchError(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                  isBatchConfirmed
                    ? 'bg-red-50/80 border-red-300 ring-1 ring-red-200'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
                }`}
              >
                <div className="mt-0.5 shrink-0 text-red-600">
                  {isBatchConfirmed ? (
                    <CheckSquare className="w-4 h-4 fill-red-100" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">
                    (ဒုတိယအဆင့် အတည်ပြုချက်) ရွေးချယ်ထားသော ကုန်ပစ္စည်း {selectedIds.length} ခုလုံး အပြီးတိုင် ဖျက်ပစ်မည်ကို အတည်ပြုပါသည်
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    မှားယွင်းဖျက်မိခြင်းမှ ကာကွယ်ရန် ဤအကွက်ကို အမှန်ခြစ်ပေးပါ
                  </p>
                </div>
              </div>

              {/* Manager Password Field */}
              <div className="space-y-1 text-left">
                <label className="block text-xs font-bold text-stone-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-red-600" />
                    <span>စီမံခန့်ခွဲသူ လျှို့ဝှက်စကားဝှက်</span>
                  </span>
                  <span className="text-[10px] font-medium text-stone-400">
                    မူလစကားဝှက်: 123456
                  </span>
                </label>
                <div className={`relative transition-transform ${isBatchShake ? 'animate-bounce' : ''}`}>
                  <input
                    type={showBatchPassword ? 'text' : 'password'}
                    value={batchPassword}
                    onChange={(e) => {
                      setBatchPassword(e.target.value);
                      setBatchError(null);
                    }}
                    placeholder="စကားဝှက် ရိုက်ထည့်ပါ..."
                    className={`w-full text-xs px-3.5 py-2.5 pr-9 rounded-xl border font-mono outline-hidden transition-all ${
                      batchError
                        ? 'border-red-500 bg-red-50/40 text-red-900'
                        : 'border-stone-300 focus:border-red-500 focus:ring-1 focus:ring-red-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowBatchPassword(!showBatchPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showBatchPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {batchError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-xl border border-red-200 flex items-center gap-1.5 text-left animate-fadeIn">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>{batchError}</span>
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBatchDeleteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  မဖျက်တော့ပါ
                </button>
                <button
                  type="submit"
                  disabled={!isBatchConfirmed || !batchPassword.trim()}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                    isBatchConfirmed && batchPassword.trim()
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ဖျက်မည် ({selectedIds.length})</span>
                </button>
              </div>
            </form>
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

      {/* Camera Barcode Scanner Modal for searching products */}
      {isCameraScannerOpen && (
        <CameraScannerModal
          isOpen={isCameraScannerOpen}
          onClose={() => setIsCameraScannerOpen(false)}
          onScan={handleBarcodeSearch}
        />
      )}

      {/* Category Manager & Deletion Modal */}
      <CategoryManagerModal
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
      />
    </div>
  );
};

