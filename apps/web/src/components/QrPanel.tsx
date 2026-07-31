import { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from 'html5-qrcode';

type Props = {
  studentName?: string;
  qrValue?: string;
  onScan?: (value: string) => void;
};

export function QrPanel({ studentName, qrValue, onScan }: Props) {
  const [scannerReady, setScannerReady] = useState(false);
  const [scanMessage, setScanMessage] = useState('Scan a student QR code to verify the student.');
  const scannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scanner.render(
      (decodedText) => {
        setScanMessage(`Scanned: ${decodedText}`);
        onScan?.(decodedText);
        scanner.clear();
      },
      () => {
        setScanMessage('Unable to read the QR code yet. Please hold the code steady.');
      }
    );

    setScannerReady(true);

    return () => {
      scanner.clear().catch(() => undefined);
    };
  }, [onScan]);

  return (
    <div className="space-y-4 rounded-3xl border border-slate-700 bg-slate-900/70 p-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Student QR</p>
        <div className="mt-3 flex justify-center rounded-2xl bg-white p-3">
          <QRCode value={qrValue ?? 'qr-student-001'} size={180} />
        </div>
        <p className="mt-3 text-sm font-semibold text-white">{studentName ?? 'Asha Patel'}</p>
        <p className="mt-1 text-xs text-slate-300">Secure, opaque student token</p>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
        <p className="text-sm font-semibold text-white">Live scanner</p>
        <p className="mt-2 text-sm text-slate-300">{scanMessage}</p>
        <div id="qr-reader" ref={scannerRef} className="mt-3 rounded-2xl bg-slate-950 p-3" />
        {!scannerReady ? <p className="mt-2 text-xs text-violet-400">Preparing camera…</p> : null}
      </div>
    </div>
  );
}
