import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation, Language } from '../lib/translations';

export function parseQrToken(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null) {
      cleaned = parsed.qrToken || parsed.token || parsed.studentId || parsed.id || cleaned;
    }
  } catch {}
  if (cleaned.includes('://')) {
    try {
      const url = new URL(cleaned);
      const token = url.searchParams.get('qrToken') || url.searchParams.get('token') || url.pathname.split('/').filter(Boolean).pop();
      if (token) cleaned = token;
    } catch {}
  }
  return cleaned;
}

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMsg: string) => void;
  scannerId?: string;
  defaultManualToken?: string;
  lang?: Language;
}

export function QrScanner({
  onScanSuccess,
  onScanError,
  scannerId = 'custom-qr-scanner',
  defaultManualToken = 'qr-student-001',
  lang = 'en'
}: QrScannerProps) {
  const t = useTranslation(lang);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [manualToken, setManualToken] = useState(defaultManualToken);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileSuccess, setFileSuccess] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const lastScanTimeRef = useRef<number>(0);
  const startPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize camera list
  useEffect(() => {
    isMountedRef.current = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (isMountedRef.current && devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          if (backCam) {
            setSelectedCameraId(backCam.id);
          } else if (devices[0]?.id) {
            setSelectedCameraId(devices[0].id);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not enumerate cameras:', err);
      });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const stopScanner = async () => {
    // If a start action is currently in progress, wait for it to settle first
    if (startPromiseRef.current) {
      try {
        await startPromiseRef.current;
      } catch {
        // ignore start failures
      }
    }

    if (html5QrcodeRef.current) {
      try {
        const state = html5QrcodeRef.current.getState();
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3 || html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        html5QrcodeRef.current.clear();
      } catch (err) {
        console.warn('Scanner stop/clear warning:', err);
      } finally {
        html5QrcodeRef.current = null;
        if (isMountedRef.current) {
          setIsScanning(false);
        }
      }
    }
  };

  // Handle live camera lifecycle
  useEffect(() => {
    if (activeTab !== 'camera') {
      void stopScanner();
      return;
    }

    let isSubscribed = true;

    const startScanner = async () => {
      setCameraError(null);
      setIsScanning(false);

      await stopScanner();

      if (!isSubscribed) return;

      const element = document.getElementById(scannerId);
      if (!element) return;

      try {
        const scannerInstance = new Html5Qrcode(scannerId);
        html5QrcodeRef.current = scannerInstance;

        const config = {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        };

        const cameraConfig = selectedCameraId
          ? selectedCameraId
          : { facingMode: 'environment' };

        const startPromise = scannerInstance.start(
          cameraConfig,
          config,
          (rawDecodedText) => {
            if (!isSubscribed || !isMountedRef.current) return;
            const now = Date.now();
            if (now - lastScanTimeRef.current < 2000) return;
            lastScanTimeRef.current = now;

            const normalizedToken = parseQrToken(rawDecodedText);
            setLastScanned(normalizedToken);
            onScanSuccess(normalizedToken);
          },
          () => {
            // Frame scan failure - safe to ignore
          }
        );

        startPromiseRef.current = startPromise as Promise<any>;
        await startPromise;

        if (isSubscribed) {
          setIsScanning(true);
        } else {
          void stopScanner();
        }
      } catch (err: any) {
        console.error('Camera scan start error:', err);
        if (isSubscribed) {
          setIsScanning(false);
          const msg = err?.message || (typeof err === 'string' ? String(err) : 'Camera access denied or unavailable.');
          setCameraError(msg);
          onScanError?.(msg);
        }
      } finally {
        startPromiseRef.current = null;
      }
    };

    void startScanner();

    return () => {
      isSubscribed = false;
      void stopScanner();
    };
  }, [activeTab, selectedCameraId, scannerId]);

  // Handle File Upload Scan
  const handleFileUpload = async (file: File) => {
    setFileError(null);
    setFileSuccess(null);

    if (!file) return;

    try {
      const tempContainerId = `temp-file-scanner-${scannerId}`;
      const tempScanner = new Html5Qrcode(tempContainerId, false);
      const result = await tempScanner.scanFileV2(file, false);
      try {
        tempScanner.clear();
      } catch {}

      if (result && result.decodedText) {
        const normalizedToken = parseQrToken(result.decodedText);
        setFileSuccess(`Scanned: ${normalizedToken}`);
        setLastScanned(normalizedToken);
        onScanSuccess(normalizedToken);
      } else {
        setFileError('No QR code found in the image.');
      }
    } catch (err: any) {
      console.error('File scan error:', err);
      setFileError('Failed to read QR code from image. Please ensure the image is clear and contains a valid QR code.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = parseQrToken(manualToken);
    if (!token) return;
    setLastScanned(token);
    onScanSuccess(token);
  };

  return (
    <div className="card-super-glass rounded-[2.2rem] p-6 space-y-4">
      {/* Off-screen container for file scanning */}
      <div
        id={`temp-file-scanner-${scannerId}`}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '1px', height: '1px', overflow: 'hidden' }}
      />

      {/* Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('qrScannerTitle')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('qrScannerDesc')}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {t('tabLiveCamera')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {t('tabUploadImage')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {t('tabManualToken')}
          </button>
        </div>
      </div>

      {/* Tab 1: Live Camera Feed */}
      {activeTab === 'camera' && (
        <div className="mt-4 space-y-3">
          {cameras.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('selectCamera')}</label>
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="text-xs rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${c.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {cameraError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
              <p className="text-sm font-semibold flex items-center gap-2">
                ⚠️ Camera Access Notice
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{cameraError}</p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[260px]">
              <div id={scannerId} className="w-full max-w-sm rounded-lg overflow-hidden" />

              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 p-4 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-2" />
                  <p className="text-xs font-medium text-slate-300">Initializing camera feed...</p>
                </div>
              )}

              {/* Viewfinder overlay graphics */}
              {isScanning && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-52 h-52 border-2 border-dashed border-emerald-400/80 rounded-xl relative shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Upload Image File */}
      {activeTab === 'upload' && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mb-3">
              📁
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {t('uploadQrPrompt')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('uploadQrSupport')}
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileUpload(file);
              }}
              className="mt-4 inline-block text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-700 dark:text-slate-300"
            />
          </div>

          {fileError && (
            <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
              ❌ {fileError}
            </div>
          )}

          {fileSuccess && (
            <div className="rounded-md bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
              ✅ {fileSuccess}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Manual Token Input & Instant Simulator */}
      {activeTab === 'manual' && (
        <div className="mt-4 space-y-4">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Enter QR token (e.g. qr-student-001)"
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              {t('verifyTokenBtn')}
            </button>
          </form>

          {/* Quick Mock Tokens Selector for Mess Staff Testing */}
          <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('quickTestTokens')}
            </p>
            <div className="flex flex-wrap gap-2">
              {['qr-student-001', 'qr-student-002', 'qr-student-003'].map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => {
                    setManualToken(token);
                    setLastScanned(token);
                    onScanSuccess(token);
                  }}
                  className="rounded-md bg-white px-2.5 py-1 text-xs font-mono text-slate-700 border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:border-emerald-400 dark:hover:text-emerald-300 transition-colors shadow-xs"
                >
                  {token}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scanned Result Banner */}
      {lastScanned && (
        <div className="mt-3 flex items-center justify-between rounded-md bg-slate-100 px-3 py-2 text-xs dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-slate-600 dark:text-slate-400">
            {t('lastScannedToken')} <strong className="font-mono text-emerald-600 dark:text-emerald-400">{lastScanned}</strong>
          </span>
          <button
            type="button"
            onClick={() => setLastScanned(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

