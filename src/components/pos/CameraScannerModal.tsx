import React, { useEffect, useRef, useState, useCallback } from 'react';
import Quagga from '@ericblade/quagga2';
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
  Upload,
  Search,
  Plus,
  Check,
  Smartphone,
  Layers,
} from 'lucide-react';
import { playBarcodeBeep } from '../../utils/scannerSound';
import { useStore } from '../../context/StoreContext';
import { formatMMK } from '../../utils/format';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: (code: string) => { success: boolean; message: string; productName?: string };
  title?: string;
}

type ScannerEngine = 'quagga' | 'html5';

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title,
}) => {
  const { products, addToCart, useMyanmarDigits } = useStore();

  const [activeEngine, setActiveEngine] = useState<ScannerEngine>('quagga');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanSuccessText, setScanSuccessText] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [showTips, setShowTips] = useState<boolean>(false);
  const [isPhotoScanning, setIsPhotoScanning] = useState<boolean>(false);

  // Multi-camera and Zoom controls
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [hasZoom, setHasZoom] = useState<boolean>(false);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number }>({
    min: 1,
    max: 2,
    step: 0.1,
  });

  // In-modal quick search & direct add
  const [modalSearch, setModalSearch] = useState('');
  const [justAddedModalId, setJustAddedModalId] = useState<string | null>(null);

  const quaggaContainerRef = useRef<HTMLDivElement | null>(null);
  const html5ContainerId = 'pos-html5-camera-box';
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningCooldownRef = useRef(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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

  // Handle scanned barcode with haptic & sound
  const handleScannedCode = useCallback(
    (rawCode: string) => {
      const clean = rawCode.trim();
      if (!clean) return;

      const now = Date.now();
      // 800ms debounce
      if (clean === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 800) {
        return;
      }

      if (isScanningCooldownRef.current) return;
      isScanningCooldownRef.current = true;
      lastScannedCodeRef.current = clean;
      lastScannedTimeRef.current = now;

      // Mobile haptic vibration
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
          setScanSuccessText(res.productName || clean);
          setTimeout(() => {
            setScanSuccessText(null);
          }, 1500);
        }
      }

      setTimeout(() => {
        isScanningCooldownRef.current = false;
      }, 500);
    },
    [onScan]
  );

  // Stop Quagga and Html5Qrcode cleanly
  const stopAllScanners = useCallback(async () => {
    try {
      if (Quagga) {
        try {
          Quagga.offDetected();
          Quagga.stop();
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
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

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
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

  // Start Quagga (Engine 1 - 1D Retail Barcode Specialist)
  const startQuagga = useCallback(
    async (targetDeviceId?: string) => {
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

        const container = quaggaContainerRef.current;
        if (!container) return;

        // Clear previous video tags
        container.innerHTML = '';

        const constraints: MediaTrackConstraints = {
          width: { min: 640, ideal: 1280 },
          height: { min: 480, ideal: 720 },
        };

        if (targetDeviceId) {
          constraints.deviceId = { exact: targetDeviceId };
        } else {
          constraints.facingMode = { ideal: 'environment' };
        }

        // @ts-expect-error continuous autofocus
        constraints.advanced = [{ focusMode: 'continuous' }];

        Quagga.init(
          {
            inputStream: {
              type: 'LiveStream',
              target: container,
              constraints,
              area: {
                // Focus area: 70% width, 50% height centered
                top: '15%',
                right: '10%',
                left: '10%',
                bottom: '15%',
              },
            },
            decoder: {
              readers: [
                'ean_reader',
                'ean_8_reader',
                'code_128_reader',
                'upc_reader',
                'upc_e_reader',
                'code_39_reader',
              ],
              multiple: false,
            },
            locate: true,
            locator: {
              patchSize: 'medium',
              halfSample: true,
            },
            numOfWorkers:
              typeof navigator !== 'undefined' && navigator.hardwareConcurrency
                ? Math.min(navigator.hardwareConcurrency, 4)
                : 2,
          },
          (err) => {
            if (err) {
              console.warn('Quagga init failed, falling back to Html5Qrcode:', err);
              startHtml5Qrcode(targetDeviceId);
              return;
            }

            Quagga.start();

            // Extract track capabilities from Quagga's active video track
            try {
              const videoElem = container.querySelector('video');
              if (videoElem && videoElem.srcObject) {
                const stream = videoElem.srcObject as MediaStream;
                mediaStreamRef.current = stream;
                const track = stream.getVideoTracks()[0];
                if (track) {
                  const caps = (track.getCapabilities ? track.getCapabilities() : {}) as MediaTrackCapabilities & {
                    torch?: boolean;
                    zoom?: { min: number; max: number; step: number };
                  };
                  if (caps?.torch) setHasTorch(true);
                  if (caps?.zoom && caps.zoom.max > 1) {
                    setHasZoom(true);
                    setZoomRange({
                      min: caps.zoom.min || 1,
                      max: Math.min(caps.zoom.max || 3, 3),
                      step: caps.zoom.step || 0.1,
                    });
                  }
                }
              }
            } catch {
              // ignore
            }
          }
        );

        Quagga.onDetected((result) => {
          if (result && result.codeResult && result.codeResult.code) {
            handleScannedCode(result.codeResult.code);
          }
        });

        await queryCameras();
      } catch (err) {
        console.warn('Quagga error:', err);
        startHtml5Qrcode(targetDeviceId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleScannedCode, stopAllScanners, queryCameras]
  );

  // Start Html5Qrcode (Engine 2 - Multi-format / QR & 1D)
  const startHtml5Qrcode = useCallback(
    async (targetDeviceId?: string) => {
      try {
        setCameraError(null);
        setScanSuccessText(null);
        setTorchOn(false);
        setHasTorch(false);
        setHasZoom(false);
        setCurrentZoom(1);

        await stopAllScanners();

        const qrScanner = new Html5Qrcode(html5ContainerId, {
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
            fps: 12, // 12 FPS gives optimal responsiveness without locking mobile CPU
            aspectRatio: 1.0,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              // Rectangular scanning band focused on barcode
              const width = Math.floor(viewfinderWidth * 0.85);
              const height = Math.floor(Math.min(viewfinderHeight * 0.45, 180));
              return { width, height };
            },
            videoConstraints: {
              facingMode: 'environment',
              width: { min: 640, ideal: 1280 },
              height: { min: 480, ideal: 720 },
              // @ts-expect-error continuous focus
              advanced: [{ focusMode: 'continuous' }],
            },
          },
          (decodedText) => {
            handleScannedCode(decodedText);
          },
          () => {
            // silent on frame miss
          }
        );

        try {
          const capabilities = qrScanner.getRunningTrackCapabilities() as MediaTrackCapabilities & {
            torch?: boolean;
            zoom?: { min: number; max: number; step: number };
          };
          if (capabilities && capabilities.torch) setHasTorch(true);
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
          setCameraError('ကင်မရာ ဖွင့်၍ မရသေးပါ။ ဘားကုဒ်ကို အောက်တွင် တိုက်ရိုက် ရိုက်ထည့်နိုင်ပါသည်။');
        }
      }
    },
    [handleScannedCode, stopAllScanners, queryCameras]
  );

  // Switch between Quagga and Html5Qrcode
  const handleToggleEngine = (newEngine: ScannerEngine) => {
    setActiveEngine(newEngine);
    if (newEngine === 'quagga') {
      startQuagga(selectedCameraId);
    } else {
      startHtml5Qrcode(selectedCameraId);
    }
  };

  // Switch Camera Lens (e.g. tablet wide angle vs main rear lens)
  const handleSwitchCamera = async () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    setSelectedCameraId(nextCamera.deviceId);
    if (activeEngine === 'quagga') {
      startQuagga(nextCamera.deviceId);
    } else {
      startHtml5Qrcode(nextCamera.deviceId);
    }
  };

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!hasTorch) return;
    const nextTorch = !torchOn;

    if (mediaStreamRef.current) {
      const track = mediaStreamRef.current.getVideoTracks()[0];
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

    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: nextTorch } as Record<string, unknown>],
        });
        setTorchOn(nextTorch);
      } catch (err) {
        console.warn('Torch toggle failed:', err);
      }
    }
  };

  // Set Zoom Level (1x, 1.5x, 2x)
  const handleSetZoom = async (zoomVal: number) => {
    if (!hasZoom) return;

    if (mediaStreamRef.current) {
      const track = mediaStreamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          await track.applyConstraints({
            advanced: [{ zoom: zoomVal } as any],
          });
          setCurrentZoom(zoomVal);
          return;
        } catch {
          // fallback
        }
      }
    }

    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ zoom: zoomVal } as Record<string, unknown>],
        });
        setCurrentZoom(zoomVal);
      } catch (err) {
        console.warn('Zoom failed:', err);
      }
    }
  };

  // Native Camera Photo Capture & Decode Fallback
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPhotoScanning(true);
    try {
      // First try Quagga.decodeSingle
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        if (!dataUrl) {
          setIsPhotoScanning(false);
          return;
        }

        Quagga.decodeSingle(
          {
            src: dataUrl,
            numOfWorkers: 2,
            inputStream: {
              size: 1280,
            },
            decoder: {
              readers: [
                'ean_reader',
                'ean_8_reader',
                'code_128_reader',
                'upc_reader',
                'upc_e_reader',
                'code_39_reader',
              ],
            },
          },
          (res) => {
            if (res && res.codeResult && res.codeResult.code) {
              handleScannedCode(res.codeResult.code);
              setIsPhotoScanning(false);
            } else {
              // Try Html5Qrcode scanFile fallback
              const tempScanner = new Html5Qrcode('temp-scan-file-div');
              tempScanner
                .scanFile(file, false)
                .then((decodedText) => {
                  handleScannedCode(decodedText);
                  tempScanner.clear();
                })
                .catch(() => {
                  alert('ဓာတ်ပုံထဲတွင် ဘားကုဒ် ရှာမတွေ့ပါ။ ဘားကုဒ်နံပါတ်ကို အောက်တွင် တိုက်ရိုက် ရိုက်ထည့်နိုင်ပါသည်။');
                })
                .finally(() => {
                  setIsPhotoScanning(false);
                });
            }
          }
        );
      };
      reader.readAsDataURL(file);
    } catch {
      setIsPhotoScanning(false);
    }

    // Reset input
    e.target.value = '';
  };

  // Start on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (activeEngine === 'quagga') {
          startQuagga();
        } else {
          startHtml5Qrcode();
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      stopAllScanners();
      setScanSuccessText(null);
      setCameraError(null);
      setTorchOn(false);
      setHasTorch(false);
      setHasZoom(false);
      setModalSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-stone-950/80 backdrop-blur-xs">
      {/* Off-screen div for temporary image file scanning */}
      <div id="temp-scan-file-div" className="hidden" />

      {/* Hidden Native Camera Snapshot Input */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCapture}
        className="hidden"
      />

      {/* Full screen on mobile (<640px), rounded modal on tablet/desktop */}
      <div className="bg-stone-900 w-full h-full sm:h-auto sm:max-w-md sm:rounded-3xl shadow-2xl border-0 sm:border sm:border-stone-700 overflow-hidden flex flex-col animate-fadeIn text-white">
        
        {/* Modal Top Bar */}
        <div className="px-4 py-3 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold leading-tight">
                  {title || 'ဘားကုဒ် စကင်ဖတ်ရန်'}
                </h3>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  {activeEngine === 'quagga' ? '1D TURBO' : 'MULTI-SCAN'}
                </span>
              </div>
              <span className="text-[10px] text-stone-400">
                EAN-13 • UPC • Code 128
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Multi-camera switch button */}
            {availableCameras.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                title="ကင်မရာမှန်ဘီလူးပြောင်းမည် (Switch Camera)"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

            {/* Flashlight button */}
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  torchOn
                    ? 'bg-amber-400 text-stone-900 shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="မီးလုံး အဖွင့်/အပိတ်"
              >
                {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Tips Toggle */}
            <button
              type="button"
              onClick={() => setShowTips(!showTips)}
              className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              title="အကြံပြုချက်"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Engine Switcher Bar */}
        <div className="px-3 py-1.5 bg-stone-900 border-b border-stone-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleToggleEngine('quagga')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                activeEngine === 'quagga'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>1D အမြန်စကင် (Quagga)</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleEngine('html5')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                activeEngine === 'html5'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>စုံစမ်းစကင် (Html5)</span>
            </button>
          </div>

          {/* Photo Snap Button */}
          <button
            type="button"
            disabled={isPhotoScanning}
            onClick={() => photoInputRef.current?.click()}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            title="ဖုန်းကင်မရာဖြင့် ဓာတ်ပုံရိုက်၍ စကင်ဖတ်မည်"
          >
            {isPhotoScanning ? (
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            ) : (
              <Upload className="w-3 h-3 text-amber-400" />
            )}
            <span>{isPhotoScanning ? 'ဖတ်နေသည်...' : 'ဓာတ်ပုံရိုက်မည်'}</span>
          </button>
        </div>

        {/* Tip Banner (Collapsible) */}
        {showTips && (
          <div className="bg-amber-950/70 px-4 py-2 border-b border-amber-800/80 text-amber-200 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>ဖုန်းနှင့် တက်ဘလက်များအတွက် အကြံပြုချက်:</span>
            </p>
            <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-amber-300/90">
              <li>ဖုန်းကို ဘားကုဒ်နှင့် <strong>၁၂ ~ ၂၀ စင်တီမီတာ (လက်တစ်ဝါးခန့်)</strong> ခွာထားပါ (နီးလွန်းပါက ဝါးသွားတတ်သည်)။</li>
              <li>ဗူးခုံး သို့မဟုတ် အရောင်ပြန်ပါက အပေါ်ရှိ <strong>"ဓာတ်ပုံရိုက်မည်"</strong> ခလုတ်ကို နှိပ်၍ ကြည်လင်ပြတ်သားစွာ ဖတ်နိုင်ပါသည်။</li>
              <li>သေးငယ်သော ဘားကုဒ်များအတွက် အောက်ရှိ <strong>1.5x / 2x Zoom</strong> ကို အသုံးပြုပါ။</li>
            </ul>
          </div>
        )}

        {/* Camera Viewport Area */}
        <div className="relative flex-1 sm:flex-none sm:aspect-square bg-black flex items-center justify-center overflow-hidden min-h-[260px] sm:min-h-[320px]">
          
          {/* Quagga Scanner Viewport Container */}
          <div
            ref={quaggaContainerRef}
            className={`w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>canvas]:hidden ${
              activeEngine === 'quagga' ? 'block' : 'hidden'
            }`}
          />

          {/* Html5Qrcode Scanner Viewport Container */}
          <div
            id={html5ContainerId}
            className={`w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover ${
              activeEngine === 'html5' ? 'block' : 'hidden'
            }`}
          />

          {/* Quick Hardware Zoom Control Bar */}
          {hasZoom && (
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-xs p-1 rounded-xl border border-white/20">
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
                className={`w-64 sm:w-72 h-28 relative transition-all duration-150 rounded-2xl overflow-hidden border-2 ${
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
                <div className="mt-2.5 text-center space-y-0.5">
                  <span className="px-3 py-1 rounded-full bg-black/75 text-white text-[11px] font-medium backdrop-blur-xs inline-block shadow-sm">
                    ဘားကုဒ်ကို မျဉ်းနီတန်းအလယ် တည့်တည့်ချိန်ပါ
                  </span>
                  <p className="text-[10px] text-stone-400">
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
                onClick={() => {
                  if (activeEngine === 'quagga') startQuagga();
                  else startHtml5Qrcode();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ထပ်မံကြိုးစားမည်</span>
              </button>
            </div>
          )}
        </div>

        {/* In-Modal Direct Search & Quick Add Section */}
        <div className="p-3 bg-stone-900 border-t border-stone-800 space-y-2">
          {/* Manual Input or Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = modalSearch.trim();
              if (val && onScan) {
                const res = onScan(val);
                playBarcodeBeep(res.success ? 'success' : 'error');
                if (res.success) {
                  setScanSuccessText(res.productName || val);
                  setModalSearch('');
                  setTimeout(() => setScanSuccessText(null), 1500);
                }
              }
            }}
            className="flex items-center gap-1.5"
          >
            <div className="relative flex-1">
              <div className="absolute left-2.5 top-2 text-stone-400 pointer-events-none">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="ဘားကုဒ် သို့မဟုတ် ပစ္စည်းအမည် ရိုက်ထည့်ရန်..."
                className="w-full text-xs pl-8 pr-7 py-2 rounded-xl border border-stone-700 bg-stone-800 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
              />
              {modalSearch && (
                <button
                  type="button"
                  onClick={() => setModalSearch('')}
                  className="absolute right-2 top-2 text-stone-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
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
                      addToCart(product, 1);
                      playBarcodeBeep('success');
                      setJustAddedModalId(product.id);
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
            <span className="text-[10px]">
              စကင်နာစက် (Gun) ဖြင့်လည်း တိုက်ရိုက်ပစ်ဖတ်နိုင်ပါသည်
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
