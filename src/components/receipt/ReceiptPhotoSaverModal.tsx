import React, { useState } from 'react';
import { Order } from '../../types';
import {
  Download,
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  X,
  Smartphone,
  Camera,
} from 'lucide-react';

interface ReceiptPhotoSaverModalProps {
  order: Order;
  imageUrl: string;
  imageBlob: Blob | null;
  onClose: () => void;
}

export const ReceiptPhotoSaverModal: React.FC<ReceiptPhotoSaverModalProps> = ({
  order,
  imageUrl,
  imageBlob,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const fileName = `EI_MON_Voucher_${order.receiptNumber}.png`;

  // 1. Direct Download to device
  const handleDownload = () => {
    try {
      const urlToUse = imageBlob ? URL.createObjectURL(imageBlob) : imageUrl;
      const link = document.createElement('a');
      link.href = urlToUse;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (imageBlob) {
        setTimeout(() => URL.revokeObjectURL(urlToUse), 4000);
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  // 2. Web Share API with image file (iOS/Android native "Save Image" to Photos / Gallery)
  const handleSystemShare = async () => {
    if (!imageBlob) {
      handleDownload();
      return;
    }

    try {
      if (navigator.share && navigator.canShare) {
        const file = new File([imageBlob], fileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `EI MON SKINCARE - ${order.receiptNumber}`,
            text: `EI MON SKINCARE တရားဝင် အရောင်းပြေစာ • အမှတ် ${order.receiptNumber}`,
          });
          setShareFeedback('စနစ်မှတစ်ဆင့် အောင်မြင်စွာ ပေးပို့/သိမ်းဆည်းပြီးပါပြီ');
          setTimeout(() => setShareFeedback(null), 3000);
          return;
        }
      }

      // If Web Share API files is not supported, inform user to long press or download
      setShareFeedback('ဖုန်းစနစ်ဖြင့် ဒေါင်းလုဒ်စတင်နေပါသည်...');
      handleDownload();
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Share error, falling back to download:', err);
        handleDownload();
      }
    }
  };

  // 3. Copy image to clipboard for instant pasting in Viber, Telegram, WeChat, Messenger
  const handleCopyImage = async () => {
    if (!imageBlob) return;
    try {
      if (navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
        const item = new ClipboardItem({ 'image/png': imageBlob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } else {
        // Fallback
        handleDownload();
      }
    } catch (err) {
      console.warn('Clipboard write failed, triggering download instead:', err);
      handleDownload();
    }
  };

  // 4. Open in new tab
  const handleOpenNewTab = () => {
    window.open(imageUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-stone-100 my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white flex items-center justify-between border-b border-rose-900/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight flex items-center gap-1.5">
                <span>ဘောင်ချာဓာတ်ပုံ (Photo Slip)</span>
                <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  HD 300 DPI
                </span>
              </h3>
              <p className="text-[10px] text-rose-200/80">
                EI MON SKINCARE • ပြေစာအမှတ် #{order.receiptNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions banner: Golden long-press tip for mobile users */}
        <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 px-4 py-3 border-b border-amber-200/70">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-500 text-stone-900 mt-0.5 shrink-0 shadow-2xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="text-xs text-stone-800 space-y-0.5">
              <p className="font-extrabold text-amber-900 flex items-center gap-1">
                <span>📱 မိုဘိုင်းလ်ဖုန်းတွင် ပုံပြခန်း (Album) သို့ သိမ်းဆည်းနည်း:</span>
              </p>
              <p className="text-[11px] text-stone-700 leading-relaxed">
                အောက်ပါဘောင်ချာပုံပေါ်တွင် လက်ဖြင့် <strong className="text-rose-700 font-bold">၁ စက္ကန့်ခန့် ဖိထားပါ (Long Press)</strong>။
                ပေါ်လာသော မီနူးထဲမှ <strong className="text-stone-900 font-bold">"Save to Photos / ပုံအားသိမ်းမည်"</strong> ကို ရွေးချယ်၍ ဖုန်းဓာတ်ပုံအယ်လ်ဘမ်ထဲသို့ တိုက်ရိုက် ၁၀၀% သိမ်းဆည်းနိုင်ပါသည်။
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Photo Canvas Preview Container */}
        <div className="p-4 bg-stone-100/90 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[260px] max-h-[56vh]">
          <div className="relative group max-w-[340px] w-full bg-white rounded-2xl p-2 shadow-md border border-stone-200/80 transition-transform duration-200">
            {/* The Real IMG Tag for 100% Native Mobile Long Press to Save */}
            <img
              src={imageUrl}
              alt={`EI MON SKINCARE Receipt ${order.receiptNumber}`}
              className="w-full h-auto rounded-xl select-all touch-manipulation cursor-pointer"
              title="ဖိထားပြီး 'Save Image' ဖြင့် သိမ်းနိုင်ပါသည် (Long press to Save Image)"
            />
          </div>
          <p className="text-[10px] text-stone-500 font-medium mt-2 text-center">
            (ပုံကို ဖိ၍သိမ်းနိုင်သလို အောက်ပါခလုတ်များဖြင့်လည်း တိုက်ရိုက်ဒေါင်းလုဒ်ဆွဲနိုင်ပါသည်)
          </p>
        </div>

        {/* Notification Feedback Toast */}
        {(downloadSuccess || copied || shareFeedback) && (
          <div className="mx-4 my-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {downloadSuccess && 'ဓာတ်ပုံအား ဖုန်း/ကွန်ပျူတာထဲသို့ အောင်မြင်စွာ ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ (Downloaded)！'}
              {copied && 'ဓာတ်ပုံအား ကော်ပီကူးပြီးပါပြီ! Viber/Messenger/Chat တွင် တိုက်ရိုက် Paste လုပ်၍ ပို့နိုင်ပါသည်！'}
              {shareFeedback}
            </span>
          </div>
        )}

        {/* Primary Action Buttons Bar */}
        <div className="p-4 bg-white border-t border-stone-200 space-y-2.5">
          {/* Main Download Button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98 min-h-[46px]"
            >
              <Download className="w-4 h-4" />
              <span>ဓာတ်ပုံ ဒေါင်းလုဒ်ဆွဲမည်</span>
            </button>

            <button
              type="button"
              onClick={handleSystemShare}
              className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98 min-h-[46px]"
            >
              <Share2 className="w-4 h-4 text-rose-300" />
              <span>စနစ်ဖြင့် သိမ်း/မျှဝေမည်</span>
            </button>
          </div>

          {/* Secondary Utilities */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyImage}
              className="flex-1 py-2 px-3 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
              title="ပုံအား ကော်ပီကူးယူမည် (Copy to Clipboard)"
            >
              <Copy className="w-3.5 h-3.5 text-stone-600" />
              <span>ပုံကော်ပီကူးမည်</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="py-2 px-3 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
              title="ပုံအကြီးသီးသန့်ကြည့်မည် (Open in Full View)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
              <span>ပုံအပြည့်ကြည့်မည်</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition-colors cursor-pointer min-h-[40px]"
            >
              ပိတ်မည်
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
