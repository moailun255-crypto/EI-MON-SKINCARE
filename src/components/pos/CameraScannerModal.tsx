import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { playBarcodeBeep } from '../../utils/scannerSound';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: (code: string) => { success: boolean; message: string; productName?: string };
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanSuccessText, setScanSuccessText] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const lastCodeRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  const scannerElementId = 'minimal-pos-camera-view';

  const startCamera = async () => {
    try {
      setCameraError(null);
      setScanSuccessText(null);

      // Check if getUserMedia is supported in the current environment
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError(
          'ဤဘရောက်ဇာတွင် ကင်မရာစနစ် မထောက်ပံ့သေးပါ သို့မဟုတ် HTTPS/လုံခြုံစိတ်ချရသော လိုင်း လိုအပ်ပါသည်။'
        );
        return;
      }

      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
        } catch {
          // ignore
        }
      }

      const qrScanner = new Html5Qrcode(scannerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      html5QrCodeRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          aspectRatio: 1.0,
        },
        (decodedText) => {
          const clean = decodedText.trim();
          if (!clean) return;

          const now = Date.now();
          if (clean === lastCodeRef.current && now - lastTimeRef.current < 2000) {
            return;
          }

          if (isScanningRef.current) return;
          isScanningRef.current = true;
          lastCodeRef.current = clean;
          lastTimeRef.current = now;

          if (onScan) {
            const res = onScan(clean);
            playBarcodeBeep(res.success ? 'success' : 'error');
            if (res.success) {
              setScanSuccessText(res.productName || clean);
              setTimeout(() => {
                setScanSuccessText(null);
              }, 1800);
            }
          }

          setTimeout(() => {
            isScanningRef.current = false;
          }, 800);
        },
        () => {
          // silent on frame misses
        }
      );
    } catch (err: unknown) {
      // Gracefully handle expected camera errors (e.g. NotAllowedError / Permission denied)
      const errName = err instanceof Error ? err.name : '';
      const errMsg = err instanceof Error ? err.message : String(err);
      const isPermissionDenied =
        errName === 'NotAllowedError' ||
        errMsg.includes('Permission denied') ||
        errMsg.includes('NotAllowedError');

      if (isPermissionDenied) {
        setCameraError(
          'ကင်မရာ အသုံးပြုခွင့် (Permission) ပိတ်ထားပါသည်။ ဘရောက်ဇာတွင် ကင်မရာဖွင့်ခွင့် ပြုပေးပါ သို့မဟုတ် အောက်တွင် ဘားကုဒ် ရိုက်ထည့်နိုင်ပါသည်။'
        );
      } else if (errName === 'NotFoundError' || errMsg.includes('NotFoundError')) {
        setCameraError('စက်တွင် ကင်မရာ တပ်ဆင်ထားခြင်း မတွေ့ရှိပါ။');
      } else {
        setCameraError('ကင်မရာ ချိတ်ဆက်၍ မရသေးပါ။ ဘားကုဒ်ကို တိုက်ရိုက် ရိုက်ထည့်နိုင်ပါသည်။');
      }
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
      setScanSuccessText(null);
      setCameraError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-fadeIn">
        {/* Simple & Clean Header */}
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">
              ဘားကုဒ် စကင်ဖတ်ရန်
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Minimalist Viewport */}
        <div className="relative bg-stone-950 aspect-square w-full flex items-center justify-center overflow-hidden">
          <div id={scannerElementId} className="w-full h-full" />

          {/* Clean Single Viewfinder Target Overlay */}
          {!cameraError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              {/* Single clean rectangle guide (no complex corners or nested boxes) */}
              <div
                className={`w-56 h-36 relative transition-all duration-200 rounded-2xl overflow-hidden ${
                  scanSuccessText
                    ? 'border-2 border-emerald-400 bg-emerald-500/10 scale-102 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                    : 'border-2 border-white/80 bg-black/10'
                }`}
              >
                {/* Subtle scanning laser beam */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse" />
              </div>

              {/* Status badge */}
              {scanSuccessText ? (
                <div className="mt-3 px-3.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{scanSuccessText} ထည့်ပြီး</span>
                </div>
              ) : (
                <span className="mt-3 px-3 py-1 rounded-full bg-black/60 text-white/90 text-[11px] font-semibold backdrop-blur-xs">
                  ဘားကုဒ်ကို အလိုအလျောက် စကင်ဖတ်ပေးပါမည်
                </span>
              )}
            </div>
          )}

          {/* Permission or Camera Error */}
          {cameraError && (
            <div className="p-5 text-center text-white space-y-2.5 max-w-xs">
              <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-red-300">
                ကင်မရာ အသုံးပြုခွင့် မရရှိပါ
              </p>
              <p className="text-[11px] text-stone-300">
                ဘရောက်ဇာတွင် ကင်မရာဖွင့်ခွင့် ပြုပေးပါ သို့မဟုတ် POS ရှာဖွေရေးဘားတွင် ဘားကုဒ်ကို တိုက်ရိုက် ရိုက်ထည့်နိုင်ပါသည်
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ထပ်မံကြိုးစားမည်</span>
              </button>
            </div>
          )}
        </div>

        {/* Minimal Footer & Manual Barcode Fallback */}
        <div className="p-3 bg-stone-50 border-t border-stone-100 space-y-2">
          {/* Quick manual barcode entry */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const input = form.elements.namedItem('manualBarcodeInput') as HTMLInputElement;
              if (input && input.value.trim() && onScan) {
                const res = onScan(input.value.trim());
                playBarcodeBeep(res.success ? 'success' : 'error');
                if (res.success) {
                  setScanSuccessText(res.productName || input.value.trim());
                  input.value = '';
                  setTimeout(() => setScanSuccessText(null), 1800);
                }
              }
            }}
            className="flex items-center gap-1.5"
          >
            <input
              name="manualBarcodeInput"
              type="text"
              placeholder="ဘားကုဒ် ရိုက်ထည့်ရန်..."
              className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              ထည့်မည်
            </button>
          </form>

          <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
            <span className="text-[10px] text-stone-400">
              စကင်နာစက် (သို့) ဘားကုဒ် ရိုက်ထည့်၍လည်း အသုံးပြုနိုင်ပါသည်
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              ပိတ်မည်
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
