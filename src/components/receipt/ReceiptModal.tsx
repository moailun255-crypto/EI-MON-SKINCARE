import React, { useState } from 'react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
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
  Receipt,
} from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const { storeProfile, useMyanmarDigits } = useStore();
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    if (!receiptElement || !order) return;

    try {
      setIsSavingImage(true);

      // Create an off-screen isolated container to render the full receipt completely
      // This eliminates mobile scroll clipping, modal overflow, and CSS viewport scale issues
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '380px';
      tempContainer.style.zIndex = '-9999';
      tempContainer.style.opacity = '1';
      tempContainer.style.pointerEvents = 'none';
      tempContainer.style.backgroundColor = '#ffffff';

      const clone = receiptElement.cloneNode(true) as HTMLElement;
      clone.id = 'printable-receipt-export-clone';
      clone.style.width = '380px';
      clone.style.maxWidth = '380px';
      clone.style.minWidth = '380px';
      clone.style.height = 'auto';
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';
      clone.style.margin = '0';
      clone.style.padding = '24px';
      clone.style.transform = 'none';
      clone.style.boxShadow = 'none';
      clone.style.borderRadius = '0';
      clone.style.backgroundColor = '#ffffff';

      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      // Allow browser layout to accurately measure full natural scroll height
      await new Promise((resolve) => setTimeout(resolve, 80));

      const captureWidth = 380;
      const captureHeight = Math.max(clone.scrollHeight, clone.offsetHeight, 400);

      let dataUrl = '';
      try {
        dataUrl = await toPng(clone, {
          width: captureWidth,
          height: captureHeight,
          canvasWidth: captureWidth * 2,
          canvasHeight: captureHeight * 2,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          skipFonts: true,
          cacheBust: false,
          style: {
            margin: '0',
            transform: 'none',
            width: `${captureWidth}px`,
            height: `${captureHeight}px`,
          },
        });
      } catch (firstErr) {
        console.warn('toPng failed, falling back to html2canvas:', firstErr);
        try {
          const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: captureWidth,
            height: captureHeight,
            windowWidth: captureWidth,
            windowHeight: captureHeight,
            scrollX: 0,
            scrollY: 0,
          });
          dataUrl = canvas.toDataURL('image/png');
        } catch (secondErr) {
          console.error('html2canvas failed as well:', secondErr);
          dataUrl = await toPng(clone, {
            backgroundColor: '#ffffff',
            width: captureWidth,
            height: captureHeight,
          });
        }
      } finally {
        if (tempContainer.parentNode) {
          tempContainer.parentNode.removeChild(tempContainer);
        }
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
                <Receipt className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-sm sm:text-base leading-tight block">
                  အရောင်းပြေစာ (ဘောင်ချာ)
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  EI MON SKINCARE • #{order.receiptNumber}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
            {/* The Actual Printable / Exportable Node - Authentic Clean Thermal POS Slip */}
            <div
              id="printable-receipt"
              className="bg-white rounded-2xl shadow-sm text-stone-900 font-mono mx-auto p-5 border border-stone-200 max-w-[340px] text-xs space-y-3"
              style={{ width: '100%' }}
            >
              {/* Brand Header */}
              <div className="text-center pb-2 border-b border-dashed border-stone-300">
                <h1 className="text-base font-black uppercase text-stone-900 tracking-wider">
                  {storeProfile.nameMy || 'EI MON SKINCARE'}
                </h1>
                <p className="text-[10px] text-stone-600 mt-0.5 leading-snug">
                  {storeProfile.addressMy}
                </p>
                <p className="text-[10px] text-stone-700 font-bold">
                  ဖုန်း - {storeProfile.phone}
                </p>
              </div>

              {/* Order Meta Info */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-stone-300 pb-2">
                <div className="flex justify-between">
                  <span className="text-stone-600">ပြေစာအမှတ်:</span>
                  <span className="font-bold font-mono text-stone-900">#{order.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">နေ့စွဲ:</span>
                  <span>{formatDateMy(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">အရောင်းဝန်ထမ်း:</span>
                  <span>{order.cashierName}</span>
                </div>
                {order.customerName && order.customerName !== 'အထွေထွေ အဝယ်တော်' && (
                  <div className="flex justify-between">
                    <span className="text-stone-600">ဝယ်သူ:</span>
                    <span>{order.customerName}</span>
                  </div>
                )}
              </div>

              {/* Items Table: Pure Myanmar headers without English */}
              <div className="border-b border-dashed border-stone-300 pb-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-stone-300 text-[10px] font-bold text-stone-700">
                      <th className="py-1 pr-1 font-bold text-left">အမည်</th>
                      <th className="py-1 px-1 font-bold text-center w-16">အရေအတွက်</th>
                      <th className="py-1 pl-1 font-bold text-right w-24">သင့်ငွေ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-stone-200">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="text-[11px]">
                        <td className="py-1.5 pr-1 font-medium leading-tight">
                          <div className="text-stone-900 font-bold">{item.productNameMy}</div>
                          <div className="text-[9px] text-stone-500 font-mono">
                            @{formatMMK(item.finalPrice, useMyanmarDigits)}
                          </div>
                        </td>
                        <td className="py-1.5 px-1 text-center font-bold">
                          {item.quantity}
                        </td>
                        <td className="py-1.5 pl-1 text-right font-bold font-mono">
                          {formatMMK(item.lineTotal, useMyanmarDigits)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Discounts */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-stone-300 pb-2">
                <div className="flex justify-between text-stone-600">
                  <span>ကုန်ပစ္စည်းသင့်ငွေ:</span>
                  <span className="font-mono">{formatMMK(order.subtotal, useMyanmarDigits)}</span>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>လျှော့ဈေး:</span>
                    <span className="font-mono">-{formatMMK(order.discountTotal, useMyanmarDigits)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1.5 border-t border-stone-300 text-stone-900">
                  <span>စုစုပေါင်း ကျသင့်ငွေ:</span>
                  <span className="font-mono">{formatMMK(order.grandTotal, useMyanmarDigits)}</span>
                </div>
              </div>

              {/* Payment Info (Without Change / ပြန်အမ်းငွေ) */}
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-stone-600">ငွေပေးချေမှု:</span>
                  <span className="font-bold uppercase">
                    {order.paymentMethod === 'cash' ? 'ငွေသား (CASH)' : 'KBZPAY'}
                  </span>
                </div>
                {order.paymentMethod === 'cash' && (
                  <div className="flex justify-between">
                    <span className="text-stone-600">ပေးငွေ:</span>
                    <span className="font-mono font-bold">{formatMMK(order.amountReceived, useMyanmarDigits)}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2 text-center border-t border-dashed border-stone-300 text-stone-600 space-y-0.5">
                <p className="text-[11px] font-bold text-stone-800">ဝယ်ယူအားပေးမှုအတွက် ကျေးဇူးတင်ပါသည်</p>
                <p className="text-[10px] font-bold tracking-widest text-stone-500">THANK YOU!</p>
              </div>
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
