import React, { useState } from 'react';
import { Order, Expense, StoreProfile } from '../../types';
import { formatMMK } from '../../utils/format';
import { PAYMENT_LABELS } from '../../utils/translations';
import {
  Wallet,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Calculator,
  Building,
  Smartphone,
  CreditCard,
  Banknote,
  RotateCcw,
} from 'lucide-react';

interface CashReconciliationProps {
  completedOrders: Order[];
  refundedOrders: Order[];
  expenses: Expense[];
  storeProfile: StoreProfile;
  useMyanmarDigits: boolean;
  dateLabel: string;
}

export const CashReconciliation: React.FC<CashReconciliationProps> = ({
  completedOrders,
  refundedOrders,
  expenses,
  storeProfile,
  useMyanmarDigits,
  dateLabel,
}) => {
  // Cash Transactions
  const cashSales = completedOrders
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const cashRefunds = refundedOrders
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  // Cash Expenses (expenses marked with paymentMethod === 'cash' or undefined/other)
  const cashExpenses = expenses
    .filter((e) => !e.paymentMethod || e.paymentMethod === 'cash')
    .reduce((sum, e) => sum + e.amount, 0);

  // Expected Cash In Drawer
  const expectedCashInDrawer = Math.max(0, cashSales - cashRefunds - cashExpenses);

  // Digital payments breakdown
  const kpayTotal = completedOrders
    .filter((o) => o.paymentMethod === 'kpay')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const waveTotal = completedOrders
    .filter((o) => o.paymentMethod === 'wave')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const bankTotal = completedOrders
    .filter((o) => o.paymentMethod === 'bank')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const totalDigitalPayments = kpayTotal + waveTotal + bankTotal;
  const grandTotalCollected = cashSales + totalDigitalPayments;

  // Drawer Physical Count State (Cashier denomination counter)
  const [useDenominations, setUseDenominations] = useState(false);
  const [denominations, setDenominations] = useState<Record<number, number>>({
    10000: 0,
    5000: 0,
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
  });
  const [manualCountedCash, setManualCountedCash] = useState<number | ''>('');

  const calculatedFromDenominations = Object.entries(denominations).reduce(
    (acc, [denom, count]) => acc + Number(denom) * (Number(count) || 0),
    0
  );

  const actualCountedCash = useDenominations
    ? calculatedFromDenominations
    : manualCountedCash === ''
    ? null
    : Number(manualCountedCash);

  const discrepancy = actualCountedCash !== null ? actualCountedCash - expectedCashInDrawer : null;

  const handleResetCount = () => {
    setDenominations({
      10000: 0,
      5000: 0,
      1000: 0,
      500: 0,
      200: 0,
      100: 0,
      50: 0,
    });
    setManualCountedCash('');
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <span>ငွေသိမ်းသေတ္တာနှင့် ငွေလက်ကျန် စစ်ဆေးမှု (Cash Drawer Audit)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            ကာလ: <span className="font-bold text-stone-800">{dateLabel}</span> • ငွေသားစီးဆင်းမှု၊ သေတ္တာတွင်း ရှိရမည့်ငွေနှင့် KBZPay/WavePay ချိန်ညှိမှု
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
            တာဝန်ကျ စာရင်းကိုင်: {storeProfile.activeCashier}
          </span>
        </div>
      </div>

      {/* Primary Reconciliation KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Cash in Drawer (Expected) */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white p-4 sm:p-5 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between text-stone-300">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              စာရင်းအရ သေတ္တာတွင်း ရှိရမည့် ငွေသား
            </span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-stone-300">
              Theoretical Cash
            </span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {formatMMK(expectedCashInDrawer, useMyanmarDigits)}
            </h3>
            <p className="text-[11px] text-stone-400 mt-1">
              ငွေသား ရောင်းရငွေမှ စရိတ်နှင့် ပြန်အမ်းငွေများ နုတ်ပြီး
            </p>
          </div>

          <div className="pt-2 border-t border-stone-800/80 space-y-1 text-xs">
            <div className="flex justify-between text-stone-300">
              <span>+ ငွေသား ရောင်းရငွေ:</span>
              <span className="font-mono text-white">+{formatMMK(cashSales, useMyanmarDigits)}</span>
            </div>
            {cashRefunds > 0 && (
              <div className="flex justify-between text-stone-400">
                <span>- ငွေသား ပြန်အမ်းငွေ:</span>
                <span className="font-mono text-red-400">-{formatMMK(cashRefunds, useMyanmarDigits)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-400">
              <span>- ကောင်တာမှ ထုတ်သုံးခဲ့သော ဆိုင်စရိတ်:</span>
              <span className="font-mono text-amber-400">-{formatMMK(cashExpenses, useMyanmarDigits)}</span>
            </div>
          </div>
        </div>

        {/* 2. Digital Accounts Collections */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              ဒစ်ဂျစ်တယ် / ဘဏ်အကောင့် ရငွေစုစုပေါင်း
            </span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
              Digital Wallets
            </span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-blue-700 font-mono tracking-tight">
              {formatMMK(totalDigitalPayments, useMyanmarDigits)}
            </h3>
            <p className="text-[11px] text-stone-400 mt-1">
              KBZPay, WavePay နှင့် ဘဏ်လွှဲငွေများ
            </p>
          </div>

          <div className="pt-2 border-t border-stone-100 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-stone-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                KBZPay:
              </span>
              <span className="font-mono font-bold">{formatMMK(kpayTotal, useMyanmarDigits)}</span>
            </div>
            <div className="flex justify-between items-center text-stone-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                WavePay:
              </span>
              <span className="font-mono font-bold">{formatMMK(waveTotal, useMyanmarDigits)}</span>
            </div>
            <div className="flex justify-between items-center text-stone-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                ဘဏ်လွှဲငွေ (Bank Transfer):
              </span>
              <span className="font-mono font-bold">{formatMMK(bankTotal, useMyanmarDigits)}</span>
            </div>
          </div>
        </div>

        {/* 3. Total Funds Received */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              စုစုပေါင်း ငွေလက်ခံရရှိမှု
            </span>
            <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold">
              Gross Receipts
            </span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-stone-900 font-mono tracking-tight">
              {formatMMK(grandTotalCollected, useMyanmarDigits)}
            </h3>
            <p className="text-[11px] text-stone-400 mt-1">
              ကာလအတွင်း ရောင်းရငွေ အားလုံးပေါင်း
            </p>
          </div>

          <div className="pt-2 border-t border-stone-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>ငွေသား အချိုး (Cash Share):</span>
              <span className="font-bold text-stone-900">
                {grandTotalCollected > 0
                  ? Math.round((cashSales / grandTotalCollected) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>ဒစ်ဂျစ်တယ် အချိုး (Digital Share):</span>
              <span className="font-bold text-stone-900">
                {grandTotalCollected > 0
                  ? Math.round((totalDigitalPayments / grandTotalCollected) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between text-stone-600 font-medium">
              <span>ပြီးစီးခဲ့သော ဘောင်ချာစောင်ရေ:</span>
              <span className="font-bold text-stone-900 font-mono">{completedOrders.length} စောင်</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Physical Cash Drawer Audit Calculator */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-rose-600" />
              <span>သေတ္တာတွင်း လက်တွေ့ငွေသား ရေတွက်စစ်ဆေးခြင်း (Physical Drawer Count)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              ကောင်တာသိမ်းချိန် သို့မဟုတ် အလှည့်ကျချိန်တွင် သေတ္တာတွင်းရှိ ငွေသားများကို စစ်ဆေးရေတွက်ပါ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUseDenominations(!useDenominations)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                useDenominations
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
              }`}
            >
              {useDenominations ? 'ငွေစက္ကူအလိုက် ရေတွက်ခြင်း ဖွင့်ထားသည်' : 'ငွေစက္ကူအလိုက် ရေတွက်မည်'}
            </button>
            <button
              type="button"
              onClick={handleResetCount}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="ပြန်လည် သုညချမည် (Reset)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {useDenominations ? (
          /* Denomination Sheet */
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {[10000, 5000, 1000, 500, 200, 100, 50].map((denom) => {
                const count = denominations[denom] || 0;
                const totalVal = denom * count;
                return (
                  <div
                    key={denom}
                    className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-1.5 text-center"
                  >
                    <span className="text-[11px] font-mono font-black text-stone-700 block">
                      {formatMMK(denom, useMyanmarDigits)}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={count || ''}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setDenominations((prev) => ({ ...prev, [denom]: val }));
                      }}
                      className="w-full text-center font-mono font-bold text-xs py-1.5 px-1 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-[10px] font-mono text-stone-500 block truncate">
                      = {formatMMK(totalVal, useMyanmarDigits)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Direct Manual Cash Input */
          <div className="max-w-md space-y-2">
            <label className="block text-xs font-bold text-stone-700">
              ရေတွက်ရရှိသော စုစုပေါင်း ငွေသားပမာဏ (MMK)
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="ဥပမာ - ၁၅၀၀၀၀"
                value={manualCountedCash}
                onChange={(e) =>
                  setManualCountedCash(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full text-base font-bold font-mono px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50"
              />
              <span className="absolute right-3.5 top-3 text-xs font-black text-stone-400">
                MMK
              </span>
            </div>
          </div>
        )}

        {/* Audit Result Banner */}
        {actualCountedCash !== null && (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              discrepancy === 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : discrepancy! > 0
                ? 'bg-blue-50 border-blue-300 text-blue-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-3">
              {discrepancy === 0 ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div
                  className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 ${
                    discrepancy! > 0 ? 'bg-blue-600' : 'bg-amber-600'
                  }`}
                >
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h4 className="font-extrabold text-sm">
                  {discrepancy === 0
                    ? 'ငွေစာရင်း အတိအကျ ကိုက်ညီပါသည် (Balanced)'
                    : discrepancy! > 0
                    ? `ငွေသား ပိုနေပါသည် (Over by +${formatMMK(discrepancy!, useMyanmarDigits)})`
                    : `ငွေသား လိုနေပါသည် (Short by ${formatMMK(Math.abs(discrepancy!), useMyanmarDigits)})`}
                </h4>
                <p className="text-xs opacity-80 mt-0.5">
                  {discrepancy === 0
                    ? 'စာရင်းအရ ရှိရမည့် ငွေသားနှင့် အမှန်တကယ် ရေတွက်ရရှိသော ငွေပမာဏ တူညီပါသည်'
                    : discrepancy! > 0
                    ? 'အမှန်တကယ် ရေတွက်ရငွေသည် စာရင်းထက် ပိုမိုနေပါသည်။ မှတ်တမ်းမတင်ရသေးသော အရောင်း ရှိမရှိ စစ်ဆေးပါ'
                    : 'အမှန်တကယ် ရေတွက်ရငွေသည် စာရင်းထက် လျော့နည်းနေပါသည်။ မှတ်တမ်းမတင်ရသေးသော ဆိုင်စရိတ် သို့မဟုတ် ပြန်အမ်းငွေ ရှိမရှိ စစ်ဆေးပါ'}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs block opacity-70">ကွာဟချက် (Variance)</span>
              <span
                className={`text-xl font-black font-mono ${
                  discrepancy === 0
                    ? 'text-emerald-700'
                    : discrepancy! > 0
                    ? 'text-blue-700'
                    : 'text-amber-800'
                }`}
              >
                {discrepancy === 0
                  ? '0 MMK'
                  : `${discrepancy! > 0 ? '+' : ''}${formatMMK(discrepancy!, useMyanmarDigits)}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
