import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { SUPABASE_SCHEMA_SQL } from '../../lib/supabaseSchema';
import {
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  Copy,
  Check,
  Code2,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Laptop,
  Radio,
  AlertCircle,
  Lock,
  Unlock,
  KeyRound,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

export const SupabaseSyncCard: React.FC = () => {
  const {
    isCloudConnected,
    cloudSyncStatus,
    cloudError,
    needsTableSetup,
    supabaseConfig,
    updateSupabaseConfig,
    disconnectSupabase,
    syncNowWithCloud,
    verifyDeletePassword,
    storeProfile,
  } = useStore();

  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Security password lock state for modifying Supabase credentials
  const hasExistingConfig = Boolean(supabaseConfig.url && supabaseConfig.anonKey);
  const [isUnlocked, setIsUnlocked] = useState(!hasExistingConfig);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [verifyPasswordInput, setVerifyPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [showKeySecret, setShowKeySecret] = useState(false);

  // Derive project ref for direct SQL link
  const match = (url || supabaseConfig.url).match(/https:\/\/([a-zA-Z0-9_-]+)\.supabase\.co/);
  const projectRef = match ? match[1] : 'ywtzyjtcdhyafxjapqlw';
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  const handleOpenUnlockModal = () => {
    setVerifyPasswordInput('');
    setPasswordError(null);
    setShowUnlockModal(true);
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPasswordInput.trim()) {
      setPasswordError('ကျေးဇူးပြု၍ စီမံခန့်ခွဲသူ လျှို့ဝှက်စကားဝှက် ရိုက်ထည့်ပါ (请输入管理员安全密码)');
      return;
    }

    if (verifyDeletePassword(verifyPasswordInput.trim())) {
      setIsUnlocked(true);
      setShowUnlockModal(false);
      setPasswordError(null);
      setActionFeedback({
        type: 'success',
        message: 'စကားဝှက် အောင်မြင်ပါသည်! ယခု Supabase ချိတ်ဆက်မှု အချက်အလက်များကို ပြင်ဆင်နိုင်ပါပြီ (安全核验通过，已解锁配置编辑权限)',
      });
    } else {
      setPasswordError('လျှို့ဝှက်စကားဝှက် မှားယွင်းနေပါသည် (管理员安全密码错误，核验失败)');
    }
  };

  const handleLockAgain = () => {
    setIsUnlocked(false);
    setUrl(supabaseConfig.url || '');
    setAnonKey(supabaseConfig.anonKey || '');
    setShowKeySecret(false);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isUnlocked) {
      handleOpenUnlockModal();
      return;
    }

    if (!url.trim() || !anonKey.trim()) {
      setActionFeedback({
        type: 'error',
        message: 'ကျေးဇူးပြု၍ Supabase URL နှင့် Anon Key နှစ်ခုစလုံးကို ထည့်သွင်းပါ',
      });
      return;
    }

    setIsConnecting(true);
    setActionFeedback(null);
    try {
      const res = await updateSupabaseConfig({
        url: url.trim(),
        anonKey: anonKey.trim(),
      });
      if (res.success) {
        setActionFeedback({
          type: 'success',
          message: res.message,
        });
        // Auto lock after successful save for safety
        setIsUnlocked(false);
      } else {
        setActionFeedback({
          type: 'error',
          message: res.message,
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'ချိတ်ဆက်မှု မအောင်မြင်ပါ',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWithCheck = () => {
    if (!isUnlocked) {
      handleOpenUnlockModal();
      return;
    }
    if (window.confirm('Supabase Cloud ချိတ်ဆက်မှုကို ဖြုတ်ရန် သေချာပါသလား? အော့ဖ်လိုင်းစနစ်ဖြင့်သာ အလုပ်လုပ်တော့မည် ဖြစ်ပါသည် (确定断开云端同步？)')) {
      disconnectSupabase();
      setIsUnlocked(true);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2.5 rounded-2xl ${
              isCloudConnected
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            {isCloudConnected ? (
              <CloudCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Cloud className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
                Supabase Cloud စနစ်နှင့် စက်အားလုံး ဒေတာတပြိုင်တည်းချိတ်ဆက်မှု
              </h3>
              {isCloudConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  ချိတ်ဆက်ထားသည်
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600">
                  <CloudOff className="w-3 h-3" />
                  အော့ဖ်လိုင်း (Local Storage)
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              ဖုန်း၊ ကွန်ပျူတာနှင့် တက်ဘလက် စသည့် စက်ပစ္စည်းအားလုံးတွင် ပစ္စည်းစာရင်း၊ ငွေစာရင်းနှင့် အမှာစာများ အချိန်နှင့်တပြေးညီ အလိုအလျောက် တပြိုင်တည်း (Realtime Sync) ဖြစ်နေမည်ဖြစ်သည်
            </p>
          </div>
        </div>

        {/* Sync now button if connected */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isCloudConnected && (
            <button
              type="button"
              onClick={syncNowWithCloud}
              disabled={cloudSyncStatus === 'syncing'}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  cloudSyncStatus === 'syncing' ? 'animate-spin text-rose-600' : ''
                }`}
              />
              <span>
                {cloudSyncStatus === 'syncing' ? 'စင့်ခ်လုပ်နေသည်...' : 'ပြန်လည်စင့်ခ်လုပ်မည်'}
              </span>
            </button>
          )}

          {isCloudConnected && (
            <button
              type="button"
              onClick={handleDisconnectWithCheck}
              className="px-3 py-2 rounded-xl text-stone-500 hover:text-rose-600 text-xs font-semibold cursor-pointer"
            >
              ဖြုတ်မည်
            </button>
          )}
        </div>
      </div>

      {/* Multi-device Realtime feature banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800">အချိန်နှင့်တပြေးညီ (Realtime)</p>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
              ကောင်တာတစ်ခုတွင် ဘောင်ချာဖြတ်လိုက်သည်နှင့် အခြားဖုန်းများတွင် ချက်ချင်း အလိုအလျောက် ပေါ်လာမည်
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800">လုံခြုံစိတ်ချရမှု (Cloud Backup)</p>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
              ဖုန်းပျောက်ခြင်း၊ ကွန်ပျူတာပျက်ခြင်း ဖြစ်ခဲ့ပါကလည်း Cloud တွင် ဒေတာများ လုံခြုံစွာ ကျန်ရှိနေမည်
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800">စက်စုံ သုံးနိုင်ခြင်း (Multi-device)</p>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
              စတိုးမန်နေဂျာနှင့် ငွေကိုင်များ အားလုံး တပြိုင်နက်တည်း အသုံးပြုနိုင်ပါသည်
            </p>
          </div>
        </div>
      </div>

      {/* Security Protection Header Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl shrink-0 ${isUnlocked ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
            {isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-stone-900">
                {isUnlocked ? 'ပြင်ဆင်ခွင့် ဖွင့်ထားသည် (已解锁编辑权限)' : 'လုံခြုံရေးစကားဝှက်ဖြင့် ကာကွယ်ထားသည် (修改受密码保护)'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${isUnlocked ? 'bg-amber-200 text-amber-900' : 'bg-stone-200 text-stone-700'}`}>
                {isUnlocked ? 'Unlocked' : 'Protected'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              ဝန်ထမ်းများ အမှားယွင်းဖြင့် မပြင်ဆင်မိစေရန် Supabase URL နှင့် Public Key ပြင်ဆင်ခြင်းကို စီမံခန့်ခွဲသူ စကားဝှက်ဖြင့် ကာကွယ်ထားပါသည် (防止员工误触或擅自修改)
            </p>
          </div>
        </div>

        <div>
          {isUnlocked ? (
            <button
              type="button"
              onClick={handleLockAgain}
              className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              <span>ချက်ချင်း ပြန်ပိတ်မည် (锁定)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenUnlockModal}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>စကားဝှက်ဖြင့် ဖွင့်မည် (核验密码解锁)</span>
            </button>
          )}
        </div>
      </div>

      {/* Cloud Configuration Form */}
      <form onSubmit={handleConnect} className="space-y-4 pt-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-stone-700">
                Supabase Project URL
              </label>
              {!isUnlocked && (
                <span className="text-[10px] text-stone-400 flex items-center gap-1 font-medium">
                  <Lock className="w-2.5 h-2.5 text-stone-400" /> ပြင်ဆင်ရန် သော့ခတ်ထားသည်
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                disabled={!isUnlocked}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxxxxxxx.supabase.co"
                className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border font-mono outline-hidden transition-all ${
                  isUnlocked
                    ? 'border-stone-300 bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-200'
                    : 'border-stone-200 bg-stone-100/80 text-stone-500 cursor-not-allowed select-none'
                }`}
              />
              {!isUnlocked && (
                <button
                  type="button"
                  onClick={handleOpenUnlockModal}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-white/90 px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs cursor-pointer"
                >
                  ပြင်ဆင်မည်
                </button>
              )}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-stone-700">
                Supabase Anon Public Key
              </label>
              <div className="flex items-center gap-2">
                {isUnlocked && (
                  <button
                    type="button"
                    onClick={() => setShowKeySecret(!showKeySecret)}
                    className="text-[10px] text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                  >
                    {showKeySecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showKeySecret ? 'ဝှက်မည်' : 'ပြမည်'}</span>
                  </button>
                )}
                {!isUnlocked && (
                  <span className="text-[10px] text-stone-400 flex items-center gap-1 font-medium">
                    <Lock className="w-2.5 h-2.5 text-stone-400" /> ပြင်ဆင်ရန် သော့ခတ်ထားသည်
                  </span>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                type={showKeySecret || !isUnlocked ? 'text' : 'password'}
                disabled={!isUnlocked}
                value={
                  !isUnlocked && anonKey
                    ? `${anonKey.slice(0, 10)}••••••••••••••••${anonKey.slice(-6)}`
                    : anonKey
                }
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border font-mono outline-hidden transition-all ${
                  isUnlocked
                    ? 'border-stone-300 bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-200'
                    : 'border-stone-200 bg-stone-100/80 text-stone-500 cursor-not-allowed select-none'
                }`}
              />
              {!isUnlocked && (
                <button
                  type="button"
                  onClick={handleOpenUnlockModal}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-white/90 px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs cursor-pointer"
                >
                  ပြင်ဆင်မည်
                </button>
              )}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Supabase Dashboard &gt; Project Settings &gt; API &gt; anon / public key
            </p>
          </div>
        </div>

        {actionFeedback && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {actionFeedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
        )}

        {needsTableSetup && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-stone-800 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs sm:text-sm text-stone-900">
                  ⚠️ Supabase 项目连接成功，但尚未建立数据表！
                </p>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  Supabase ချိတ်ဆက်မိသော်လည်း Database ဇယားများ မရှိသေးပါ။ အောက်ပါ SQL Script ကို ကူးယူပြီး Supabase SQL Editor တွင် Run ပေးပါရန်။
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1 pl-7">
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? '已复制 SQL!' : '一键复制建表 SQL'}</span>
              </button>
              <a
                href={sqlEditorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>打开 Supabase SQL Editor</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={syncNowWithCloud}
                disabled={cloudSyncStatus === 'syncing'}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>我已运行 SQL，立即同步</span>
              </button>
            </div>
          </div>
        )}

        {cloudError && !actionFeedback && !needsTableSetup && (
          <div className="p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>ချိတ်ဆက်မှု အခြေအနေ: {cloudError}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            {isUnlocked ? (
              <button
                type="submit"
                disabled={isConnecting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>စစ်ဆေးချိတ်ဆက်နေသည်...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>{isCloudConnected ? 'ချိတ်ဆက်မှု ပြင်ဆင်သိမ်းမည် (保存配置)' : 'Supabase နှင့် ချိတ်ဆက်မည်'}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenUnlockModal}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>စကားဝှက်ရိုက်ထည့်ပြီးမှ ပြင်ဆင်မည် (核验密码以修改)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-stone-500" />
              <span>{showSqlGuide ? 'SQL ဇယားလမ်းညွှန် ဝှက်မည်' : 'SQL Database Schema ဇယားများ ရယူရန်'}</span>
            </button>
          </div>

          <a
            href={sqlEditorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 underline-offset-4 hover:underline"
          >
            <span>Supabase SQL Editor သို့သွားရန်</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </form>

      {/* SQL Script Accordion */}
      {showSqlGuide && (
        <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div>
              <p className="font-bold text-xs sm:text-sm text-stone-200 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>Supabase SQL Database ဇယားများ တည်ဆောက်ခြင်း ညွှန်ကြားချက်</span>
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Supabase Dashboard &gt; SQL Editor သို့ ဤကုဒ်ကို ကူးယူထည့်သွင်း၍ "RUN" ခလုတ်ကို တစ်ကြိမ် နှိပ်ပေးပါ
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-700"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ကူးယူပြီးပါပြီ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>SQL အားလုံး ကူးယူမည်</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-stone-950 p-3 rounded-xl max-h-56 overflow-y-auto font-mono text-[11px] text-stone-300 border border-stone-800">
            <pre className="whitespace-pre-wrap">{SUPABASE_SCHEMA_SQL}</pre>
          </div>

          <div className="text-[11px] text-stone-400 space-y-1 pt-1">
            <p className="font-semibold text-stone-300">လွယ်ကူသော အဆင့် ၃ ဆင့်:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>အထက်ပါ SQL ကုဒ်ကို "SQL အားလုံး ကူးယူမည်" နှိပ်၍ Copy ယူပါ</li>
              <li>သင်၏ Supabase Project ၏ ဘယ်ဘက် မီနူးရှိ "SQL Editor" သို့သွားပြီး Paste လုပ်ပါ</li>
              <li>"RUN" ခလုတ်နှိပ်လိုက်ပါက Products, Orders, Expenses, StoreProfile ဇယားများနှင့် Realtime Sync များ အလိုအလျောက် အဆင်သင့်ဖြစ်သွားပါမည်</li>
            </ol>
          </div>
        </div>
      )}

      {/* Security Password Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-100 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    စီမံခန့်ခွဲသူ စကားဝှက် စစ်ဆေးခြင်း
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    管理员安全核验 (Supabase 云配置保护)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Supabase Project URL နှင့် Public Anon Key သည် ဆိုင်၏ Cloud ဒေတာ တပြိုင်တည်း ချိတ်ဆက်မှု အဓိက သော့ချက်ဖြစ်သောကြောင့် အခြားသူများ အမှားယွင်းဖြင့် မပြင်ဆင်နိုင်ရန် စီမံခန့်ခွဲသူ လျှို့ဝှက်စကားဝှက် ရိုက်ထည့်၍ အတည်ပြုပေးပါရန်။
            </p>

            <form onSubmit={handleVerifyPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  လုံခြုံရေး လျှို့ဝှက်စကားဝှက် (管理员安全密码)
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    autoFocus
                    value={verifyPasswordInput}
                    onChange={(e) => {
                      setVerifyPasswordInput(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="စကားဝှက် ရိုက်ထည့်ပါ..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 pr-10 rounded-xl border border-stone-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  * ဆိုင်မန်နေဂျာ သို့မဟုတ် စီမံခန့်ခွဲသူ လျှို့ဝှက်စကားဝှက်ဖြင့်သာ အတည်ပြုပြင်ဆင်နိုင်ပါသည်
                </p>
              </div>

              {passwordError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  မလုပ်တော့ပါ (取消)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>အတည်ပြုဖွင့်မည် (核验解锁)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

