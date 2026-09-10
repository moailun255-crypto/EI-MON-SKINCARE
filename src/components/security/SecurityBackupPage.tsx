import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { StoreProfile } from '../../types';
import { SupabaseSyncCard } from './SupabaseSyncCard';
import {
  ShieldCheck,
  Save,
  CheckCircle,
  AlertTriangle,
  Store,
  Printer,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';

export const SecurityBackupPage: React.FC = () => {
  const {
    storeProfile,
    updateStoreProfile,
    verifyDeletePassword,
    updateDeletePassword,
    setActiveTab,
  } = useStore();

  const [profileForm, setProfileForm] = useState<StoreProfile>({ ...storeProfile });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Step-by-step password modification state (never reveal current password)
  const [passwordStep, setPasswordStep] = useState<1 | 2>(1);
  const [oldPassword, setOldPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Step 1: Verify current password
  const handleVerifyCurrentPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!oldPassword.trim()) {
      setPassError('လက်ရှိ လျှို့ဝှက်စကားဝှက်ကို ထည့်သွင်းပါ');
      return;
    }

    if (!verifyDeletePassword(oldPassword)) {
      setPassError('လက်ရှိ လျှို့ဝှက်စကားဝှက် မှားယွင်းနေပါသည် (Incorrect Current Password)');
      return;
    }

    // Step 1 passed, proceed to Step 2
    setPasswordStep(2);
    setPassError(null);
  };

  // Step 2: Set new password
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!newPassword || newPassword.trim().length < 4) {
      setPassError('စကားဝှက် အသစ်သည် အနည်းဆုံး ၄ လုံး ရှိရပါမည်');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('စကားဝှက် အသစ် နှစ်ကြိမ် ရိုက်ထည့်မှု မကိုက်ညီပါ');
      return;
    }

    const res = updateDeletePassword(oldPassword, newPassword.trim());
    if (res.success) {
      setPassSuccess('စကားဝှက် အသစ် အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ');
      setPasswordStep(1);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('စကားဝှက် အသစ် အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ');
    } else {
      setPassError(res.message);
    }
  };

  const handleResetSteps = () => {
    setPasswordStep(1);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPassError(null);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreProfile(profileForm);
    showToast('ဆိုင်အချက်အလက်နှင့် ဆက်တင်များ သိမ်းဆည်းပြီးပါပြီ');
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
            <span>လုံခြုံရေးနှင့် ဆိုင်ဆက်တင်များ</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Cloud ဒေတာချိတ်ဆက်မှု၊ ဆိုင်အချက်အလက်၊ စလစ်ပြေစာပုံစံနှင့် လုံခြုံရေးစကားဝှက် စီမံခန့်ခွဲမှု
          </p>
        </div>

        <div className="flex items-center gap-2">
          {toastMsg && (
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs animate-fadeIn">
              <CheckCircle className="w-4 h-4" />
              <span>{toastMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Supabase Cloud & Realtime Multi-Device Sync Card */}
      <SupabaseSyncCard />

      {/* Stacked Clean Configuration Panels */}
      <div className="space-y-6">
        {/* Store Profile, Payment Accounts & Thermal Settings */}
        <form
          onSubmit={handleSaveProfile}
          className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                ဆိုင်အချက်အလက်နှင့် ပြေစာပုံစံ
              </h3>
              <p className="text-[11px] text-stone-400">
                ဘောင်ချာပေါ်တွင် ဖော်ပြမည့် အချက်အလက်များ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ဆိုင်အမည်
              </label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200 font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ဆိုင်လိပ်စာ
              </label>
              <input
                type="text"
                value={profileForm.addressMy}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, addressMy: e.target.value })
                }
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ဆိုင်ဖုန်းနံပါတ်
              </label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, phone: e.target.value })
                }
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                လက်ရှိငွေကိုင် အမည်
              </label>
              <input
                type="text"
                value={profileForm.activeCashier}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    activeCashier: e.target.value,
                  })
                }
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200"
              />
            </div>
          </div>

          {/* Thermal Printer Settings */}
          <div className="pt-3 border-t border-stone-100 space-y-3">
            <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-stone-700" />
              <span>ပြေစာ စလစ်ပုံစံ နှင့် အခွန်ဆက်တင်များ</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  စက္ကူအရွယ်အစား
                </label>
                <select
                  value={profileForm.paperSize}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      paperSize: e.target.value as '58mm' | '80mm',
                    })
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white"
                >
                  <option value="80mm">80mm စံနှုန်းပြေစာ</option>
                  <option value="58mm">58mm အသေးစားပြေစာ</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  ကုန်သွယ်ခွန် %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={profileForm.taxRate}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      taxRate: Number(e.target.value),
                    })
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-3 border-t border-stone-100 flex justify-end">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ဆက်တင်များ သိမ်းဆည်းမည်</span>
            </button>
          </div>
        </form>

        {/* Order Deletion & Refund Manager Password Change Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                  အမှာစာဖျက်ရန်နှင့် ငွေပြန်အမ်းရန် လျှို့ဝှက်စကားဝှက်
                </h3>
                <p className="text-[11px] text-stone-500">
                  အမှားအမှာစာဖျက်ခြင်းနှင့် ငွေပြန်အမ်းရာတွင် စစ်ဆေးမည့် မန်နေဂျာ စကားဝှက် (မူလ: 123456)
                </p>
              </div>
            </div>

            {/* Shield protection badge - Never revealing current password */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>စကားဝှက်ဖြင့် အပြည့်အဝ ကာကွယ်ထားသည်</span>
            </div>
          </div>

          {/* Step Progress Tracker */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-stone-100 rounded-2xl">
            <div
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                passwordStep === 1
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-emerald-700 bg-emerald-50/70 font-semibold'
              }`}
            >
              {passwordStep === 2 ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">
                  ၁
                </span>
              )}
              <span>အဆင့် (၁): လက်ရှိစကားဝှက် စစ်ဆေးခြင်း</span>
            </div>

            <div
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                passwordStep === 2
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-400 font-medium'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  passwordStep === 2 ? 'bg-rose-600 text-white' : 'bg-stone-300 text-stone-600'
                }`}
              >
                ၂
              </span>
              <span>အဆင့် (၂): စကားဝှက်အသစ် သတ်မှတ်ခြင်း</span>
            </div>
          </div>

          {/* Success Message Banner */}
          {passSuccess && (
            <div className="p-3 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          {/* Error Message Banner */}
          {passError && (
            <div className="p-3 rounded-xl text-xs font-bold text-red-700 bg-rose-50 border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          {/* STEP 1: Verify Current Password */}
          {passwordStep === 1 && (
            <form onSubmit={handleVerifyCurrentPassword} className="space-y-4 pt-1">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 text-xs leading-relaxed">
                စကားဝှက်အသစ် မပြောင်းလဲမီ လုံခြုံရေးအရ <strong>လက်ရှိ အသုံးပြုနေသော မန်နေဂျာ စကားဝှက်</strong> ကို အရင်ဆုံး မှန်ကန်စွာ ရိုက်ထည့် စစ်ဆေးရပါမည်။
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  လက်ရှိ လျှို့ဝှက်စကားဝှက် ရိုက်ထည့်ပါ *
                </label>
                <div className="relative max-w-md">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    required
                    autoFocus
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      setPassError(null);
                      setPassSuccess(null);
                    }}
                    placeholder="လက်ရှိ စကားဝှက် (Default: 123456)..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 pr-10 rounded-xl border border-stone-300 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-stone-500">
                  စကားဝှက် မှန်ကန်မှသာ အဆင့် (၂) စကားဝှက် အသစ် သတ်မှတ်ခွင့် ရရှိပါမည်
                </span>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-stone-900 hover:bg-black text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span>စစ်ဆေးအတည်ပြုမည်</span>
                  <KeyRound className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Set New Password */}
          {passwordStep === 2 && (
            <form onSubmit={handleSaveNewPassword} className="space-y-4 pt-1">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>လက်ရှိ စကားဝှက် မှန်ကန်ကြောင်း အတည်ပြုပြီးပါပြီ။ စကားဝှက် အသစ် သတ်မှတ်နိုင်ပါပြီ။</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetSteps}
                  className="text-xs font-bold text-stone-600 hover:text-stone-900 underline cursor-pointer text-left"
                >
                  အဆင့် (၁) သို့ ပြန်သွားမည်
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    စကားဝှက် အသစ် ထည့်သွင်းပါ *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      autoFocus
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPassError(null);
                        setPassSuccess(null);
                      }}
                      placeholder="စကားဝှက် အသစ် (အနည်းဆုံး ၄ လုံး)..."
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 pr-10 rounded-xl border border-stone-300 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password requirement hint */}
                  <div className="flex items-center gap-1 mt-1.5">
                    {newPassword.length >= 4 ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                    )}
                    <span
                      className={`text-[11px] ${
                        newPassword.length >= 4 ? 'text-emerald-600 font-semibold' : 'text-stone-400'
                      }`}
                    >
                      အနည်းဆုံး ၄ လုံး ({newPassword.length}/4)
                    </span>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    စကားဝှက် အတည်ပြုပါ *
                  </label>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPassError(null);
                      setPassSuccess(null);
                    }}
                    placeholder="စကားဝှက် ထပ်မံရိုက်ထည့်ပါ..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden bg-white"
                  />
                  {/* Matching confirmation hint */}
                  {confirmPassword && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {newPassword === confirmPassword ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[11px] text-emerald-600 font-semibold">
                            စကားဝှက် ကိုက်ညီပါသည်
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-[11px] text-red-500 font-semibold">
                            စကားဝှက် မကိုက်ညီသေးပါ
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-stone-500">
                  💡 စကားဝှက် အသစ် သတ်မှတ်ပြီးပါက အမှာစာဖျက်ခြင်းနှင့် ငွေပြန်အမ်းရာတွင် ဤစကားဝှက် အသစ်ကို အသုံးပြုရမည်
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetSteps}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    ပယ်ဖျက်မည်
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-white" />
                    <span>စကားဝှက် အသစ် သိမ်းဆည်းမည်</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
