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

  // Digital payments breakdown (KBZPay)
  const kpayTotal = completedOrders
    .filter((o) => o.paymentMethod === 'kpay')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const totalDigitalPayments = kpayTotal;
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
    <div className="space-y-3 sm:space-y-4">
      {/* Title Card */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-stone-900 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ငွေသိမ်းသေတ္တာနှင့် ငွေလက်ကျန် စစ်ဆေးမှု</span>
          </h2>
          <p className="text-[10px] text-stone-500 mt-0.5">
            ကာလ: <span className="font-bold text-stone-800">{dateLabel}</span> • ငွေသားစီးဆင်းမှု၊ သေတ္တာတွင်း ရှိရမည့်ငွေနှင့် ငွေလွှဲချိန်ညှိမှု
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded-lg border border-emerald-200">
            တာဝန်ကျ စာရင်းကိုင်: {storeProfile.activeCashier}
          </span>
        </div>
      </div>

      {/* Primary Reconciliation KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-2.5">
        {/* 1. Cash in Drawer (Expected) */}
        <div className="bg-stone-900 text-white p-3 rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-300">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              စာရင်းအရ ရှိရမည့် ငွေသား
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-emerald-400 font-mono tracking-tight leading-tight">
              {formatMMK(expectedCashInDrawer, useMyanmarDigits)}
            </h3>
            <p className="text-[9px] text-stone-400 mt-0.5">
              ငွေသား ရောင်းရငွေမှ စရိတ်နှင့် ပြန်အမ်းငွေများ နုတ်ပြီး
            </p>
          </div>

          <div className="pt-1.5 border-t border-stone-800/80 space-y-0.5 text-[10px]">
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
              <span>- ကောင်တာ ဆိုင်စရိတ်:</span>
              <span className="font-mono text-amber-400">-{formatMMK(cashExpenses, useMyanmarDigits)}</span>
            </div>
          </div>
        </div>

        {/* 2. Digital Accounts Collections */}
        <div className="bg-white p-3 rounded-xl border border-stone-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" />
              ငွေလွှဲ / KPay ရငွေ စုစုပေါင်း
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-blue-700 font-mono tracking-tight leading-tight">
              {formatMMK(totalDigitalPayments, useMyanmarDigits)}
            </h3>
            <p className="text-[9px] text-stone-400 mt-0.5">
              အကောင့်သို့ တိုက်ရိုက်ဝင်ငွေ
            </p>
          </div>

          <div className="pt-1.5 border-t border-stone-100 space-y-0.5 text-[10px]">
            <div className="flex justify-between items-center text-stone-700">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
                ငွေလွှဲ / KPay စုစုပေါင်း:
              </span>
              <span className="font-mono font-bold">{formatMMK(kpayTotal, useMyanmarDigits)}</span>
            </div>
            <div className="flex justify-between items-center text-stone-500 text-[9px]">
              <span>ဘောင်ချာစောင်ရေ:</span>
              <span className="font-mono font-bold text-stone-800">
                {completedOrders.filter((o) => o.paymentMethod === 'kpay').length} စောင်
              </span>
            </div>
          </div>
        </div>

        {/* 3. Total Funds Received */}
        <div className="bg-white p-3 rounded-xl border border-stone-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" />
              စုစုပေါင်း ငွေလက်ခံရရှိမှု
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-stone-900 font-mono tracking-tight leading-tight">
              {formatMMK(grandTotalCollected, useMyanmarDigits)}
            </h3>
            <p className="text-[9px] text-stone-400 mt-0.5">
              ကာလအတွင်း ရောင်းရငွေ အားလုံးပေါင်း
            </p>
          </div>

          <div className="pt-1.5 border-t border-stone-100 space-y-0.5 text-[10px]">
            <div className="flex justify-between text-stone-600">
              <span>ငွေသား အချိုး:</span>
              <span className="font-bold text-stone-900">
                {grandTotalCollected > 0
                  ? Math.round((cashSales / grandTotalCollected) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>ဒစ်ဂျစ်တယ် အချိုး:</span>
              <span className="font-bold text-stone-900">
                {grandTotalCollected > 0
                  ? Math.round((totalDigitalPayments / grandTotalCollected) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>ပြီးစီးဘောင်ချာ:</span>
              <span className="font-bold text-stone-900 font-mono">{completedOrders.length} စောင်</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Physical Cash Drawer Audit Calculator */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-stone-900 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-rose-600 shrink-0" />
              <span>သေတ္တာတွင်း လက်တွေ့ငွေသား ရေတွက်စစ်ဆေးခြင်း</span>
            </h3>
            <p className="text-[10px] text-stone-500 mt-0.5">
              ကောင်တာသိမ်းချိန် သို့မဟုတ် အလှည့်ကျချိန်တွင် သေတ္တာတွင်းရှိ ငွေသားများကို စစ်ဆေးရေတွက်ပါ
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setUseDenominations(!useDenominations)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                useDenominations
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
              }`}
            >
              {useDenominations ? 'ငွေစက္ကူအလိုက် ဖွင့်ထားသည်' : 'ငွေစက္ကူအလိုက် ရေတွက်မည်'}
            </button>
            <button
              type="button"
              onClick={handleResetCount}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="ပြန်လည် သုညချမည် (Reset)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {useDenominations ? (
          /* Denomination Sheet */
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
              {[10000, 5000, 1000, 500, 200, 100, 50].map((denom) => {
                const count = denominations[denom] || 0;
                const totalVal = denom * count;
                return (
                  <div
                    key={denom}
                    className="p-1.5 rounded-lg border border-stone-200 bg-stone-50/70 space-y-1 text-center"
                  >
                    <span className="text-[10px] font-mono font-black text-stone-700 block">
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
                      className="w-full text-center font-mono font-bold text-xs py-1 px-1 rounded-md border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <span className="text-[9px] font-mono text-stone-500 block truncate">
                      = {formatMMK(totalVal, useMyanmarDigits)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Direct Manual Cash Input */
          <div className="max-w-md space-y-1">
            <label className="block text-[11px] font-bold text-stone-700">
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
                className="w-full text-sm font-bold font-mono px-3 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-stone-50/50"
              />
              <span className="absolute right-3 top-2 text-[10px] font-black text-stone-400">
                MMK
              </span>
            </div>
          </div>
        )}

        {/* Audit Result Banner */}
        {actualCountedCash !== null && (
          <div
            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
              discrepancy === 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : discrepancy! > 0
                ? 'bg-blue-50 border-blue-300 text-blue-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {discrepancy === 0 ? (
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : (
                <div
                  className={`w-7 h-7 rounded-lg text-white flex items-center justify-center shrink-0 ${
                    discrepancy! > 0 ? 'bg-blue-600' : 'bg-amber-600'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              <div>
                <h4 className="font-extrabold text-xs">
                  {discrepancy === 0
                    ? 'ငွေစာရင်း အတိအကျ ကိုက်ညီပါသည် (Balanced)'
                    : discrepancy! > 0
                    ? `ငွေသား ပိုနေပါသည် (+${formatMMK(discrepancy!, useMyanmarDigits)})`
                    : `ငွေသား လိုနေပါသည် (-${formatMMK(Math.abs(discrepancy!), useMyanmarDigits)})`}
                </h4>
                <p className="text-[10px] opacity-80 mt-0.2">
                  {discrepancy === 0
                    ? 'စာရင်းအရ ရှိရမည့် ငွေသားနှင့် အမှန်တကယ် ရေတွက်ရရှိသော ငွေပမာဏ တူညီပါသည်'
                    : discrepancy! > 0
                    ? 'အမှန်တကယ် ရေတွက်ရငွေသည် စာရင်းထက် ပိုမိုနေပါသည်'
                    : 'အမှန်တကယ် ရေတွက်ရငွေသည် စာရင်းထက် လျော့နည်းနေပါသည်'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[10px] block opacity-70">ကွာဟချက်</span>
              <span
                className={`text-sm sm:text-base font-black font-mono ${
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
