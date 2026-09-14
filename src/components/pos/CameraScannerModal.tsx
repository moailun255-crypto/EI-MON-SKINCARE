import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
} from '@zxing/library';
import {
  Camera,
  X,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Zap,
  ZapOff,
  SwitchCamera,
  ZoomIn,
  Search,
  Plus,
  Check,
  Scan,
  Volume2,
  VolumeX,
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
  elementId?: string;
}

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

  // Multi-camera and Zoom controls
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [hasHardwareZoom, setHasHardwareZoom] = useState<boolean>(false);
  const [focusRingPos, setFocusRingPos] = useState<{ x: number; y: number } | null>(null);

  // In-modal quick search & direct add
  const [modalSearch, setModalSearch] = useState('');
  const [justAddedModalId, setJustAddedModalId] = useState<string | null>(null);

  // DOM and Stream Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const isDetectingRef = useRef<boolean>(false);
  const isCooldownRef = useRef<boolean>(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

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

  // Handle scanned barcode with instant beep, haptic, and UI feedback
  const handleScannedCode = useCallback(
    (rawCode: string) => {
      const clean = normalizeBarcode(rawCode);
      if (!clean || clean.length < 3) return;

      const now = Date.now();
      // Debounce: prevent duplicate scan of the EXACT SAME barcode within 900ms
      if (clean === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 900) {
        return;
      }

      if (isCooldownRef.current) return;
      isCooldownRef.current = true;
      lastScannedCodeRef.current = clean;
      lastScannedTimeRef.current = now;

      // Haptic vibration feedback for mobile devices
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(60);
        } catch {
          // ignore
        }
      }

      if (onScan) {
        const res = onScan(clean);
        playBarcodeBeep(res.success ? 'success' : 'error');

        if (res.success) {
          setScanErrorText(null);
          setScanSuccessText(res.productName || clean);
          setUnregisteredScannedBarcode(null);
          setTimeout(() => {
            setScanSuccessText(null);
          }, 1600);
        } else {
          // Error buzz vibration
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
        }
      }

      // Short cooldown between scans (400ms) for high-speed continuous cashier scanning
      setTimeout(() => {
        isCooldownRef.current = false;
      }, 400);
    },
    [onScan]
  );

  // Stop all camera streams and decoder loops cleanly
  const stopCamera = useCallback(() => {
    isDetectingRef.current = false;

    if (zxingReaderRef.current) {
      try {
        zxingReaderRef.current.stopContinuousDecode();
        zxingReaderRef.current.reset();
      } catch {
        // ignore
      }
      zxingReaderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Enumerate cameras
  const queryCameras = useCallback(async () => {
    try {
      if (!navigator?.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableCameras(videoInputs);
    } catch {
      // ignore
    }
  }, []);

  // Launch the camera and initiate the ultra-fast dual-engine scanning loop
  const startCamera = useCallback(
    async (deviceId?: string) => {
      try {
        setCameraError(null);
        setScanSuccessText(null);
        setScanErrorText(null);
        setTorchOn(false);
        setHasTorch(false);
        setHasHardwareZoom(false);
        setCurrentZoom(1);

        if (!navigator?.mediaDevices?.getUserMedia) {
          setCameraError(
            'ဤဘရောက်ဇာတွင် ကင်မရာစနစ် မထောက်ပံ့သေးပါ သို့မဟုတ် HTTPS လုံခြုံရေးလိုင်း လိုအပ်ပါသည်။'
          );
          return;
        }

        stopCamera();

        // 1. Request High-Definition stream (1080p ideal) with continuous autofocus & exposure
        let stream: MediaStream;
        try {
          const constraints: MediaStreamConstraints = {
            video: {
              deviceId: deviceId ? { exact: deviceId } : undefined,
              facingMode: deviceId ? undefined : { ideal: 'environment' },
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 },
              advanced: [
                { focusMode: 'continuous' } as any,
                { exposureMode: 'continuous' } as any,
                { whiteBalanceMode: 'continuous' } as any,
              ],
            } as any,
            audio: false,
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          // Resilient fallback: standard video constraints if advanced constraints fail
          stream = await navigator.mediaDevices.getUserMedia({
            video: deviceId
              ? { deviceId: { exact: deviceId } }
              : { facingMode: { ideal: 'environment' } },
            audio: false,
          });
        }

        mediaStreamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.muted = true;

        await video.play();

        // Check camera hardware capabilities (Torch, Hardware Zoom, Autofocus)
        const track = stream.getVideoTracks()[0];
        if (track) {
          const caps = (track.getCapabilities ? track.getCapabilities() : {}) as any;
          if (caps?.torch) setHasTorch(true);
          if (caps?.zoom && caps.zoom.max > 1) {
            setHasHardwareZoom(true);
          }

          // Apply continuous autofocus if supported
          try {
            if ('applyConstraints' in track) {
              const advancedConstraints: Record<string, unknown>[] = [];
              if (caps?.focusMode?.includes('continuous')) {
                advancedConstraints.push({ focusMode: 'continuous' });
              }
              if (caps?.exposureMode?.includes('continuous')) {
                advancedConstraints.push({ exposureMode: 'continuous' });
              }
              if (advancedConstraints.length > 0) {
                await track.applyConstraints({ advanced: advancedConstraints as any });
              }
            }
          } catch {
            // ignore
          }
        }

        await queryCameras();

        // 2. Start Ultra-Fast Scanning Pipeline
        isDetectingRef.current = true;

        // Tier 1: Hardware-accelerated native BarcodeDetector (Chrome, Edge, Android Webview)
        let nativeDetectorSupported = false;
        if ('BarcodeDetector' in window) {
          try {
            const BarcodeDetectorClass = (window as unknown as {
              BarcodeDetector: new (opts: { formats: string[] }) => {
                detect: (src: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
              };
            }).BarcodeDetector;

            const nativeDetector = new BarcodeDetectorClass({
              formats: [
                'ean_13',
                'ean_8',
                'upc_a',
                'upc_e',
                'code_128',
                'code_39',
                'code_93',
                'itf',
                'codabar',
                'qr_code',
              ],
            });

            nativeDetectorSupported = true;

            const runNativeFrameDetection = async () => {
              if (!isDetectingRef.current) return;
              if (video && video.readyState >= 2 && !isCooldownRef.current) {
                try {
                  const barcodes = await nativeDetector.detect(video);
                  if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                    handleScannedCode(barcodes[0].rawValue);
                  }
                } catch {
                  // silent frame miss
                }
              }

              if (isDetectingRef.current) {
                if ('requestVideoFrameCallback' in video) {
                  // Sync directly with camera hardware refresh (30-60 FPS)
                  (video as any).requestVideoFrameCallback(runNativeFrameDetection);
                } else {
                  requestAnimationFrame(runNativeFrameDetection);
                }
              }
            };

            if ('requestVideoFrameCallback' in video) {
              (video as any).requestVideoFrameCallback(runNativeFrameDetection);
            } else {
              requestAnimationFrame(runNativeFrameDetection);
            }
          } catch (e) {
            console.warn('Native BarcodeDetector init failed, using ZXing:', e);
            nativeDetectorSupported = false;
          }
        }

        // Tier 2: ZXing MultiFormatReader with TRY_HARDER = true (Runs in parallel or as primary)
        // This ensures 100% scanning coverage across iOS Safari, desktop browsers, and all 1D formats
        try {
          const hints = new Map<DecodeHintType, any>();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13,
            BarcodeFormat.UPC_A,
            BarcodeFormat.CODE_128,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_E,
            BarcodeFormat.CODE_39,
            BarcodeFormat.CODE_93,
            BarcodeFormat.ITF,
            BarcodeFormat.CODABAR,
            BarcodeFormat.QR_CODE,
          ]);
          hints.set(DecodeHintType.TRY_HARDER, true);

          // Fast decode cycle: 80ms interval if no native detector, or 180ms background
          const decodeDelay = nativeDetectorSupported ? 180 : 80;
          const reader = new BrowserMultiFormatReader(hints, decodeDelay);
          zxingReaderRef.current = reader;

          reader.decodeFromVideoElementContinuously(video, (result, err) => {
            if (!isDetectingRef.current) return;
            if (result && result.getText()) {
              handleScannedCode(result.getText());
            }
          });
        } catch (e) {
          console.warn('ZXing reader start failed:', e);
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
            'ကင်မရာ အသုံးပြုခွင့် (Permission) ပိတ်ထားပါသည်။ ဘရောက်ဇာ Settings တွင် ကင်မရာဖွင့်ခွင့် ပေးပါ သို့မဟုတ် အောက်တွင် ဘားကုဒ် ရိုက်ထည့်နိုင်ပါသည်။'
          );
        } else if (errName === 'NotFoundError' || errMsg.includes('NotFoundError')) {
          setCameraError('စက်တွင် ကင်မရာ တပ်ဆင်ထားခြင်း မတွေ့ရှိပါ။');
        } else {
          setCameraError('ကင်မရာ ဖွင့်၍ မရသေးပါ။ ဘားကုဒ်ကို အောက်တွင် တိုက်ရိုက် ရိုက်ထည့်နိုင်ပါသည်။');
        }
      }
    },
    [handleScannedCode, stopCamera, queryCameras]
  );

  // Switch Camera Lens (e.g. tablet wide angle vs main rear lens)
  const handleSwitchCamera = async () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    setSelectedCameraId(nextCamera.deviceId);
    await startCamera(nextCamera.deviceId);
  };

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!hasTorch || !mediaStreamRef.current) return;
    const nextTorch = !torchOn;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: nextTorch } as any],
        });
        setTorchOn(nextTorch);
      } catch (err) {
        console.warn('Torch toggle failed:', err);
      }
    }
  };

  // Set Zoom Level (1x, 1.5x, 2x) - Seamless Hardware Sensor Zoom & CSS Magnification
  const handleSetZoom = async (zoomVal: number) => {
    setCurrentZoom(zoomVal);

    // Apply hardware camera zoom if supported
    if (hasHardwareZoom && mediaStreamRef.current) {
      const track = mediaStreamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          await track.applyConstraints({
            advanced: [{ zoom: zoomVal } as any],
          });
        } catch {
          // fallback to CSS transform
        }
      }
    }
  };

  // Tap-to-Focus interaction: Touching anywhere on the camera focuses on that area
  const handleTapToFocus = async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setFocusRingPos({ x, y });
    setTimeout(() => setFocusRingPos(null), 900);

    // Trigger autofocus re-lock on hardware
    if (mediaStreamRef.current) {
      const track = mediaStreamRef.current.getVideoTracks()[0];
      if (track && 'applyConstraints' in track) {
        try {
          const normX = x / rect.width;
          const normY = y / rect.height;
          await track.applyConstraints({
            advanced: [
              { pointsOfInterest: [{ x: normX, y: normY }] } as any,
              { focusMode: 'continuous' } as any,
            ],
          });
        } catch {
          // ignore
        }
      }
    }
  };

  // Sound Mute Toggle
  const toggleSound = () => {
    const next = !isMutedState;
    setIsMutedState(next);
    setSoundMuted(next);
  };

  // Lifecycle: open/close camera
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startCamera();
      }, 80);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
      setScanSuccessText(null);
      setScanErrorText(null);
      setCameraError(null);
      setTorchOn(false);
      setHasTorch(false);
      setHasHardwareZoom(false);
      setUnregisteredScannedBarcode(null);
      setModalSearch('');
    }
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-stone-950/85 backdrop-blur-xs">
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
                {title || 'ဘားကုဒ် အမြန်စကင်ဖတ်ရန်'}
              </h3>
              <p className="text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>全屏极速感应 • 任意一维码/大条码均可秒扫</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
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
        <div
          onClick={handleTapToFocus}
          className="relative flex-1 sm:flex-none sm:aspect-square bg-black flex items-center justify-center overflow-hidden min-h-[320px] sm:min-h-[350px] cursor-crosshair select-none"
        >
          {/* Direct Hardware-Accelerated Video Stream Element */}
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            style={{
              transform: currentZoom > 1 ? `scale(${currentZoom})` : 'none',
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out',
            }}
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Tap-to-Focus Animated Target Ring */}
          {focusRingPos && (
            <div
              style={{ left: focusRingPos.x - 24, top: focusRingPos.y - 24 }}
              className="absolute w-12 h-12 rounded-full border-2 border-emerald-400 pointer-events-none animate-ping z-30"
            />
          )}

          {/* Zoom Control Bar (1x, 1.5x, 2x) */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-lg">
            <ZoomIn className="w-3.5 h-3.5 text-stone-300 ml-1" />
            {[1, 1.5, 2].map((z) => (
              <button
                key={z}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetZoom(z);
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  currentZoom === z
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-white/20'
                }`}
              >
                {z}x
              </button>
            ))}
          </div>

          {/* Full-View Laser Reticle Frame (No strict clipping - visual alignment helper only) */}
          {!cameraError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-3">
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

                {/* High-Tech Laser Beam Scanning Line */}
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

              {/* Instant Status Toast / Instructions */}
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
                    <span>မျက်နှာပြင်တစ်ခုလုံး အလိုအလျောက် ဖတ်ရှုနေပါသည်</span>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    无需对准红线 • 全屏任意距离/角度均可秒扫 • 点击屏幕可快速对焦
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
                onClick={() => startCamera(selectedCameraId || undefined)}
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
                setActiveTab('add_product');
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
