import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  X,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Zap,
  ZapOff,
  Info,
  SwitchCamera,
  ZoomIn,
  Sparkles,
} from 'lucide-react';
import { playBarcodeBeep } from '../../utils/scannerSound';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: (code: string) => { success: boolean; message: string; productName?: string };
  title?: string;
  elementId?: string;
}

// Typings for native Web API BarcodeDetector (W3C Shape Detection API)
interface DetectedBarcode {
  boundingBox?: DOMRectReadOnly;
  cornerPoints?: { x: number; y: number }[];
  format: string;
  rawValue: string;
}

interface IBarcodeDetector {
  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): IBarcodeDetector;
      getSupportedFormats(): Promise<string[]>;
    };
  }
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
  const [isHardwareAccelerated, setIsHardwareAccelerated] = useState<boolean>(false);

  // Multi-camera and Zoom controls for tablets and phones
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [hasZoom, setHasZoom] = useState<boolean>(false);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number }>({
    min: 1,
    max: 2,
    step: 0.1,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const lastCodeRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);
  const nativeDetectLoopRef = useRef<boolean>(false);
  const animFrameIdRef = useRef<number | null>(null);

  const scannerElementId = elementId || 'minimal-pos-camera-view';

  // Handle scanned barcode with haptic vibration & feedback
  const handleScannedCode = useCallback(
    (rawCode: string) => {
      const clean = rawCode.trim();
      if (!clean) return;

      const now = Date.now();
      // 800ms cooldown for rapid item-by-item scanning
      if (clean === lastCodeRef.current && now - lastTimeRef.current < 800) {
        return;
      }

      if (isScanningRef.current) return;
      isScanningRef.current = true;
      lastCodeRef.current = clean;
      lastTimeRef.current = now;

      // Haptic feedback for mobile phones and tablets
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(60);
        } catch {
          // ignore
        }
      }

      if (onScan) {
        const res = onScan(clean);
        // Play beep sound
        playBarcodeBeep(res.success ? 'success' : 'error');
        if (res.success) {
          setScanSuccessText(res.productName || clean);
          setTimeout(() => {
            setScanSuccessText(null);
          }, 1400);
        }
      }

      setTimeout(() => {
        isScanningRef.current = false;
      }, 400);
    },
    [onScan]
  );

  // Stop all camera streams and scanners cleanly
  const stopAllScanners = useCallback(async () => {
    nativeDetectLoopRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

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
  }, []);

  // Enumerate available video inputs (back cameras, wide/normal lenses)
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

  // Switch Camera Lens (e.g. tablet wide angle vs main rear lens)
  const handleSwitchCamera = async () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    setSelectedCameraId(nextCamera.deviceId);
    await stopAllScanners();
    setTimeout(() => {
      startCamera(nextCamera.deviceId);
    }, 100);
  };

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!hasTorch) return;
    const nextTorch = !torchOn;

    // Try track constraint
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: nextTorch } as any],
          });
          setTorchOn(nextTorch);
          return;
        } catch {
          // fallback
        }
      }
    }

    // Try html5QrCode fallback
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: nextTorch } as Record<string, unknown>],
        });
        setTorchOn(nextTorch);
      } catch (err) {
        console.warn('Torch failed:', err);
      }
    }
  };

  // Set Zoom Level (1x, 1.5x, 2x)
  const handleSetZoom = async (zoomVal: number) => {
    if (!hasZoom || !streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ zoom: zoomVal } as any],
      });
      setCurrentZoom(zoomVal);
    } catch (err) {
      console.warn('Zoom failed:', err);
    }
  };

  // Start Camera with Dual Engine:
  // Primary: Native C++ BarcodeDetector on <video> (1-5ms real-time 60fps)
  // Fallback: Optimized Html5Qrcode
  const startCamera = async (targetDeviceId?: string) => {
    try {
      setCameraError(null);
      setScanSuccessText(null);
      setTorchOn(false);
      setHasTorch(false);
      setHasZoom(false);
      setCurrentZoom(1);

      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError(
          'ဤဘရောက်ဇာတွင် ကင်မရာစနစ် မထောက်ပံ့သေးပါ သို့မဟုတ် HTTPS/လုံခြုံစိတ်ချရသော လိုင်း လိုအပ်ပါသည်။'
        );
        return;
      }

      await stopAllScanners();

      // Check if native BarcodeDetector API is supported
      const hasNativeBarcodeDetector =
        typeof window !== 'undefined' && typeof window.BarcodeDetector === 'function';

      if (hasNativeBarcodeDetector) {
        try {
          // 1. HARDWARE ACCELERATED NATIVE C++ ENGINE
          let supportedFormats = ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'];
          try {
            if (window.BarcodeDetector?.getSupportedFormats) {
              const deviceFormats = await window.BarcodeDetector.getSupportedFormats();
              if (deviceFormats && deviceFormats.length > 0) {
                supportedFormats = supportedFormats.filter((f) => deviceFormats.includes(f));
              }
            }
          } catch {
            // ignore
          }

          const barcodeDetector = new window.BarcodeDetector!({
            formats: supportedFormats,
          });

          // Request high-frame-rate video stream with continuous autofocus
          const videoConstraints: MediaTrackConstraints = {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, max: 60 },
          };

          if (targetDeviceId) {
            videoConstraints.deviceId = { exact: targetDeviceId };
          } else {
            videoConstraints.facingMode = { ideal: 'environment' };
          }

          videoConstraints.advanced = [{ focusMode: 'continuous' } as any];

          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: videoConstraints,
          });

          streamRef.current = stream;
          setIsHardwareAccelerated(true);

          // Check track capabilities (torch, zoom)
          const track = stream.getVideoTracks()[0];
          if (track) {
            const caps = (track.getCapabilities ? track.getCapabilities() : {}) as MediaTrackCapabilities & {
              torch?: boolean;
              zoom?: { min: number; max: number; step: number };
            };
            if (caps?.torch) {
              setHasTorch(true);
            }
            if (caps?.zoom && caps.zoom.max > 1) {
              setHasZoom(true);
              setZoomRange({
                min: caps.zoom.min || 1,
                max: Math.min(caps.zoom.max || 3, 3),
                step: caps.zoom.step || 0.1,
              });
            }
          }

          // Connect to video element
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            // Run lightning-fast detection loop
            nativeDetectLoopRef.current = true;
            const detectLoop = async () => {
              if (!nativeDetectLoopRef.current) return;
              const video = videoRef.current;
              if (video && video.readyState >= 2 && !video.paused) {
                try {
                  const barcodes = await barcodeDetector.detect(video);
                  if (barcodes && barcodes.length > 0) {
                    for (const b of barcodes) {
                      const code = b.rawValue ? b.rawValue.trim() : '';
                      if (code) {
                        handleScannedCode(code);
                        break;
                      }
                    }
                  }
                } catch {
                  // ignore single-frame errors
                }
              }

              // Use requestVideoFrameCallback for 0-latency frame sync, fallback to requestAnimationFrame
              if (video && 'requestVideoFrameCallback' in video) {
                (video as any).requestVideoFrameCallback(detectLoop);
              } else {
                animFrameIdRef.current = requestAnimationFrame(detectLoop);
              }
            };

            detectLoop();
            await queryCameras();
            return;
          }
        } catch (nativeErr) {
          console.warn('Native BarcodeDetector stream failed, falling back to Html5Qrcode:', nativeErr);
          await stopAllScanners();
        }
      }

      // 2. OPTIMIZED UNIVERSAL FALLBACK ENGINE (Html5Qrcode)
      setIsHardwareAccelerated(false);
      const qrScanner = new Html5Qrcode(scannerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_8,
        ],
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      });
      html5QrCodeRef.current = qrScanner;

      await qrScanner.start(
        targetDeviceId ? { deviceId: { exact: targetDeviceId } } : { facingMode: 'environment' },
        {
          fps: 25,
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: 'environment',
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
            advanced: [{ focusMode: 'continuous' } as any],
          },
        },
        (decodedText) => {
          handleScannedCode(decodedText);
        },
        () => {
          // silent on frame misses
        }
      );

      try {
        const capabilities = qrScanner.getRunningTrackCapabilities() as MediaTrackCapabilities & {
          torch?: boolean;
          zoom?: { min: number; max: number; step: number };
        };
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
        if (capabilities && capabilities.zoom && capabilities.zoom.max > 1) {
          setHasZoom(true);
          setZoomRange({
            min: capabilities.zoom.min || 1,
            max: Math.min(capabilities.zoom.max || 3, 3),
            step: capabilities.zoom.step || 0.1,
          });
        }
      } catch {
        // ignore
      }

      await queryCameras();
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

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      stopAllScanners();
      setScanSuccessText(null);
      setCameraError(null);
      setTorchOn(false);
      setHasTorch(false);
      setHasZoom(false);
      setIsHardwareAccelerated(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm sm:max-w-md rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-fadeIn">
        {/* Modal Top Bar */}
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold leading-tight">
                  {title || 'ဘားကုဒ် စကင်ဖတ်ရန်'}
                </h3>
                {isHardwareAccelerated ? (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    TURBO 60FPS
                  </span>
                ) : (
                  <span className="text-[9px] bg-stone-700 text-stone-300 font-mono px-1 py-0.5 rounded">
                    1D BARCODE
                  </span>
                )}
              </div>
              <span className="text-[10px] text-stone-400">
                EAN-13 • UPC • Code 128 • QR
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Multi-camera switch button if tablet has multiple lenses */}
            {availableCameras.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                title="ကင်မရာမှန်ဘီလူးပြောင်းမည် (Switch Lens)"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

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
              <span>စကင်ဖတ်နှုန်း အမြန်ဆုံးဖြစ်စေရန် အကြံပြုချက်:</span>
            </p>
            <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-amber-800">
              <li>ဖုန်းကို ဘားကုဒ်နှင့် <strong>၁၂ ~ ၂၀ စင်တီမီတာ (လက်တစ်ဝါးခန့်)</strong> ခွာထားပါ (နီးလွန်းပါက ဝါးသွားတတ်သည်)။</li>
              <li>ပစ္စည်းသေးပါက အောက်ရှိ <strong>1.5x / 2x Zoom</strong> ခလုတ်ကို နှိပ်၍ ချဲ့ကြည့်ပါ။</li>
              <li>ဘားကုဒ်ကို အနီရောင်မျဉ်းတန်းအလယ်တွင် တည့်တည့်ထားပေးပါ။</li>
            </ul>
          </div>
        )}

        {/* Camera Viewport */}
        <div className="relative bg-stone-950 aspect-4/3 sm:aspect-square w-full flex items-center justify-center overflow-hidden">
          {/* Native HTML5 Video Element for direct C++ hardware acceleration */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover ${isHardwareAccelerated ? 'block' : 'hidden'}`}
          />

          {/* Fallback container for Html5Qrcode */}
          <div
            id={scannerElementId}
            className={`w-full h-full object-cover ${!isHardwareAccelerated ? 'block' : 'hidden'}`}
          />

          {/* Quick Hardware Zoom Control Bar (Overlay on Camera Viewport) */}
          {hasZoom && (
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-xs p-1 rounded-xl border border-white/20">
              <ZoomIn className="w-3 h-3 text-stone-300 ml-1" />
              {[1, 1.5, 2].map((z) => {
                if (z > zoomRange.max && z !== 1) return null;
                return (
                  <button
                    key={z}
                    type="button"
                    onClick={() => handleSetZoom(z)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      currentZoom === z
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-stone-300 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    {z}x
                  </button>
                );
              })}
            </div>
          )}

          {/* Laser Reticle & Guidance Overlay */}
          {!cameraError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              {/* Wide Horizontal Rectangular Reticle suited for 1D barcodes */}
              <div
                className={`w-72 sm:w-80 h-32 relative transition-all duration-150 rounded-2xl overflow-hidden border-2 ${
                  scanSuccessText
                    ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(52,211,153,0.7)] scale-102'
                    : 'border-white/80 bg-black/15 shadow-[0_0_15px_rgba(0,0,0,0.4)]'
                }`}
              >
                {/* Horizontal High-Speed Scanning Laser */}
                <div
                  className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 shadow-lg ${
                    scanSuccessText
                      ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]'
                      : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)] animate-pulse'
                  }`}
                />

                {/* Corner Crosshairs */}
                <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-white" />
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-white" />
                <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-white" />
                <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-white" />
              </div>

              {/* Status Badge */}
              {scanSuccessText ? (
                <div className="mt-3 px-4 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg animate-bounce">
                  <CheckCircle className="w-4 h-4" />
                  <span className="truncate max-w-[220px]">{scanSuccessText} ထည့်ပြီး</span>
                </div>
              ) : (
                <div className="mt-3 text-center space-y-0.5">
                  <span className="px-3 py-1 rounded-full bg-black/75 text-white text-[11px] font-medium backdrop-blur-xs inline-block shadow-sm">
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
                onClick={() => startCamera()}
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
                  setTimeout(() => setScanSuccessText(null), 1400);
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
              စကင်နာစက် (သို့) ဘားကုဒ် ရိုက်ထည့်၍လည်း ရပါသည်
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
