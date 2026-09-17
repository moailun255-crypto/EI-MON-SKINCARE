import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { PageTab } from '../../types';
import { formatMMK } from '../../utils/format';
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
  Sparkles,
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
  const todayCompletedOrders = useMemo(
    () => orders.filter((o) => o.createdAt.startsWith(todayStr) && o.status === 'completed'),
    [orders, todayStr]
  );
  const todayRevenue = useMemo(
    () => todayCompletedOrders.reduce((sum, o) => sum + o.grandTotal, 0),
    [todayCompletedOrders]
  );

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

  const navItems: {
    id: PageTab;
    title: string;
    titleTablet: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'pos',
      title: 'အရောင်းကောင်တာ (POS)',
      titleTablet: 'အရောင်း',
      icon: <Store className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'products',
      title: 'ကုန်ပစ္စည်းများ',
      titleTablet: 'ကုန်ပစ္စည်း',
      icon: <Boxes className="w-4 h-4 shrink-0" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500 text-stone-900',
    },
    {
      id: 'add-product',
      title: 'အသစ်ထည့်',
      titleTablet: 'အသစ်ထည့်',
      icon: <Plus className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'transactions',
      title: 'အရောင်းမှတ်တမ်း',
      titleTablet: 'မှတ်တမ်း',
      icon: <ReceiptText className="w-4 h-4 shrink-0" />,
      badge: todayCompletedOrders.length > 0 ? todayCompletedOrders.length : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'finance',
      title: 'ဘဏ္ဍာရေးနှင့် စာရင်း',
      titleTablet: 'ဘဏ္ဍာရေး',
      icon: <TrendingUp className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'security',
      title: 'လုံခြုံရေးနှင့် Cloud',
      titleTablet: 'လုံခြုံရေး',
      icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
    },
  ];

  const isMoreTabActive = activeTab === 'finance' || activeTab === 'security';

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP & TABLET DEDICATED NAVIGATION RIBBON                              */}
      {/* Clean, high contrast, non-crowded bar sitting directly under header       */}
      {/* ========================================================================= */}
      <nav className="hidden sm:block sticky top-13 sm:top-14 z-25 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-2xs shrink-0">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-5 py-1.5 flex items-center justify-between gap-2 lg:gap-3">
          {/* Left: Optional Quick Back to POS button & Primary Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto scrollbar-none py-0.5 overscroll-x-contain touch-pan-x">
            {activeTab !== 'pos' && (
              <button
                type="button"
                onClick={() => setActiveTab('pos')}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0 mr-0.5"
                title="အရောင်းကောင်တာသို့ ပြန်သွားမည် (Back to POS)"
              >
                <ArrowLeft className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="hidden md:inline">အရောင်းသို့</span>
                <span className="inline md:hidden">အရောင်း</span>
              </button>
            )}

            {/* The 6 Primary Navigation Tabs */}
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 md:gap-2 px-2.5 sm:px-2.5 md:px-3 lg:px-3.5 py-1.5 md:py-2 rounded-xl text-xs lg:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px] md:min-h-[40px] select-none app-touch-btn active:scale-98 ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-xs shadow-rose-300 font-extrabold scale-[1.01]'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/90'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-stone-500'}>
                    {item.icon}
                  </span>
                  <span className="hidden lg:inline">{item.title}</span>
                  <span className="inline lg:hidden">{item.titleTablet}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded-full leading-tight ${
                        isActive
                          ? 'bg-white text-rose-700'
                          : item.badgeColor || 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right (Desktop xl+): Realtime Daily POS Pulse */}
          <div className="hidden xl:flex items-center gap-2.5 shrink-0 pl-3 border-l border-stone-200">
            <div className="text-right">
              <p className="text-[9px] text-stone-400 font-bold uppercase leading-none">
                ယနေ့ ရောင်းရငွေ
              </p>
              <p className="text-xs font-black text-emerald-700 leading-tight">
                {formatMMK(todayRevenue, useMyanmarDigits)}
              </p>
            </div>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Smart Ergonomic 5-Slot Layout for Phones)   */}
      {/* ========================================================================= */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200/90 px-2 pt-1 pb-[max(8px,env(safe-area-inset-bottom,8px))] flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none">
        {/* 1. POS */}
        <button
          type="button"
          onClick={() => setActiveTab('pos')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all app-touch-btn cursor-pointer min-h-[46px] min-w-[56px] ${
            activeTab === 'pos'
              ? 'text-rose-600 font-extrabold bg-rose-50/80'
              : 'text-stone-500 hover:text-stone-900 active:bg-stone-100'
          }`}
        >
          <Store className={`w-5 h-5 ${activeTab === 'pos' ? 'stroke-[2.5] text-rose-600 scale-105' : ''}`} />
          <span className="text-[10px] font-bold tracking-tight mt-0.5">အရောင်း</span>
        </button>

        {/* 2. Products */}
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all app-touch-btn cursor-pointer relative min-h-[46px] min-w-[56px] ${
            activeTab === 'products'
              ? 'text-rose-600 font-extrabold bg-rose-50/80'
              : 'text-stone-500 hover:text-stone-900 active:bg-stone-100'
          }`}
        >
          <div className="relative">
            <Boxes className={`w-5 h-5 ${activeTab === 'products' ? 'stroke-[2.5] text-rose-600 scale-105' : ''}`} />
            {lowStockCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-stone-900 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-2xs">
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
          className="flex flex-col items-center justify-center -mt-5 cursor-pointer focus:outline-hidden app-touch-btn"
          title="ကုန်ပစ္စည်းအသစ် ထည့်သွင်းမည်"
        >
          <div
            className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white transition-all ${
              activeTab === 'add-product'
                ? 'bg-rose-700 text-white ring-3 ring-rose-400/50 shadow-rose-500/40'
                : 'bg-rose-600 text-white shadow-rose-600/30'
            }`}
          >
            <Plus className="w-6 h-6 stroke-[2.7]" />
          </div>
          <span className="text-[9px] font-black text-rose-700 mt-0.5 tracking-tight">အသစ်ထည့်</span>
        </button>

        {/* 4. Orders / Transactions */}
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all app-touch-btn cursor-pointer relative min-h-[46px] min-w-[56px] ${
            activeTab === 'transactions'
              ? 'text-rose-600 font-extrabold bg-rose-50/80'
              : 'text-stone-500 hover:text-stone-900 active:bg-stone-100'
          }`}
        >
          <div className="relative">
            <ReceiptText className={`w-5 h-5 ${activeTab === 'transactions' ? 'stroke-[2.5] text-rose-600 scale-105' : ''}`} />
            {todayCompletedOrders.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                {todayCompletedOrders.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">မှတ်တမ်း</span>
        </button>

        {/* 5. More / Menu Drawer */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all app-touch-btn cursor-pointer relative min-h-[46px] min-w-[56px] ${
            isMoreTabActive
              ? 'text-rose-600 font-extrabold bg-rose-50/80'
              : 'text-stone-500 hover:text-stone-900 active:bg-stone-100'
          }`}
        >
          <div className="relative">
            <Menu className={`w-5 h-5 ${isMoreTabActive ? 'stroke-[2.5] text-rose-600 scale-105' : ''}`} />
            {isMoreTabActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full border border-white" />
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
          <div className="bg-white w-full rounded-t-3xl shadow-2xl p-5 pb-[max(20px,env(safe-area-inset-bottom,20px))] border-t border-stone-200 max-h-[85vh] overflow-y-auto space-y-4 animate-slideUp">
            {/* Native Sheet Pull Drag Bar */}
            <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto -mt-1 mb-2" />

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
                className="p-2 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 cursor-pointer app-touch-btn"
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
                className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-sm flex items-center justify-between transition-colors app-touch-btn cursor-pointer shadow-2xs"
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
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all app-touch-card cursor-pointer ${
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
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all app-touch-card cursor-pointer ${
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
                  className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-xs font-bold text-stone-700 app-touch-btn cursor-pointer shadow-2xs"
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
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-xs font-bold text-stone-700 flex items-center gap-1 app-touch-btn cursor-pointer shadow-2xs"
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
                  className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100 flex items-center justify-center gap-2 font-bold text-xs app-touch-btn cursor-pointer"
                >
                  <Languages className="w-4 h-4 text-stone-500" />
                  <span>{useMyanmarDigits ? 'မြန်မာဂဏန်း (၁၂၃)' : 'English Numbers (123)'}</span>
                </button>

                {/* Sound */}
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100 flex items-center justify-center gap-2 font-bold text-xs app-touch-btn cursor-pointer"
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
