import { useState } from 'react';
import QRCode from 'react-qr-code';
import { QrScanner } from './QrScanner';

type Props = {
  studentName?: string;
  qrValue?: string;
  onScan?: (value: string) => void;
};

export function QrPanel({ studentName, qrValue, onScan }: Props) {
  const [scanMessage, setScanMessage] = useState('Scan a student QR code to verify entitlement.');

  const handleScanSuccess = (decodedText: string) => {
    setScanMessage(`Scanned Token: ${decodedText}`);
    onScan?.(decodedText);
  };

  return (
    <div className="glass-card space-y-4 rounded-2xl p-5">
      {/* Student QR Display Section */}
      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-5 text-center backdrop-blur-md">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Digital Student Pass QR
          </p>
        </div>

        <div className="mx-auto flex w-fit justify-center rounded-2xl bg-white p-4 shadow-xl border border-white/20">
          <QRCode value={qrValue ?? 'qr-student-001'} size={180} />
        </div>

        <p className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">
          {studentName ?? 'Asha Patel'}
        </p>
        <p className="mt-1 font-mono text-xs text-slate-400">
          Token: {qrValue ?? 'qr-student-001'}
        </p>
      </div>

      {/* QR Scanner Component */}
      <div className="pt-2">
        <p className="text-xs text-slate-400 mb-3 font-semibold">
          {scanMessage}
        </p>
        <QrScanner
          scannerId="qr-panel-reader"
          onScanSuccess={handleScanSuccess}
          defaultManualToken={qrValue ?? 'qr-student-001'}
        />
      </div>
    </div>
  );
}
