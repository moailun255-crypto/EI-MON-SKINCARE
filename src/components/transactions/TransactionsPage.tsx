import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { PaymentMethod, Order } from '../../types';
import { formatMMK, formatDateMy } from '../../utils/format';
import { PAYMENT_LABELS } from '../../utils/translations';
import { DeleteOrderModal } from './DeleteOrderModal';
import { ClearAllOrdersModal } from './ClearAllOrdersModal';
import { RefundOrderModal } from './RefundOrderModal';
import {
  ReceiptText,
  Search,
  Printer,
  RotateCcw,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Camera,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const {
    orders,
    refundOrder,
    setActiveReceiptOrder,
    useMyanmarDigits,
    setActiveTab,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'specific' | 'week' | 'month' | 'all'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'refunded'>('all');
  const [refundingOrder, setRefundingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Helper for stepping days
  const handleStepDay = (delta: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + delta);
    const newDateStr = current.toISOString().slice(0, 10);
    setSelectedDate(newDateStr);
    setDateFilter('specific');
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    return orders.filter((order) => {
      const orderDateStr = order.createdAt.slice(0, 10);

      // Date matching
      let dateMatch = true;
      if (dateFilter === 'today') {
        dateMatch = orderDateStr === todayStr;
      } else if (dateFilter === 'yesterday') {
        dateMatch = orderDateStr === yesterdayStr;
      } else if (dateFilter === 'specific') {
        dateMatch = orderDateStr === selectedDate;
      } else if (dateFilter === 'week') {
        const orderTime = new Date(order.createdAt).getTime();
        const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        dateMatch = orderTime >= weekAgo;
      } else if (dateFilter === 'month') {
        const orderTime = new Date(order.createdAt).getTime();
        const monthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        dateMatch = orderTime >= monthAgo;
      }

      // Search matching
      const matchesSearch =
        searchTerm === '' ||
        order.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerName &&
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customerPhone && order.customerPhone.includes(searchTerm)) ||
        order.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some((item) =>
          item.productNameMy.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Payment matching
      const matchesPayment =
        paymentFilter === 'all' || order.paymentMethod === paymentFilter;

      // Status matching
      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter;

      return dateMatch && matchesSearch && matchesPayment && matchesStatus;
    });
  }, [orders, dateFilter, selectedDate, searchTerm, paymentFilter, statusFilter]);

  // Aggregate stats for filtered orders
  const completedOrders = filteredOrders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalProfit = completedOrders.reduce((sum, o) => sum + o.profit, 0);
  const cashTotal = completedOrders
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.grandTotal, 0);
  const digitalTotal = totalRevenue - cashTotal;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* Title & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <ReceiptText className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600" />
            <span>အရောင်းမှတ်တမ်းနှင့် ငွေစီးဆင်းမှု</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            EI MON SKINCARE • နေ့စဉ်ဘောင်ချာများ၊ ငွေသား/KBZPay စီးဆင်းမှုနှင့် ပြေစာမှတ်တမ်းများ
          </p>
        </div>

        {/* Date Filter Tabs, Day Picker, and Clear All Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className="px-3 py-2 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs min-h-[40px]"
            title="အရောင်းကောင်တာသို့ ပြန်သွားမည်"
          >
            <ArrowLeft className="w-4 h-4 text-rose-600" />
            <span>အရောင်းကောင်တာ (POS)</span>
          </button>

          {/* Preset Date Tabs */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-stone-200 shadow-xs text-xs overflow-x-auto">
            {(
              [
                { id: 'today', my: 'ယနေ့' },
                { id: 'yesterday', my: 'မနေ့က' },
                { id: 'specific', my: 'ရက်စွဲရွေး' },
                { id: 'week', my: '၇ ရက်' },
                { id: 'month', my: '၁ လ' },
                { id: 'all', my: 'အားလုံး' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  dateFilter === tab.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.my}
              </button>
            ))}
          </div>

          {/* Interactive Date Picker (Single Day Selector) */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-stone-200 shadow-xs text-xs gap-1">
            <button
              type="button"
              onClick={() => handleStepDay(-1)}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
              title="ယခင်ရက်သို့ (Previous Day)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-stone-50 border border-stone-200/80">
              <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setDateFilter('specific');
                  }
                }}
                className="text-xs font-mono font-bold text-stone-800 bg-transparent border-none outline-none cursor-pointer p-0"
              />
            </div>

            <button
              type="button"
              onClick={() => handleStepDay(1)}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
              title="နောက်ရက်သို့ (Next Day)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Delete all transactions flow button */}
          {orders.length > 0 && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="အရောင်းမှတ်တမ်းများ အားလုံး ရှင်းလင်းမည်"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>မှတ်တမ်းရှင်းမည်</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Day Status Bar Banner when filtered by specific day or yesterday */}
      {(dateFilter === 'specific' || dateFilter === 'yesterday') && (
        <div className="bg-rose-50/80 border border-rose-200 px-4 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-rose-900 font-bold">
            <Calendar className="w-4 h-4 text-rose-600" />
            <span>
              ရွေးချယ်ထားသော ရက်စွဲ:{' '}
              <span className="font-mono text-stone-900 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                {dateFilter === 'yesterday' ? 'မနေ့က' : selectedDate}
              </span>
            </span>
            <span className="text-rose-600">•</span>
            <span>
              အရောင်းဘောင်ချာ:{' '}
              <span className="font-mono font-black text-rose-700">
                {filteredOrders.length}
              </span>{' '}
              စောင်
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDateFilter('today')}
            className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
          >
            ယနေ့အရောင်းသို့ ပြန်သွားမည် (Back to Today)
          </button>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500">
            ရောင်းရငွေ စုစုပေါင်း
          </p>
          <p className="text-base sm:text-2xl font-black text-rose-700 mt-1">
            {formatMMK(totalRevenue, useMyanmarDigits)}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">
            {completedOrders.length} စောင်
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500">
            အကြမ်းဖျင်းအမြတ်
          </p>
          <p className="text-base sm:text-2xl font-black text-emerald-700 mt-1">
            {formatMMK(totalProfit, useMyanmarDigits)}
          </p>
          <p className="text-[10px] text-emerald-600 mt-0.5">
            {totalRevenue > 0
              ? `${Math.round((totalProfit / totalRevenue) * 100)}% အမြတ်ရာခိုင်နှုန်း`
              : '0%'}
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500">
            ငွေသား လက်ခံရရှိငွေ
          </p>
          <p className="text-base sm:text-xl font-black text-stone-800 mt-1">
            {formatMMK(cashTotal, useMyanmarDigits)}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">အံဆွဲအတွင်း ငွေသား</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500">
            KBZPay လက်ခံရရှိငွေ
          </p>
          <p className="text-base sm:text-xl font-black text-blue-700 mt-1">
            {formatMMK(digitalTotal, useMyanmarDigits)}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">KBZPay အကောင့်သို့ တိုက်ရိုက်</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ပြေစာအမှတ်၊ ဝယ်သူအမည်၊ ဖုန်း သို့မဟုတ် ပစ္စည်းရှာဖွေပါ..."
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Method Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentMethod | 'all')}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-stone-200 bg-white cursor-pointer"
          >
            <option value="all">ပေးချေမှုပုံစံ အားလုံး</option>
            {Object.entries(PAYMENT_LABELS).map(([m, label]) => (
              <option key={m} value={m}>
                {label.my}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'completed' | 'refunded')
            }
            className="text-xs font-medium px-3 py-2 rounded-xl border border-stone-200 bg-white cursor-pointer"
          >
            <option value="all">အခြေအနေ အားလုံး</option>
            <option value="completed">ပြီးစီး</option>
            <option value="refunded">ငွေပြန်အမ်းပြီး</option>
          </select>
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-stone-400">
            <ReceiptText className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="font-bold text-stone-700 text-sm">
              အရောင်းမှတ်တမ်း မတွေ့ရှိပါ
            </p>
            <p className="text-xs text-stone-400 mt-1">
              ရက်စွဲ သို့မဟုတ် ရှာဖွေမှု ပြောင်းလဲကြည့်ပါ
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredOrders.map((order) => {
              const isRefunded = order.status === 'refunded';

              return (
                <div
                  key={order.id}
                  className={`p-3.5 sm:p-4 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                    isRefunded ? 'bg-red-50/30' : 'hover:bg-rose-50/20'
                  }`}
                >
                  {/* Left: Receipt details and item list */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs sm:text-sm text-stone-900">
                        {order.receiptNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isRefunded
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isRefunded ? 'ငွေပြန်အမ်းပြီး' : 'ပြီးစီး'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.paymentMethod === 'cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.paymentMethod === 'cash' ? 'ငွေသား' : 'KBZPay'}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {formatDateMy(order.createdAt)}
                      </span>
                    </div>

                    {/* Items preview */}
                    <p className="text-xs text-stone-600 line-clamp-1">
                      {order.items
                        .map((it) => `${it.productNameMy} (x${it.quantity})`)
                        .join(', ')}
                    </p>

                    {/* Customer & Cashier info */}
                    <div className="flex items-center gap-3 text-[11px] text-stone-500">
                      <span>ငွေကိုင်: {order.cashierName}</span>
                      {order.customerName && (
                        <span>• ဝယ်သူ: {order.customerName}</span>
                      )}
                      {order.customerPhone && <span>({order.customerPhone})</span>}
                    </div>
                  </div>

                  {/* Right: Amounts and Action Buttons */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                    <div className="text-left lg:text-right">
                      <div
                        className={`text-base sm:text-lg font-black ${
                          isRefunded
                            ? 'line-through text-stone-400'
                            : 'text-rose-700'
                        }`}
                      >
                        {formatMMK(order.grandTotal, useMyanmarDigits)}
                      </div>
                      {!isRefunded && (
                        <span className="text-[10px] font-bold text-emerald-700 block">
                          အမြတ်: +{formatMMK(order.profit, useMyanmarDigits)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveReceiptOrder(order)}
                        className="px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-rose-100 hover:text-rose-700 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="ပြေစာထုတ်မည် / ဓာတ်ပုံအဖြစ် ပုံပြခန်း (Album) သို့ သိမ်းမည်"
                      >
                        <Camera className="w-4 h-4 text-rose-600" />
                        <span>ပြေစာ / ပုံ</span>
                      </button>

                      {!isRefunded && (
                        <button
                          onClick={() => setRefundingOrder(order)}
                          className="p-2 rounded-xl bg-stone-100 hover:bg-amber-100 hover:text-amber-800 text-stone-500 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="ငွေပြန်အမ်းမည် (Refund with Password)"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span className="hidden sm:inline">ပြန်အမ်း</span>
                        </button>
                      )}

                      <button
                        onClick={() => setDeletingOrder(order)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-red-100 hover:text-red-700 text-stone-500 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="မှားယွင်းဖွင့်ထား၍ အမှာစာဖျက်မည် (Delete Order)"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">ဖျက်မည်</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn border border-stone-700">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Delete Order with Password Verification Modal */}
      {deletingOrder && (
        <DeleteOrderModal
          order={deletingOrder}
          onClose={() => setDeletingOrder(null)}
          onSuccess={() => {
            setToastMsg('အမှာစာအား အောင်မြင်စွာ ဖျက်သိမ်းပြီးပါပြီ (လက်ကျန်နှင့် စာရင်းဇယားများ ပြင်ဆင်ပြီး)');
            setTimeout(() => setToastMsg(null), 3500);
          }}
        />
      )}

      {/* Refund Order with Password Verification Modal */}
      {refundingOrder && (
        <RefundOrderModal
          order={refundingOrder}
          onClose={() => setRefundingOrder(null)}
          onSuccess={() => {
            setToastMsg('ငွေပြန်အမ်းခြင်း အောင်မြင်ပြီး ကုန်ပစ္စည်းလက်ကျန် ပြန်လည်ဖြည့်တင်းပြီးပါပြီ');
            setTimeout(() => setToastMsg(null), 3500);
          }}
        />
      )}
      {/* Clear All Orders with Password Verification Modal */}
      <ClearAllOrdersModal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
      />
    </div>
  );
};
