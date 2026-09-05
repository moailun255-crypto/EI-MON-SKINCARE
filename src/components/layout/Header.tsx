import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Sparkles,
  ShoppingCart,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileCart }) => {
  const {
    storeProfile,
    cartItemCount,
    activeTab,
  } = useStore();

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand identity: Strictly "EI MON SKINCARE" */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-stone-900 tracking-tight text-base sm:text-lg">
                EI MON SKINCARE
              </span>
              <span className="hidden md:inline-flex items-center text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                အရောင်းစနစ်
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 font-medium truncate max-w-[200px] sm:max-w-sm">
              အလှကုန်နှင့် အသားအရေထိန်းပစ္စည်း အရောင်းကောင်တာ
            </p>
          </div>
        </div>

        {/* Right side controls: Cashier Badge, Mobile Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cashier profile info */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                ငွေကိုင်
              </p>
              <p className="text-xs font-bold text-stone-800">
                {storeProfile.activeCashier}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
              {storeProfile.activeCashier.charAt(0)}
            </div>
          </div>

          {/* Mobile Cart Button (Visible on small screens when on POS page) */}
          {activeTab === 'pos' && onOpenMobileCart && (
            <button
              onClick={onOpenMobileCart}
              className="lg:hidden relative p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-xs flex items-center justify-center cursor-pointer"
            >
              <ShoppingCart className="w-4.5 h-4.5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-stone-900 font-extrabold text-[10px] rounded-full w-5 h-5 flex items-center justify-center shadow-xs">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
