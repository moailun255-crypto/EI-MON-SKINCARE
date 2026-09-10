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
  AlertCircle,
  Eye,
  EyeOff,
  Database,
  Lock,
  KeyRound,
  X,
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
  } = useStore();

  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Security Verification Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authAction, setAuthAction] = useState<'connect' | 'disconnect' | null>(null);
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Derive project ref for direct SQL link
  const match = (url || supabaseConfig.url).match(/https:\/\/([a-zA-Z0-9_-]+)\.supabase\.co/);
  const projectRef = match ? match[1] : '';
  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : 'https://supabase.com/dashboard';

  const triggerConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      setFeedback({
        type: 'error',
        message: 'Supabase Project URL နှင့် Anon Key နှစ်ခုစလုံးကို ထည့်သွင်းပါ',
      });
      return;
    }
    // Require password verification before modifying cloud configuration
    setAuthAction('connect');
    setAuthPassword('');
    setAuthError(null);
    setAuthModalOpen(true);
  };

  const triggerDisconnect = () => {
    // Require password verification before disconnecting
    setAuthAction('disconnect');
    setAuthPassword('');
    setAuthError(null);
    setAuthModalOpen(true);
  };

  const handleConfirmAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!verifyDeletePassword(authPassword)) {
      setAuthError('လုံခြုံရေး လျှို့ဝှက်စကားဝှက် မှားယွင်းနေပါသည် (Incorrect Password)');
      return;
    }

    const currentAction = authAction;
    setAuthModalOpen(false);
    setAuthPassword('');

    if (currentAction === 'connect') {
      setIsConnecting(true);
      setFeedback(null);
      try {
        const res = await updateSupabaseConfig({
          url: url.trim(),
          anonKey: anonKey.trim(),
        });
        if (res.success) {
          setFeedback({
            type: 'success',
            message: 'Supabase Cloud သို့ အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီ',
          });
        } else {
          setFeedback({
            type: 'error',
            message: res.message,
          });
        }
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err.message || 'ချိတ်ဆက်မှု မအောင်မြင်ပါ',
        });
      } finally {
        setIsConnecting(false);
      }
    } else if (currentAction === 'disconnect') {
      disconnectSupabase();
      setFeedback({
        type: 'success',
        message: 'Cloud ချိတ်ဆက်မှု ဖြုတ်ပြီးပါပြီ (Local စနစ်သို့ ပြန်လည်ရောက်ရှိပါသည်)',
      });
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
      {/* Header with Status & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-3">
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
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                Supabase Cloud စနစ် ချိတ်ဆက်မှု
              </h3>
              {isCloudConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ချိတ်ဆက်ထားသည်
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">
                  <CloudOff className="w-3 h-3" />
                  အော့ဖ်လိုင်း (Local)
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Lock className="w-3 h-3 text-amber-600" />
                ပြင်ဆင်ရန် စကားဝှက် လိုအပ်သည်
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              ဖုန်းနှင့် ကွန်ပျူတာ စက်အားလုံးတွင် ဒေတာ အချိန်နှင့်တပြေးညီ တပြိုင်တည်း (Realtime Sync) ချိတ်ဆက်အသုံးပြုရန်
            </p>
          </div>
        </div>

        {/* Action buttons if connected */}
        {isCloudConnected && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={syncNowWithCloud}
              disabled={cloudSyncStatus === 'syncing'}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  cloudSyncStatus === 'syncing' ? 'animate-spin text-rose-600' : ''
                }`}
              />
              <span>
                {cloudSyncStatus === 'syncing' ? 'စင့်ခ်လုပ်နေသည်...' : 'စင့်ခ်လုပ်မည်'}
              </span>
            </button>
            <button
              type="button"
              onClick={triggerDisconnect}
              className="px-3 py-1.5 rounded-xl text-stone-500 hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Lock className="w-3 h-3 text-stone-400" />
              <span>ချိတ်ဆက်မှုဖြုတ်မည်</span>
            </button>
          </div>
        )}
      </div>

      {/* Cloud Configuration Inputs */}
      <form onSubmit={triggerConnect} className="space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxxxxxx.supabase.co"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-stone-700">
                Supabase Anon Key
              </label>
              <button
                type="button"
                onClick={() => setShowKeySecret(!showKeySecret)}
                className="text-[10px] text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
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
          </div>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
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

        {cloudError && !feedback && !needsTableSetup && (
          <div className="p-2.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{cloudError}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isConnecting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ချိတ်ဆက်နေသည်...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-200" />
                  <span>{isCloudConnected ? 'စကားဝှက်ဖြင့် အသစ်သိမ်းမည်' : 'စကားဝှက်ဖြင့် ချိတ်ဆက်မည်'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-stone-500" />
              <span>{showSqlGuide ? 'SQL ဇယားပိတ်မည်' : 'SQL Database ဇယားများ'}</span>
            </button>
          </div>

          <a
            href={sqlEditorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 underline-offset-4 hover:underline"
          >
            <span>Supabase Dashboard သို့</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </form>

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

      {/* Password Verification Modal before changing or disconnecting Cloud */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-base">
                    လုံခြုံရေး စကားဝှက် အတည်ပြုပါ
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    {authAction === 'connect'
                      ? 'Supabase Cloud ချိတ်ဆက်မှု အသစ် ပြောင်းလဲရန် မန်နေဂျာ စကားဝှက် ရိုက်ထည့်ပါ'
                      : 'Supabase Cloud ချိတ်ဆက်မှု ဖြုတ်ပစ်ရန် မန်နေဂျာ စကားဝှက် ရိုက်ထည့်ပါ'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAuth} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  မန်နေဂျာ လျှို့ဝှက်စကားဝှက် *
                </label>
                <div className="relative">
                  <input
                    type={showAuthPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    value={authPassword}
                    onChange={(e) => {
                      setAuthPassword(e.target.value);
                      setAuthError(null);
                    }}
                    placeholder="စကားဝှက် ရိုက်ထည့်ပါ..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 pr-10 rounded-xl border border-stone-300 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-2.5 rounded-xl text-xs font-bold text-red-600 bg-rose-50 border border-rose-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>စစ်ဆေးအတည်ပြုမည်</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
