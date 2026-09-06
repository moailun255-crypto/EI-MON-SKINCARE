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
    setRetryStatus('正在检查数据库表并同步...');
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
                ⚠️ Supabase 数据库尚未建表，云端数据同步未生效！
              </p>
              <p className="text-xs text-white/90 font-medium">
                Supabase ချိတ်ဆက်မိသော်လည်း ဒေတာဇယားများ မဆောက်ရသေးပါ (SQL Script ကို Run ပေးရန် လိုအပ်ပါသည်)
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
              <span>查看指引并一键复制 SQL</span>
            </button>

            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>打开 Supabase SQL Editor</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={handleRetrySync}
              disabled={cloudSyncStatus === 'syncing'}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>我已运行 SQL，立即同步</span>
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
                    Supabase 数据库建表与实时同步指引
                  </h3>
                  <p className="text-xs text-stone-500">
                    只需 3 步，耗时约 30 秒，即可开启全设备毫秒级实时同步
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
                    点击下方按钮，一键复制建表 SQL 脚本
                  </h4>
                  <p className="text-xs text-stone-600 mb-2.5">
                    该脚本会自动在您的 Supabase 项目中创建 products（商品）、orders（订单）、expenses（支出）、store_profile（店铺设置）四张表，并开通行级安全（RLS）和实时通讯订阅（Realtime）。
                  </p>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">已成功复制全部 SQL 代码！</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>一键复制建表 SQL 脚本 (Copy SQL)</span>
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
                    打开 Supabase 后台的 SQL Editor 并粘贴运行
                  </h4>
                  <p className="text-xs text-stone-600 mb-2.5">
                    点击下方链接进入您项目的 SQL 编辑器页面，按 <kbd className="px-1.5 py-0.5 bg-white border border-stone-300 rounded text-[10px] font-mono">Ctrl + V</kbd> 粘贴刚才复制的代码，然后点击右下角绿色的 <strong>"RUN"</strong> 按钮。
                  </p>
                  <a
                    href={sqlEditorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    <span>直接打开 Supabase SQL Editor</span>
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
                    在 Supabase 点击 RUN 完成后，回到此处点击「立即同步」
                  </h4>
                  <p className="text-xs text-stone-600 mb-2.5">
                    系统检测到数据表已建立后，会自动将现有的美妆护肤库存推送到云端，并激活手机与电脑之间的实时同步。
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
                    <span>我已在 Supabase 运行完毕，立即同步数据</span>
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
                项目 ID: <span className="font-mono font-semibold text-stone-700">{projectRef}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
