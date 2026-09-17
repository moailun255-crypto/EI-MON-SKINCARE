import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatMMK } from '../../utils/format';
import {
  Trash2,
  AlertTriangle,
  Lock,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  Boxes,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
} from 'lucide-react';

interface ClearAllProductsModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClearAllProductsModal: React.FC<ClearAllProductsModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { products, clearAllProducts, useMyanmarDigits } = useStore();
  
  // Step 1: Warning & Secondary Confirmation Checkbox
  // Step 2: Manager Password Verification
  const [step, setStep] = useState<1 | 2>(1);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isShake, setIsShake] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalCost = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);

  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) {
      setErrorMsg('ကျေးဇူးပြု၍ ဆက်လက်လုပ်ဆောင်ရန် အတည်ပြုချက် အမှန်ခြစ် ပေးပါ');
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!password.trim()) {
      setErrorMsg('ကျေးဇူးပြု၍ စီမံခန့်ခွဲသူ လျှို့ဝှက်စကားဝှက် ရိုက်ထည့်ပါ');
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const result = clearAllProducts(password.trim());
      setIsProcessing(false);

      if (result.success) {
        setSuccessMsg(result.message);
        setTimeout(() => {
          setPassword('');
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      } else {
        setErrorMsg(result.message);
        setIsShake(true);
        setTimeout(() => setIsShake(false), 500);
      }
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-rose-950 text-base sm:text-lg">
                  ကုန်ပစ္စည်း အားလုံး ရှင်းလင်းမည်
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                  အဆင့် {step}/၂
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-0.5">
                {step === 1 ? 'သတိပေးချက်နှင့် အတည်ပြုခြင်း' : 'စီမံခန့်ခွဲသူ စကားဝှက် စစ်ဆေးခြင်း'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="grid grid-cols-2 gap-1 px-5 pt-3 bg-white">
          <div
            className={`h-1.5 rounded-full transition-all ${
              step >= 1 ? 'bg-rose-600' : 'bg-stone-200'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              step === 2 ? 'bg-rose-600' : 'bg-stone-200'
            }`}
          />
        </div>

        {/* STEP 1: Impact Review & Mandatory Secondary Confirmation */}
        {step === 1 && (
          <form onSubmit={handleProceedToStep2} className="p-5 sm:p-6 space-y-4">
            {/* Impact Summary Statistics */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-center">
              <div>
                <p className="text-[10px] font-bold text-stone-400">ဖျက်မည့်ပစ္စည်း</p>
                <p className="text-sm font-black text-stone-900">{products.length} မျိုး</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400">လက်ကျန် စုစုပေါင်း</p>
                <p className="text-sm font-black text-stone-900">{totalStock} ခု</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400">စုစုပေါင်း တန်ဖိုး</p>
                <p className="text-xs font-black text-rose-600 mt-0.5 truncate">
                  {formatMMK(totalCost, useMyanmarDigits)}
                </p>
              </div>
            </div>

            {/* High-Impact Danger Warning Card */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex gap-3 text-amber-900 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-950">
                  အရေးကြီး သတိပေးချက်: ကုန်ပစ္စည်း {products.length} မျိုးလုံးကို စနစ်မှ လုံးဝဖျက်ပါမည်
                </p>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  ဖုန်း၊ ကွန်ပျူတာနှင့် Cloud Database ပေါ်ရှိ ကုန်ပစ္စည်းစာရင်းနှင့် လက်ကျန်အားလုံး လုံးဝ ကင်းစင်သွားမည်ဖြစ်ပြီး ဤလုပ်ဆောင်ချက်ကို <strong>နောက်မှ ပြန်လည်မရယူနိုင်ပါ</strong>။
                </p>
              </div>
            </div>

            {/* Mandatory Secondary Confirmation Checkbox */}
            <div
              onClick={() => {
                setIsConfirmed(!isConfirmed);
                setErrorMsg(null);
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                isConfirmed
                  ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200/50'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
              }`}
            >
              <div className="mt-0.5 shrink-0 text-rose-600">
                {isConfirmed ? (
                  <CheckSquare className="w-5 h-5 fill-rose-100" />
                ) : (
                  <Square className="w-5 h-5 text-stone-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900">
                  (ဒုတိယအဆင့် အတည်ပြုချက်) ကုန်ပစ္စည်း {products.length} မျိုးလုံး အပြီးတိုင် ဖျက်ပစ်မည်ကို အတည်ပြုပါသည်
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  မှားယွင်းဖျက်မိခြင်းမှ ကာကွယ်ရန် ဤအကွက်ကို အမှန်ခြစ်ပေးရန် လိုအပ်ပါသည်
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold cursor-pointer"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                type="submit"
                disabled={!isConfirmed}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                  isConfirmed
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <span>ရှေ့သို့ (အဆင့် ၂ စကားဝှက်)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Password Verification & Final Execution */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="p-5 sm:p-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-950 text-xs">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold">လုံခြုံရေး အတည်ပြုချက် လိုအပ်ပါသည်</p>
                <p className="text-rose-800 text-[11px] mt-0.5">
                  ကုန်ပစ္စည်း {products.length} မျိုးလုံးကို ဖျက်ရန် စီမံခန့်ခွဲသူ လျှို့ဝှက်စကားဝှက် ရိုက်ထည့်ပါ
                </p>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span>စီမံခန့်ခွဲသူ လျှို့ဝှက်စကားဝှက် (Password)</span>
                </span>
                <span className="text-[10px] font-medium text-stone-400">
                  မူလစကားဝှက်: 123456
                </span>
              </label>
              <div className={`relative transition-transform ${isShake ? 'animate-bounce' : ''}`}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="စကားဝှက် ရိုက်ထည့်ပါ..."
                  className={`w-full text-xs sm:text-sm px-3.5 py-2.5 pr-10 rounded-xl border font-mono outline-hidden transition-all ${
                    errorMsg
                      ? 'border-red-500 bg-red-50/40 text-red-900 focus:ring-2 focus:ring-red-200'
                      : 'border-stone-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error / Success Feedback */}
            {errorMsg && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}

            {successMsg && (
              <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </p>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setStep(1);
                }}
                disabled={isProcessing || Boolean(successMsg)}
                className="px-3.5 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>နောက်သို့</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || Boolean(successMsg)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isProcessing ? 'ဖျက်နေသည်...' : 'အတည်ပြု ဖျက်မည်'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

