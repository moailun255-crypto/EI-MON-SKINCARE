import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';
import { formatMMK, formatDateMy } from '../../utils/format';
import { DeleteOrderModal } from '../transactions/DeleteOrderModal';
import {
  Printer,
  X,
  CheckCircle,
  Download,
  Trash2,
} from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const { storeProfile, useMyanmarDigits } = useStore();
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!order) return null;

  // Open in dedicated print window (reliable in all browsers, desktop, mobile & preview iframes)
  const handlePrint = () => {
    const receiptElement = document.getElementById('printable-receipt');
    if (!receiptElement) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=450,height=700');
    if (!printWin) {
      // Fallback if popup blocked
      window.print();
      return;
    }

    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt_${order.receiptNumber}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            @page { size: auto; margin: 2mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pyidaungsu", "Myanmar3", sans-serif;
              font-size: 11px;
              line-height: 1.35;
              color: #000;
              background: #fff;
              margin: 0 auto;
              padding: 6mm 4mm;
              max-width: ${storeProfile.paperSize === '58mm' ? '58mm' : '80mm'};
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-mono { font-family: monospace; }
            .border-b { border-bottom: 1px dashed #777; }
            .py-2 { padding-top: 6px; padding-bottom: 6px; }
            .py-2\\.5 { padding-top: 8px; padding-bottom: 8px; }
            .space-y-1 > * + * { margin-top: 3px; }
            .space-y-1\\.5 > * + * { margin-top: 4px; }
            .space-y-2 > * + * { margin-top: 6px; }
            .flex { display: flex; justify-content: space-between; }
            img { max-width: 100%; height: auto; }
            @media print {
              .no-print-bar { display: none !important; }
            }
            .no-print-bar {
              padding: 10px;
              text-align: center;
              background: #fdf2f4;
              border: 1px solid #fecdd3;
              margin-bottom: 15px;
              border-radius: 10px;
            }
            .print-btn {
              background: #e11d48;
              color: white;
              border: none;
              padding: 9px 18px;
              font-size: 13px;
              font-weight: bold;
              border-radius: 8px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="no-print-bar">
            <button class="print-btn" onclick="window.print()">🖨️ ပရင့်ထုတ်မည် (Print Voucher)</button>
          </div>
          ${receiptElement.innerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Download high-resolution PNG receipt image
  const handleDownloadImage = async () => {
    const receiptElement = document.getElementById('printable-receipt');
    if (!receiptElement) return;

    try {
      setIsSavingImage(true);
      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `EI_MON_Receipt_${order.receiptNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download receipt image:', err);
    } finally {
      setIsSavingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto receipt-modal-backdrop">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-stone-100 my-auto animate-fadeIn receipt-modal-card">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm sm:text-base">
              ငွေရပြေစာ (ဘောင်ချာ)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Receipt Simulation */}
        <div className="p-4 sm:p-6 bg-stone-100 overflow-y-auto max-h-[62vh] receipt-scroll-container">
          {/* Actual Printable Thermal Voucher */}
          <div
            id="printable-receipt"
            className="bg-white p-5 rounded-xl shadow-xs border border-stone-200 text-stone-900 font-sans text-xs mx-auto"
            style={{ maxWidth: storeProfile.paperSize === '58mm' ? '280px' : '340px' }}
          >
            {/* Header: Strictly "EI MON SKINCARE" */}
            <div className="text-center pb-3 border-b border-dashed border-stone-300">
              <h1 className="text-base sm:text-lg font-black tracking-wider text-stone-900 uppercase">
                EI MON SKINCARE
              </h1>
              <p className="text-[10px] text-stone-600 mt-1">
                {storeProfile.addressMy}
              </p>
              <p className="text-[10px] text-stone-700 font-medium mt-0.5">
                ဖုန်း - {storeProfile.phone}
              </p>
            </div>

            {/* Meta Info */}
            <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-stone-300">
              <div className="flex justify-between">
                <span className="text-stone-500">ပြေစာအမှတ်:</span>
                <span className="font-bold font-mono">{order.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">ရက်စွဲ:</span>
                <span>{formatDateMy(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">ငွေကိုင်:</span>
                <span>{order.cashierName}</span>
              </div>
              {order.customerName && (
                <div className="flex justify-between">
                  <span className="text-stone-500">ဝယ်ယူသူ:</span>
                  <span>{order.customerName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-stone-300 space-y-2">
              <div className="flex justify-between font-bold text-[10px] text-stone-500 uppercase tracking-wider">
                <span>ပစ္စည်းအမည်</span>
                <span>သင့်ငွေ</span>
              </div>
              {order.items.map((item, idx) => (
                <div key={idx} className="text-[11px]">
                  <div className="font-semibold text-stone-900 leading-tight">
                    {item.productNameMy}
                  </div>
                  <div className="flex justify-between text-stone-600 text-[10px] mt-0.5 font-mono">
                    <span>
                      {item.quantity} x {formatMMK(item.finalPrice, useMyanmarDigits)}
                    </span>
                    <span className="font-bold text-stone-900">
                      {formatMMK(item.lineTotal, useMyanmarDigits)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2.5 space-y-1.5 text-[11px] border-b border-dashed border-stone-300">
              <div className="flex justify-between">
                <span>ကုန်ပစ္စည်းသင့်ငွေ:</span>
                <span className="font-mono">{formatMMK(order.subtotal, useMyanmarDigits)}</span>
              </div>

              {order.discountTotal > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>လျှော့ငွေ:</span>
                  <span className="font-mono">-{formatMMK(order.discountTotal, useMyanmarDigits)}</span>
                </div>
              )}

              {order.taxAmount > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>အခွန် ({order.taxPercent}%):</span>
                  <span className="font-mono">{formatMMK(order.taxAmount, useMyanmarDigits)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black pt-1 border-t border-stone-200">
                <span>စုစုပေါင်း ကျသင့်ငွေ:</span>
                <span className="font-extrabold text-stone-900 font-mono">
                  {formatMMK(order.grandTotal, useMyanmarDigits)}
                </span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 text-[11px] space-y-1 border-b border-dashed border-stone-300">
              <div className="flex justify-between">
                <span className="text-stone-500">ရှင်းလင်းပုံစံ:</span>
                <span className="font-bold">
                  {order.paymentMethod === 'cash' ? 'ငွေသား (Cash)' : 'KBZPay'}
                </span>
              </div>
              {order.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-stone-500">ပေးချေငွေ:</span>
                    <span className="font-mono">{formatMMK(order.amountReceived, useMyanmarDigits)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>ပြန်အမ်းငွေ:</span>
                    <span className="font-mono">{formatMMK(order.changeGiven, useMyanmarDigits)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer Note */}
            <div className="pt-3 text-center space-y-1">
              <p className="text-[11px] font-bold text-stone-800">
                ဝယ်ယူအားပေးမှုကို အထူးပင် ကျေးဇူးတင်ရှိပါသည်
              </p>
              <p className="text-[9px] text-stone-500 font-medium tracking-wide">
                EI MON SKINCARE
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-white border-t border-stone-200 space-y-2 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>ဘောင်ချာ ပရင့်ထုတ်မည်</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isSavingImage}
              className="py-3 px-3.5 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="PNG ပုံအဖြစ် ဒေါင်းလုဒ်သိမ်းဆည်းမည်"
            >
              <Download className="w-4 h-4 text-rose-600" />
              <span>{isSavingImage ? 'သိမ်းနေသည်...' : 'ပုံသိမ်းဆည်းမည်'}</span>
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-3 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
              title="မှားယွင်းဖွင့်ထားသော အမှာစာအား ဖျက်သိမ်းမည်"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
            >
              ပိတ်မည်
            </button>
          </div>
        </div>
      </div>

      {/* Delete Order with Password Verification Modal */}
      {showDeleteModal && (
        <DeleteOrderModal
          order={order}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => {
            setShowDeleteModal(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
