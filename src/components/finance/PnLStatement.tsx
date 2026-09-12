import React from 'react';
import { Order, Expense, StoreProfile } from '../../types';
import { formatMMK } from '../../utils/format';
import { EXPENSE_CATEGORY_LABELS } from '../../utils/translations';
import {
  Printer,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Percent,
  CheckCircle,
  HelpCircle,
  Building2,
} from 'lucide-react';

interface PnLStatementProps {
  completedOrders: Order[];
  refundedOrders: Order[];
  expenses: Expense[];
  storeProfile: StoreProfile;
  useMyanmarDigits: boolean;
  dateLabel: string;
}

export const PnLStatement: React.FC<PnLStatementProps> = ({
  completedOrders,
  refundedOrders,
  expenses,
  storeProfile,
  useMyanmarDigits,
  dateLabel,
}) => {
  // Financial Calculations
  const grossSales = completedOrders.reduce((sum, o) => sum + (o.subtotal || o.grandTotal), 0);
  const totalDiscounts = completedOrders.reduce((sum, o) => sum + (o.discountTotal || 0), 0);
  const totalRefunds = refundedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const netSalesRevenue = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  const totalCOGS = completedOrders.reduce((sum, o) => sum + (o.costTotal || 0), 0);
  const grossProfit = netSalesRevenue - totalCOGS;
  const grossMargin = netSalesRevenue > 0 ? ((grossProfit / netSalesRevenue) * 100).toFixed(1) : '0.0';

  // Group Expenses by Category
  const expenseByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
  });
  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const netOperatingProfit = grossProfit - totalOperatingExpenses;
  const netMargin =
    netSalesRevenue > 0 ? ((netOperatingProfit / netSalesRevenue) * 100).toFixed(1) : '0.0';

  const totalTaxCollected = completedOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);
  const totalItemsSold = completedOrders.reduce((sum, o) => sum + (o.itemCount || 0), 0);
  const averageOrderValue =
    completedOrders.length > 0 ? Math.round(netSalesRevenue / completedOrders.length) : 0;
  const averageProfitPerOrder =
    completedOrders.length > 0 ? Math.round(grossProfit / completedOrders.length) : 0;

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const rows = [
      ['EI MON SKINCARE - အရှုံးအမြတ် စာရင်းရှင်းတမ်း (Income Statement)'],
      ['စစ်ဆေးသည့် ကာလ:', dateLabel],
      ['ထုတ်ယူသည့် ရက်စွဲ:', new Date().toLocaleString()],
      ['ဆိုင်တာဝန်ခံ:', storeProfile.activeCashier],
      [''],
      ['ခေါင်းစဉ်', 'ငွေပမာဏ (MMK)', 'မှတ်ချက်'],
      ['၁။ အရောင်းဆိုင်ရာ ဝင်ငွေ (OPERATING REVENUE)', '', ''],
      ['အရောင်း စုစုပေါင်း (Gross Sales)', grossSales, ''],
      ['နှုတ် - ပေးခဲ့သော လျှော့စျေးများ (Discounts)', -totalDiscounts, ''],
      ['နှုတ် - ပြန်အမ်းငွေများ (Refunds & Returns)', -totalRefunds, `${refundedOrders.length} စောင်`],
      ['အသားတင် ရောင်းရငွေ (Net Sales Revenue)', netSalesRevenue, '100.0%'],
      [''],
      ['၂။ ရောင်းကုန်ဝယ်ရင်းစရိတ် (COST OF GOODS SOLD)', '', ''],
      ['ရောင်းချရသော ပစ္စည်းမူရင်းတန်ဖိုး (COGS)', totalCOGS, ''],
      ['အကြမ်းဖျင်း အမြတ်ငွေ (Gross Profit)', grossProfit, `အမြတ်နှုန်း: ${grossMargin}%`],
      [''],
      ['၃။ ဆိုင်လည်ပတ်မှု ကုန်ကျစရိတ်များ (OPERATING EXPENSES)', '', ''],
      ...Object.entries(EXPENSE_CATEGORY_LABELS).map(([cat, label]) => [
        label.my,
        expenseByCategory[cat] || 0,
        '',
      ]),
      ['စုစုပေါင်း ဆိုင်စရိတ် (Total Operating Expenses)', totalOperatingExpenses, ''],
      [''],
      ['၄။ အသားတင် လည်ပတ်မှု အမြတ် (NET OPERATING PROFIT)', '', ''],
      ['အသားတင် အမြတ်ငွေ (Net Profit)', netOperatingProfit, `အမြတ်နှုန်း: ${netMargin}%`],
      [''],
      ['၅။ အခြား အချက်အလက်များ', '', ''],
      ['ကောက်ခံရရှိသော ကုန်သွယ်ခွန် (Tax)', totalTaxCollected, ''],
      ['ပြီးစီးခဲ့သော ဘောင်ချာစောင်ရေ', completedOrders.length, ''],
      ['ရောင်းချရသော ကုန်ပစ္စည်း အရေအတွက်', totalItemsSold, 'ခု'],
      ['ဘောင်ချာတစ်စောင် ပျမ်းမျှရောင်းရငွေ (AOV)', averageOrderValue, 'MMK'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EI_MON_PnL_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-rose-600" />
            <span>တရားဝင် အရှုံးအမြတ် ရှင်းတမ်း (Income Statement)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            ကာလ: <span className="font-bold text-stone-800">{dateLabel}</span> • GAAP နှင့် လက်လီအရောင်းစံနှုန်း အကိုက် ဘဏ္ဍာရေးစာရင်း
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV ဒေါင်းလုဒ်</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>အစီရင်ခံစာ ပရင့်ထုတ်မည်</span>
          </button>
        </div>
      </div>

      {/* Printable Paper Canvas Statement */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm p-4 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="text-center border-b-2 border-stone-900 pb-5 space-y-1">
          <div className="inline-flex items-center justify-center gap-2 text-rose-600 mb-1">
            <Building2 className="w-6 h-6" />
            <span className="text-xs font-bold tracking-widest uppercase">Official Financial Statement</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            {storeProfile.name || 'EI MON SKINCARE'}
          </h1>
          <p className="text-xs text-stone-600 font-medium">{storeProfile.sloganMy || 'အရည်အသွေးမြင့် အသားအရေထိန်းသိမ်းမှု ပစ္စည်းများ'}</p>
          <p className="text-[11px] text-stone-500 font-mono">
            ဖုန်း: {storeProfile.phone} • ဆိုင်လိပ်စာ: {storeProfile.addressMy || storeProfile.address}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-stone-700">
            <span className="bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
              ကာလ: {dateLabel}
            </span>
            <span className="bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
              စာရင်းစစ်: {storeProfile.activeCashier}
            </span>
            <span className="bg-stone-100 px-3 py-1 rounded-full border border-stone-200 font-mono">
              ရက်စွဲ: {new Date().toISOString().slice(0, 10)}
            </span>
          </div>
        </div>

        {/* Financial Statement Table */}
        <div className="space-y-4">
          {/* Section 1: Revenue */}
          <div className="overflow-hidden border border-stone-200 rounded-2xl">
            <div className="bg-stone-100 px-4 py-2.5 font-black text-xs text-stone-800 uppercase tracking-wider flex justify-between">
              <span>၁။ အရောင်းဆိုင်ရာ ဝင်ငွေ (Operating Revenue)</span>
              <span>MMK</span>
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-stone-100">
                <tr className="hover:bg-stone-50/50">
                  <td className="py-2.5 px-4 text-stone-700">အရောင်း စုစုပေါင်း (Gross Sales)</td>
                  <td className="py-2.5 px-4 text-right font-mono text-stone-900">
                    {formatMMK(grossSales, useMyanmarDigits)}
                  </td>
                </tr>
                {totalDiscounts > 0 && (
                  <tr className="hover:bg-stone-50/50 text-stone-600">
                    <td className="py-2.5 px-4 pl-8 flex items-center gap-1">
                      <span>- ပေးခဲ့သော လျှော့စျေးများ (Sales Discounts)</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-amber-700">
                      -{formatMMK(totalDiscounts, useMyanmarDigits)}
                    </td>
                  </tr>
                )}
                {totalRefunds > 0 && (
                  <tr className="hover:bg-stone-50/50 text-stone-600">
                    <td className="py-2.5 px-4 pl-8 flex items-center gap-1">
                      <span>- ပစ္စည်းပြန်အပ်/ငွေပြန်အမ်းငွေ ({refundedOrders.length} စောင်)</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-red-600">
                      -{formatMMK(totalRefunds, useMyanmarDigits)}
                    </td>
                  </tr>
                )}
                <tr className="bg-rose-50/60 font-black text-rose-950 border-t border-rose-200">
                  <td className="py-3 px-4 flex items-center justify-between">
                    <span>အသားတင် ရောင်းရငွေ (Net Sales Revenue)</span>
                    <span className="text-[10px] text-rose-700 font-bold bg-white px-2 py-0.5 rounded-md border border-rose-200">
                      100.0%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm sm:text-base text-rose-700">
                    {formatMMK(netSalesRevenue, useMyanmarDigits)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: COGS & Gross Profit */}
          <div className="overflow-hidden border border-stone-200 rounded-2xl">
            <div className="bg-stone-100 px-4 py-2.5 font-black text-xs text-stone-800 uppercase tracking-wider flex justify-between">
              <span>၂။ ရောင်းကုန်ဝယ်ရင်းစရိတ်နှင့် အကြမ်းဖျင်းအမြတ် (COGS & Gross Profit)</span>
              <span>MMK</span>
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-stone-100">
                <tr className="hover:bg-stone-50/50">
                  <td className="py-2.5 px-4 text-stone-700">
                    ရောင်းချရသော ပစ္စည်းမူရင်းဝယ်ရင်းစရိတ် (Cost of Goods Sold - COGS)
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-stone-800">
                    {formatMMK(totalCOGS, useMyanmarDigits)}
                  </td>
                </tr>
                <tr className="bg-emerald-50/70 font-black text-emerald-950 border-t border-emerald-200">
                  <td className="py-3 px-4 flex items-center justify-between">
                    <span>အကြမ်းဖျင်း အမြတ်ငွေ (Gross Profit)</span>
                    <span className="text-[11px] text-emerald-800 font-bold bg-white px-2.5 py-0.5 rounded-md border border-emerald-300">
                      အမြတ်နှုန်း: {grossMargin}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm sm:text-base text-emerald-700">
                    {formatMMK(grossProfit, useMyanmarDigits)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Operating Expenses */}
          <div className="overflow-hidden border border-stone-200 rounded-2xl">
            <div className="bg-stone-100 px-4 py-2.5 font-black text-xs text-stone-800 uppercase tracking-wider flex justify-between">
              <span>၃။ ဆိုင်လည်ပတ်မှု ကုန်ကျစရိတ်များ (Operating Expenses - OPEX)</span>
              <span>MMK</span>
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-stone-100">
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([cat, label]) => {
                  const amount = expenseByCategory[cat] || 0;
                  const pctOfRevenue =
                    netSalesRevenue > 0 ? ((amount / netSalesRevenue) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={cat} className="hover:bg-stone-50/50">
                      <td className="py-2.5 px-4 text-stone-700 flex items-center justify-between">
                        <span>{label.my}</span>
                        {amount > 0 && (
                          <span className="text-[10px] text-stone-400 font-mono">
                            {pctOfRevenue}% of sales
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-stone-800">
                        {amount > 0 ? formatMMK(amount, useMyanmarDigits) : '-'}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-stone-50 font-black text-red-950 border-t border-stone-300">
                  <td className="py-3 px-4">စုစုပေါင်း ဆိုင်စရိတ် (Total Operating Expenses)</td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-red-600">
                    -{formatMMK(totalOperatingExpenses, useMyanmarDigits)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 4: Net Operating Profit (The Bottom Line) */}
          <div className="border-2 border-stone-900 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-stone-900 text-white px-4 py-3 font-black text-xs uppercase tracking-wider flex justify-between items-center">
              <span className="text-amber-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                ၄။ အသားတင် လုပ်ငန်းလည်ပတ်မှု အမြတ် (Net Operating Profit)
              </span>
              <span className="bg-emerald-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                Net Margin: {netMargin}%
              </span>
            </div>
            <div className="p-4 sm:p-6 bg-gradient-to-br from-stone-50 to-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-stone-600 font-medium">
                  ကုန်ကျစရိတ်နှင့် ဆိုင်စရိတ်အားလုံး နုတ်ပြီး အသားတင် အမြတ်ငွေ
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Gross Profit ({formatMMK(grossProfit, useMyanmarDigits)}) - Total OPEX ({formatMMK(totalOperatingExpenses, useMyanmarDigits)})
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {formatMMK(netOperatingProfit, useMyanmarDigits)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Supplemental Key Performance Ratios */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">ဘောင်ချာ အရေအတွက်</span>
              <span className="font-mono font-black text-stone-900 text-sm">{completedOrders.length} စောင်</span>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">ရောင်းချရသော ပစ္စည်းစုစုပေါင်း</span>
              <span className="font-mono font-black text-stone-900 text-sm">{totalItemsSold} ခု</span>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">ဘောင်ချာတစ်စောင် ပျမ်းမျှတန်ဖိုး</span>
              <span className="font-mono font-black text-rose-700 text-sm">{formatMMK(averageOrderValue, useMyanmarDigits)}</span>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">ဘောင်ချာတစ်စောင် ပျမ်းမျှအမြတ်</span>
              <span className="font-mono font-black text-emerald-700 text-sm">{formatMMK(averageProfitPerOrder, useMyanmarDigits)}</span>
            </div>
          </div>
        </div>

        {/* Official Signatures Box for Auditing */}
        <div className="pt-10 border-t border-stone-200 grid grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-8">
            <div className="border-b border-stone-400 pb-1 w-3/4 mx-auto" />
            <div>
              <p className="font-bold text-stone-800">စာရင်းပြုစုသူ (Cashier)</p>
              <p className="text-[10px] text-stone-400 mt-0.5">{storeProfile.activeCashier}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="border-b border-stone-400 pb-1 w-3/4 mx-auto" />
            <div>
              <p className="font-bold text-stone-800">စာရင်းစစ်ဆေးသူ (Auditor)</p>
              <p className="text-[10px] text-stone-400 mt-0.5">အကြီးတန်း စာရင်းကိုင်</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="border-b border-stone-400 pb-1 w-3/4 mx-auto" />
            <div>
              <p className="font-bold text-stone-800">အတည်ပြုသူ (Store Owner)</p>
              <p className="text-[10px] text-stone-400 mt-0.5">မအိမွန် (Ei Mon)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
