import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatMMK } from '../../utils/format';
import {
  Trash2,
  Plus,
  Minus,
  Tag,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  X,
} from 'lucide-react';

interface CartPanelProps {
  onCheckout: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  onCheckout,
  isMobile,
  onCloseMobile,
}) => {
  const {
    cart,
    updateCartQuantity,
    updateCartItemDiscount,
    clearCart,
    cartSubtotal,
    cartDiscountTotal,
    cartTotal,
    cartItemCount,
    useMyanmarDigits,
    storeProfile,
  } = useStore();

  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);

  const taxAmount = (cartTotal * (storeProfile.taxRate || 0)) / 100;
  const grandTotal = Math.round(cartTotal + taxAmount);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
      {/* Cart Header */}
      <div className="p-3.5 sm:p-4 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-900 leading-tight">
              စျေးဝယ်ခြင်းတောင်း
            </h2>
            <p className="text-[11px] text-stone-500">
              {cartItemCount} ခု ရွေးချယ်ထားသည်
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-stone-500 hover:text-red-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-red-50 cursor-pointer"
              title="ရှင်းလင်းမည်"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ရှင်းလင်းမည်</span>
            </button>
          )}

          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-stone-100">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-3 text-stone-300">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <p className="font-bold text-stone-700 text-sm">
              ခြင်းတောင်းထဲတွင် ပစ္စည်းမရှိသေးပါ
            </p>
            <p className="text-xs text-stone-400 mt-1 max-w-[220px]">
              အလှကုန်ပစ္စည်းများကို နှိပ်၍ သို့မဟုတ် ဘားကုဒ်စကင်ဖတ်၍ ထည့်ပါ
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const isEditingDiscount = editingDiscountId === item.product.id;
            return (
              <div key={item.product.id} className="pt-2.5 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                      {item.product.nameMy}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-rose-700">
                        {formatMMK(item.finalPrice, useMyanmarDigits)}
                      </span>
                      {item.discountPercent > 0 && (
                        <span className="text-[10px] line-through text-stone-400">
                          {formatMMK(item.product.sellingPrice, useMyanmarDigits)}
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded">
                        {item.product.volume}
                      </span>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-black text-stone-900">
                      {formatMMK(item.lineTotal, useMyanmarDigits)}
                    </span>
                  </div>
                </div>

                {/* Controls: Quantity + Discount */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-50">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setEditingDiscountId(isEditingDiscount ? null : item.product.id)
                      }
                      className={`text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                        item.discountPercent > 0 || item.discountAmount > 0
                          ? 'bg-amber-100 text-amber-900 font-bold'
                          : 'text-stone-500 hover:bg-stone-100 font-semibold'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      <span>
                        {item.discountPercent > 0
                          ? `-${item.discountPercent}%`
                          : item.discountAmount > 0
                          ? `-${item.discountAmount} MMK`
                          : 'လျှော့စျေး'}
                      </span>
                    </button>
                  </div>

                  {/* Quantity Buttons */}
                  <div className="flex items-center gap-2 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                    <button
                      onClick={() =>
                        updateCartQuantity(item.product.id, item.quantity - 1)
                      }
                      className="w-6 h-6 rounded-md bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-5 text-center text-stone-800">
                      {item.quantity}
                    </span>
                    <button
                      disabled={item.quantity >= item.product.stock}
                      onClick={() =>
                        updateCartQuantity(item.product.id, item.quantity + 1)
                      }
                      className="w-6 h-6 rounded-md bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center transition-colors shadow-2xs disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Inline Discount Editor */}
                {isEditingDiscount && (
                  <div className="mt-2 p-2 bg-amber-50/80 rounded-xl border border-amber-200 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-amber-900">
                      အမြန်လျှော့ငွေ:
                    </span>
                    {[5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => {
                          updateCartItemDiscount(item.product.id, pct, 0);
                          setEditingDiscountId(null);
                        }}
                        className={`px-2 py-0.5 rounded-md font-bold border cursor-pointer ${
                          item.discountPercent === pct
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        updateCartItemDiscount(item.product.id, 0, 0);
                        setEditingDiscountId(null);
                      }}
                      className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 font-medium hover:bg-stone-300 ml-auto cursor-pointer"
                    >
                      မူလအတိုင်း
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Cart Footer / Bill Summary */}
      {cart.length > 0 && (
        <div className="p-3.5 sm:p-4 bg-stone-50 border-t border-stone-200 space-y-2.5">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>ကုန်ပစ္စည်းသင့်ငွေ</span>
              <span className="font-bold">
                {formatMMK(cartSubtotal, useMyanmarDigits)}
              </span>
            </div>

            {cartDiscountTotal > 0 && (
              <div className="flex justify-between text-amber-700 font-medium">
                <span>စုစုပေါင်း လျှော့ငွေ</span>
                <span className="font-bold">-{formatMMK(cartDiscountTotal, useMyanmarDigits)}</span>
              </div>
            )}

            {storeProfile.taxRate > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>အခွန် ({storeProfile.taxRate}%)</span>
                <span className="font-semibold">
                  {formatMMK(taxAmount, useMyanmarDigits)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-base sm:text-lg font-black text-stone-900 pt-1.5 border-t border-stone-200">
              <span>ကျသင့်ငွေ စုစုပေါင်း</span>
              <span className="text-rose-700 font-black">
                {formatMMK(grandTotal, useMyanmarDigits)}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onCheckout}
            className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
          >
            <CreditCard className="w-5 h-5" />
            <span>ငွေရှင်းမည် ({formatMMK(grandTotal, useMyanmarDigits)})</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};
