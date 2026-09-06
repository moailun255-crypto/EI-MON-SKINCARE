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
} from 'lucide-react';

export const SupabaseSyncCard: React.FC = () => {
  const {
    isCloudConnected,
    cloudSyncStatus,
    cloudError,
    supabaseConfig,
    updateSupabaseConfig,
    disconnectSupabase,
    syncNowWithCloud,
    products,
    orders,
    expenses,
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

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
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
        {isCloudConnected && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
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
            <button
              type="button"
              onClick={disconnectSupabase}
              className="px-3 py-2 rounded-xl text-stone-500 hover:text-rose-600 text-xs font-semibold cursor-pointer"
            >
              ဖြုတ်မည်
            </button>
          </div>
        )}
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

      {/* Cloud Configuration Form */}
      <form onSubmit={handleConnect} className="space-y-4 pt-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxxxxxx.supabase.co"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Supabase Anon Public Key
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-hidden"
            />
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

        {cloudError && !actionFeedback && (
          <div className="p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>ချိတ်ဆက်မှု အခြေအနေ: {cloudError}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
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
                  <span>{isCloudConnected ? 'ချိတ်ဆက်မှု ပြင်ဆင်သိမ်းမည်' : 'Supabase နှင့် ချိတ်ဆက်မည်'}</span>
                </>
              )}
            </button>

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
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 underline-offset-4 hover:underline"
          >
            <span>Supabase Dashboard သို့သွားရန်</span>
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
    </div>
  );
};
