import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { issueLunchBox, returnLunchBox, scanQr, getDailyLunchBoxSummary } from '../lib/api';
import { useTranslation, Language } from '../lib/translations';

interface StaffPortalProps {
  user: { id?: string; name: string; role: string };
  isDark: boolean;
}

export function StaffPortal({ user, isDark }: StaffPortalProps) {
  const [manualToken, setManualToken] = useState('qr-student-001');
  const [scanResult, setScanResult] = useState<any>(null);
  const [status, setStatus] = useState('Ready to scan student QR code');
  const [loading, setLoading] = useState(false);
  const [scannerMessage, setScannerMessage] = useState('Position the student QR code inside the viewfinder camera box.');
  const [summary, setSummary] = useState<any>(null);
  const [lang, setLang] = useState<Language>('en');
  const t = useTranslation(lang);

  const scannerRef = useRef<HTMLDivElement | null>(null);

  const fetchSummary = async () => {
    try {
      const data = await getDailyLunchBoxSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load daily lunchbox summary for staff', err);
    }
  };

  useEffect(() => {
    void fetchSummary();
    const interval = setInterval(() => {
      void fetchSummary();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!scannerRef.current) return;

    const scanner = new Html5QrcodeScanner('staff-qr-reader', { fps: 10, qrbox: { width: 220, height: 220 } }, false);
    
    scanner.render(
      async (decodedText) => {
        setScannerMessage(`Scanned QR: ${decodedText}`);
        await handleVerifyToken(decodedText);
      },
      () => {
        setScannerMessage('Waiting for QR code frame...');
      }
    );

    return () => {
      scanner.clear().catch(() => undefined);
    };
  }, []);

  const handleVerifyToken = async (tokenToVerify?: string) => {
    const token = tokenToVerify ?? manualToken;
    if (!token.trim()) return;

    setLoading(true);
    setStatus(`Verifying token ${token}...`);
    try {
      const result = await scanQr(token.trim(), 'lunch');
      setScanResult(result);
      setStatus(result.status === 'issued' ? 'Meal box already issued' : 'Student verified successfully');
    } catch (err) {
      setStatus('Error verifying student token. Ensure backend server is active.');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!scanResult?.student?.id) return;
    setLoading(true);
    setStatus('Issuing lunch box...');
    try {
      const result = await issueLunchBox(scanResult.student.id, 'lunch', user.id ?? 'staff-1');
      setStatus(result.ok ? '✅ Lunch box issued successfully' : result.message);
      setScanResult({ ...scanResult, status: result.ok ? 'issued' : scanResult.status });
      await fetchSummary();
    } catch {
      setStatus('Failed to issue lunch box');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!scanResult?.student?.id) return;
    setLoading(true);
    setStatus('Recording lunch box return...');
    try {
      const result = await returnLunchBox(scanResult.student.id, user.id ?? 'staff-1');
      setStatus(result.ok ? '✅ Lunch box returned successfully' : result.message);
      setScanResult({ ...scanResult, status: result.ok ? 'returned' : scanResult.status });
      await fetchSummary();
    } catch {
      setStatus('Failed to return lunch box');
    } finally {
      setLoading(false);
    }
  };

  const cardClass = isDark ? 'border-slate-700 bg-slate-900/70 text-slate-100' : 'border-violet-200 bg-white text-slate-900 shadow-md';
  const panelClass = isDark ? 'border-slate-700 bg-slate-900/60' : 'border-violet-200 bg-slate-50/80';
  const mutedText = isDark ? 'text-slate-300' : 'text-violet-400';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className={`rounded-3xl border p-6 backdrop-blur ${panelClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400 border border-emerald-500/20">
              {t('messOperations')}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{t('staffScannerTitle')}</h1>
            <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
              {t('staffScannerDesc')}
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="rounded-full border border-slate-600 bg-slate-900/80 px-4 py-1.5 text-sm font-medium text-emerald-400 hover:bg-slate-800 transition"
            >
              {lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
            </button>
            <div className="rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm">
              <span className="text-xs uppercase tracking-wider text-slate-300">{t('operator')} </span>
              <span className="font-semibold text-emerald-400">{user.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mess Staff Daily Production & Forecast Counter */}
      <div className={`rounded-3xl border p-6 ${cardClass} bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2 text-emerald-400">
              <span>🍲</span> Mess Staff Daily Food Production Forecast
            </h2>
            <p className={`text-xs ${mutedText} mt-0.5`}>
              Live meal box target to be prepared today based on resident student check-ins.
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 text-xs font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-time Forecast
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Target Boxes To Make Today</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1">{summary?.lunchBoxesToBeMade ?? 0}</p>
            <p className="text-[10px] text-emerald-200/80 mt-1">Based on student check-ins</p>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Issued to Students</p>
            <p className="text-3xl font-extrabold text-amber-400 mt-1">{summary?.issuedCount ?? 0}</p>
            <p className="text-[10px] text-amber-200/80 mt-1">Handed over at counter</p>
          </div>

          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">Returned Boxes</p>
            <p className="text-3xl font-extrabold text-cyan-400 mt-1">{summary?.returnedCount ?? 0}</p>
            <p className="text-[10px] text-cyan-200/80 mt-1">Returned & washed</p>
          </div>

          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-300">Currently Not Returned</p>
            <p className="text-3xl font-extrabold text-rose-400 mt-1">{summary?.notReturnedCount ?? 0}</p>
            <p className="text-[10px] text-rose-200/80 mt-1">Still with students</p>
          </div>
        </div>
      </div>

      {/* Main Work Area */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Scanner Panel */}
        <div className={`rounded-3xl border p-6 ${cardClass}`}>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
            <span>📷</span> {t('liveQrViewfinder')}
          </h2>
          <p className={`text-xs ${mutedText} mb-4`}>{scannerMessage}</p>

          <div id="staff-qr-reader" ref={scannerRef} className="overflow-hidden rounded-2xl bg-slate-950 p-3 border border-slate-700" />

          <div className="mt-6 pt-4 border-t border-slate-700/70">
            <p className="text-xs uppercase font-semibold tracking-wider text-slate-300 mb-2">{t('manualTokenVerification')}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="e.g. qr-student-001"
                className={`flex-1 rounded-2xl border px-3.5 py-2.5 text-sm outline-none ${
                  isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
              />
              <button
                onClick={() => handleVerifyToken()}
                disabled={loading}
                className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition disabled:opacity-50"
              >
                {t('verifyToken')}
              </button>
            </div>
          </div>
        </div>

        {/* Verification & Action Panel */}
        <div className="space-y-6">
          <div className={`rounded-3xl border p-6 ${cardClass}`}>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span>📋</span> {t('verificationResult')}
            </h2>

            <div className={`rounded-2xl border p-4 mb-4 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-violet-200 bg-slate-50'}`}>
              <p className="text-xs uppercase tracking-wider text-slate-300">{t('systemStatus')}</p>
              <p className="mt-1 text-sm font-semibold text-emerald-400">{status}</p>
            </div>

            {scanResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div>
                    <h3 className="text-xl font-bold">{scanResult.student?.name}</h3>
                    <p className={`text-xs ${mutedText}`}>{scanResult.student?.email}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                    scanResult.status === 'issued' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {scanResult.status ?? 'Verified'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className={`rounded-2xl border p-3 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-violet-200 bg-slate-100'}`}>
                    <p className={`text-xs ${mutedText}`}>{t('room')}</p>
                    <p className="font-semibold mt-0.5">{scanResult.student?.roomNumber}</p>
                  </div>
                  <div className={`rounded-2xl border p-3 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-violet-200 bg-slate-100'}`}>
                    <p className={`text-xs ${mutedText}`}>{t('rollNumber')}</p>
                    <p className="font-semibold mt-0.5">{scanResult.student?.rollNumber}</p>
                  </div>
                  <div className={`rounded-2xl border p-3 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-violet-200 bg-slate-100'}`}>
                    <p className={`text-xs ${mutedText}`}>{t('dietPreference')}</p>
                    <p className="font-semibold text-cyan-400 mt-0.5">{scanResult.student?.mealPreference ?? 'Veg'}</p>
                  </div>
                  <div className={`rounded-2xl border p-3 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-violet-200 bg-slate-100'}`}>
                    <p className={`text-xs ${mutedText}`}>{t('currentSession')}</p>
                    <p className="font-semibold text-emerald-400 mt-0.5">{scanResult.session?.type ?? 'Lunch'}</p>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={handleIssue}
                    disabled={loading}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:scale-[1.01] transition disabled:opacity-50"
                  >
                    🍱 {t('issueLunchBox')}
                  </button>
                  <button
                    onClick={handleReturn}
                    disabled={loading}
                    className="flex-1 rounded-2xl border border-slate-600 bg-slate-800 py-3 text-sm font-bold text-white hover:bg-slate-700 transition disabled:opacity-50"
                  >
                    🔄 {t('returnLunchBox')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-300">
                {t('noStudentScanned')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
