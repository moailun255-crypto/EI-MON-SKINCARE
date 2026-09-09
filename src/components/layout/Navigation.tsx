import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PageTab } from '../../types';
import {
  Store,
  Boxes,
  Plus,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  Menu,
  X,
  ArrowLeft,
  RefreshCw,
  Languages,
  Volume2,
  VolumeX,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { getSoundMuted, setSoundMuted } from '../../utils/scannerSound';

export const Navigation: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    goBack,
    canGoBack,
    products,
    orders,
    storeProfile,
    isCloudConnected,
    cloudSyncStatus,
    syncNowWithCloud,
    useMyanmarDigits,
    toggleMyanmarDigits,
    updateStoreProfile,
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(getSoundMuted());
  const [isChangingCashier, setIsChangingCashier] = useState(false);
  const [cashierInput, setCashierInput] = useState(storeProfile.activeCashier || '');

  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrdersCount = orders.filter((o) => o.createdAt.startsWith(todayStr)).length;

  const handleToggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    setSoundMuted(next);
  };

  const handleSaveCashier = (e: React.FormEvent) => {
    e.preventDefault();
    if (cashierInput.trim()) {
      updateStoreProfile({ activeCashier: cashierInput.trim() });
      setIsChangingCashier(false);
    }
  };

  const isMoreTabActive = activeTab === 'finance' || activeTab === 'security';

  const desktopNavItems: {
    id: PageTab;
    titleMy: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'pos',
      titleMy: 'အရောင်းကောင်တာ (POS)',
      icon: <Store className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'products',
      titleMy: 'ကုန်ပစ္စည်းများ (Products)',
      icon: <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500 text-stone-900',
    },
    {
      id: 'add-product',
      titleMy: 'ပစ္စည်းအသစ်ထည့်ရန် (+ Add)',
      icon: <Plus className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'transactions',
      titleMy: 'အရောင်းမှတ်တမ်း (Orders)',
      icon: <ReceiptText className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: todayOrdersCount > 0 ? todayOrdersCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'finance',
      titleMy: 'ဘဏ္ဍာရေးနှင့် စာရင်း (Finance)',
      icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'security',
      titleMy: 'လုံခြုံရေးနှင့် သိမ်းဆည်းမှု (Security)',
      icon: <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Navigation Bar */}
      <nav className="hidden sm:block bg-stone-900 text-stone-300 border-b border-stone-800 shadow-inner sticky top-[57px] sm:top-[61px] z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between gap-2 py-1.5">
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-0.5">
              {/* Tablet / Desktop Back to POS quick action if inside sub-pages */}
              {activeTab !== 'pos' && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-rose-300 border border-stone-700 transition-all cursor-pointer mr-1 active:scale-95 shrink-0"
                  title="နောက်သို့ ပြန်သွားမည် (Go Back)"
                >
                  <ArrowLeft className="w-4 h-4 text-rose-400" />
                  <span>နောက်သို့ (Back)</span>
                </button>
              )}

              {desktopNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 relative cursor-pointer min-h-[40px] ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-stone-300 hover:text-white hover:bg-stone-800/90'
                    }`}
                  >
                    {item.icon}
                    <span>{item.titleMy}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`ml-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          item.badgeColor || 'bg-rose-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Direct Quick Return to POS shortcut on tablet */}
            {activeTab !== 'pos' && (
              <button
                type="button"
                onClick={() => setActiveTab('pos')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/60 transition-colors cursor-pointer shrink-0"
              >
                <Store className="w-3.5 h-3.5 text-rose-400" />
                <span>အရောင်းကောင်တာ (POS) သို့</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Smart Ergonomic 5-Slot Layout for Phones) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1 flex items-center justify-around shadow-lg">
        {/* 1. POS */}
        <button
          type="button"
          onClick={() => setActiveTab('pos')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-h-[48px] ${
            activeTab === 'pos' ? 'text-rose-600 font-extrabold' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Store className={`w-5 h-5 ${activeTab === 'pos' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-bold tracking-tight mt-0.5">အရောင်း</span>
        </button>

        {/* 2. Products */}
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer relative min-h-[48px] ${
            activeTab === 'products' ? 'text-rose-600 font-extrabold' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <div className="relative">
            <Boxes className={`w-5 h-5 ${activeTab === 'products' ? 'stroke-[2.5]' : ''}`} />
            {lowStockCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-amber-500 text-stone-900 text-[9px] font-black px-1 rounded-full">
                {lowStockCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">ပစ္စည်းများ</span>
        </button>

        {/* 3. Add Product Center Floating Action Button */}
        <button
          type="button"
          onClick={() => setActiveTab('add-product')}
          className="flex flex-col items-center justify-center -mt-4 cursor-pointer focus:outline-hidden active:scale-95 transition-transform"
          title="ကုန်ပစ္စည်းအသစ် ထည့်သွင်းမည်"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all ${
              activeTab === 'add-product'
                ? 'bg-rose-700 text-white ring-2 ring-rose-400'
                : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[9px] font-black text-rose-700 mt-0.5 tracking-tight">အသစ်ထည့်</span>
        </button>

        {/* 4. Orders / Transactions */}
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer relative min-h-[48px] ${
            activeTab === 'transactions' ? 'text-rose-600 font-extrabold' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <div className="relative">
            <ReceiptText className={`w-5 h-5 ${activeTab === 'transactions' ? 'stroke-[2.5]' : ''}`} />
            {todayOrdersCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1 rounded-full">
                {todayOrdersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">မှတ်တမ်း</span>
        </button>

        {/* 5. More / Menu Drawer */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer relative min-h-[48px] ${
            isMoreTabActive ? 'text-rose-600 font-extrabold' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <div className="relative">
            <Menu className={`w-5 h-5 ${isMoreTabActive ? 'stroke-[2.5]' : ''}`} />
            {isMoreTabActive && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">မီနူး</span>
        </button>
      </nav>

      {/* Mobile Slide-Up Quick Menu Sheet */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex flex-col justify-end animate-fadeIn">
          {/* Backdrop Click Dismiss */}
          <div
            className="flex-1 w-full"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Bottom Sheet Modal */}
          <div className="bg-white w-full rounded-t-3xl shadow-2xl p-5 border-t border-stone-200 max-h-[85vh] overflow-y-auto space-y-4 animate-slideUp">
            {/* Sheet Handle and Title */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
                  <span>အိမွန် မီနူးနှင့် စီမံခန့်ခွဲမှု</span>
                </h3>
                <p className="text-xs text-stone-500">EI MON SKINCARE • စနစ်ဆိုင်ရာ အမြန်မီနူးများ</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Back to POS Prominent Button */}
            {activeTab !== 'pos' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('pos');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-sm flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowLeft className="w-5 h-5 text-rose-600" />
                  <span>အရောင်းကောင်တာသို့ ပြန်သွားမည်</span>
                </div>
                <span className="text-xs font-semibold text-rose-600">POS &rarr;</span>
              </button>
            )}

            {/* Primary Menu Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Finance & Analytics */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('finance');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                  activeTab === 'finance'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2 rounded-xl ${
                      activeTab === 'finance' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  {activeTab === 'finance' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">ဘဏ္ဍာရေးနှင့် စာရင်း</h4>
                  <p className={`text-[10px] mt-0.5 ${activeTab === 'finance' ? 'text-rose-100' : 'text-stone-500'}`}>
                    ဝင်ငွေ၊ အမြတ်နှင့် စာရင်း
                  </p>
                </div>
              </button>

              {/* Security & Backup */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('security');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2 rounded-xl ${
                      activeTab === 'security' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  {activeTab === 'security' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">လုံခြုံရေးနှင့် သိမ်းဆည်းမှု</h4>
                  <p className={`text-[10px] mt-0.5 ${activeTab === 'security' ? 'text-rose-100' : 'text-stone-500'}`}>
                    Cloud ချိတ်ဆက်မှုနှင့် Backup
                  </p>
                </div>
              </button>
            </div>

            {/* Quick Action Rows */}
            <div className="space-y-2 pt-1 border-t border-stone-100">
              {/* Cashier profile & switch */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                    {storeProfile.activeCashier?.charAt(0) || 'င'}
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 font-bold uppercase">တာဝန်ကျ ငွေကိုင်</p>
                    <p className="text-xs font-bold text-stone-800">{storeProfile.activeCashier}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCashierInput(storeProfile.activeCashier || '');
                    setIsChangingCashier(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-xs font-bold text-stone-700 cursor-pointer shadow-2xs"
                >
                  ပြောင်းလဲမည်
                </button>
              </div>

              {/* Cloud Sync Status */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <div>
                    <p className="text-xs font-bold text-stone-800">
                      {isCloudConnected ? 'Supabase Cloud Realtime' : 'အော့ဖ်လိုင်း (Offline)'}
                    </p>
                    <p className="text-[10px] text-stone-500">
                      {isCloudConnected ? 'ဒေတာများ တပြိုင်တည်း ချိတ်ဆက်ထားပါသည်' : 'Cloud နှင့် မချိတ်ဆက်ရသေးပါ'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => syncNowWithCloud()}
                  disabled={cloudSyncStatus === 'syncing'}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-xs font-bold text-stone-700 flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-rose-600 ${cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* System Toggles: Numbers & Sound */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Digit mode */}
                <button
                  type="button"
                  onClick={toggleMyanmarDigits}
                  className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100 flex items-center justify-center gap-2 font-bold text-xs cursor-pointer"
                >
                  <Languages className="w-4 h-4 text-stone-500" />
                  <span>{useMyanmarDigits ? 'မြန်မာဂဏန်း (၁၂၃)' : 'English Numbers (123)'}</span>
                </button>

                {/* Sound */}
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100 flex items-center justify-center gap-2 font-bold text-xs cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-rose-600" />}
                  <span>{isMuted ? 'အသံပိတ်ထားသည်' : 'အသံဖွင့်ထားသည်'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cashier Change Dialog */}
      {isChangingCashier && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 animate-fadeIn">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-2xl bg-rose-100 text-rose-700">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">ငွေကိုင်အမည် ပြောင်းလဲမည်</h3>
                <p className="text-xs text-stone-500">တာဝန်ကျ ငွေကိုင်အမည် ရိုက်ထည့်ပါ</p>
              </div>
            </div>

            <form onSubmit={handleSaveCashier} className="space-y-3">
              <input
                type="text"
                value={cashierInput}
                onChange={(e) => setCashierInput(e.target.value)}
                placeholder="ငွေကိုင်အမည်..."
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-rose-500 focus:outline-hidden"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingCashier(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  သိမ်းဆည်းမည်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
