import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Trash2,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';

interface ClearAllOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClearAllOrdersModal: React.FC<ClearAllOrdersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { clearAllOrders, orders } = useStore();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!password.trim()) {
      setErrorMsg('ကျေးဇူးပြု၍ မန်နေဂျာ လျှို့ဝှက်စကားဝှက် ရိုက်ထည့်ပါ');
      return;
    }

    const result = clearAllOrders(password);
    if (result.success) {
      setSuccessMsg(result.message);
      setTimeout(() => {
        setPassword('');
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-rose-950 text-base sm:text-lg">
                အရောင်းမှတ်တမ်း အားလုံး ရှင်းလင်းမည်
              </h3>
              <p className="text-xs text-rose-700">
                ဘောင်ချာမှတ်တမ်းနှင့် ငွေစီးဆင်းမှုအားလုံး ပယ်ဖျက်ခြင်း
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex gap-3 text-amber-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-950">
                သတိပြုရန်: အရောင်းမှတ်တမ်း {orders.length} ခုလုံးကို လုံးဝဖျက်ပါမည်။
              </p>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                ဖုန်း၊ ကွန်ပျူတာနှင့် Cloud Database ပေါ်ရှိ ယခင် စမ်းသပ်ထားသော ဘောင်ချာများနှင့် အရောင်းမှတ်တမ်းအားလုံး လုံးဝ ကင်းစင်သွားမည်ဖြစ်ပါသည်။
              </p>
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>မန်နေဂျာ လျှို့ဝှက်စကားဝှက် ရိုက်ထည့်ပါ</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="လျှို့ဝှက်စကားဝှက်..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 pr-10 rounded-xl border border-stone-300 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden"
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
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
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
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>မှတ်တမ်းအားလုံး ရှင်းလင်းမည်</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
