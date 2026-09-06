import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { PaymentMethod } from '../../types';
import { formatMMK } from '../../utils/format';
import { PAYMENT_LABELS } from '../../utils/translations';
import { playPaymentSuccessChime } from '../../utils/scannerSound';
import {
  X,
  CheckCircle2,
  Banknote,
  User,
  Phone,
  Printer,
  Tag,
  CreditCard,
  Smartphone,
  Building2,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen = true,
  onClose,
}) => {
  const {
    cartTotal,
    storeProfile,
    checkout,
    useMyanmarDigits,
  } = useStore();

  const taxAmount = (cartTotal * (storeProfile.taxRate || 0)) / 100;
  const initialGrandTotal = Math.round(cartTotal + taxAmount);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState<number>(initialGrandTotal);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const finalPayable = Math.max(0, initialGrandTotal - orderDiscount);
  const changeDue = Math.max(0, amountReceived - finalPayable);

  // Update amount received when payable changes
  useEffect(() => {
    setAmountReceived(finalPayable);
  }, [finalPayable]);

  if (!isOpen) return null;

  // Myanmar quick cash denominations (exact, 10,000, 20,000, 50,000, 100,000 MMK)
  const quickCashOptions = [
    finalPayable,
    Math.ceil(finalPayable / 5000) * 5000,
    Math.ceil(finalPayable / 10000) * 10000,
    Math.ceil(finalPayable / 20000) * 20000,
    Math.ceil(finalPayable / 50000) * 50000,
    100000,
  ].filter((val, idx, arr) => val >= finalPayable && arr.indexOf(val) === idx);

  const handleFinishCheckout = () => {
    playPaymentSuccessChime();
    checkout({
      paymentMethod,
      amountReceived: paymentMethod === 'cash' ? amountReceived : finalPayable,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      orderDiscount,
    });
    onClose();
  };

  const paymentMethodsList: { id: PaymentMethod; label: string; sub: string; icon: React.ReactNode }[] = [
    { id: 'cash', label: 'ငွေသား (Cash)', sub: 'ရူဘီငွေစက္ကူ', icon: <Banknote className="w-4 h-4 text-emerald-600" /> },
    { id: 'kpay', label: 'KBZPay', sub: 'KPay စကင် / ဖုန်း', icon: <Smartphone className="w-4 h-4 text-blue-600" /> },
    { id: 'wave', label: 'WavePay', sub: 'Wave Money', icon: <Smartphone className="w-4 h-4 text-amber-500" /> },
    { id: 'bank', label: 'ဘဏ်လွှဲ / AYA / CB', sub: 'Mobile Banking', icon: <Building2 className="w-4 h-4 text-violet-600" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-100 animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-2xs">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
                ငွေပေးချေမှု ရှင်းတမ်း
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {storeProfile.name || 'EI MON SKINCARE'} • MMK (ကျပ်)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Total Display Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 via-amber-50/50 to-stone-50 border border-rose-200/80 text-center">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              ကျသင့်ငွေ စုစုပေါင်း
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">
              {formatMMK(finalPayable, useMyanmarDigits)}
            </h2>
            {orderDiscount > 0 && (
              <p className="text-xs font-semibold text-emerald-700 mt-1">
                သီးသန့်လျှော့စျေး: -{formatMMK(orderDiscount, useMyanmarDigits)}
              </p>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              ငွေပေးချေမှုပုံစံ ရွေးချယ်ပါ
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethodsList.map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50/70 ring-2 ring-rose-500/20 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1.5">
                        {method.icon}
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                          {method.sub}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <span className="text-xs font-black text-stone-900 leading-tight">
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  လက်ခံရရှိငွေ (ကျပ်)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amountReceived || ''}
                    onChange={(e) => setAmountReceived(Number(e.target.value))}
                    className="w-full text-lg font-bold px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-stone-400">
                    MMK
                  </span>
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {quickCashOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAmountReceived(opt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      amountReceived === opt
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {formatMMK(opt, useMyanmarDigits)}
                  </button>
                ))}
              </div>

              {/* Change calculation */}
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">
                  ပြန်အမ်းငွေ:
                </span>
                <span
                  className={`text-base font-extrabold ${
                    changeDue > 0 ? 'text-emerald-700' : 'text-stone-900'
                  }`}
                >
                  {formatMMK(changeDue, useMyanmarDigits)}
                </span>
              </div>
            </div>
          )}

          {/* Digital Mobile Payment Selected Display */}
          {paymentMethod !== 'cash' && (
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold ${PAYMENT_LABELS[paymentMethod]?.color || 'bg-stone-900 text-white'}`}>
                  {PAYMENT_LABELS[paymentMethod]?.my || paymentMethod.toUpperCase()}
                </div>
                <span className="text-xs text-stone-600 font-medium">
                  ဖြင့် တိုက်ရိုက်လက်ခံမည်
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-rose-700 font-mono">
                  {formatMMK(finalPayable, useMyanmarDigits)}
                </span>
              </div>
            </div>
          )}

          {/* Optional: Customer Details & Order Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                ဝယ်ယူသူ အမည်
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="ဥပမာ - မသီတာ"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                ဖုန်းနံပါတ်
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  type="tel"
                  placeholder="၀၉..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Extra Order Discount Input */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              ဘောင်ချာ သီးသန့်လျှော့ငွေ (ကျပ်)
            </label>
            <div className="relative">
              <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="number"
                placeholder="0"
                value={orderDiscount || ''}
                onChange={(e) => setOrderDiscount(Math.max(0, Number(e.target.value)))}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-200 transition-colors cursor-pointer"
          >
            မလုပ်တော့ပါ
          </button>

          <button
            type="button"
            onClick={handleFinishCheckout}
            className="flex-[2] py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>ငွေရှင်းပြီး ပြေစာထုတ်မည်</span>
          </button>
        </div>
      </div>
    </div>
  );
};
