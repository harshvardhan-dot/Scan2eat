import { useState, useEffect } from 'react';
import { QrScanner } from './QrScanner';
import { issueLunchBox, returnLunchBox, scanQr, getDailyLunchBoxSummary } from '../lib/api';
import { useTranslation, Language } from '../lib/translations';

interface StaffPortalProps {
  user: { id?: string; name: string; role: string };
  isDark?: boolean;
  lang?: Language;
}

export function StaffPortal({ user, lang: propLang = 'en' }: StaffPortalProps) {
  const [scanResult, setScanResult] = useState<any>(null);
  const [status, setStatus] = useState('Ready to scan student QR pass');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const lang = propLang;
  const t = useTranslation(lang);

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
      if (typeof document !== 'undefined' && document.hidden) return;
      void fetchSummary();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyToken = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) return;

    setLoading(true);
    setStatus(`Verifying token ${tokenToVerify}...`);
    try {
      const result = await scanQr(tokenToVerify.trim(), 'lunch');
      setScanResult(result);
      if (result.status === 'not_opted_in' || result.isAttending === false) {
        setStatus(`⚠️ ${result.student?.name || 'Student'} has NOT clicked "Going to College" today. QR pass is INACTIVE!`);
      } else if (result.status === 'issued') {
        setStatus('Meal box already issued for this session');
      } else {
        setStatus('Student verified successfully');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error verifying student token. Ensure backend server is running.';
      setStatus(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!scanResult?.student?.id) return;
    if (scanResult.isAttending === false || scanResult.status === 'not_opted_in') {
      setStatus(`❌ Cannot issue meal box: ${scanResult.student.name} has NOT clicked "Going to College" today.`);
      return;
    }

    setLoading(true);
    setStatus('Issuing meal box...');
    try {
      const result = await issueLunchBox(scanResult.student.id, 'lunch', user.id ?? 'staff-1');
      setStatus(result.ok ? '✅ Meal box issued successfully' : result.message);
      setScanResult({ ...scanResult, status: result.ok ? 'issued' : scanResult.status });
      await fetchSummary();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to issue meal box';
      setStatus(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!scanResult?.student?.id) return;
    setLoading(true);
    setStatus('Recording meal box return...');
    try {
      const result = await returnLunchBox(scanResult.student.id, user.id ?? 'staff-1');
      setStatus(result.ok ? '✅ Meal box returned successfully' : result.message);
      setScanResult({ ...scanResult, status: result.ok ? 'returned' : scanResult.status });
      await fetchSummary();
    } catch {
      setStatus('Failed to record box return');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Operations Header */}
      <div className="card-super-glass rounded-[2.2rem] p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-md mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('messOperations')} • Live Issue Desk
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            🍱 Welcome back, {user.name}!
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('staffScannerDesc')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-slate-900/40 px-4 py-2 text-xs backdrop-blur-md">
            <span className="text-slate-400">{t('operator')}: </span>
            <span className="font-bold text-slate-100">{user.name}</span>
          </div>
        </div>
      </div>

      {/* Mess Daily Operations Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-super-glass rounded-[1.8rem] p-5">
          <p className="text-xs font-semibold text-slate-400">{t('targetBoxesToday')}</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{summary?.lunchBoxesToBeMade ?? 0}</p>
        </div>

        <div className="card-super-glass rounded-[1.8rem] p-5">
          <p className="text-xs font-semibold text-amber-400">{t('issuedToStudents')}</p>
          <p className="text-3xl font-extrabold text-amber-400 mt-1">{summary?.issuedCount ?? 0}</p>
        </div>

        <div className="card-super-glass rounded-[1.8rem] p-5">
          <p className="text-xs font-semibold text-emerald-400">{t('returnedBoxes')}</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1">{summary?.returnedCount ?? 0}</p>
        </div>

        <div className="card-super-glass rounded-[1.8rem] p-5">
          <p className="text-xs font-semibold text-rose-400">{t('pendingReturn')}</p>
          <p className="text-3xl font-extrabold text-rose-400 mt-1">{summary?.notReturnedCount ?? 0}</p>
        </div>
      </div>

      {/* Main Work Area: Scanner + Verification Result */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Scanner Column */}
        <div className="lg:col-span-7">
          <QrScanner
            scannerId="staff-issue-desk-scanner"
            onScanSuccess={handleVerifyToken}
            defaultManualToken="qr-student-001"
            lang={lang}
          />
        </div>

        {/* Verification Result Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-super-glass rounded-[2.2rem] p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              📋 {t('verificationResult')}
            </h3>

            <div className={`rounded-2xl border p-3.5 mb-4 backdrop-blur-md ${
              scanResult?.isAttending === false || scanResult?.status === 'not_opted_in'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                : 'bg-slate-950/40 border-white/10 text-emerald-400'
            }`}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('systemStatus')}</p>
              <p className={`mt-1 text-xs font-bold ${
                scanResult?.isAttending === false || scanResult?.status === 'not_opted_in'
                  ? 'text-rose-400'
                  : 'text-emerald-400'
              }`}>{status}</p>
            </div>

            {scanResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{scanResult.student?.name}</h4>
                    <p className="text-xs text-slate-400">{scanResult.student?.email}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    scanResult.isAttending === false || scanResult.status === 'not_opted_in'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : scanResult.status === 'issued'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {scanResult.isAttending === false || scanResult.status === 'not_opted_in'
                      ? 'Pass Inactive'
                      : scanResult.status ?? 'Verified'}
                  </span>
                </div>

                {(scanResult.isAttending === false || scanResult.status === 'not_opted_in') && (
                  <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
                    ⚠️ Student has NOT clicked "Going to College" in their portal today. QR pass is locked!
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-2xl bg-white/5 p-3 border border-white/10 backdrop-blur-md">
                    <p className="text-slate-400 font-medium">{t('room')}</p>
                    <p className="font-bold text-slate-100 mt-0.5">{scanResult.student?.roomNumber}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3 border border-white/10 backdrop-blur-md">
                    <p className="text-slate-400 font-medium">{t('rollNumber')}</p>
                    <p className="font-bold text-slate-100 mt-0.5">{scanResult.student?.rollNumber}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3 border border-white/10 backdrop-blur-md">
                    <p className="text-slate-400 font-medium">{t('dietPreference')}</p>
                    <p className="font-bold text-emerald-400 mt-0.5">{scanResult.student?.mealPreference ?? 'Veg'}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3 border border-white/10 backdrop-blur-md">
                    <p className="text-slate-400 font-medium">{t('currentSession')}</p>
                    <p className="font-bold text-indigo-400 mt-0.5">{scanResult.session?.type ?? 'Lunch'}</p>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleIssue}
                    disabled={loading || scanResult.isAttending === false || scanResult.status === 'not_opted_in'}
                    className="flex-1 btn-pill-dark text-xs py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    🍱 {t('issueLunchBox')}
                  </button>
                  <button
                    type="button"
                    onClick={handleReturn}
                    disabled={loading}
                    className="flex-1 rounded-full border border-white/15 bg-slate-800/60 py-3 text-xs font-bold text-slate-200 hover:bg-slate-700/60 backdrop-blur-md disabled:opacity-50 transition-all shadow-md"
                  >
                    🔄 {t('returnLunchBox')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-400">
                {t('noStudentScanned')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
