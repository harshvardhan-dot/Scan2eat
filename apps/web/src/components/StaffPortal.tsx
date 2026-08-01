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
      setStatus(result.status === 'issued' ? 'Meal box already issued for this session' : 'Student verified successfully');
    } catch (err) {
      setStatus('Error verifying student token. Ensure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!scanResult?.student?.id) return;
    setLoading(true);
    setStatus('Issuing meal box...');
    try {
      const result = await issueLunchBox(scanResult.student.id, 'lunch', user.id ?? 'staff-1');
      setStatus(result.ok ? '✅ Meal box issued successfully' : result.message);
      setScanResult({ ...scanResult, status: result.ok ? 'issued' : scanResult.status });
      await fetchSummary();
    } catch {
      setStatus('Failed to issue meal box');
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
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('messOperations')} • Live Issue Desk
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            🍱 Welcome back, {user.name}!
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('staffScannerDesc')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-950">
            <span className="text-slate-500 dark:text-slate-400">{t('operator')}: </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</span>
          </div>
        </div>
      </div>

      {/* Mess Daily Operations Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('targetBoxesToday')}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary?.lunchBoxesToBeMade ?? 0}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">{t('issuedToStudents')}</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{summary?.issuedCount ?? 0}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('returnedBoxes')}</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{summary?.returnedCount ?? 0}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{t('pendingReturn')}</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{summary?.notReturnedCount ?? 0}</p>
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
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              📋 {t('verificationResult')}
            </h3>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 mb-4 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('systemStatus')}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{status}</p>
            </div>

            {scanResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{scanResult.student?.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{scanResult.student?.email}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                    scanResult.status === 'issued'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/40'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/40'
                  }`}>
                    {scanResult.status ?? 'Verified'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-700/60">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{t('room')}</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{scanResult.student?.roomNumber}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-700/60">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{t('rollNumber')}</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{scanResult.student?.rollNumber}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-700/60">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{t('dietPreference')}</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{scanResult.student?.mealPreference ?? 'Veg'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-700/60">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{t('currentSession')}</p>
                    <p className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">{scanResult.session?.type ?? 'Lunch'}</p>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleIssue}
                    disabled={loading}
                    className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    🍱 {t('issueLunchBox')}
                  </button>
                  <button
                    type="button"
                    onClick={handleReturn}
                    disabled={loading}
                    className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    🔄 {t('returnLunchBox')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                {t('noStudentScanned')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
