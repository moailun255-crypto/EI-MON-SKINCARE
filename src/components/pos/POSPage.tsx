import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory } from '../../types';
import { formatMMK } from '../../utils/format';
import { CATEGORY_LABELS } from '../../utils/translations';
import { CartPanel } from './CartPanel';
import { PaymentModal } from './PaymentModal';
import { CameraScannerModal } from './CameraScannerModal';
import { playBarcodeBeep, playCartAddSound } from '../../utils/scannerSound';
import {
  Search,
  Barcode,
  Camera,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  TrendingUp,
  Receipt,
  AlertTriangle,
  Boxes,
  Flame,
  ChevronDown,
  ChevronUp,
  Store,
  ShoppingBag,
} from 'lucide-react';

interface POSPageProps {
  isMobileCartOpen?: boolean;
  setIsMobileCartOpen?: (open: boolean) => void;
}

export const POSPage: React.FC<POSPageProps> = ({
  isMobileCartOpen = false,
  setIsMobileCartOpen,
}) => {
  const {
    products,
    addToCart,
    useMyanmarDigits,
    orders,
    cartItemCount,
    cartTotal,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'popular' | 'low_stock'>('all');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [showMobileMetrics, setShowMobileMetrics] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'catalog' | 'cart'>('catalog');

  // Sync external mobile cart drawer state
  useEffect(() => {
    if (isMobileCartOpen) {
      setMobileView('cart');
    }
  }, [isMobileCartOpen]);

  // Compact notification toast for scans
  const [scanAlert, setScanAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Compute Today's POS Quick Stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = useMemo(
    () => orders.filter((o) => o.createdAt.startsWith(todayStr) && o.status === 'completed'),
    [orders, todayStr]
  );
  const todayRevenue = useMemo(
    () => todayOrders.reduce((sum, o) => sum + o.grandTotal, 0),
    [todayOrders]
  );
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minStockAlert).length,
    [products]
  );

  // Filter products by search term & category
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((item) => {
      const matchesSearch =
        q === '' ||
        item.nameMy.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.barcode.includes(q);

      let matchesCategory = true;
      if (selectedCategory === 'all') {
        matchesCategory = true;
      } else if (selectedCategory === 'low_stock') {
        matchesCategory = item.stock <= item.minStockAlert;
      } else if (selectedCategory === 'popular') {
        // Higher selling items or high stock priority
        matchesCategory = item.stock > 0;
      } else {
        matchesCategory = item.category === selectedCategory;
      }

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Core Barcode Processor
  const executeBarcodeScan = useCallback(
    (rawCode: string): { success: boolean; message: string; productName?: string } => {
      const cleanCode = rawCode.trim();
      if (!cleanCode) {
        return { success: false, message: 'ဘားကုဒ်မရှိပါ' };
      }

      // Find product by exact barcode, SKU, or normalized digits (handling UPC-A vs EAN-13 leading zeros)
      const cleanNoLeadingZero = cleanCode.replace(/^0+/, '');
      const matched = products.find((p) => {
        const pBarcode = (p.barcode || '').trim();
        const pBarcodeNoZero = pBarcode.replace(/^0+/, '');
        return (
          pBarcode === cleanCode ||
          (cleanNoLeadingZero && pBarcodeNoZero === cleanNoLeadingZero) ||
          p.sku.toLowerCase() === cleanCode.toLowerCase()
        );
      });

      if (!matched) {
        playBarcodeBeep('error');
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([100, 80, 150]);
          } catch {
            // ignore
          }
        }
        const failMsg = `[${cleanCode}] ဤဘားကုဒ်ဖြင့် ပစ္စည်းစာရင်းထဲ မတွေ့ပါ (Barcode Not Found)`;
        setScanAlert({ type: 'error', message: failMsg });
        setTimeout(() => setScanAlert(null), 3500);
        return { success: false, message: failMsg };
      }

      if (matched.stock <= 0) {
        playBarcodeBeep('error');
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([80, 60, 80]);
          } catch {
            // ignore
          }
        }
        const outMsg = `${matched.nameMy} လက်ကျန်ကုန်နေပါသည် (Out of Stock)`;
        setScanAlert({ type: 'error', message: outMsg });
        setTimeout(() => setScanAlert(null), 3500);
        return { success: false, message: outMsg };
      }

      // Add to cart
      addToCart(matched, 1);
      playBarcodeBeep('success');

      setJustAddedId(matched.id);
      setTimeout(() => setJustAddedId(null), 600);

      const successMsg = `${matched.nameMy} ထည့်ပြီး`;
      setScanAlert({ type: 'success', message: successMsg });
      setTimeout(() => setScanAlert(null), 2200);

      return {
        success: true,
        message: successMsg,
        productName: matched.nameMy,
      };
    },
    [products, addToCart]
  );

  // Global hardware barcode scanner listener (USB / Bluetooth barcode gun)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTypingInInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        target !== searchInputRef.current;

      if (isTypingInInput) return;

      const now = Date.now();
      const elapsed = now - lastKeyTime;
      lastKeyTime = now;

      if (elapsed > 120) {
        buffer = '';
      }

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          e.preventDefault();
          executeBarcodeScan(buffer);
          buffer = '';
          if (searchInputRef.current) {
            searchInputRef.current.value = '';
          }
        }
        return;
      }

      if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeBarcodeScan]);

  // Handle manual search bar submission (Enter key)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Check if query is an exact barcode match first
    const matched = products.find(
      (p) => p.barcode === query || p.sku.toLowerCase() === query.toLowerCase()
    );

    if (matched) {
      executeBarcodeScan(query);
      setSearchQuery('');
    } else if (filteredProducts.length === 1) {
      // If single item left from search, add directly on Enter
      handleProductClick(filteredProducts[0]);
      setSearchQuery('');
    } else if (filteredProducts.length === 0) {
      // Not found anywhere
      executeBarcodeScan(query);
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.stock <= 0) {
      playBarcodeBeep('error');
      return;
    }
    addToCart(product, 1);
    playCartAddSound();
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 600);
  };

  const categoriesList: { id: ProductCategory | 'popular' | 'low_stock'; labelMy: string; count?: number; icon?: React.ReactNode }[] = [
    { id: 'all', labelMy: 'အားလုံး', count: products.length },
    { id: 'popular', labelMy: 'လူကြိုက်များ', icon: <Flame className="w-3 h-3 text-rose-500" /> },
    { id: 'low_stock', labelMy: 'လက်ကျန်နည်း', count: lowStockCount, icon: <AlertTriangle className="w-3 h-3 text-amber-500" /> },
    { id: 'serum', labelMy: 'ဆာရမ်' },
    { id: 'toner', labelMy: 'တိုနာ' },
    { id: 'sunscreen', labelMy: 'နေလောင်ကာ' },
    { id: 'moisturizer', labelMy: 'ခရင်မ်' },
    { id: 'cleanser', labelMy: 'မျက်နှာသစ်' },
    { id: 'mask', labelMy: 'Mask ကပ်ခွာ' },
    { id: 'treatment', labelMy: 'ကုထုံးဆေး' },
  ];

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden max-w-[1600px] mx-auto w-full px-2 sm:px-3 py-1 sm:py-2 pb-16 sm:pb-2">
      {/* ========================================================================= */}
      {/* FLOATING HIGH-VISIBILITY SCAN ALERT TOAST (Visible across all views)      */}
      {/* ========================================================================= */}
      {scanAlert && (
        <div
          className={`fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2.5 w-[92%] sm:w-auto sm:min-w-[360px] max-w-md shadow-2xl rounded-2xl border-2 flex items-center justify-between gap-3 animate-slideDown backdrop-blur-md ${
            scanAlert.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-400 text-emerald-950 shadow-emerald-900/20'
              : 'bg-red-50/95 border-red-500 text-red-950 shadow-red-900/20'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-black min-w-0">
            {scanAlert.type === 'success' ? (
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            <span className="truncate">{scanAlert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setScanAlert(null)}
            className="p-1 rounded-lg hover:bg-black/10 text-stone-600 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE TOP SEGMENTED VIEW SWITCHER (< md)                                 */}
      {/* Allows switching instantly between Catalog and Cart without long scrolls  */}
      {/* ========================================================================= */}
      <div className="md:hidden flex items-center bg-stone-200/90 p-1 rounded-xl mb-1.5 shrink-0">
        <button
          type="button"
          onClick={() => {
            setMobileView('catalog');
            setIsMobileCartOpen?.(false);
          }}
          className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileView === 'catalog'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Store className="w-3.5 h-3.5 text-rose-600" />
          <span>ကုန်ပစ္စည်းများ ({filteredProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileView('cart');
            setIsMobileCartOpen?.(true);
          }}
          className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileView === 'cart'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>ခြင်းတောင်း ({cartItemCount})</span>
          {cartItemCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                mobileView === 'cart' ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'
              }`}
            >
              {formatMMK(cartTotal, useMyanmarDigits)}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TOP COMPACT METRICS STRIP (Saves vertical screen height)                  */}
      {/* ========================================================================= */}
      <div className="shrink-0 mb-1.5">
        <div className="flex items-center justify-between p-1.5 px-2.5 rounded-xl bg-white border border-stone-200/90 shadow-2xs text-xs">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-5 h-5 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingUp className="w-3 h-3" />
              </div>
              <span className="text-[10px] sm:text-xs text-stone-500 font-semibold">ယနေ့:</span>
              <span className="font-black text-xs sm:text-sm text-stone-900">
                {formatMMK(todayRevenue, useMyanmarDigits)}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 shrink-0 border-l border-stone-200 pl-3">
              <span className="text-xs text-stone-500 font-semibold">ဘောင်ချာ:</span>
              <span className="px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 font-bold text-xs">
                {todayOrders.length} စောင်
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 shrink-0 border-l border-stone-200 pl-3">
              <span className="text-xs text-stone-500 font-semibold">ပစ္စည်း:</span>
              <span className="font-bold text-xs text-stone-700">
                {products.length} မျိုး
              </span>
            </div>

            {lowStockCount > 0 && (
              <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                <AlertTriangle className="w-3 h-3 text-amber-600 animate-pulse" />
                <span>လက်ကျန်နည်း {lowStockCount} မျိုး</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => setShowMobileMetrics(!showMobileMetrics)}
              className="px-2 py-1 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-600 cursor-pointer flex items-center gap-1 text-[10px] font-bold border border-stone-200/80"
              title="အသေးစိတ်စာရင်း"
            >
              <span>{showMobileMetrics ? 'ဝှက်မည်' : 'အသေးစိတ်'}</span>
              {showMobileMetrics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* The 4 Expanded Stat Cards (only when requested) */}
        {showMobileMetrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5 animate-fadeIn">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-stone-200/90 shadow-2xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-stone-400 font-semibold truncate">ယနေ့ရောင်းရငွေ</p>
                <p className="text-xs sm:text-sm font-black text-stone-900 truncate">
                  {formatMMK(todayRevenue, useMyanmarDigits)}
                </p>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-stone-200/90 shadow-2xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-stone-400 font-semibold truncate">ယနေ့ဘောင်ချာ</p>
                <p className="text-xs sm:text-sm font-black text-stone-900 truncate">
                  {todayOrders.length} <span className="text-[10px] text-stone-500 font-normal">စောင်</span>
                </p>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-stone-200/90 shadow-2xs flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  lowStockCount > 0
                    ? 'bg-amber-50 text-amber-600 animate-pulse'
                    : 'bg-stone-50 text-stone-400'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-stone-400 font-semibold truncate">လက်ကျန်သတိပေးချက်</p>
                <p
                  className={`text-xs sm:text-sm font-black truncate ${
                    lowStockCount > 0 ? 'text-amber-600' : 'text-stone-900'
                  }`}
                >
                  {lowStockCount} <span className="text-[10px] text-stone-500 font-normal">မျိုး</span>
                </p>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-stone-200/90 shadow-2xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                <Boxes className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-stone-400 font-semibold truncate">ဆိုင်ရှိပစ္စည်းများ</p>
                <p className="text-xs sm:text-sm font-black text-stone-900 truncate">
                  {products.length} <span className="text-[10px] text-stone-500 font-normal">မျိုး</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MOBILE DEDICATED CART VIEW (< md)                                         */}
      {/* When user selects "ခြင်းတောင်း" tab on mobile                            */}
      {/* ========================================================================= */}
      <div className={`md:hidden flex-1 min-h-0 overflow-hidden flex flex-col ${mobileView === 'cart' ? 'flex' : 'hidden'}`}>
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <CartPanel
            isMobile={true}
            onCloseMobile={() => setMobileView('catalog')}
            onCheckout={() => setIsPaymentModalOpen(true)}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* WORKSPACE: MOBILE CATALOG OR DESKTOP DUAL-PANEL POS                       */}
      {/* ========================================================================= */}
      <div className={`flex-1 min-h-0 overflow-hidden ${mobileView === 'catalog' ? 'flex flex-col' : 'hidden md:flex flex-col'}`}>
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 overflow-hidden">
          {/* Left Column: Product Catalog & Search (col-span-7 lg:col-span-8) */}
          <div className="md:col-span-7 lg:col-span-8 h-full flex flex-col min-h-0 space-y-1.5 overflow-hidden">
            {/* Search + Scanner + Horizontal Categories Toolbar (shrink-0) */}
            <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-2xs space-y-1.5 shrink-0">
              <div className="flex items-center gap-1.5">
                {/* Search & Barcode Input */}
                <form onSubmit={handleSearchSubmit} className="relative flex-1">
                  <div className="absolute left-2.5 top-2 text-stone-400 pointer-events-none">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ပစ္စည်းအမည်၊ SKU သို့မဟုတ် ဘားကုဒ်..."
                    className="w-full text-xs pl-8 pr-7 py-1.5 rounded-xl border border-stone-200 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-stone-50/60"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-1.5 top-1.5 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </form>

                {/* Camera Scanner Button */}
                <button
                  type="button"
                  onClick={() => setIsCameraScannerOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <Camera className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-xs font-bold">စကင်</span>
                </button>
              </div>

              {/* Category Filter Horizontal Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                {categoriesList.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border shrink-0 ${
                        isSelected
                          ? 'bg-rose-600 border-rose-600 text-white shadow-2xs font-bold'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                      }`}
                    >
                      {cat.icon}
                      <span>{cat.labelMy}</span>
                      {cat.count !== undefined && (
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded-full font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {cat.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compact Scan Alert Banner */}
            {scanAlert && (
              <div
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center justify-between gap-2 border animate-fadeIn shrink-0 ${
                  scanAlert.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-red-50 text-red-900 border-red-200'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {scanAlert.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  )}
                  <span className="truncate">{scanAlert.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setScanAlert(null)}
                  className="text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Catalog Container Box (Self-contained scroll, never overflows window!) */}
            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
              <div className="shrink-0 px-3 py-1.5 border-b border-stone-100 flex items-center justify-between text-[11px] text-stone-500 bg-stone-50/50">
                <span className="font-bold text-stone-700">
                  {filteredProducts.length} မျိုး ရရှိနိုင်သည်
                </span>
                <span className="text-stone-400 hidden sm:inline">ကလစ်နှိပ်၍ ခြင်းတောင်းထဲထည့်ပါ</span>
              </div>

              {/* Scrollable Product Grid */}
              <div className="flex-1 min-h-0 overflow-y-auto pos-scrollbar overscroll-contain p-2 sm:p-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full py-10 text-center p-4">
                      <Sparkles className="w-7 h-7 text-rose-300 mx-auto mb-1.5" />
                      <p className="font-bold text-stone-700 text-xs sm:text-sm">
                        ရှာဖွေမှုနှင့် ကိုက်ညီသော ပစ္စည်းမတွေ့ပါ
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        အခြား အမည် သို့မဟုတ် ဘားကုဒ်ဖြင့် ရှာကြည့်ပါ
                      </p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => {
                      const isOutOfStock = product.stock <= 0;
                      const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
                      const isJustAdded = justAddedId === product.id;

                      return (
                        <div
                          key={product.id}
                          onClick={() => handleProductClick(product)}
                          className={`group rounded-xl border p-2 flex flex-col justify-between relative cursor-pointer select-none transition-all duration-150 hover:border-rose-400 hover:shadow-2xs active:scale-[0.98] ${
                            isOutOfStock
                              ? 'opacity-50 border-stone-200 bg-stone-50 cursor-not-allowed'
                              : 'border-stone-200 bg-white'
                          } ${isJustAdded ? 'ring-2 ring-emerald-500 bg-emerald-50/40 shadow-xs' : ''}`}
                        >
                          <div>
                            {/* Brand & Stock Header */}
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[9px] text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded font-bold truncate max-w-[70%]">
                                {product.brand || CATEGORY_LABELS[product.category]?.my}
                              </span>

                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                  isOutOfStock
                                    ? 'bg-red-500 text-white'
                                    : isLowStock
                                    ? 'bg-amber-400 text-stone-900'
                                    : 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                                }`}
                              >
                                {isOutOfStock ? 'ကုန်ပြီ' : `ကျန်: ${product.stock}`}
                              </span>
                            </div>

                            {/* Product Name */}
                            <h3 className="text-xs font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors mb-1">
                              {product.nameMy}
                            </h3>

                            {/* Volume & Barcode Snippet */}
                            <div className="flex items-center justify-between text-[9px] text-stone-400 font-mono mb-1">
                              <span className="truncate">{product.volume}</span>
                              <span className="truncate">{product.barcode.slice(-4)}</span>
                            </div>
                          </div>

                          {/* Price & Quick Add Button */}
                          <div className="flex items-center justify-between pt-1 border-t border-stone-100 mt-1">
                            <span className="text-xs sm:text-sm font-black text-rose-600">
                              {formatMMK(product.sellingPrice, useMyanmarDigits)}
                            </span>

                            <button
                              type="button"
                              disabled={isOutOfStock}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                                isJustAdded
                                  ? 'bg-emerald-600 text-white scale-110'
                                  : isOutOfStock
                                  ? 'bg-stone-100 text-stone-300'
                                  : 'bg-stone-100 text-stone-700 group-hover:bg-rose-600 group-hover:text-white'
                              }`}
                            >
                              {isJustAdded ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Desktop Cart Panel (col-span-5 lg:col-span-4) */}
          <div className="hidden md:flex md:col-span-5 lg:col-span-4 h-full flex-col min-h-0 overflow-hidden">
            <CartPanel onCheckout={() => setIsPaymentModalOpen(true)} />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING CART SUMMARY PILL (Mobile Catalog View Only)                     */}
      {/* ========================================================================= */}
      {mobileView === 'catalog' && cartItemCount > 0 && (
        <div className="md:hidden fixed bottom-18 left-3 right-3 z-30 animate-slideUp">
          <button
            type="button"
            onClick={() => {
              setMobileView('cart');
              setIsMobileCartOpen?.(true);
            }}
            className="w-full bg-stone-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl shadow-xl border border-stone-800 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-xs">
                {cartItemCount}
              </span>
              <span className="text-xs font-bold text-rose-300">
                {formatMMK(cartTotal, useMyanmarDigits)}
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs font-extrabold text-white bg-rose-600 px-3 py-1 rounded-xl">
              ခြင်းတောင်းကြည့်မည် &rarr;
            </span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHECKOUT PAYMENT & BARCODE SCANNER MODALS                                 */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={true}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={executeBarcodeScan}
      />
    </div>
  );
};
