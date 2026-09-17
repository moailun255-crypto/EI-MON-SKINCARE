import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Database,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  X,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const SESSION_LOCK_TIMEOUT_SECONDS = 180; // 3 minutes auto-lock
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_SECONDS = 60;

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
  } = useStore();

  // Airtight Security Lock States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(SESSION_LOCK_TIMEOUT_SECONDS);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Password Unlock Modal
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Disconnect Confirmation Modal
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [disconnectPassword, setDisconnectPassword] = useState('');
  const [showDisconnectPassword, setShowDisconnectPassword] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  // Form State (Only modifiable when unlocked)
  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Keep local inputs in sync when config updates
  useEffect(() => {
    setUrl(supabaseConfig.url || '');
    setAnonKey(supabaseConfig.anonKey || '');
  }, [supabaseConfig]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Session auto-lock countdown timer when unlocked
  useEffect(() => {
    if (!isUnlocked) return;
    const interval = setInterval(() => {
      setSessionSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsUnlocked(false);
          setShowKeySecret(false);
          setFeedback({
            type: 'error',
            message: 'အချိန်ပြည့်သွားသဖြင့် လုံခြုံရေးအရ အလိုအလျောက် သော့ပြန်ခတ်လိုက်ပါပြီ (Auto-locked for security)',
          });
          return SESSION_LOCK_TIMEOUT_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isUnlocked]);

  // Masking helpers for display when locked
  const maskUrl = (rawUrl: string): string => {
    if (!rawUrl) return 'ချိတ်ဆက်ထားခြင်းမရှိပါ (Not Configured)';
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname;
      const parts = host.split('.');
      if (parts.length >= 3) {
        const sub = parts[0];
        const maskedSub = sub.length > 4 ? `${sub.slice(0, 4)}••••••` : '••••••••';
        return `https://${maskedSub}.${parts.slice(1).join('.')}`;
      }
      return `https://${host.slice(0, 4)}••••••`;
    } catch {
      return 'https://••••••••.supabase.co';
    }
  };

  // Derive project ref for direct SQL link
  const match = (url || supabaseConfig.url).match(/https:\/\/([a-zA-Z0-9_-]+)\.supabase\.co/);
  const projectRef = match ? match[1] : '';
  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : 'https://supabase.com/dashboard';

  // Manual Lock Action
  const handleLockNow = () => {
    setIsUnlocked(false);
    setShowKeySecret(false);
    setSessionSecondsLeft(SESSION_LOCK_TIMEOUT_SECONDS);
    setFeedback({
      type: 'success',
      message: 'Cloud ဆက်တင်အား လုံခြုံစွာ သော့ပြန်ခတ်ပြီးပါပြီ (Security Lock Restored)',
    });
  };

  // Unlock Submission with Brute-Force Rate Limiting
  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    if (!verifyDeletePassword(unlockPassword.trim())) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        setLockoutSeconds(LOCKOUT_DURATION_SECONDS);
        setUnlockError(
          `စကားဝှက် ${MAX_FAILED_ATTEMPTS} ကြိမ် မှားယွင်းသွားသဖြင့် လုံခြုံရေးအရ ${LOCKOUT_DURATION_SECONDS} စက္ကန့် ပိတ်ထားပါသည် (Brute-force lockout active)`
        );
      } else {
        setUnlockError(
          `လျှို့ဝှက်စကားဝှက် မှားယွင်းပါသည် (${newAttempts}/${MAX_FAILED_ATTEMPTS} ကြိမ် စမ်းသပ်ထားသည်)`
        );
      }
      return;
    }

    // Password valid! Unlock session
    setFailedAttempts(0);
    setIsUnlocked(true);
    setSessionSecondsLeft(SESSION_LOCK_TIMEOUT_SECONDS);
    setUnlockModalOpen(false);
    setUnlockPassword('');
    setUnlockError(null);
    setFeedback({
      type: 'success',
      message: 'လုံခြုံရေး စကားဝှက် အောင်မြင်ပါသည် - ဆက်တင်များ ပြင်ဆင်နိုင်ပါပြီ (Unlocked)',
    });
  };

  // Save new Supabase Credentials
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked) {
      setUnlockModalOpen(true);
      return;
    }

    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl.startsWith('https://')) {
      setFeedback({
        type: 'error',
        message: 'Supabase URL သည် https:// ဖြင့်သာ စတင်ရပါမည် (HTTPS is required for security)',
      });
      return;
    }

    if (cleanKey.length < 20) {
      setFeedback({
        type: 'error',
        message: 'Supabase Anon Key အချက်အလက် မပြည့်စုံပါ (Invalid API Key format)',
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await updateSupabaseConfig({
        url: cleanUrl,
        anonKey: cleanKey,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Supabase Cloud သို့ အောင်မြင်စွာ ချိတ်ဆက်သိမ်းဆည်းပြီးပါပြီ!',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'ချိတ်ဆက်မှု မအောင်မြင်ပါ',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'ချိတ်ဆက်မှု စစ်ဆေးရာတွင် ချို့ယွင်းချက်ဖြစ်ပေါ်ပါသည်',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger Disconnect with Password confirmation
  const handleConfirmDisconnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyDeletePassword(disconnectPassword.trim())) {
      setDisconnectError('မန်နေဂျာ စကားဝှက် မှားယွင်းနေပါသည်');
      return;
    }

    disconnectSupabase();
    setDisconnectModalOpen(false);
    setDisconnectPassword('');
    setDisconnectError(null);
    setIsUnlocked(false);
    setFeedback({
      type: 'success',
      message: 'Cloud ချိတ်ဆက်မှု ဖြုတ်ပြီးပါပြီ (Local အော့ဖ်လိုင်းစနစ်သို့ ပြန်လည်ရောက်ရှိပါသည်)',
    });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-5">
      {/* Header with High-Security Shield and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2.5 sm:p-3 rounded-2xl shrink-0 ${
              isCloudConnected
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                : 'bg-stone-100 text-stone-600 border border-stone-200/60'
            }`}
          >
            {isCloudConnected ? (
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            ) : (
              <Shield className="w-6 h-6 text-stone-500" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                Supabase Cloud စနစ် ချိတ်ဆက်မှု
              </h3>

              {isCloudConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Realtime တိုက်ရိုက်ချိတ်ဆက်ထားသည်
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">
                  <CloudOff className="w-3 h-3" />
                  အော့ဖ်လိုင်း (Local သီးသန့်)
                </span>
              )}

              {/* Active Security Lock Badge */}
              {isUnlocked ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                  <Unlock className="w-3 h-3 text-amber-700" />
                  သော့ဖွင့်ထားသည် ({Math.floor(sessionSecondsLeft / 60)}:
                  {(sessionSecondsLeft % 60).toString().padStart(2, '0')})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-900 text-white shadow-2xs">
                  <Lock className="w-3 h-3 text-amber-400" />
                  လုံခြုံရေး သော့ခတ်ထားပါသည်
                </span>
              )}
            </div>

            <p className="text-xs text-stone-500 mt-1">
              ဖုန်း၊ တက်ဘလက်နှင့် ကွန်ပျူတာ စက်အားလုံးတွင် ဒေတာ အချိန်နှင့်တပြေးညီ တပြိုင်တည်း (Multi-Device Realtime Sync) ချိတ်ဆက်စနစ်
            </p>
          </div>
        </div>

        {/* Quick Sync Button if connected */}
        {isCloudConnected && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={syncNowWithCloud}
              disabled={cloudSyncStatus === 'syncing'}
              className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 border border-stone-200/80 shadow-2xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  cloudSyncStatus === 'syncing' ? 'animate-spin text-rose-600' : 'text-stone-600'
                }`}
              />
              <span>{cloudSyncStatus === 'syncing' ? 'စင့်ခ်လုပ်နေသည်...' : 'အခုချက်ချင်း စင့်ခ်လုပ်မည်'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. LOCKED VIEW (Default: Full Protection against Tampering)               */}
      {/* ========================================================================= */}
      {!isUnlocked && (
        <div className="space-y-4">
          {/* Tamper-Protection Guarantee Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 border border-stone-200/90 text-stone-800 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100/80 text-amber-800 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                  <span>လုံခြုံရေး အထူးကာကွယ်မှု စနစ် အသက်ဝင်နေပါသည်</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-md bg-stone-900 text-amber-300 font-mono font-bold">
                    PROTECTED
                  </span>
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  ဤ Cloud Database ဆက်တင်သည် ဆိုင်၏ အချက်အလက်များအားလုံးနှင့် စက်အားလုံးကို တိုက်ရိုက်ချိတ်ဆက်ထားသောကြောင့် <strong>မန်နေဂျာ/ဆိုင်ပိုင်ရှင် စကားဝှက်မရှိဘဲ မည်သူမျှ ကြည့်ရှုခွင့်၊ ပြင်ဆင်ခွင့် သို့မဟုတ် ချိတ်ဆက်မှုဖြုတ်ပစ်ခွင့် မရှိအောင်</strong> အလိုအလျောက် သော့ခတ်ထားပါသည်။
                </p>
              </div>
            </div>

            {/* Masked Data Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block">SUPABASE PROJECT URL</span>
                  <span className="font-mono text-xs font-semibold text-stone-800">
                    {maskUrl(supabaseConfig.url)}
                  </span>
                </div>
                <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block">SUPABASE ANON KEY</span>
                  <span className="font-mono text-xs font-semibold text-stone-800 tracking-widest">
                    ••••••••••••••••••••••••••••••••
                  </span>
                </div>
                <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              </div>
            </div>
          </div>

          {/* Primary Action Button: Unlock with Password */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setUnlockError(null);
                setUnlockPassword('');
                setUnlockModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer app-touch-btn"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>မန်နေဂျာ စကားဝှက်ဖြင့် သော့ဖွင့်၍ ပြင်ဆင်မည်</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-stone-500" />
              <span>{showSqlGuide ? 'SQL ဇယားပိတ်မည်' : 'Database SQL ဇယားများ'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. UNLOCKED VIEW (Active Editing Session with Auto-Lock Safeguard)        */}
      {/* ========================================================================= */}
      {isUnlocked && (
        <form onSubmit={handleSaveConfig} className="space-y-4 animate-in fade-in-50">
          {/* Active Session Warning Bar */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Unlock className="w-4 h-4 text-amber-700 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">လုံခြုံရေး သော့ဖွင့်ထားပါသည်: </span>
                <span className="text-amber-800">
                  {Math.floor(sessionSecondsLeft / 60)} မိနစ် {(sessionSecondsLeft % 60).toString().padStart(2, '0')} စက္ကန့်အတွင်း အလိုအလျောက် သော့ပြန်ခတ်ပါမည်
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLockNow}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>အခုချက်ချင်း သော့ပြန်ခတ်မည်</span>
            </button>
          </div>

          {/* Editable Credential Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Supabase Project URL *
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxxxxxxx.supabase.co"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden bg-white"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                ဥပမာ: https://ywtzyjtcdhyafxjapqlw.supabase.co
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-800">
                  Supabase Anon Key *
                </label>
                <button
                  type="button"
                  onClick={() => setShowKeySecret(!showKeySecret)}
                  className="text-[10px] text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer font-semibold"
                >
                  {showKeySecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showKeySecret ? 'ဝှက်မည်' : 'ပြမည်'}</span>
                </button>
              </div>
              <input
                type={showKeySecret ? 'text' : 'password'}
                required
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden bg-white"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Supabase Project Settings &gt; API &gt; anon public key
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 app-touch-btn"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>ချိတ်ဆက်စစ်ဆေးနေသည်...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ဆက်တင်အသစ် အတည်ပြုသိမ်းမည်</span>
                  </>
                )}
              </button>

              {isCloudConnected && (
                <button
                  type="button"
                  onClick={() => {
                    setDisconnectPassword('');
                    setDisconnectError(null);
                    setDisconnectModalOpen(true);
                  }}
                  className="px-3.5 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CloudOff className="w-3.5 h-3.5" />
                  <span>ချိတ်ဆက်မှု ဖြုတ်ပစ်မည်</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSqlGuide(!showSqlGuide)}
                className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-stone-500" />
                <span>{showSqlGuide ? 'SQL ဇယားပိတ်မည်' : 'Database SQL'}</span>
              </button>

              <a
                href={sqlEditorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 underline-offset-4 hover:underline"
              >
                <span>Supabase Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </form>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Cloud Error Display */}
      {cloudError && !feedback && !needsTableSetup && (
        <div className="p-3 rounded-2xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{cloudError}</span>
        </div>
      )}

      {/* Missing Tables Notice */}
      {needsTableSetup && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-bold text-amber-900">
              Database ဇယားများ မရှိသေးပါ (SQL Script ကို Run ပေးပါ)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySql}
              className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'ကူးယူပြီး!' : 'SQL ကူးယူမည်'}</span>
            </button>
            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <span>SQL Editor ဖွင့်မည်</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Expandable SQL Schema Box */}
      {showSqlGuide && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 space-y-2.5 animate-in fade-in-50">
          <div className="flex items-center justify-between pb-1.5 border-b border-stone-800">
            <span className="font-bold text-xs text-stone-200 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>Supabase Table Creation SQL Script</span>
            </span>
            <button
              type="button"
              onClick={handleCopySql}
              className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-700"
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

          <div className="bg-stone-950 p-2.5 rounded-xl max-h-48 overflow-y-auto font-mono text-[11px] text-stone-300 border border-stone-800">
            <pre className="whitespace-pre-wrap">{SUPABASE_SCHEMA_SQL}</pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL: MANAGER PASSWORD UNLOCK WITH BRUTE FORCE RATE LIMITING          */}
      {/* ========================================================================= */}
      {unlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-base">
                    မန်နေဂျာ စကားဝှက်ဖြင့် သော့ဖွင့်ပါ
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Cloud ချိတ်ဆက်မှု ဆက်တင် ပြင်ဆင်ရန် စကားဝှက် လိုအပ်ပါသည်
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnlockModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {lockoutSeconds > 0 ? (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1.5 text-center">
                <ShieldAlert className="w-6 h-6 text-rose-600 mx-auto animate-bounce" />
                <p className="text-xs font-bold">စကားဝှက် မှားယွင်းမှု များပြားသဖြင့် ပိတ်ထားပါသည်</p>
                <p className="text-sm font-extrabold text-rose-900 font-mono">
                  {lockoutSeconds} စက္ကန့် စောင့်ဆိုင်းပေးပါ
                </p>
              </div>
            ) : (
              <form onSubmit={handleUnlockSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    မန်နေဂျာ လျှို့ဝှက်စကားဝှက် (PIN / Password) *
                  </label>
                  <div className="relative">
                    <input
                      type={showUnlockPassword ? 'text' : 'password'}
                      autoFocus
                      required
                      value={unlockPassword}
                      onChange={(e) => {
                        setUnlockPassword(e.target.value);
                        setUnlockError(null);
                      }}
                      placeholder="စကားဝှက် ရိုက်ထည့်ပါ..."
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 pr-10 rounded-xl border border-stone-300 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {unlockError && (
                  <div className="p-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{unlockError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setUnlockModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    မလုပ်တော့ပါ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs app-touch-btn"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>သော့ဖွင့်မည်</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: SECONDARY CONFIRMATION FOR DISCONNECTING CLOUD                  */}
      {/* ========================================================================= */}
      {disconnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-base">
                    Cloud ချိတ်ဆက်မှု ဖြုတ်ပစ်မည်လား?
                  </h4>
                  <p className="text-[11px] text-rose-600 font-bold">
                    သတိပြုရန်: စက်အားလုံးနှင့် အချိန်နှင့်တပြေးညီ ချိတ်ဆက်မှု ရပ်တန့်သွားပါမည်
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDisconnectModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDisconnect} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  အတည်ပြုရန် မန်နေဂျာ စကားဝှက် ရိုက်ထည့်ပါ *
                </label>
                <div className="relative">
                  <input
                    type={showDisconnectPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    value={disconnectPassword}
                    onChange={(e) => {
                      setDisconnectPassword(e.target.value);
                      setDisconnectError(null);
                    }}
                    placeholder="စကားဝှက် ရိုက်ထည့်ပါ..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 pr-10 rounded-xl border border-stone-300 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDisconnectPassword(!showDisconnectPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showDisconnectPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {disconnectError && (
                <div className="p-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{disconnectError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDisconnectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  မဖြုတ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs app-touch-btn"
                >
                  <CloudOff className="w-3.5 h-3.5" />
                  <span>အတည်ပြုဖြုတ်မည်</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
