import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { SUPABASE_SCHEMA_SQL } from '../../lib/supabaseSchema';
import {
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  X,
  Database,
  Radio,
  CheckCircle2,
} from 'lucide-react';

export const SupabaseSetupBanner: React.FC = () => {
  const {
    needsTableSetup,
    supabaseConfig,
    syncNowWithCloud,
    cloudSyncStatus,
    isCloudConnected,
  } = useStore();

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);

  // If already connected or doesn't need table setup, do not show banner
  if (!needsTableSetup || isCloudConnected) {
    return null;
  }

  // Extract project ref if available
  const match = supabaseConfig.url.match(/https:\/\/([a-zA-Z0-9_-]+)\.supabase\.co/);
  const projectRef = match ? match[1] : 'ywtzyjtcdhyafxjapqlw';
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleRetrySync = async () => {
    setRetryStatus('စစ်ဆေးချိတ်ဆက်နေသည်...');
    await syncNowWithCloud();
    setTimeout(() => {
      setRetryStatus(null);
    }, 3000);
  };

  return (
    <>
      {/* Eye-catching Top Alert Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs shrink-0">
              <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base leading-tight">
                ⚠️ Supabase Cloud Database သို့ ချိတ်ဆက်မိသော်လည်း ဇယားများ မဆောက်ရသေးပါ
              </p>
              <p className="text-xs text-white/90 font-medium">
                ဒေတာများ အချိန်နှင့်တပြေးညီ တပြိုင်တည်း ထပ်တူကျစေရန် SQL Script ကို Supabase တွင် Run ပေးပါရန်
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsOpenModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white text-orange-900 font-bold text-xs hover:bg-orange-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-orange-600" />
              <span>SQL ဇယားလမ်းညွှန် ကြည့်မည်</span>
            </button>

            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Supabase SQL Editor ဖွင့်မည်</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={handleRetrySync}
              disabled={cloudSyncStatus === 'syncing'}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>SQL Run ပြီးပါက ချက်ချင်းချိတ်မည်</span>
            </button>
          </div>
        </div>
      </div>

      {/* Setup Guide Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base leading-tight">
                    Supabase Database ဇယားများ တည်ဆောက်ခြင်း လမ်းညွှန်
                  </h3>
                  <p className="text-xs text-stone-500">
                    စက္ကန့် ၃၀ အတွင်း အဆင့် ၃ ဆင့်ဖြင့် အလွယ်တကူ ချိတ်ဆက်နိုင်ပါသည်
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-sm text-stone-700">
              {/* Step 1 */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-stone-900 mb-1">
                    အောက်ပါ ခလုတ်ကိုနှိပ်၍ SQL Script ကို ကူးယူပါ
                  </h4>
                  <p className="text-xs text-stone-600 mb-2.5">
                    ဤ Script သည် သင်၏ Supabase Project တွင် products, orders, expenses, store_profile ဇယားများကို အလိုအလျောက် တည်ဆောက်ပေးပြီး Realtime Sync ကို ဖွင့်ပေးပါမည်။
                  </p>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">SQL ကုဒ် အားလုံး ကူးယူပြီးပါပြီ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>SQL Script အားလုံး ကူးယူမည် (Copy SQL)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-stone-900 mb-1">
                    Supabase SQL Editor သို့သွား၍ Paste လုပ်ပြီး RUN နှိပ်ပါ
                  </h4>
                  <p className="text-xs text-stone-600 mb-2.5">
                    အောက်ပါ လင့်ခ်ကိုနှိပ်၍ SQL Editor သို့သွားပါ၊ ကူးယူထားသော ကုဒ်ကို Paste ထည့်သွင်းပြီး အစိမ်းရောင် <strong>"RUN"</strong> ခလုတ်ကို နှိပ်ပေးပါ။
                  </p>
                  <a
                    href={sqlEditorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    <span>Supabase SQL Editor သို့ တိုက်ရိုက်သွားရန်</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-stone-900 mb-1">
                    Supabase တွင် RUN ပြီးပါက ဤနေရာတွင် «ဒေတာ ချက်ချင်းချိတ်မည်» နှိပ်ပါ
                  </h4>
                  <p className="text-xs text-stone-600 mb-2.5">
                    စနစ်က ဒေတာဇယားများ အဆင်သင့်ဖြစ်သည်နှင့် ကုန်ပစ္စည်းများနှင့် စာရင်းများကို Cloud သို့ အလိုအလျောက် ထပ်တူပြုပေးပါမည်။
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleRetrySync();
                      if (isCloudConnected) {
                        setIsOpenModal(false);
                      }
                    }}
                    disabled={cloudSyncStatus === 'syncing'}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>SQL Run ပြီးပါပြီ၊ ဒေတာ ချက်ချင်းချိတ်မည်</span>
                  </button>
                  {retryStatus && (
                    <p className="text-xs font-semibold text-emerald-700 mt-2">
                      {retryStatus}
                    </p>
                  )}
                </div>
              </div>

              {/* SQL Code Preview Collapsible */}
              <div className="border border-stone-200 rounded-xl p-3 bg-stone-900 text-stone-200 font-mono text-xs max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800 text-stone-400 text-[11px]">
                  <span>SQL Script Preview</span>
                  <span>PostgreSQL DDL</span>
                </div>
                <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-stone-300">
                  {SUPABASE_SCHEMA_SQL}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                Project ID: <span className="font-mono font-semibold text-stone-700">{projectRef}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
              >
                ပိတ်မည်
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
