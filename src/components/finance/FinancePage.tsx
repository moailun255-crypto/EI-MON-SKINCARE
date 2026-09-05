import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ExpenseCategory } from '../../types';
import { formatMMK, formatMMKCompact } from '../../utils/format';
import { EXPENSE_CATEGORY_LABELS, PAYMENT_LABELS } from '../../utils/translations';
import {
  TrendingUp,
  PlusCircle,
  Receipt,
  Trash2,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  CalendarDays,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

export const FinancePage: React.FC = () => {
  const {
    orders,
    expenses,
    addExpense,
    deleteExpense,
    storeProfile,
    useMyanmarDigits,
  } = useStore();

  const [dateRange, setDateRange] = useState<'this-month' | 'today' | 'all'>('this-month');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // New Expense form state
  const [expTitleMy, setExpTitleMy] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('utilities');
  const [expAmount, setExpAmount] = useState<number | ''>(50000);
  const [expNotes, setExpNotes] = useState('');

  // Date filters
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = now.toISOString().slice(0, 10);

  const filteredOrders = orders.filter((o) => {
    if (o.status !== 'completed') return false;
    if (dateRange === 'today') return o.createdAt.startsWith(todayStr);
    if (dateRange === 'this-month') return o.createdAt.startsWith(currentMonthStr);
    return true;
  });

  const filteredExpenses = expenses.filter((e) => {
    if (dateRange === 'today') return e.date === todayStr;
    if (dateRange === 'this-month') return e.date.startsWith(currentMonthStr);
    return true;
  });

  // Financial calculations
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalCOGS = filteredOrders.reduce((sum, o) => sum + o.costTotal, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
  const netMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Payment Breakdown
  const paymentBreakdown: Record<string, number> = {};
  filteredOrders.forEach((o) => {
    paymentBreakdown[o.paymentMethod] = (paymentBreakdown[o.paymentMethod] || 0) + o.grandTotal;
  });

  // Top Selling Skincare Ranking
  const productSalesMap: Record<string, { nameMy: string; qty: number; revenue: number }> = {};
  filteredOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          nameMy: item.productNameMy,
          qty: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.lineTotal;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Toggle to show profit line on chart
  const [showProfitLine, setShowProfitLine] = useState(false);

  // 30-Day Daily Sales Revenue Trend Calculation
  const thirtyDayData = useMemo(() => {
    let latestTime = new Date().getTime();
    orders.forEach((o) => {
      if (o.status === 'completed') {
        const t = new Date(o.createdAt).getTime();
        if (!isNaN(t) && t > latestTime) {
          latestTime = t;
        }
      }
    });

    const refDate = new Date(latestTime);
    const dayBuckets: {
      dateKey: string;
      shortDate: string;
      fullDate: string;
      dayOfWeek: string;
      revenue: number;
      profit: number;
      ordersCount: number;
    }[] = [];

    const ordersByDate: Record<string, { revenue: number; profit: number; count: number }> = {};
    orders.forEach((o) => {
      if (o.status === 'completed') {
        const key = o.createdAt.slice(0, 10);
        if (!ordersByDate[key]) {
          ordersByDate[key] = { revenue: 0, profit: 0, count: 0 };
        }
        ordersByDate[key].revenue += o.grandTotal;
        ordersByDate[key].profit += o.profit;
        ordersByDate[key].count += 1;
      }
    });

    const myanmarDays = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(refDate);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayIndex = d.getDay();
      const month = d.getMonth() + 1;
      const day = d.getDate();

      const stats = ordersByDate[dateKey] || { revenue: 0, profit: 0, count: 0 };

      dayBuckets.push({
        dateKey,
        shortDate: `${month}/${day}`,
        fullDate: dateKey,
        dayOfWeek: myanmarDays[dayIndex],
        revenue: stats.revenue,
        profit: stats.profit,
        ordersCount: stats.count,
      });
    }

    return dayBuckets;
  }, [orders]);

  // Aggregate metrics for the 30-day period
  const thirtyDayTotalRevenue = useMemo(() => {
    return thirtyDayData.reduce((acc, d) => acc + d.revenue, 0);
  }, [thirtyDayData]);

  const thirtyDayAvgRevenue = useMemo(() => {
    return Math.round(thirtyDayTotalRevenue / 30);
  }, [thirtyDayTotalRevenue]);

  const thirtyDayPeak = useMemo(() => {
    return thirtyDayData.reduce(
      (max, d) => (d.revenue > max.revenue ? d : max),
      thirtyDayData[0] || {
        revenue: 0,
        dateKey: '',
        shortDate: '',
        fullDate: '',
        dayOfWeek: '',
        profit: 0,
        ordersCount: 0,
      }
    );
  }, [thirtyDayData]);

  const thirtyDayTotalOrders = useMemo(() => {
    return thirtyDayData.reduce((acc, d) => acc + d.ordersCount, 0);
  }, [thirtyDayData]);

  const activeDaysCount = useMemo(() => {
    return thirtyDayData.filter((d) => d.revenue > 0).length;
  }, [thirtyDayData]);

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-stone-900/95 text-white p-3 sm:p-3.5 rounded-xl shadow-2xl border border-stone-700/80 backdrop-blur-md text-xs min-w-[210px] space-y-2">
          <div className="flex items-center justify-between border-b border-stone-700/80 pb-1.5 font-bold">
            <span className="text-stone-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              <span>{data.fullDate}</span>
            </span>
            <span className="text-amber-400 font-medium">({data.dayOfWeek})</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-stone-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                ရောင်းရငွေ (ဝင်ငွေ):
              </span>
              <span className="font-black text-rose-400 text-sm tracking-tight">
                {formatMMK(data.revenue, useMyanmarDigits)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                အကြမ်းဖျင်းအမြတ်:
              </span>
              <span className="font-bold text-emerald-400">
                {formatMMK(data.profit, useMyanmarDigits)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-stone-800 text-[11px]">
              <span className="text-stone-400 flex items-center gap-1.5">
                <ShoppingBag className="w-3 h-3 text-stone-400" />
                ဘောင်ချာစောင်ရေ:
              </span>
              <span className="font-bold text-stone-200">
                {data.ordersCount} စောင်
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitleMy) return;

    addExpense({
      title: expTitleMy,
      titleMy: expTitleMy,
      category: expCategory,
      amount: Number(expAmount) || 0,
      date: new Date().toISOString().slice(0, 10),
      recordedBy: storeProfile.activeCashier,
      notes: expNotes,
    });

    setExpTitleMy('');
    setExpAmount(0);
    setExpNotes('');
    setIsAddExpenseOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Title & Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600" />
            <span>ဘဏ္ဍာရေးနှင့် အရှုံးအမြတ်စာရင်း</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            EI MON SKINCARE • ရောင်းရငွေ၊ ကုန်ပစ္စည်းဝယ်ရင်းစရိတ်၊ ဆိုင်စရိတ်များနှင့် အသားတင်အမြတ်
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-stone-200 shadow-xs text-xs">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                dateRange === 'today'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ယနေ့
            </button>
            <button
              onClick={() => setDateRange('this-month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                dateRange === 'this-month'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ယခုလ
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                dateRange === 'all'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              အားလုံး
            </button>
          </div>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>စရိတ်ထည့်ရန်</span>
          </button>
        </div>
      </div>

      {/* P&L Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              ရောင်းရငွေ (ဝင်ငွေ)
            </span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-rose-700">
            {formatMMK(totalRevenue, useMyanmarDigits)}
          </h3>
          <p className="text-[10px] text-stone-400 mt-1">
            {filteredOrders.length} ဘောင်ချာစောင်
          </p>
        </div>

        {/* 2. COGS (Cost of Goods Sold) */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              ဝယ်ရင်းစရိတ်
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-stone-800">
            {formatMMK(totalCOGS, useMyanmarDigits)}
          </h3>
          <p className="text-[10px] text-stone-400 mt-1">ကုန်ပစ္စည်းမူရင်း လက်ကားဈေး</p>
        </div>

        {/* 3. Gross Profit */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              အကြမ်းဖျင်းအမြတ်
            </span>
            <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {grossMargin}%
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-700">
            {formatMMK(grossProfit, useMyanmarDigits)}
          </h3>
          <p className="text-[10px] text-stone-400 mt-1">ဝင်ငွေမှ ကုန်ကျစရိတ်နုတ်ပြီး</p>
        </div>

        {/* 4. Operating Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              ဆိုင်စရိတ်များ
            </span>
            <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-red-600">
            {formatMMK(totalExpenses, useMyanmarDigits)}
          </h3>
          <p className="text-[10px] text-stone-400 mt-1">
            {filteredExpenses.length} ခု
          </p>
        </div>

        {/* 5. Net Profit */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white p-4 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-stone-300 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              အသားတင်အမြတ်
            </span>
            <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-emerald-500 text-white">
              {netMargin}%
            </span>
          </div>
          <h3
            className={`text-xl sm:text-2xl font-black ${
              netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatMMK(netProfit, useMyanmarDigits)}
          </h3>
          <p className="text-[10px] text-stone-400 mt-1">
            စရိတ်အားလုံးနုတ်ပြီး အမြတ်
          </p>
        </div>
      </div>

      {/* 30-Day Daily Sales Revenue Recharts Line Chart Section */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        {/* Header with Title, Descriptions and Summary Badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span>လွန်ခဲ့သော ရက် (၃၀) နေ့စဉ် အရောင်းဝင်ငွေ စီးဆင်းမှုမျဉ်းပြဇယား</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              ရက် (၃၀) အတွင်း နေ့အလိုက် ရောင်းရငွေ (MMK) နှင့် အရောင်းအမြင့်ဆုံးနေ့များ စောင့်ကြည့်လေ့လာချက်
            </p>
          </div>

          {/* Quick Metrics Badges & Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-rose-50/80 border border-rose-200/60 rounded-xl px-3 py-1.5">
              <span className="text-[10px] uppercase font-bold text-rose-600 block">
                ရက် (၃၀) စုစုပေါင်း
              </span>
              <span className="text-xs sm:text-sm font-black text-rose-700">
                {formatMMK(thirtyDayTotalRevenue, useMyanmarDigits)}
              </span>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">
                နေ့စဉ်ပျမ်းမျှ
              </span>
              <span className="text-xs sm:text-sm font-black text-stone-800">
                {formatMMK(thirtyDayAvgRevenue, useMyanmarDigits)}
              </span>
            </div>

            {thirtyDayPeak.revenue > 0 && (
              <div className="hidden sm:block bg-amber-50/80 border border-amber-200/60 rounded-xl px-3 py-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">
                  အမြင့်ဆုံးနေ့ ({thirtyDayPeak.shortDate})
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-800">
                  {formatMMK(thirtyDayPeak.revenue, useMyanmarDigits)}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowProfitLine(!showProfitLine)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showProfitLine
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  showProfitLine ? 'bg-emerald-500' : 'bg-stone-300'
                }`}
              />
              <span>
                {showProfitLine ? 'အမြတ်မျဉ်း ဖျောက်မည်' : 'အမြတ်မျဉ်း ကြည့်မည်'}
              </span>
            </button>
          </div>
        </div>

        {/* Recharts Line Chart Container */}
        <div className="w-full h-72 sm:h-80 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={thirtyDayData}
              margin={{ top: 12, right: 15, left: -5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="shortDate"
                tick={{ fontSize: 11, fill: '#78716c' }}
                tickLine={false}
                axisLine={{ stroke: '#e7e5e4' }}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#78716c' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatMMKCompact(val, useMyanmarDigits)}
                width={82}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <ReferenceLine
                y={thirtyDayAvgRevenue}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="နေ့စဉ်ရောင်းရငွေ (MMK)"
                stroke="#e11d48"
                strokeWidth={3}
                dot={{
                  r: 3.5,
                  fill: '#e11d48',
                  stroke: '#ffffff',
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 6,
                  fill: '#e11d48',
                  stroke: '#ffffff',
                  strokeWidth: 2.5,
                }}
              />
              {showProfitLine && (
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="နေ့စဉ်အမြတ်ငွေ (MMK)"
                  stroke="#059669"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{
                    r: 3,
                    fill: '#059669',
                    stroke: '#ffffff',
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 5.5,
                    fill: '#059669',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Legend & Mini Stats Grid */}
        <div className="pt-3 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-stone-700">
            <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[10px] text-stone-400 block font-medium truncate">
                အဓိက စာရင်း
              </span>
              <span className="font-bold truncate block">
                ရောင်းရငွေ (MMK)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-stone-700">
            <CalendarDays className="w-4 h-4 text-stone-500 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[10px] text-stone-400 block font-medium truncate">
                အရောင်းရှိသောရက်များ
              </span>
              <span className="font-bold truncate block">
                {activeDaysCount} / 30 ရက်
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-stone-700">
            <ShoppingBag className="w-4 h-4 text-stone-500 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[10px] text-stone-400 block font-medium truncate">
                စုစုပေါင်း ဘောင်ချာ
              </span>
              <span className="font-bold truncate block">
                {thirtyDayTotalOrders} စောင်
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-stone-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[10px] text-stone-400 block font-medium truncate">
                ဘောင်ချာတစ်စောင် ပျမ်းမျှ
              </span>
              <span className="font-bold text-stone-900 truncate block">
                {thirtyDayTotalOrders > 0
                  ? formatMMK(Math.round(thirtyDayTotalRevenue / thirtyDayTotalOrders), useMyanmarDigits)
                  : formatMMK(0, useMyanmarDigits)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Left = Payment Methods & Top Products, Right = Expenses List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Col (5 cols): Payment Channels & Top Skincare Sellers */}
        <div className="lg:col-span-5 space-y-5">
          {/* Payment Method Distribution */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-rose-600" />
              <span>ငွေပေးချေမှုပုံစံ ခွဲခြမ်းစိတ်ဖြာချက်</span>
            </h3>

            <div className="space-y-2.5">
              {Object.entries(PAYMENT_LABELS).map(([key, label]) => {
                const amount = paymentBreakdown[key] || 0;
                const percentage = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-stone-700">
                        {label.my}
                      </span>
                      <span className="text-stone-900 font-bold">
                        {formatMMK(amount, useMyanmarDigits)}{' '}
                        <span className="text-[10px] text-stone-400 font-normal">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Selling Skincare Products */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>အရောင်းရဆုံး အလှကုန်ပစ္စည်းများ</span>
            </h3>

            <div className="space-y-2.5 divide-y divide-stone-100">
              {topProducts.length === 0 ? (
                <p className="text-xs text-stone-400 py-3 text-center">
                  အရောင်းမှတ်တမ်း မရှိသေးပါ
                </p>
              ) : (
                topProducts.map((item, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {item.nameMy}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {item.qty} ခု ရောင်းချရ
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-rose-700 whitespace-nowrap">
                      {formatMMK(item.revenue, useMyanmarDigits)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col (7 cols): Operating Expenses Log */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-600" />
              <span>စတိုးဆိုင် ကုန်ကျစရိတ် မှတ်တမ်းများ</span>
            </h3>
            <span className="text-xs font-extrabold text-red-600">
              စုစုပေါင်း: {formatMMK(totalExpenses, useMyanmarDigits)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 text-[10px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                  <th className="py-2.5 px-3">အမျိုးအစား</th>
                  <th className="py-2.5 px-3">အကြောင်းအရာ</th>
                  <th className="py-2.5 px-3 text-right">ငွေပမာဏ (MMK)</th>
                  <th className="py-2.5 px-3">ရက်စွဲ</th>
                  <th className="py-2.5 px-2 text-right">ဖျက်မည်</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      အသုံးစရိတ် မရှိသေးပါ
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-stone-50">
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold text-[10px]">
                          {EXPENSE_CATEGORY_LABELS[exp.category]?.my || exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-stone-900">
                        {exp.titleMy || exp.title}
                        {exp.notes && (
                          <span className="text-[10px] text-stone-400 block">{exp.notes}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-red-600">
                        -{formatMMK(exp.amount, useMyanmarDigits)}
                      </td>
                      <td className="py-2.5 px-3 text-stone-500">{exp.date}</td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="font-extrabold text-stone-900 text-base">
              ဆိုင်အသုံးစရိတ် အသစ်ထည့်သွင်းရန်
            </h3>

            <form onSubmit={handleCreateExpense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  အသုံးစရိတ် အမျိုးအစား
                </label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200 bg-white cursor-pointer"
                >
                  {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label.my}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  အကြောင်းအရာ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ဥပမာ - မီတာခ၊ စက္ကူအိတ်ဖိုး၊ ဆိုင်ငှားခ..."
                  value={expTitleMy}
                  onChange={(e) => setExpTitleMy(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ကုန်ကျငွေ ပမာဏ (MMK) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={expAmount}
                    onChange={(e) =>
                      setExpAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200 font-bold"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-stone-400">
                    MMK
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  မှတ်ချက်
                </label>
                <input
                  type="text"
                  placeholder="ဥပမာ - KPay ဖြင့် ပေးချေထားသည်"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
                >
                  စရိတ် သိမ်းဆည်းမည်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
