import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';
import { formatMMK, formatDateMy } from '../../utils/format';
import { DeleteOrderModal } from '../transactions/DeleteOrderModal';
import { ReceiptBarcode } from './ReceiptBarcode';
import { ReceiptPhotoSaverModal } from './ReceiptPhotoSaverModal';
import {
  Printer,
  X,
  CheckCircle,
  Download,
  Trash2,
  Share2,
  Camera,
  Sparkles,
  ShieldCheck,
  Receipt as ReceiptIcon,
  Crown,
  Smartphone,
  CheckCircle2,
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
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Photo Album Saver Dialog State
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [savedImageBlob, setSavedImageBlob] = useState<Blob | null>(null);
  const [showPhotoSaverModal, setShowPhotoSaverModal] = useState(false);

  // Generate authentic QR code for receipt verification
  useEffect(() => {
    if (order) {
      const payload = `EI MON SKINCARE\nReceipt: ${order.receiptNumber}\nDate: ${order.createdAt}\nTotal: ${order.grandTotal} MMK\nItems: ${order.items.length}\nCashier: ${order.cashierName}\nStatus: Verified`;
      QRCode.toDataURL(payload, {
        width: 140,
        margin: 1,
        color: {
          dark: '#1c1917',
          light: '#ffffff',
        },
      })
        .then(setQrDataUrl)
        .catch((err) => console.warn('QR Code generation failed:', err));
    }
  }, [order]);

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

  // High-Resolution 300DPI Capture & Save to Photo Album / Gallery
  const handleSaveToAlbum = async () => {
    const receiptElement = document.getElementById('printable-receipt');
    if (!receiptElement) return;

    try {
      setIsSavingImage(true);

      // High scale factor (3x) ensures crystal-clear text, barcode and QR code even on 4K retina screens
      const canvas = await html2canvas(receiptElement, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        allowTaint: true,
      });

      const fileName = `EI_MON_Slip_${order.receiptNumber}.png`;
      const dataUrl = canvas.toDataURL('image/png');

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );

      // Trigger standard browser download
      try {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (dlErr) {
        console.warn('Auto download error, user will use modal:', dlErr);
      }

      // Store in state and open dedicated Photo Album Saver Modal
      setSavedImageUrl(dataUrl);
      setSavedImageBlob(blob);
      setShowPhotoSaverModal(true);
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
                  ? 'p-6 border-2 border-rose-100/90 max-w-[360px] relative'
                  : 'p-5 border border-stone-200 max-w-[320px]'
              }`}
              style={{ width: '100%' }}
            >
              {slipStyle === 'luxury' ? (
                /* =================== LUXURY BOUTIQUE SLIP =================== */
                <div className="space-y-3.5 relative">
                  {/* Luxury Official Stamp Overlay (Bottom-Right) */}
                  <div className="absolute right-0 bottom-16 pointer-events-none select-none opacity-85 rotate-[-12deg] z-10">
                    <div className="border-2 border-rose-600 rounded-full w-24 h-24 p-0.5 flex items-center justify-center">
                      <div className="border border-dashed border-rose-500 rounded-full w-full h-full flex flex-col items-center justify-center p-1 text-center bg-rose-50/30">
                        <span className="text-[6.5px] font-black uppercase tracking-wider text-rose-700">
                          EI MON SKINCARE
                        </span>
                        <span className="text-xs font-black text-rose-600 tracking-wider my-0.5">
                          PAID
                        </span>
                        <span className="text-[7.5px] font-bold text-rose-700">
                          အခပေးပြီး
                        </span>
                        <span className="text-[5.5px] text-rose-500 font-bold tracking-tighter">
                          OFFICIAL VERIFIED
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Brand Header */}
                  <div className="text-center pb-3 border-b-2 border-rose-100">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-rose-600 text-white shadow-xs mb-1.5">
                      <Crown className="w-5 h-5" />
                    </div>
                    <h1 className="text-lg font-black tracking-widest text-stone-900 uppercase">
                      EI MON SKINCARE
                    </h1>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-rose-700 mt-0.5">
                      Luxury Beauty & Cosmetics
                    </p>
                    <p className="text-[10px] text-stone-500 font-bold mt-1">
                      တရားဝင် အရောင်းပြေစာ • OFFICIAL SALES VOUCHER
                    </p>
                    <p className="text-[10px] text-stone-600 mt-0.5">
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
                  <div className="space-y-2 pt-1 border-b border-dashed border-stone-300 pb-3">
                    <div className="grid grid-cols-12 text-[10px] font-black text-stone-400 uppercase tracking-wider pb-1 border-b border-stone-200">
                      <div className="col-span-7">ပစ္စည်းအမည် (ITEM)</div>
                      <div className="col-span-2 text-center">အရေ</div>
                      <div className="col-span-3 text-right">သင့်ငွေ</div>
                    </div>

                    {order.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 text-[11px] items-center gap-1">
                        <div className="col-span-7">
                          <p className="font-bold text-stone-900 leading-tight">
                            {item.productNameMy}
                          </p>
                          <p className="text-[9px] text-stone-500 font-mono">
                            {formatMMK(item.finalPrice, useMyanmarDigits)} / ခု
                          </p>
                        </div>
                        <div className="col-span-2 text-center font-bold text-stone-700">
                          {item.quantity}
                        </div>
                        <div className="col-span-3 text-right font-black text-stone-900 font-mono">
                          {formatMMK(item.lineTotal, useMyanmarDigits)}
                        </div>
                      </div>
                    ))}
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
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-stone-500">ပေးငွေ (Paid):</span>
                          <span className="font-mono font-bold">
                            {formatMMK(order.amountReceived, useMyanmarDigits)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-emerald-800">
                          <span>ပြန်အမ်းငွေ (Change):</span>
                          <span className="font-mono font-black">
                            {formatMMK(order.changeGiven, useMyanmarDigits)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* QR Code & Barcode Verification Footer */}
                  <div className="pt-2 flex items-center justify-between gap-3 border-t border-stone-200">
                    {qrDataUrl && (
                      <div className="flex flex-col items-center">
                        <img
                          src={qrDataUrl}
                          alt="Verification QR"
                          className="w-16 h-16 rounded-lg border border-stone-200 p-0.5 bg-white shadow-2xs"
                        />
                        <span className="text-[8px] text-stone-500 font-bold mt-0.5">
                          စကင်စစ်ဆေးရန်
                        </span>
                      </div>
                    )}
                    <div className="flex-1 flex flex-col items-center">
                      <ReceiptBarcode value={order.receiptNumber} />
                      <p className="text-[8px] text-stone-400 font-bold mt-1 text-center">
                        စစ်မှန်သော အလှကုန်ပစ္စည်းများသာ ရောင်းချပါသည်
                      </p>
                    </div>
                  </div>

                  {/* Courtesy Footer */}
                  <div className="text-center pt-2 border-t border-dashed border-stone-200 text-stone-500 space-y-0.5">
                    <p className="text-[10px] font-bold text-stone-800">
                      ဝယ်ယူအားပေးမှုကို အထူးပင် ကျေးဇူးတင်ရှိပါသည်
                    </p>
                    <p className="text-[8px] text-stone-400">
                      ပစ္စည်းဝယ်ယူပြီး ၇ ရက်အတွင်း ဘောင်ချာပြသ၍ လဲလှယ်နိုင်ပါသည်
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
                      <>
                        <div className="flex justify-between">
                          <span>PAID:</span>
                          <span>{formatMMK(order.amountReceived, useMyanmarDigits)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>CHANGE:</span>
                          <span>{formatMMK(order.changeGiven, useMyanmarDigits)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-2 text-center border-t border-dashed border-stone-300">
                    <ReceiptBarcode value={order.receiptNumber} />
                    <p className="text-[10px] font-bold mt-2">THANK YOU!</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Buttons Bar */}
          <div className="p-3.5 sm:p-4 bg-white border-t border-stone-200 space-y-2 no-print">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* PRIMARY PROMINENT BUTTON: Save Slip Photo to Album */}
              <button
                type="button"
                onClick={handleSaveToAlbum}
                disabled={isSavingImage}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-rose-600 hover:from-rose-700 hover:to-rose-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98 disabled:opacity-50 min-h-[46px]"
                title="ဖုန်း/တက်ဘလက် ပုံပြခန်း (Photo Album) သို့ ဓာတ်ပုံအဖြစ် ဒေါင်းလုဒ်သိမ်းဆည်းမည်"
              >
                <Camera className="w-4 h-4 text-rose-200" />
                <span>
                  {isSavingImage ? 'ဓာတ်ပုံ ထုတ်လုပ်နေပါသည်...' : '📷 ဓာတ်ပုံအဖြစ် Album သို့ သိမ်းမည်'}
                </span>
              </button>

              {/* Print Voucher */}
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98 min-h-[46px]"
              >
                <Printer className="w-4 h-4 text-rose-300" />
                <span>🖨️ ဘောင်ချာ ပရင့်ထုတ်မည်</span>
              </button>
            </div>

            {/* Sub-actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="py-2 px-3 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
                title="မှားယွင်းဖွင့်ထားသော အမှာစာအား ဖျက်သိမ်းမည်"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>အမှာစာဖျက်မည်</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2 px-6 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors cursor-pointer min-h-[38px]"
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
