import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory } from '../../types';
import { formatMMK } from '../../utils/format';
import { CATEGORY_LABELS } from '../../utils/translations';
import { CartPanel } from './CartPanel';
import { PaymentModal } from './PaymentModal';
import { CameraScannerModal } from './CameraScannerModal';
import { playBarcodeBeep } from '../../utils/scannerSound';
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
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Compact notification toast for scans
  const [scanAlert, setScanAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter products by search term & category
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((item) => {
      const matchesSearch =
        q === '' ||
        item.nameMy.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.barcode.includes(q);

      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

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

      // Find product by exact barcode or SKU
      const matched = products.find(
        (p) =>
          p.barcode === cleanCode ||
          p.sku.toLowerCase() === cleanCode.toLowerCase()
      );

      if (!matched) {
        playBarcodeBeep('error');
        const failMsg = `[${cleanCode}] ပစ္စည်းစာရင်းထဲ မတွေ့ပါ`;
        setScanAlert({ type: 'error', message: failMsg });
        setTimeout(() => setScanAlert(null), 2800);
        return { success: false, message: failMsg };
      }

      if (matched.stock <= 0) {
        playBarcodeBeep('error');
        const outMsg = `${matched.nameMy} လက်ကျန်ကုန်နေပါသည်`;
        setScanAlert({ type: 'error', message: outMsg });
        setTimeout(() => setScanAlert(null), 2800);
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
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.stock <= 0) return;
    addToCart(product, 1);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 600);
  };

  const categoriesList: ProductCategory[] = [
    'all',
    'serum',
    'toner',
    'sunscreen',
    'moisturizer',
    'cleanser',
    'mask',
    'treatment',
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2.5 sm:py-3">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Left Side: Skincare Products Catalog */}
        <div className="lg:col-span-8 space-y-2.5">
          {/* Top Unified Search & Barcode Bar */}
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              {/* Unified Search & Barcode Input */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <div className="absolute left-3 top-2.5 text-stone-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ပစ္စည်းအမည်၊ SKU သို့မဟုတ် ဘားကုဒ်ဖြင့် ရှာမည်..."
                  className="w-full text-xs sm:text-sm pl-9 pr-16 py-2 rounded-xl border border-stone-200 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-stone-50/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Sleek Camera Scanner Button */}
              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">ကင်မရာစကင်</span>
              </button>
            </div>

            {/* Category Filter Horizontal Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-0.5">
              {categoriesList.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-2xs font-bold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <span>{CATEGORY_LABELS[cat]?.my}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact Scan Alert Banner */}
          {scanAlert && (
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 border animate-fadeIn ${
                scanAlert.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-red-50 text-red-900 border-red-200'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {scanAlert.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span className="truncate">{scanAlert.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setScanAlert(null)}
                className="text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Compact, High-Density Skincare Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-10 text-center bg-white rounded-2xl border border-stone-200 p-5">
                <Sparkles className="w-8 h-8 text-rose-300 mx-auto mb-1.5" />
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
                    className={`group rounded-xl border p-2.5 flex flex-col justify-between relative cursor-pointer select-none transition-all duration-150 hover:border-rose-400 hover:shadow-xs active:scale-[0.98] ${
                      isOutOfStock
                        ? 'opacity-50 border-stone-200 bg-stone-50 cursor-not-allowed'
                        : 'border-stone-200 bg-white'
                    } ${isJustAdded ? 'ring-2 ring-emerald-500 bg-emerald-50/30' : ''}`}
                  >
                    <div>
                      {/* Category & Stock Pill */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded font-medium truncate">
                          {CATEGORY_LABELS[product.category]?.my}
                        </span>

                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            isOutOfStock
                              ? 'bg-red-500 text-white'
                              : isLowStock
                              ? 'bg-amber-400 text-stone-900'
                              : 'text-emerald-700 bg-emerald-50'
                          }`}
                        >
                          {isOutOfStock ? 'ကုန်ပြီ' : `ကျန်: ${product.stock}`}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h3 className="text-xs font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors mb-1">
                        {product.nameMy}
                      </h3>

                      {/* Barcode & Volume */}
                      <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mb-2">
                        <span>{product.volume}</span>
                        <span className="flex items-center gap-0.5">
                          <Barcode className="w-2.5 h-2.5 text-stone-400" />
                          <span>{product.barcode.slice(-5)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Price & Quick Add Button */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-stone-100 mt-auto">
                      <span className="text-xs sm:text-sm font-black text-rose-600">
                        {formatMMK(product.sellingPrice, useMyanmarDigits)}
                      </span>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : isOutOfStock
                            ? 'bg-stone-100 text-stone-300'
                            : 'bg-stone-100 text-stone-700 group-hover:bg-rose-600 group-hover:text-white'
                        }`}
                      >
                        {isJustAdded ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Sticky Cart Panel */}
        <div className="hidden lg:block lg:col-span-4 sticky top-16 h-[calc(100vh-4.8rem)]">
          <CartPanel onCheckout={() => setIsPaymentModalOpen(true)} />
        </div>
      </div>

      {/* Mobile Cart Drawer */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-slideLeft">
            <CartPanel
              isMobile={true}
              onCloseMobile={() => setIsMobileCartOpen && setIsMobileCartOpen(false)}
              onCheckout={() => {
                if (setIsMobileCartOpen) setIsMobileCartOpen(false);
                setIsPaymentModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Checkout Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={true}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {/* Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={executeBarcodeScan}
      />
    </div>
  );
};
