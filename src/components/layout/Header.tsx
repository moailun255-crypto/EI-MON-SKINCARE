import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { BrandLogo } from '../common/BrandLogo';
import {
  ShoppingCart,
  CloudOff,
  RefreshCw,
  Clock,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  UserCheck,
  Languages,
} from 'lucide-react';
import { getSoundMuted, setSoundMuted } from '../../utils/scannerSound';

interface HeaderProps {
  onOpenMobileCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileCart }) => {
  const {
    storeProfile,
    cartItemCount,
    activeTab,
    isCloudConnected,
    cloudSyncStatus,
    syncNowWithCloud,
    useMyanmarDigits,
    toggleMyanmarDigits,
    updateStoreProfile,
    setActiveTab,
  } = useStore();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(getSoundMuted());
  const [isChangingCashier, setIsChangingCashier] = useState<boolean>(false);
  const [newCashierName, setNewCashierName] = useState<string>(storeProfile.activeCashier || '');

  // Live digital clock (Myanmar Standard Time / Local)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleToggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    setSoundMuted(nextState);
  };

  const handleSaveCashier = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCashierName.trim()) {
      updateStoreProfile({ activeCashier: newCashierName.trim() });
      setIsChangingCashier(false);
    }
  };

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs h-14 sm:h-15">
      <div className="max-w-7xl mx-auto h-full px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand identity & System Tagline */}
        <div className="flex items-center gap-3 shrink-0">
          <BrandLogo size="md" />
          <div className="hidden lg:flex flex-col border-l border-stone-200 pl-3">
            <span className="text-[11px] font-black tracking-tight text-stone-800 leading-tight">
              အိမွန် အလှကုန် အရောင်းဆိုင်
            </span>
            <span className="text-[9px] text-rose-600 font-semibold leading-tight">
              SMART POS & RETAIL SYSTEM
            </span>
          </div>
        </div>

        {/* Center Live Clock (Visible on md, lg, xl screens) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="font-mono text-xs font-bold tracking-tight text-stone-900">
            {currentTime}
          </span>
          <span className="text-[10px] text-stone-400 font-medium">| {currentDate}</span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Supabase Cloud Live Sync status indicator */}
          <button
            type="button"
            onClick={() => {
              if (!isCloudConnected) {
                setActiveTab('security');
              } else {
                syncNowWithCloud();
              }
            }}
            title={
              isCloudConnected
                ? 'Supabase Cloud ချိတ်ဆက်ထားသည် (ကလစ်နှိပ်၍ အခုချက်ချင်း Refresh ပြုလုပ်ပါ)'
                : 'အော့ဖ်လိုင်း (Supabase Cloud ချိတ်ဆက်ရန် နှိပ်ပါ)'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
              isCloudConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            {cloudSyncStatus === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
            ) : isCloudConnected ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <CloudOff className="w-3 h-3 text-amber-600" />
            )}
            <span className="text-[11px] hidden sm:inline font-bold">
              {cloudSyncStatus === 'syncing'
                ? 'Syncing...'
                : isCloudConnected
                ? 'Cloud Realtime'
                : 'Cloud Offline'}
            </span>
          </button>

          {/* Cashier profile info with click to switch */}
          <button
            type="button"
            onClick={() => {
              setNewCashierName(storeProfile.activeCashier);
              setIsChangingCashier(true);
            }}
            title="ငွေကိုင်အမည် ပြောင်းလဲရန် နှိပ်ပါ"
            className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl bg-stone-50 border border-stone-200 hover:border-rose-300 transition-colors cursor-pointer shadow-2xs"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              {storeProfile.activeCashier.charAt(0) || 'င'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[8px] text-stone-400 uppercase font-semibold leading-none">
                တာဝန်ကျ
              </p>
              <p className="text-[11px] font-bold text-stone-800 leading-tight truncate max-w-[85px]">
                {storeProfile.activeCashier}
              </p>
            </div>
          </button>

          {/* Quick Utility Tools Group */}
          <div className="flex items-center gap-1 pl-1 border-l border-stone-200">
            {/* Quick Digit Toggle (English 123 vs Myanmar ၁၂၃) */}
            <button
              type="button"
              onClick={toggleMyanmarDigits}
              title={useMyanmarDigits ? 'Switch to English Numbers (123)' : 'မြန်မာဂဏန်းပြောင်းမည် (၁၂၃)'}
              className="px-2 py-1.5 rounded-xl text-xs font-bold border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Languages className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-[11px] font-mono font-bold">{useMyanmarDigits ? '၁၂၃' : '123'}</span>
            </button>

            {/* Sound Mute Toggle */}
            <button
              type="button"
              onClick={handleToggleMute}
              title={isMuted ? 'အသံဖွင့်မည် (Sound ON)' : 'အသံပိတ်မည် (Mute Sound)'}
              className={`p-1.5 sm:p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                isMuted
                  ? 'bg-stone-100 border-stone-200 text-stone-400 hover:text-stone-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Fullscreen Toggle (desktop/tablet) */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'မျက်နှာပြင် အပြည့်မှ ထွက်မည်' : 'မျက်နှာပြင် အပြည့်သုံးမည် (Fullscreen)'}
              className="hidden sm:flex p-1.5 sm:p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer shadow-2xs"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Mobile Cart Button */}
            {activeTab === 'pos' && onOpenMobileCart && (
              <button
                type="button"
                onClick={onOpenMobileCart}
                className="md:hidden relative p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-xs flex items-center justify-center cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-stone-900 font-extrabold text-[10px] rounded-full w-5 h-5 flex items-center justify-center shadow-xs">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cashier Quick Switch Modal */}
      {isChangingCashier && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
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
                value={newCashierName}
                onChange={(e) => setNewCashierName(e.target.value)}
                placeholder="ဥပမာ - အိမွန်၊ ဝန်ထမ်း ၁"
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingCashier(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  ပြောင်းမည်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
