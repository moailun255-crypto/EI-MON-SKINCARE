import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { StoreProfile } from '../../types';
import { SupabaseSyncCard } from './SupabaseSyncCard';
import {
  ShieldCheck,
  Download,
  Upload,
  FileSpreadsheet,
  Save,
  CheckCircle,
  AlertTriangle,
  Store,
  Printer,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

export const SecurityBackupPage: React.FC = () => {
  const {
    storeProfile,
    updateStoreProfile,
    updateDeletePassword,
    exportDatabaseJSON,
    importDatabaseJSON,
    products,
    orders,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileForm, setProfileForm] = useState<StoreProfile>({ ...storeProfile });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Password modification state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!oldPassword) {
      setPassError('ကျေးဇူးပြု၍ ယခင် လျှို့ဝှက်စကားဝှက် ရိုက်ထည့်ပါ');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setPassError('စကားဝှက် အသစ်သည် အနည်းဆုံး ၄ လုံး ရှိရပါမည်');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('စကားဝှက် အသစ် နှစ်ကြိမ် ရိုက်ထည့်မှု မတူညီပါ');
      return;
    }

    const res = updateDeletePassword(oldPassword, newPassword);
    if (res.success) {
      setPassSuccess(res.message);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(res.message);
    } else {
      setPassError(res.message);
    }
  };

  // Backup Export: triggers browser file download of JSON
  const handleExportJSON = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ei_mon_skincare_backup_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ဒေတာသိမ်းဆည်းမှု ဖိုင် ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ');
  };

  // Backup Import: reads file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDatabaseJSON(content);
        if (success) {
          showToast('ဒေတာများ အောင်မြင်စွာ ပြန်လည်သွင်းယူပြီးပါပြီ');
        } else {
          alert('ဒေတာဖိုင် မှားယွင်းနေပါသည်');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Export Sales Report as CSV
  const handleExportSalesCSV = () => {
    const headers = ['ReceiptNumber', 'Date', 'Cashier', 'Customer', 'PaymentMethod', 'GrandTotalMMK', 'ProfitMMK', 'Status'];
    const rows = orders.map((o) => [
      `"${o.receiptNumber}"`,
      `"${o.createdAt}"`,
      `"${o.cashierName}"`,
      `"${o.customerName || ''}"`,
      `"${o.paymentMethod}"`,
      o.grandTotal,
      o.profit,
      `"${o.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ei_mon_sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('အရောင်းမှတ်တမ်း CSV ဖိုင် ထုတ်ယူပြီးပါပြီ');
  };

  // Export Inventory Stock as CSV
  const handleExportInventoryCSV = () => {
    const headers = ['SKU', 'Barcode', 'NameMyanmar', 'Category', 'Volume', 'CostPriceMMK', 'SellingPriceMMK', 'Stock'];
    const rows = products.map((p) => [
      `"${p.sku}"`,
      `"${p.barcode}"`,
      `"${p.nameMy.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.volume}"`,
      p.costPrice,
      p.sellingPrice,
      p.stock,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ei_mon_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ကုန်လက်ကျန်စာရင်း CSV ဖိုင် ထုတ်ယူပြီးပါပြီ');
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
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
            <span>ဒေတာလုံခြုံရေး၊ မိတ္တူသိမ်းဆည်းမှုနှင့် ဆိုင်ဆက်တင်များ</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            ဒေတာများ ဘေးကင်းလုံခြုံစွာ သိမ်းဆည်းရန်၊ CSV စာရင်းထုတ်ယူရန်နှင့် လျှို့ဝှက်ကုဒ် သတ်မှတ်ရန်
          </p>
        </div>

        {toastMsg && (
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs animate-fadeIn">
            <CheckCircle className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        )}
      </div>

      {/* Supabase Cloud & Realtime Multi-Device Sync Card */}
      <SupabaseSyncCard />

      {/* Grid: Left = Backup & Data Safety, Right = Store Profile & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 cols): Data Safety & Backup Actions */}
        <div className="lg:col-span-5 space-y-5">
          {/* Backup & Restore Box */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-sm">
                  ဒေတာ မိတ္တူ သိမ်းဆည်းခြင်း
                </h3>
                <p className="text-[11px] text-stone-400">JSON စနစ်</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              သင့်ဆိုင်၏ ကုန်ပစ္စည်း၊ စျေးနှုန်း၊ ဘောင်ချာနှင့် ကုန်ကျစရိတ် ဒေတာအားလုံးကို ဖိုင်အဖြစ် လုံခြုံစွာ ဒေါင်းလုဒ်သိမ်းဆည်းနိုင်ပါသည်။
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                onClick={handleExportJSON}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ဒေတာ မိတ္တူ ဖိုင် ဒေါင်းလုဒ်ဆွဲမည် (.json)</span>
              </button>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-stone-500" />
                  <span>သိမ်းထားသော မိတ္တူဖိုင် ပြန်လည်သွင်းမည်</span>
                </button>
              </div>
            </div>
          </div>

          {/* Excel / CSV Reports Export */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-sm">
                  အစီရင်ခံစာများ ထုတ်ယူရန် (CSV/Excel)
                </h3>
                <p className="text-[11px] text-stone-400">စာရင်းကိုင်နှင့် အခွန်တွက်ချက်မှု</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleExportSalesCSV}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-rose-600" />
                  <span>အရောင်းပြေစာမှတ်တမ်း CSV</span>
                </div>
                <Download className="w-3.5 h-3.5 text-stone-400" />
              </button>

              <button
                onClick={handleExportInventoryCSV}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>ကုန်ပစ္စည်းလက်ကျန်စာရင်း CSV</span>
                </div>
                <Download className="w-3.5 h-3.5 text-stone-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Store Profile, Payment Accounts & Thermal Settings */}
        <div className="lg:col-span-7 space-y-5">
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

          {/* Order Deletion Manager Password Change Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    အမှာစာဖျက်ရန် လျှို့ဝှက်စကားဝှက်
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    မှားယွင်းဖွင့်ထားသော အမှာစာဖျက်ရန် မန်နေဂျာ လျှို့ဝှက်စကားဝှက် ပြောင်းလဲသတ်မှတ်ခြင်း
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                Password Protected
              </span>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Old Password */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ယခင် လျှို့ဝှက်စကားဝှက် *
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPass ? 'text' : 'password'}
                      required
                      value={oldPassword}
                      onChange={(e) => {
                        setOldPassword(e.target.value);
                        setPassError(null);
                        setPassSuccess(null);
                      }}
                      placeholder="လက်ရှိ စကားဝှက် ရိုက်ထည့်ပါ..."
                      className="w-full text-xs sm:text-sm px-3 py-2 pr-8 rounded-xl border border-stone-200 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    စကားဝှက် အသစ် *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPassError(null);
                        setPassSuccess(null);
                      }}
                      placeholder="စကားဝှက်အသစ်..."
                      className="w-full text-xs sm:text-sm px-3 py-2 pr-8 rounded-xl border border-stone-200 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
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
                    placeholder="ထပ်မံရိုက်ထည့်ပါ..."
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden"
                  />
                </div>
              </div>

              {passError && (
                <p className="text-xs font-bold text-red-600 flex items-center gap-1 animate-fadeIn">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passError}</span>
                </p>
              )}

              {passSuccess && (
                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fadeIn">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passSuccess}</span>
                </p>
              )}

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] text-stone-400">
                  💡 စကားဝှက် အသစ် မပြောင်းမီ ယခင်စကားဝှက် မှန်ကန်မှသာ အသစ်သတ်မှတ်နိုင်ပါမည်။
                </span>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>စကားဝှက် အသစ် ပြောင်းမည်</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
