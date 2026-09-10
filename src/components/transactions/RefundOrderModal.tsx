import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';
import { formatMMK, formatDateMy } from '../../utils/format';
import {
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  CheckCircle,
  PackageCheck,
} from 'lucide-react';

interface RefundOrderModalProps {
  order: Order | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RefundOrderModal: React.FC<RefundOrderModalProps> = ({
  order,
  onClose,
  onSuccess,
}) => {
  const { refundOrder, verifyDeletePassword, useMyanmarDigits } = useStore();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShake, setIsShake] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  if (!order) return null;

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password) {
      triggerError('ကျေးဇူးပြု၍ စီမံခန့်ခွဲသူ လျှို့ဝှက်စကားဝှက် ရိုက်ထည့်ပါ (Please enter manager password)');
      return;
    }

    const isValid = verifyDeletePassword(password);
    if (!isValid) {
      triggerError('လျှို့ဝှက်စကားဝှက် မမှန်ကန်ပါ (Incorrect Password)');
      return;
    }

    setIsRefunding(true);
    setTimeout(() => {
      refundOrder(order.id);
      setIsRefunding(false);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className={`bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-amber-200/80 my-auto ${
          isShake ? 'animate-shake' : ''
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                ငွေပြန်အမ်းရန် အတည်ပြုပါ (Confirm Refund)
              </h3>
              <p className="text-[11px] text-amber-100">
                လုံခြုံရေး စကားဝှက် စစ်ဆေးခြင်း လိုအပ်ပါသည်
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Order Details Card */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium">ပြေစာအမှတ်:</span>
              <span className="font-mono font-black text-rose-600">
                #{order.receiptNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium">ရက်စွဲ:</span>
              <span className="text-stone-800 font-medium">
                {formatDateMy(order.createdAt)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium">ဝယ်ယူသူ/ငွေကိုင်:</span>
              <span className="text-stone-800 font-semibold">
                {order.customerName || 'အထွေထွေ'} ({order.cashierName})
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-stone-200 text-stone-900 font-bold">
              <span>ပြန်အမ်းမည့်ငွေ ပမာဏ:</span>
              <span className="text-amber-700 font-black text-sm">
                {formatMMK(order.grandTotal, useMyanmarDigits)}
              </span>
            </div>
          </div>

          {/* Automatic Stock Restoration Notice */}
          <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-start gap-2.5">
            <PackageCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900 space-y-0.5">
              <p className="font-extrabold text-amber-950">
                ကုန်ပစ္စည်းလက်ကျန် အလိုအလျောက် ပြန်လည်ဖြည့်တင်းမည်:
              </p>
              <p className="text-amber-800 leading-relaxed">
                ဤအမှာစာတွင် ပါဝင်သော ကုန်ပစ္စည်းအရေအတွက် ({order.items.length} မျိုး) အားလုံးကို လက်ကျန်စာရင်းသို့ အလိုအလျောက် ပြန်လည်ပေါင်းထည့်ပေးပြီး အရောင်းအမြတ်စာရင်းမှ နုတ်ယူပေးပါမည်။
              </p>
            </div>
          </div>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-black text-stone-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>စီမံခန့်ခွဲသူ လျှို့ဝှက်စကားဝှက် (Admin Password)</span>
                </span>
                <span className="text-[10px] text-stone-400 font-normal">
                  လုံခြုံရေးအတည်ပြုချက်
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  autoFocus
                  placeholder="စကားဝှက် ရိုက်ထည့်ပါ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 text-sm font-mono tracking-wider outline-none transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {errorMessage && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-bold animate-fadeIn">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isRefunding}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
              >
                မလုပ်တော့ပါ (Cancel)
              </button>
              <button
                type="submit"
                disabled={isRefunding}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isRefunding ? (
                  <span>အတည်ပြုနေသည်...</span>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ငွေပြန်အမ်းမည်</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
