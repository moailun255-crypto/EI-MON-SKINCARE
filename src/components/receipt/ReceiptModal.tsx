import React, { useState } from 'react';
import { toPng } from 'html-to-image';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';
import { formatMMK, formatDateMy } from '../../utils/format';
import { DeleteOrderModal } from '../transactions/DeleteOrderModal';
import { ReceiptPhotoSaverModal } from './ReceiptPhotoSaverModal';
import {
  Printer,
  X,
  Trash2,
  Camera,
  Download,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Receipt as ReceiptIcon,
  Crown,
} from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const { storeProfile, useMyanmarDigits } = useStore();
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [slipStyle, setSlipStyle] = useState<'luxury' | 'thermal'>('luxury');

  // Photo Album Saver State
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [savedImageBlob, setSavedImageBlob] = useState<Blob | null>(null);
  const [showPhotoSaverModal, setShowPhotoSaverModal] = useState(false);
  const [downloadToast, setDownloadToast] = useState(false);

  if (!order) return null;

  // Print voucher in dedicated window
  const handlePrint = () => {
    const receiptElement = document.getElementById('printable-receipt');
    if (!receiptElement) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=480,height=750');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>EI_MON_Receipt_${order.receiptNumber}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            @page { size: auto; margin: 3mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pyidaungsu", "Myanmar3", sans-serif;
              font-size: 11px;
              line-height: 1.35;
              color: #000;
              background: #fff;
              margin: 0 auto;
              padding: 6mm 4mm;
              max-width: ${storeProfile.paperSize === '58mm' ? '58mm' : '82mm'};
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-mono { font-family: monospace; }
            .border-b { border-bottom: 1px dashed #777; }
            .py-2 { padding-top: 6px; padding-bottom: 6px; }
            .space-y-1 > * + * { margin-top: 3px; }
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

  // Helper to convert base64 data URL to binary Blob reliably
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // High-Resolution 300DPI Capture & Direct Save to Photo Album / Gallery
  const handleSaveToAlbum = async () => {
    const receiptElement = document.getElementById('printable-receipt');
    if (!receiptElement) return;

    try {
      setIsSavingImage(true);

      // Scroll container to top so no elements are clipped by scroll position
      const scrollContainer = receiptElement.closest('.receipt-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }

      // Generate ultra-crisp high-resolution image using html-to-image
      // This natively supports CSS Color Module 4 (oklch, srgb), modern fonts, and flexbox
      let dataUrl = '';
      try {
        dataUrl = await toPng(receiptElement, {
          quality: 1,
          pixelRatio: 2.5,
          backgroundColor: '#ffffff',
          skipFonts: true,
          cacheBust: false,
        });
      } catch (firstErr) {
        console.warn('First toPng capture attempt with skipFonts failed, falling back to standard toPng:', firstErr);
        dataUrl = await toPng(receiptElement, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });
      }

      if (!dataUrl) {
        throw new Error('Image generation produced empty result');
      }

      const fileName = `EI_MON_Voucher_${order.receiptNumber}.png`;
      const blob = dataUrlToBlob(dataUrl);

      // 1. Direct file download to user's device/album
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // 2. Native Mobile Share Sheet with direct "Save to Photos / 相册" capability
      if (blob && navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], fileName, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `EI MON SKINCARE - ${order.receiptNumber}`,
              text: `EI MON SKINCARE အရောင်းပြေစာ #${order.receiptNumber}`,
            });
          }
        } catch (shareErr: any) {
          if (shareErr?.name !== 'AbortError') {
            console.warn('Native share sheet error:', shareErr);
          }
        }
      }

      setSavedImageUrl(dataUrl);
      setSavedImageBlob(blob);
      setDownloadToast(true);
      setTimeout(() => setDownloadToast(false), 5000);
    } catch (err) {
      console.error('Failed to capture receipt image:', err);
    } finally {
      setIsSavingImage(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto receipt-modal-backdrop animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-stone-100 my-auto flex flex-col max-h-[95vh] receipt-modal-card">
          {/* Modal Top Bar */}
          <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white flex items-center justify-between no-print border-b border-stone-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center shadow-xs">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-sm sm:text-base leading-tight block">
                  အရောင်းပြေစာ (ဘောင်ချာ)
                </span>
                <span className="text-[10px] text-stone-400">
                  EI MON SKINCARE • #{order.receiptNumber}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Slip Style Toggle (Luxury vs Thermal) */}
              <div className="bg-stone-800 p-0.5 rounded-xl flex items-center border border-stone-700 text-xs">
                <button
                  type="button"
                  onClick={() => setSlipStyle('luxury')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] flex items-center gap-1 cursor-pointer ${
                    slipStyle === 'luxury'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                  title="အဆင့်မြင့် ဇိမ်ခံစတိုင် ပြေစာ"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>ဇိမ်ခံ (Luxury)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSlipStyle('thermal')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] flex items-center gap-1 cursor-pointer ${
                    slipStyle === 'thermal'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                  title="ရိုးရိုး အပူဒဏ်ခံစက္ကူ စတိုင်"
                >
                  <ReceiptIcon className="w-3 h-3" />
                  <span>Thermal</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="bg-rose-50/80 px-4 py-2 border-b border-rose-100 flex items-center justify-between text-xs text-rose-900">
            <span className="flex items-center gap-1.5 font-bold">
              <Camera className="w-4 h-4 text-rose-600 shrink-0" />
              <span>ဓာတ်ပုံအဖြစ် ပုံပြခန်း (Album) သို့ တိုက်ရိုက်ဒေါင်းလုဒ်သိမ်းဆည်းနိုင်ပါသည်</span>
            </span>
            <span className="text-[10px] bg-rose-200/80 text-rose-900 font-extrabold px-2 py-0.5 rounded-full">
              HD 300DPI
            </span>
          </div>

          {/* Paper Receipt Simulation Scroll Area */}
          <div className="p-3 sm:p-5 bg-stone-100 overflow-y-auto max-h-[60vh] receipt-scroll-container flex justify-center">
            {/* The Actual Printable / Exportable Node */}
            <div
              id="printable-receipt"
              className={`bg-white rounded-2xl shadow-sm text-stone-900 font-sans mx-auto transition-all ${
                slipStyle === 'luxury'
                  ? 'p-6 border border-stone-200 max-w-[360px]'
                  : 'p-5 border border-stone-200 max-w-[320px]'
              }`}
              style={{ width: '100%' }}
            >
              {slipStyle === 'luxury' ? (
                /* =================== CLEAN BOUTIQUE SLIP =================== */
                <div className="space-y-3.5">
                  {/* Brand Header */}
                  <div className="text-center pb-3 border-b border-stone-200">
                    <h1 className="text-base sm:text-lg font-black tracking-wider text-stone-900 uppercase">
                      {storeProfile.nameMy || 'EI MON SKINCARE'}
                    </h1>
                    <p className="text-[10px] font-bold text-rose-700 tracking-wide mt-0.5 uppercase">
                      Cosmetics & Skincare Retail
                    </p>
                    <p className="text-[10px] text-stone-500 font-semibold mt-0.5">
                      အရောင်းပြေစာ (Sales Voucher)
                    </p>
                    <p className="text-[10px] text-stone-600 mt-1">
                      {storeProfile.addressMy}
                    </p>
                    <p className="text-[10px] text-stone-700 font-medium">
                      ဖုန်း - {storeProfile.phone}
                    </p>
                  </div>

                  {/* Voucher Meta Strip */}
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500">ပြေစာအမှတ် (No):</span>
                      <span className="font-extrabold font-mono text-rose-700">
                        {order.receiptNumber}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500">ရက်စွဲ (Date):</span>
                      <span className="font-medium text-stone-800">
                        {formatDateMy(order.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500">ငွေကိုင် (Cashier):</span>
                      <span className="font-bold text-stone-800">
                        {order.cashierName}
                      </span>
                    </div>
                    {order.customerName && (
                      <div className="flex justify-between items-center pt-0.5 border-t border-stone-200/60">
                        <span className="text-stone-500">ဝယ်ယူသူ (Customer):</span>
                        <span className="font-bold text-rose-800">
                          {order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Items List Table */}
                  <div className="pt-1 border-b border-dashed border-stone-300 pb-3">
                    <table className="w-full border-collapse table-fixed">
                      <thead>
                        <tr className="border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                          <th className="py-1.5 pr-2 font-bold text-stone-600 text-left">
                            အမည်
                          </th>
                          <th className="py-1.5 px-1 font-bold text-stone-600 text-center w-16 whitespace-nowrap">
                            အရေအတွက်
                          </th>
                          <th className="py-1.5 pl-1 font-bold text-stone-600 text-right w-24 whitespace-nowrap">
                            သင့်ငွေ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-[11px]">
                        {order.items.map((item, idx) => (
                          <tr key={idx} className="align-top">
                            <td className="py-2 pr-2 text-left">
                              <p className="font-bold text-stone-900 leading-snug break-words">
                                {item.productNameMy}
                              </p>
                              <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                                {formatMMK(item.finalPrice, useMyanmarDigits)} / ခု
                              </p>
                            </td>
                            <td className="py-2 px-1 text-center font-bold text-stone-800 font-mono whitespace-nowrap pt-2.5">
                              {item.quantity}
                            </td>
                            <td className="py-2 pl-1 text-right font-black text-stone-900 font-mono whitespace-nowrap pt-2.5">
                              {formatMMK(item.lineTotal, useMyanmarDigits)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Totals */}
                  <div className="space-y-1.5 text-[11px] border-b border-dashed border-stone-300 pb-3">
                    <div className="flex justify-between text-stone-600">
                      <span>ကုန်ပစ္စည်းသင့်ငွေ (Subtotal):</span>
                      <span className="font-mono font-medium">
                        {formatMMK(order.subtotal, useMyanmarDigits)}
                      </span>
                    </div>

                    {order.discountTotal > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>အထူးလျှော့ငွေ (Discount):</span>
                        <span className="font-mono">
                          -{formatMMK(order.discountTotal, useMyanmarDigits)}
                        </span>
                      </div>
                    )}

                    {order.taxAmount > 0 && (
                      <div className="flex justify-between text-stone-600">
                        <span>အခွန် ({order.taxPercent}% Tax):</span>
                        <span className="font-mono">
                          {formatMMK(order.taxAmount, useMyanmarDigits)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm font-black pt-1.5 border-t-2 border-stone-900 text-stone-900">
                      <span>စုစုပေါင်း ကျသင့်ငွေ (Total):</span>
                      <span className="text-base text-rose-700 font-extrabold font-mono">
                        {formatMMK(order.grandTotal, useMyanmarDigits)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500">ပေးချေပုံစံ (Payment):</span>
                      <span className="font-bold text-stone-900">
                        {order.paymentMethod === 'cash' ? 'ငွေသား (Cash)' : 'KBZPay / WavePay'}
                      </span>
                    </div>
                    {order.paymentMethod === 'cash' && (
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500">ပေးငွေ (Paid):</span>
                        <span className="font-mono font-bold">
                          {formatMMK(order.amountReceived, useMyanmarDigits)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Courtesy Footer - Clean, No QR, No Stamp */}
                  <div className="text-center pt-3 border-t border-dashed border-stone-300 text-stone-600 space-y-1">
                    <p className="text-xs font-bold text-stone-800">
                      ဝယ်ယူအားပေးမှုအတွက် အထူးကျေးဇူးတင်ရှိပါသည်
                    </p>
                    <p className="text-[10px] text-stone-400 font-medium tracking-wider">
                      THANK YOU FOR YOUR PURCHASE
                    </p>
                  </div>
                </div>
              ) : (
                /* =================== CLASSIC THERMAL POS SLIP =================== */
                <div className="text-stone-900 font-mono text-xs space-y-3">
                  <div className="text-center pb-2 border-b border-dashed border-stone-300">
                    <h1 className="text-base font-black uppercase">
                      EI MON SKINCARE
                    </h1>
                    <p className="text-[10px] text-stone-600 mt-0.5">
                      {storeProfile.addressMy}
                    </p>
                    <p className="text-[10px] text-stone-700">
                      TEL: {storeProfile.phone}
                    </p>
                  </div>

                  <div className="space-y-1 text-[11px] border-b border-dashed border-stone-300 pb-2">
                    <div className="flex justify-between">
                      <span>RC NO:</span>
                      <span className="font-bold">{order.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DATE:</span>
                      <span>{formatDateMy(order.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CASHIER:</span>
                      <span>{order.cashierName}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-b border-dashed border-stone-300 pb-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-[11px]">
                        <div className="font-bold">{item.productNameMy}</div>
                        <div className="flex justify-between text-stone-600 text-[10px]">
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

                  <div className="space-y-1 text-[11px] border-b border-dashed border-stone-300 pb-2">
                    <div className="flex justify-between">
                      <span>SUBTOTAL:</span>
                      <span>{formatMMK(order.subtotal, useMyanmarDigits)}</span>
                    </div>
                    {order.discountTotal > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>DISCOUNT:</span>
                        <span>-{formatMMK(order.discountTotal, useMyanmarDigits)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm pt-1 border-t border-stone-300">
                      <span>TOTAL:</span>
                      <span>{formatMMK(order.grandTotal, useMyanmarDigits)}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>PAYMENT:</span>
                      <span>{order.paymentMethod === 'cash' ? 'CASH' : 'KBZPAY'}</span>
                    </div>
                    {order.paymentMethod === 'cash' && (
                      <div className="flex justify-between">
                        <span>RECEIVED:</span>
                        <span>{formatMMK(order.amountReceived, useMyanmarDigits)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 text-center border-t border-dashed border-stone-300 text-stone-600 space-y-0.5">
                    <p className="text-[11px] font-bold text-stone-800">ဝယ်ယူအားပေးမှုအတွက် ကျေးဇူးတင်ပါသည်</p>
                    <p className="text-[10px] font-bold">THANK YOU!</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Download Success Notification Toast */}
          {downloadToast && (
            <div className="mx-3.5 sm:mx-4 mt-2 px-3.5 py-2.5 rounded-2xl bg-emerald-700 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>
                  ဓာတ်ပုံအား အောင်မြင်စွာ ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ！ဖုန်း Album / Downloads တွင် ကြည့်နိုင်ပါသည်
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoSaverModal(true)}
                className="ml-2 text-[11px] underline font-extrabold hover:text-emerald-100 whitespace-nowrap cursor-pointer"
              >
                ပုံကြည့်မည်
              </button>
            </div>
          )}

          {/* Bottom Action Buttons Bar */}
          <div className="p-3.5 sm:p-4 bg-white border-t border-stone-200 space-y-2.5 no-print">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* PRIMARY PROMINENT BUTTON: Direct Download to Photo Album */}
              <button
                type="button"
                onClick={handleSaveToAlbum}
                disabled={isSavingImage}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-rose-600 hover:from-rose-700 hover:to-rose-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98 disabled:opacity-50 min-h-[48px]"
                title="ဘောင်ချာဓာတ်ပုံအား ဖုန်း Album / ကွန်ပျူတာထဲသို့ တိုက်ရိုက်ဒေါင်းလုဒ်သိမ်းဆည်းမည်"
              >
                <Download className="w-5 h-5 text-rose-200 shrink-0" />
                <div className="text-left leading-tight">
                  <div className="font-black text-xs sm:text-sm">
                    {isSavingImage ? 'ဓာတ်ပုံ ထုတ်လုပ်နေပါသည်...' : '📥 ဓာတ်ပုံ ဒေါင်းလုဒ်ဆွဲမည် (Save to Album)'}
                  </div>
                  <div className="text-[10px] text-rose-200 font-medium">
                    ဖုန်း Album / စက်ထဲသို့ တိုက်ရိုက်သိမ်းဆည်းမည်
                  </div>
                </div>
              </button>

              {/* Print Voucher */}
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer active:scale-98 min-h-[48px]"
              >
                <Printer className="w-5 h-5 text-rose-300 shrink-0" />
                <div className="text-left leading-tight">
                  <div className="font-black text-xs sm:text-sm">🖨️ ဘောင်ချာ ပရင့်ထုတ်မည်</div>
                  <div className="text-[10px] text-stone-400 font-medium">
                    Print Voucher / POS Printer
                  </div>
                </div>
              </button>
            </div>

            {/* Sub-actions */}
            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-stone-100">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (savedImageUrl) {
                      setShowPhotoSaverModal(true);
                    } else {
                      handleSaveToAlbum().then(() => setShowPhotoSaverModal(true));
                    }
                  }}
                  className="py-2 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
                  title="ဓာတ်ပုံအား အစမ်းကြည့်ရှုခြင်းနှင့် Viber/Messenger သို့ ပို့ရန်"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-rose-600" />
                  <span>🖼️ ပုံအစမ်းကြည့် / မျှဝေမည်</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="py-2 px-3 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
                  title="မှားယွင်းဖွင့်ထားသော အမှာစာအား ဖျက်သိမ်းမည်"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>အမှာစာဖျက်မည်</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="py-2 px-5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors cursor-pointer min-h-[38px]"
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

      {/* High Definition Photo Saver / Album Download Dialog */}
      {showPhotoSaverModal && savedImageUrl && (
        <ReceiptPhotoSaverModal
          order={order}
          imageUrl={savedImageUrl}
          imageBlob={savedImageBlob}
          onClose={() => setShowPhotoSaverModal(false)}
        />
      )}
    </>
  );
};
