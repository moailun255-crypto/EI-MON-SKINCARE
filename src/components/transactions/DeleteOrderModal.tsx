import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';
import { formatMMK, formatDateMy } from '../../utils/format';
import {
  Trash2,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  CheckCircle,
} from 'lucide-react';

interface DeleteOrderModalProps {
  order: Order | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DeleteOrderModal: React.FC<DeleteOrderModalProps> = ({
  order,
  onClose,
  onSuccess,
}) => {
  const { deleteOrder, verifyDeletePassword, useMyanmarDigits } = useStore();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password) {
      setErrorMessage('ကျေးဇူးပြု၍ စကားဝှက် ရိုက်ထည့်ပါ (မူလ: 123456)');
      return;
    }

    const isValid = verifyDeletePassword(password);
    if (!isValid) {
      setErrorMessage('လျှို့ဝှက်စကားဝှက် မှားယွင်းနေပါသည် (မူလ စကားဝှက်: 123456)');
      return;
    }

    setIsDeleting(true);
    setTimeout(() => {
      const success = deleteOrder(order.id);
      setIsDeleting(false);
      if (success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage('အမှာစာ ဖျက်သိမ်းရာတွင် အမှားဖြစ်ပေါ်ပါသည်');
      }
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-stone-200 my-auto">
        {/* Header */}
        <div className="bg-red-50/80 p-4 sm:p-5 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-base">
                မှားယွင်းအမှာစာ ဖျက်သိမ်းခြင်း
              </h3>
              <p className="text-[11px] text-red-600 font-semibold">
                Delete Erroneous Order
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200/60 text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Order Summary Box */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-stone-800">
              <span className="font-mono">ပြေစာ: {order.receiptNumber}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                {order.paymentMethod === 'cash' ? 'ငွေသား' : 'KBZPay'}
              </span>
            </div>

            <div className="text-stone-500 flex justify-between items-center text-[11px]">
              <span>ရက်စွဲ: {formatDateMy(order.createdAt)}</span>
              <span>ငွေကိုင်: {order.cashierName}</span>
            </div>

            {/* Total */}
            <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
              <span className="font-bold text-stone-700">ကျသင့်ငွေ စုစုပေါင်း:</span>
              <span className="text-base font-black text-rose-600 font-mono">
                {formatMMK(order.grandTotal, useMyanmarDigits)}
              </span>
            </div>

            {/* Items summary */}
            <div className="pt-1 text-[11px] text-stone-500 truncate">
              ပစ္စည်းများ: {order.items.map((i) => `${i.productNameMy} (x${i.quantity})`).join(', ')}
            </div>
          </div>

          {/* Impact Warning */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex gap-2.5 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <p className="font-bold text-amber-950">
                ဤအမှာစာကို ဖျက်သိမ်းပါက:
              </p>
              <ul className="list-disc pl-3.5 space-y-0.5 text-amber-800">
                <li>ကုန်ပစ္စည်းလက်ကျန် (Stock) ပြန်လည်ပေါင်းထည့်ပေးပါမည်။</li>
                <li>ဘဏ္ဍာရေးစာရင်း၊ ဝင်ငွေ၊ အမြတ်နှင့် အရောင်းမှတ်တမ်းများမှလည်း အလိုအလျောက် နုတ်ပယ်သွားပါမည်။</li>
              </ul>
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                <span>မန်နေဂျာ လျှို့ဝှက်စကားဝှက်</span>
              </label>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="စကားဝှက် ရိုက်ထည့်ပါ..."
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-stone-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-xs sm:text-sm font-mono transition-all outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMessage && (
              <p className="text-xs font-bold text-red-600 flex items-center gap-1 pt-1 animate-fadeIn">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{errorMessage}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-100 transition-colors cursor-pointer"
            >
              မလုပ်တော့ပါ
            </button>
            <button
              type="submit"
              disabled={isDeleting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'ဖျက်သိမ်းနေသည်...' : 'အတည်ပြု ဖျက်မည်'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
