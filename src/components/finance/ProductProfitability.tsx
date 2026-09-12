import React, { useState, useMemo } from 'react';
import { Order, Product } from '../../types';
import { formatMMK } from '../../utils/format';
import { CATEGORY_LABELS } from '../../utils/translations';
import {
  Sparkles,
  ArrowUpDown,
  Search,
  TrendingUp,
  Download,
  AlertCircle,
  Package,
} from 'lucide-react';

interface ProductProfitabilityProps {
  completedOrders: Order[];
  products: Product[];
  useMyanmarDigits: boolean;
  dateLabel: string;
}

type SortField = 'profit' | 'revenue' | 'quantity' | 'margin';

export const ProductProfitability: React.FC<ProductProfitabilityProps> = ({
  completedOrders,
  products,
  useMyanmarDigits,
  dateLabel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('profit');
  const [sortAsc, setSortAsc] = useState(false);

  // Map products to current stock
  const productStockMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      map[p.id] = p.stock;
    });
    return map;
  }, [products]);

  // Aggregate Product Performance
  const productStats = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        nameMy: string;
        category: string;
        unitsSold: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    > = {};

    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = {
            id: item.productId,
            nameMy: item.productNameMy,
            category: item.productCategory,
            unitsSold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          };
        }

        const itemCost = item.unitCost * item.quantity;
        const itemRevenue = item.lineTotal;
        const itemProfit = itemRevenue - itemCost;

        map[item.productId].unitsSold += item.quantity;
        map[item.productId].revenue += itemRevenue;
        map[item.productId].cost += itemCost;
        map[item.productId].profit += itemProfit;
      });
    });

    return Object.values(map);
  }, [completedOrders]);

  // Filter and Sort
  const filteredAndSorted = useMemo(() => {
    return productStats
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.nameMy.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (CATEGORY_LABELS[p.category]?.my || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'profit') {
          diff = a.profit - b.profit;
        } else if (sortField === 'revenue') {
          diff = a.revenue - b.revenue;
        } else if (sortField === 'quantity') {
          diff = a.unitsSold - b.unitsSold;
        } else if (sortField === 'margin') {
          const marginA = a.revenue > 0 ? (a.profit / a.revenue) * 100 : 0;
          const marginB = b.revenue > 0 ? (b.profit / b.revenue) * 100 : 0;
          diff = marginA - marginB;
        }
        return sortAsc ? diff : -diff;
      });
  }, [productStats, searchQuery, sortField, sortAsc]);

  const totalAggregates = useMemo(() => {
    return productStats.reduce(
      (acc, curr) => ({
        unitsSold: acc.unitsSold + curr.unitsSold,
        revenue: acc.revenue + curr.revenue,
        cost: acc.cost + curr.cost,
        profit: acc.profit + curr.profit,
      }),
      { unitsSold: 0, revenue: 0, cost: 0, profit: 0 }
    );
  }, [productStats]);

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['EI MON SKINCARE - ကုန်ပစ္စည်းတစ်ခုချင်းစီ၏ အမြတ်အစွန်းဆန်းစစ်ချက်'],
      ['ကာလ:', dateLabel],
      [''],
      ['ကုန်ပစ္စည်းအမည်', 'အမျိုးအစား', 'ရောင်းချရမှု (ခု)', 'စုစုပေါင်းရောင်းရငွေ (MMK)', 'မူရင်းဝယ်ရင်းစရိတ် (MMK)', 'အမြတ်ငွေ (MMK)', 'အမြတ်ရာခိုင်နှုန်း (%)'],
      ...filteredAndSorted.map((p) => {
        const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : '0.0';
        return [
          p.nameMy,
          CATEGORY_LABELS[p.category]?.my || p.category,
          p.unitsSold,
          p.revenue,
          p.cost,
          p.profit,
          `${margin}%`,
        ];
      }),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EI_MON_Product_Profitability_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>ကုန်ပစ္စည်းတစ်ခုချင်းစီ၏ အမြတ်အစွန်းဆန်းစစ်ချက် (Product Profitability)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            ကာလ: <span className="font-bold text-stone-800">{dateLabel}</span> • အမြတ်အများဆုံး ထွက်သော ပစ္စည်းများနှင့် အမြတ်ရာခိုင်နှုန်း စိစစ်ချက်
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV ထုတ်ယူမည်</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-stone-400 block">
            အရောင်းရှိခဲ့သော ပစ္စည်းအမျိုးအမည်
          </span>
          <span className="text-xl sm:text-2xl font-black text-stone-900 font-mono mt-1 block">
            {productStats.length} မျိုး
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-stone-400 block">
            ရောင်းချရသော စုစုပေါင်း အရေအတွက်
          </span>
          <span className="text-xl sm:text-2xl font-black text-stone-900 font-mono mt-1 block">
            {totalAggregates.unitsSold} ခု
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-rose-600 block">
            စုစုပေါင်း ရောင်းရငွေ
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-700 font-mono mt-1 block">
            {formatMMK(totalAggregates.revenue, useMyanmarDigits)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600 block">
            စုစုပေါင်း အကြမ်းဖျင်းအမြတ်
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1 block">
            {formatMMK(totalAggregates.profit, useMyanmarDigits)}
          </span>
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ပစ္စည်းအမည် သို့မဟုတ် အမျိုးအစား ရှာရန်..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50"
          />
        </div>

        {/* Sort Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-stone-400 text-[11px] font-bold mr-1">စီစဉ်ရန်:</span>
          <button
            type="button"
            onClick={() => handleToggleSort('profit')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              sortField === 'profit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>အမြတ်အများဆုံး</span>
            {sortField === 'profit' && <span>{sortAsc ? '↑' : '↓'}</span>}
          </button>

          <button
            type="button"
            onClick={() => handleToggleSort('revenue')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              sortField === 'revenue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>ဝင်ငွေအများဆုံး</span>
            {sortField === 'revenue' && <span>{sortAsc ? '↑' : '↓'}</span>}
          </button>

          <button
            type="button"
            onClick={() => handleToggleSort('quantity')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              sortField === 'quantity'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>အရောင်းရဆုံး (ခု)</span>
            {sortField === 'quantity' && <span>{sortAsc ? '↑' : '↓'}</span>}
          </button>

          <button
            type="button"
            onClick={() => handleToggleSort('margin')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              sortField === 'margin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>အမြတ်ရာခိုင်နှုန်း %</span>
            {sortField === 'margin' && <span>{sortAsc ? '↑' : '↓'}</span>}
          </button>
        </div>
      </div>

      {/* Product Profitability Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 text-[10px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                <th className="py-3 px-4">စဉ်</th>
                <th className="py-3 px-4">ကုန်ပစ္စည်းအမည်</th>
                <th className="py-3 px-3">အမျိုးအစား</th>
                <th className="py-3 px-3 text-right">ရောင်းရမှု (Qty)</th>
                <th className="py-3 px-3 text-right">ရောင်းရငွေ (Revenue)</th>
                <th className="py-3 px-3 text-right">ဝယ်ရင်းစရိတ် (COGS)</th>
                <th className="py-3 px-4 text-right">အမြတ်ငွေ (Gross Profit)</th>
                <th className="py-3 px-4 text-right">အမြတ်နှုန်း %</th>
                <th className="py-3 px-3 text-center">လက်ကျန်</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    ရွေးချယ်ထားသော ကာလတွင် အရောင်းမှတ်တမ်း မရှိသေးပါ
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((item, idx) => {
                  const marginPct =
                    item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : '0.0';
                  const stock = productStockMap[item.id] ?? 0;
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 text-stone-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-stone-900 max-w-xs truncate">
                        {item.nameMy}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[10px]">
                          {CATEGORY_LABELS[item.category]?.my || item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-800">
                        {item.unitsSold} ခု
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                        {formatMMK(item.revenue, useMyanmarDigits)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-stone-500">
                        {formatMMK(item.cost, useMyanmarDigits)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                        {formatMMK(item.profit, useMyanmarDigits)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block font-mono font-bold text-[11px] px-2 py-0.5 rounded-md ${
                            Number(marginPct) >= 30
                              ? 'bg-emerald-100 text-emerald-800'
                              : Number(marginPct) >= 15
                              ? 'bg-blue-50 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {marginPct}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            stock <= 5
                              ? 'bg-rose-100 text-rose-800 font-black'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {stock}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
