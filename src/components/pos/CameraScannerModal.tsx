import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  Html5QrcodeScannerState,
} from 'html5-qrcode';
import {
  Camera,
  X,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Zap,
  ZapOff,
  SwitchCamera,
  Search,
  Plus,
  Check,
  Scan,
  Volume2,
  VolumeX,
  Upload,
} from 'lucide-react';
import { playBarcodeBeep, getSoundMuted, setSoundMuted } from '../../utils/scannerSound';
import { useStore } from '../../context/StoreContext';
import { formatMMK } from '../../utils/format';
import { normalizeBarcode } from '../../utils/barcodeValidator';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: (code: string) => { success: boolean; message: string; productName?: string };
  title?: string;
}

const VIEWPORT_ID = 'pos-camera-scanner-viewport';

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title,
}) => {
  const {
    products,
    addToCart,
    useMyanmarDigits,
    setActiveTab,
    setPendingBarcodeForAdd,
  } = useStore();

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanSuccessText, setScanSuccessText] = useState<string | null>(null);
  const [scanErrorText, setScanErrorText] = useState<string | null>(null);
  const [unregisteredScannedBarcode, setUnregisteredScannedBarcode] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isMutedState, setIsMutedState] = useState<boolean>(getSoundMuted());
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(true);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const [isFileScanning, setIsFileScanning] = useState<boolean>(false);

  // Available cameras and active selection
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  // In-modal quick search & direct add
  const [modalSearch, setModalSearch] = useState('');
  const [justAddedModalId, setJustAddedModalId] = useState<string | null>(null);

  // Scanner engine refs
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef<boolean>(false);
  const isCooldownRef = useRef<boolean>(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  // Filtered products for quick-select inside modal
  const searchResults = React.useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.nameMy.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [products, modalSearch]);

  // Handle scanned barcode with instant sound, vibration, and cart integration
  const handleScannedCode = useCallback((rawCode: string) => {
    const clean = normalizeBarcode(rawCode);
    if (!clean || clean.length < 3) return;

    const now = Date.now();
    // Debounce: prevent duplicate scan of the EXACT SAME barcode within 700ms
    if (clean === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 700) {
      return;
    }

    if (isCooldownRef.current) return;
    isCooldownRef.current = true;
    lastScannedCodeRef.current = clean;
    lastScannedTimeRef.current = now;

    // Haptic vibration feedback for mobile devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(70);
      } catch {
        // ignore
      }
    }

    if (onScanRef.current) {
      const res = onScanRef.current(clean);
      playBarcodeBeep(res.success ? 'success' : 'error');

      if (res.success) {
        setScanErrorText(null);
        setScanSuccessText(res.productName || clean);
        setUnregisteredScannedBarcode(null);
        setTimeout(() => {
          setScanSuccessText(null);
        }, 1800);
      } else {
        // Error vibration
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([80, 50, 80]);
          } catch {
            // ignore
          }
        }
        setScanSuccessText(null);
        setScanErrorText(res.message || `[${clean}] ပစ္စည်းစာရင်းထဲ မတွေ့ပါ`);
        // Store unregistered barcode so user can click to create product immediately
        setUnregisteredScannedBarcode(clean);
        setTimeout(() => {
          setScanErrorText(null);
        }, 3000);
      }
    }

    // Cooldown window
    setTimeout(() => {
      isCooldownRef.current = false;
    }, 400);
  }, []);

  // Cleanly stop scanner instance
  const stopScanner = useCallback(async () => {
    const scanner = html5QrCodeRef.current;
    if (scanner) {
      try {
        const state = scanner.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scanner.stop();
        }
        scanner.clear();
      } catch (err) {
        console.warn('Error during scanner cleanup:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsVideoReady(false);
    setIsCameraLoading(false);
  }, []);

  // Launch camera scanner with Html5Qrcode
  const startScanner = useCallback(
    async (cameraId?: string) => {
      if (!isMountedRef.current) return;

      const viewportEl = document.getElementById(VIEWPORT_ID);
      if (!viewportEl) {
        console.warn('Scanner viewport element not ready');
        return;
      }

      await stopScanner();
      if (!isMountedRef.current) return;

      setIsCameraLoading(true);
      setCameraError(null);
      setIsVideoReady(false);

      try {
        // All major 1D retail barcode formats + QR Code
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
        ];

        const scanner = new Html5Qrcode(VIEWPORT_ID, {
          formatsToSupport,
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });
        html5QrCodeRef.current = scanner;

        // Query available camera list
        try {
          const devices = await Html5Qrcode.getCameras();
          if (isMountedRef.current && devices && devices.length > 0) {
            setAvailableCameras(devices);
          }
        } catch {
          // ignore device enumeration failure
        }

        const cameraConfig = cameraId
          ? { deviceId: { exact: cameraId } }
          : { facingMode: 'environment' };

        // 15 FPS scanning with wide 1D barcode scanning window
        await scanner.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const w = Math.min(Math.floor(viewfinderWidth * 0.92), 420);
              const h = Math.min(Math.floor(viewfinderHeight * 0.6), 260);
              return { width: Math.max(w, 220), height: Math.max(h, 120) };
            },
            aspectRatio: undefined,
            disableFlip: false,
          },
          (decodedText) => {
            handleScannedCode(decodedText);
          },
          () => {
            // normal frame miss, no-op
          }
        );

        if (!isMountedRef.current) {
          await scanner.stop();
          scanner.clear();
          html5QrCodeRef.current = null;
          return;
        }

        setIsCameraLoading(false);
        setIsVideoReady(true);

        // Check if flashlight/torch is supported
        try {
          const caps = scanner.getRunningTrackCapabilities();
          if (caps && (caps as any).torch) {
            setHasTorch(true);
          }
        } catch {
          // ignore
        }
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        setIsCameraLoading(false);
        setIsVideoReady(false);

        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission denied')) {
          setCameraError('ကင်မရာ အသုံးပြုခွင့် (Permission) ပိတ်ထားပါသည်။ ဘရောက်ဇာ ဆက်တင်တွင် Camera ဖွင့်ပေးပါ။');
        } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
          setCameraError('ကင်မရာ ချိတ်ဆက်ထားခြင်း မရှိပါ သို့မဟုတ် ကင်မရာ ရှာမတွေ့ပါ။');
        } else {
          setCameraError(`ကင်မရာ ဖွင့်မရပါ: ${errMsg}`);
        }
      }
    },
    [handleScannedCode, stopScanner]
  );

  // Switch between front/back/external cameras
  const handleSwitchCamera = useCallback(async () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    setSelectedCameraId(nextCamera.id);
    await startScanner(nextCamera.id);
  }, [availableCameras, selectedCameraId, startScanner]);

  // Flashlight toggle
  const toggleTorch = useCallback(async () => {
    const scanner = html5QrCodeRef.current;
    if (!scanner || !hasTorch) return;
    try {
      const nextTorch = !torchOn;
      await scanner.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  }, [hasTorch, torchOn]);

  // Sound Mute Toggle
  const toggleSound = useCallback(() => {
    const next = !isMutedState;
    setIsMutedState(next);
    setSoundMuted(next);
  }, [isMutedState]);

  // Scan from uploaded image file
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsFileScanning(true);
      try {
        let scanner = html5QrCodeRef.current;
        let createdTemp = false;

        if (!scanner) {
          scanner = new Html5Qrcode(VIEWPORT_ID, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
            verbose: false,
          });
          createdTemp = true;
        }

        const decoded = await scanner.scanFile(file, false);
        if (decoded) {
          handleScannedCode(decoded);
        }

        if (createdTemp) {
          scanner.clear();
        }
      } catch {
        playBarcodeBeep('error');
        setScanErrorText('ပုံဖိုင်ထဲတွင် ဘားကုဒ် ရှာမတွေ့ပါ (ရှင်းလင်းသော ဓာတ်ပုံရွေးပါ)');
        setTimeout(() => setScanErrorText(null), 3000);
      } finally {
        setIsFileScanning(false);
        e.target.value = '';
      }
    },
    [handleScannedCode]
  );

  // Modal open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      isMountedRef.current = true;
      const timer = setTimeout(() => {
        startScanner();
      }, 120);

      return () => {
        isMountedRef.current = false;
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      isMountedRef.current = false;
      stopScanner();
      setScanSuccessText(null);
      setScanErrorText(null);
      setCameraError(null);
      setTorchOn(false);
      setHasTorch(false);
      setUnregisteredScannedBarcode(null);
      setModalSearch('');
    }
  }, [isOpen, startScanner, stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-stone-950/85 backdrop-blur-xs">
      {/* CSS Override to integrate Html5Qrcode cleanly into modern dark POS theme */}
      <style>{`
        #${VIEWPORT_ID} {
          width: 100% !important;
          height: 100% !important;
          min-height: 290px !important;
          border: none !important;
          position: relative !important;
          background: #0c0a09 !important;
          overflow: hidden !important;
        }
        #${VIEWPORT_ID} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0.75rem !important;
        }
        #${VIEWPORT_ID} canvas {
          display: none !important;
        }
        #${VIEWPORT_ID} img {
          display: none !important;
        }
        #${VIEWPORT_ID} div[id$="shaded_region"] {
          border-color: rgba(0, 0, 0, 0.45) !important;
        }
      `}</style>

      {/* Modal Dialog */}
      <div className="bg-stone-900 w-full h-full sm:h-auto sm:max-w-md sm:rounded-3xl shadow-2xl border-0 sm:border sm:border-stone-700 overflow-hidden flex flex-col animate-fadeIn text-white">
        
        {/* Modal Top Bar */}
        <div className="px-4 py-3 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Scan className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight leading-none">
                {title || 'ဘားကုဒ် အမြန်စကင်ဖတ်ရန် (Barcode Scanner)'}
              </h3>
              <p className="text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>1D ဘားကုဒ် / QR ကုဒ် အလိုအလျောက် ဖတ်ရှုနေပါသည်</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Image File Upload Scanner Button */}
            <label
              className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              title="ပုံဖိုင်ဖြင့် ဘားကုဒ်ဖတ်မည် (Upload Barcode Image)"
            >
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isFileScanning}
              />
            </label>

            {/* Sound Mute/Unmute */}
            <button
              type="button"
              onClick={toggleSound}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isMutedState ? 'text-stone-500 hover:text-stone-300' : 'text-emerald-400 hover:bg-stone-800'
              }`}
              title={isMutedState ? 'အသံဖွင့်မည်' : 'အသံပိတ်မည်'}
            >
              {isMutedState ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Multi-camera switch button */}
            {availableCameras.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                title="ကင်မရာ ပြောင်းမည်"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

            {/* Flashlight button */}
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  torchOn
                    ? 'bg-amber-400 text-stone-900 shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="မီးလုံး အဖွင့်/အပိတ်"
              >
                {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer ml-1"
              title="ပိတ်မည်"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative flex-1 sm:flex-none sm:aspect-square bg-stone-900 flex items-center justify-center overflow-hidden min-h-[320px] sm:min-h-[350px] select-none">
          {/* Html5Qrcode Mounted Region */}
          <div id={VIEWPORT_ID} className="w-full h-full" />

          {/* Warm Illuminated Placeholder while camera starts */}
          {isCameraLoading && !cameraError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-radial from-stone-800 to-stone-950 text-center p-6 select-none">
              <div className="relative mb-3 flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="absolute -inset-1 rounded-2xl border border-emerald-400/20 animate-ping opacity-40 pointer-events-none" />
              </div>
              <p className="text-xs font-bold text-stone-100 tracking-wide">ကင်မရာ အသင့်ပြင်နေပါသည်...</p>
              <p className="text-[10px] text-emerald-400/80 mt-1 font-medium flex items-center gap-1.5 justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                1D ဘားကုဒ် ကြည်လင်ပြတ်သားစွာ ဖတ်ရှုရန် ပြင်ဆင်နေသည်
              </p>
            </div>
          )}

          {/* High-Precision Laser Reticle Frame */}
          {isVideoReady && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 z-20">
              <div
                className={`relative transition-all duration-200 rounded-2xl w-[90%] max-w-[340px] h-44 sm:h-48 ${
                  scanSuccessText
                    ? 'scale-105 bg-emerald-500/20'
                    : scanErrorText
                    ? 'scale-102 bg-red-500/20 animate-shake'
                    : 'bg-black/10'
                }`}
              >
                {/* 4 L-shaped Corner Angles */}
                <div
                  className={`absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 rounded-tl-xl transition-colors ${
                    scanSuccessText
                      ? 'border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]'
                      : scanErrorText
                      ? 'border-red-500 shadow-[0_0_16px_rgba(239,68,68,0.9)]'
                      : 'border-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                  }`}
                />
                <div
                  className={`absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 rounded-tr-xl transition-colors ${
                    scanSuccessText
                      ? 'border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]'
                      : scanErrorText
                      ? 'border-red-500 shadow-[0_0_16px_rgba(239,68,68,0.9)]'
                      : 'border-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                  }`}
                />
                <div
                  className={`absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 rounded-bl-xl transition-colors ${
                    scanSuccessText
                      ? 'border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]'
                      : scanErrorText
                      ? 'border-red-500 shadow-[0_0_16px_rgba(239,68,68,0.9)]'
                      : 'border-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                  }`}
                />
                <div
                  className={`absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 rounded-br-xl transition-colors ${
                    scanSuccessText
                      ? 'border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]'
                      : scanErrorText
                      ? 'border-red-500 shadow-[0_0_16px_rgba(239,68,68,0.9)]'
                      : 'border-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                  }`}
                />

                {/* Animated Horizontal Laser Scan Line */}
                <div
                  className={`absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 rounded-full ${
                    scanSuccessText
                      ? 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,1)]'
                      : scanErrorText
                      ? 'bg-red-500 shadow-[0_0_16px_rgba(239,68,68,1)]'
                      : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)] animate-pulse'
                  }`}
                />
              </div>

              {/* Instant Status Toast / Scanning Prompt */}
              {scanSuccessText ? (
                <div className="mt-3 px-4 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg animate-bounce">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-[260px]">{scanSuccessText} အောင်မြင်စွာ ထည့်ပြီး</span>
                </div>
              ) : scanErrorText ? (
                <div className="mt-3 px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-[260px]">{scanErrorText}</span>
                </div>
              ) : (
                <div className="mt-3 text-center pointer-events-auto space-y-1">
                  <div className="px-3.5 py-1 rounded-full bg-black/80 text-stone-200 text-[11px] font-medium backdrop-blur-md shadow-md inline-flex items-center gap-1.5 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ဘားကုဒ်အား ကင်မရာ အလယ်တည့်တည့်တွင် ပြပါ</span>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    EAN-13, UPC, Code 128, QR အားလုံး ဖတ်ရှုနိုင်ပါသည်
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Camera Error Display */}
          {cameraError && (
            <div className="p-5 text-center text-white space-y-2.5 max-w-xs z-30">
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
                onClick={() => startScanner(selectedCameraId || undefined)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 mx-auto transition-colors cursor-pointer shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ပြန်လည်စတင်မည်</span>
              </button>
            </div>
          )}
        </div>

        {/* Unregistered Scanned Barcode Quick-Action Banner */}
        {unregisteredScannedBarcode && (
          <div className="p-3 bg-stone-950 border-t border-amber-500/40 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>စကင်ဖတ်ရရှိသော ဘားကုဒ်: <span className="font-mono text-white text-xs bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/50">{unregisteredScannedBarcode}</span></span>
              </p>
              <p className="text-[10px] text-stone-400 truncate mt-0.5">
                ဆိုင်စနစ်တွင် မရှိသေးပါ (မထည့်ရသေးသော ပစ္စည်းအသစ်)
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPendingBarcodeForAdd(unregisteredScannedBarcode);
                setActiveTab('add-product');
                onClose();
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ပစ္စည်းအသစ်ထည့်မည်</span>
            </button>
          </div>
        )}

        {/* In-Modal Direct Search & Quick Add Section */}
        <div className="p-3 bg-stone-900 border-t border-stone-800 space-y-2">
          {/* Manual Input or Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = modalSearch.trim();
              if (val) {
                handleScannedCode(val);
                setModalSearch('');
              }
            }}
            className="flex items-center gap-1.5"
          >
            <div className="relative flex-1">
              <div className="absolute left-2.5 top-2.5 text-stone-400 pointer-events-none">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="ဘားကုဒ် သို့မဟုတ် ပစ္စည်းအမည် ရိုက်ထည့်ရန်..."
                className="w-full text-xs pl-8 pr-7 py-2 rounded-xl border border-stone-700 bg-stone-800 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              {modalSearch && (
                <button
                  type="button"
                  onClick={() => setModalSearch('')}
                  className="absolute right-2 top-2 text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              ထည့်မည်
            </button>
          </form>

          {/* Quick Search Results Dropdown/List */}
          {searchResults.length > 0 && (
            <div className="bg-stone-800 rounded-xl border border-stone-700 p-1.5 max-h-36 overflow-y-auto space-y-1">
              <p className="text-[10px] text-stone-400 px-1 font-bold">
                ရှာတွေ့သော ပစ္စည်းများ (နှိပ်၍ခြင်းထဲထည့်ပါ):
              </p>
              {searchResults.map((product) => {
                const isJustAdded = justAddedModalId === product.id;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      if (product.stock <= 0) {
                        playBarcodeBeep('error');
                        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                          try {
                            navigator.vibrate([80, 60, 80]);
                          } catch {
                            // ignore
                          }
                        }
                        setScanSuccessText(null);
                        setScanErrorText(`${product.nameMy} လက်ကျန်ကုန်နေပါသည် (Out of Stock)`);
                        setTimeout(() => setScanErrorText(null), 3000);
                        return;
                      }

                      const res = addToCart(product, 1);
                      if (!res.success) {
                        playBarcodeBeep('error');
                        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                          try {
                            navigator.vibrate([80, 60, 80]);
                          } catch {
                            // ignore
                          }
                        }
                        setScanSuccessText(null);
                        setScanErrorText(res.message);
                        setTimeout(() => setScanErrorText(null), 3000);
                        return;
                      }

                      playBarcodeBeep('success');
                      setJustAddedModalId(product.id);
                      setScanErrorText(null);
                      setScanSuccessText(product.nameMy);
                      setTimeout(() => {
                        setJustAddedModalId(null);
                        setScanSuccessText(null);
                      }, 1200);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-stone-700 text-left transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-white truncate">{product.nameMy}</p>
                      <p className="text-[10px] text-stone-400 font-mono truncate">
                        {product.barcode} • {formatMMK(product.sellingPrice, useMyanmarDigits)}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                        isJustAdded ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {isJustAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      <span>{isJustAdded ? 'ထည့်ပြီး' : 'ထည့်မည်'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between text-xs text-stone-400 pt-0.5">
            <span className="text-[10px] truncate max-w-[240px]">
              USB/Bluetooth စကင်နာသေနတ်ဖြင့်လည်း တိုက်ရိုက်ဖတ်နိုင်ပါသည်
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              ပိတ်မည်
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
