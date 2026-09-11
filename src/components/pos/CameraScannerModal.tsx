import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, AlertCircle, RefreshCw, CheckCircle, Zap, ZapOff, Info } from 'lucide-react';
import { playBarcodeBeep } from '../../utils/scannerSound';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: (code: string) => { success: boolean; message: string; productName?: string };
  title?: string;
  elementId?: string;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title,
  elementId,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanSuccessText, setScanSuccessText] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [showTips, setShowTips] = useState<boolean>(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const lastCodeRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  const scannerElementId = elementId || 'minimal-pos-camera-view';

  const startCamera = async () => {
    try {
      setCameraError(null);
      setScanSuccessText(null);
      setTorchOn(false);
      setHasTorch(false);

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

      // Initialize with hardware-accelerated BarcodeDetector if available
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
        useBarCodeDetectorIfSupported: true,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
        verbose: false,
      });
      html5QrCodeRef.current = qrScanner;

      // Start with high-definition settings and autofocus for crisp 1D barcodes
      await qrScanner.start(
        {
          facingMode: 'environment',
        },
        {
          fps: 25,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Horizontal rectangular region specifically optimized for 1D retail barcodes
            const width = Math.min(Math.floor(viewfinderWidth * 0.9), 320);
            const height = Math.min(Math.floor(viewfinderHeight * 0.42), 160);
            return { width, height };
          },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: 'environment',
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            // @ts-expect-error advanced focusMode is supported on mobile browsers
            advanced: [{ focusMode: 'continuous' }],
          },
        },
        (decodedText) => {
          const clean = decodedText.trim();
          if (!clean) return;

          const now = Date.now();
          if (clean === lastCodeRef.current && now - lastTimeRef.current < 1800) {
            return;
          }

          if (isScanningRef.current) return;
          isScanningRef.current = true;
          lastCodeRef.current = clean;
          lastTimeRef.current = now;

          // Haptic feedback on mobile devices
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate(100);
            } catch {
              // ignore
            }
          }

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
          }, 500);
        },
        () => {
          // silent on frame misses
        }
      );

      // Check if camera supports flashlight/torch
      try {
        const capabilities = qrScanner.getRunningTrackCapabilities() as MediaTrackCapabilities & {
          torch?: boolean;
        };
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      } catch {
        // ignore
      }
    } catch (err: unknown) {
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
        setCameraError('ကင်မရာ ဖွင့်၍ မရသေးပါ။ ဘားကုဒ်ကို တိုက်ရိုက် ရိုက်ထည့်နိုင်ပါသည်။');
      }
    }
  };

  const toggleTorch = async () => {
    if (html5QrCodeRef.current && hasTorch) {
      try {
        const nextState = !torchOn;
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: nextState } as Record<string, unknown>],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Torch control failed:', e);
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
      setTorchOn(false);
      setHasTorch(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-fadeIn">
        {/* Modal Top Bar */}
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                {title || 'ဘားကုဒ် စကင်ဖတ်ရန်'}
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">
                1D BARCODE / EAN-13
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Flashlight button if supported by hardware */}
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  torchOn
                    ? 'bg-amber-400 text-stone-900 shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="မီးလုံး အဖွင့်/အပိတ်"
              >
                {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowTips(!showTips)}
              className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              title="စကင်ဖတ်နည်း အကြံပြုချက်"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tip Banner (Collapsible) */}
        {showTips && (
          <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200/80 text-amber-900 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              <span>ဘားကုဒ် ချိန်သားကိုက်ဖတ်နည်း အကြံပြုချက်:</span>
            </p>
            <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-amber-800">
              <li>ဖုန်းကို ဘားကုဒ်နှင့် <strong>၁၀ ~ ၁၅ စင်တီမီတာ (လက်တစ်ဝါးခန့်)</strong> ခွာထားပါ (အနီးကပ်လွန်းပါက ကင်မရာဝါးသွားနိုင်သည်)။</li>
              <li>ဘားကုဒ်ကို <strong>မျဉ်းနီတန်းအလယ်တွင် တည့်တည့်</strong> ချိန်ပေးပါ။</li>
              <li>အလင်းရောင် အားနည်းပါက အပေါ်ရှိ မီးလုံးခလုတ် (Flash) ကို ဖွင့်ပါ။</li>
            </ul>
          </div>
        )}

        {/* Camera Viewport */}
        <div className="relative bg-stone-950 aspect-square w-full flex items-center justify-center overflow-hidden">
          <div id={scannerElementId} className="w-full h-full" />

          {/* Barcode Targeting Guide Overlay */}
          {!cameraError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              {/* Wide Horizontal Rectangular Reticle suited for 1D barcodes */}
              <div
                className={`w-64 h-28 relative transition-all duration-200 rounded-xl overflow-hidden border-2 ${
                  scanSuccessText
                    ? 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                    : 'border-white/80 bg-black/10'
                }`}
              >
                {/* Horizontal scanning laser beam */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)] animate-pulse" />

                {/* Corner crosshairs */}
                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-white/90" />
                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-white/90" />
                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-white/90" />
                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-white/90" />
              </div>

              {/* Status Badge */}
              {scanSuccessText ? (
                <div className="mt-3 px-3.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md animate-bounce">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{scanSuccessText} ထည့်ပြီး</span>
                </div>
              ) : (
                <div className="mt-3 text-center space-y-1">
                  <span className="px-3 py-1 rounded-full bg-black/70 text-white/95 text-[11px] font-medium backdrop-blur-xs inline-block">
                    ဘားကုဒ်ကို မျဉ်းနီတန်းအလယ် တည့်တည့်ချိန်ပါ
                  </span>
                  <p className="text-[10px] text-stone-300">
                    လက်တစ်ဝါးခန့် (10-15cm) ခွာ၍ ချိန်ပေးပါ
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Camera Error Display */}
          {cameraError && (
            <div className="p-5 text-center text-white space-y-2.5 max-w-xs">
              <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-red-300">
                ကင်မရာ အသုံးပြုခွင့် မရရှိပါ
              </p>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                {cameraError}
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

        {/* Footer with Manual Barcode Entry Fallback */}
        <div className="p-3 bg-stone-50 border-t border-stone-100 space-y-2">
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
              placeholder="ဘားကုဒ် နံပါတ် ရိုက်ထည့်ရန်..."
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              ထည့်မည်
            </button>
          </form>

          <div className="flex items-center justify-between text-xs text-stone-500 pt-0.5">
            <span className="text-[10px] text-stone-400">
              စကင်နာစက် (သို့) ဘားကုဒ် ရိုက်ထည့်၍လည်း အဆင်ပြေပါသည်
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              ပိတ်မည်
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
