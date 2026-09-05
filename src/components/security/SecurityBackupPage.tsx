import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { StoreProfile } from '../../types';
import {
  ShieldCheck,
  Download,
  Upload,
  FileSpreadsheet,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Store,
  Printer,
} from 'lucide-react';

export const SecurityBackupPage: React.FC = () => {
  const {
    storeProfile,
    updateStoreProfile,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetToSampleData,
    products,
    orders,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileForm, setProfileForm] = useState<StoreProfile>({ ...storeProfile });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

          {/* Reset Demo Data */}
          <div className="bg-red-50/50 p-4 rounded-2xl border border-red-200 space-y-2">
            <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>စနစ်စတင်အခြေအနေသို့ ပြန်ထားမည်</span>
            </h4>
            <p className="text-[11px] text-red-700">
              စမ်းသပ်ဒေတာများကို မူလအခြေအနေအတိုင်း ပြန်လည်သတ်မှတ်လိုပါက အသုံးပြုပါ။
            </p>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              ပြန်လည်သတ်မှတ်မည်
            </button>
          </div>
        </div>

        {/* Right Column (7 cols): Store Profile, Payment Accounts & Thermal Settings */}
        <div className="lg:col-span-7">
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
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                မူလ စမ်းသပ်ဒေတာများသို့ ပြန်ထားမည်မှာ သေချာပါသလား?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                လက်ရှိ အရောင်းမှတ်တမ်းများအားလုံးကို မူလနမူနာဒေတာဖြင့် ပြန်လည်အစားထိုးပါမည်။
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 cursor-pointer"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                onClick={() => {
                  resetToSampleData();
                  setShowResetConfirm(false);
                  showToast('မူလဒေတာများဖြင့် ပြန်လည်စတင်ပြီးပါပြီ');
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                ပြန်လည်သတ်မှတ်မည်
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
