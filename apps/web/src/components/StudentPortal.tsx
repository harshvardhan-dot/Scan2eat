import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { getStudentStatus, getWeeklyMenu, submitFoodReview, studentCheckIn, setMealOptIn } from '../lib/api';
import { useTranslation, type Language } from '../lib/translations';
import { IconCheck, IconCopy, IconQr, IconUtensils } from './Icons';

interface StudentPortalProps {
  user: { id?: string; name: string; email?: string; role: string };
  isDark?: boolean;
  lang?: Language;
}

interface MenuItem {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  mainDish: string;
  sideDishes: string[];
  dietaryTags: Array<'Veg' | 'Non-Veg' | 'Vegan'>;
  timing: string;
}

interface DayMenu {
  day: string;
  meals: MenuItem[];
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function StudentPortal({ user, lang = 'en' }: StudentPortalProps) {
  const t = useTranslation(lang);
  const [copied, setCopied] = useState(false);
  const [liveData, setLiveData] = useState<any>(null);
  const [weeklyMenu, setWeeklyMenu] = useState<DayMenu[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [checkInMsg, setCheckInMsg] = useState<string>('');
  const [confirmCheckInBox, setConfirmCheckInBox] = useState<boolean>(false);

  const [reviewForm, setReviewForm] = useState({
    taste: 5,
    quantity: 5,
    freshness: 5,
    temperature: 5,
    comment: ''
  });
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const studentId = user.id ?? 'student-1';

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await studentCheckIn(studentId, 'lunch');
      setIsCheckedIn(true);
      setCheckInMsg(res.message || 'Confirmed attending today. Your meal pass is now active.');
      await fetchStatus();
    } catch {
      setCheckInMsg('Failed to activate QR pass. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptOut = async () => {
    setLoading(true);
    try {
      await setMealOptIn(studentId, false);
      setIsCheckedIn(false);
      setConfirmCheckInBox(false);
      setCheckInMsg('Marked as NOT attending today. QR pass deactivated.');
      await fetchStatus();
    } catch {
      setCheckInMsg('Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: any) => {
    e.preventDefault();
    setReviewLoading(true);
    try {
      const overallRating = Number(((reviewForm.taste + reviewForm.quantity + reviewForm.freshness + reviewForm.temperature) / 4).toFixed(1));
      const res = await submitFoodReview(studentId, {
        rating: overallRating,
        taste: reviewForm.taste,
        quantity: reviewForm.quantity,
        freshness: reviewForm.freshness,
        temperature: reviewForm.temperature,
        comment: reviewForm.comment,
        returnCount: 1
      });
      setReviewMessage(res.message);
      setReviewForm({ taste: 5, quantity: 5, freshness: 5, temperature: 5, comment: '' });
    } catch {
      setReviewMessage('Failed to submit review.');
    } finally {
      setReviewLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const statusData = await getStudentStatus(studentId);
      setLiveData(statusData);
      if (statusData?.isAttending !== undefined) {
        setIsCheckedIn(Boolean(statusData.isAttending));
      }
    } catch (err) {
      console.error('Failed to load student status', err);
    }
  };

  const fetchMenu = async () => {
    try {
      const menuData = await getWeeklyMenu();
      setWeeklyMenu(menuData);
    } catch (err) {
      console.error('Failed to load weekly menu', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStatus(), fetchMenu()]);
      setLoading(false);
    };
    void init();

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void fetchStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, [studentId]);

  const handleCopyToken = () => {
    const token = liveData?.student?.qrToken ?? 'qr-student-001';
    void navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const student = liveData?.student ?? {
    name: user.name,
    rollNumber: 'CS2023-042',
    roomNumber: 'B-304',
    hostelBlock: 'Block-B',
    mealPreference: 'Veg',
    qrToken: 'qr-student-001'
  };

  const currentStatus = liveData?.lunchBoxStatus ?? 'none';
  const activeBox = liveData?.activeBox;
  const selectedMenu = weeklyMenu.find((m) => m.day === selectedDay) ?? weeklyMenu[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Student Profile Header */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Today's Status: Active Pass</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {student.name}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            Room <strong className="text-slate-900 dark:text-white">{student.roomNumber}</strong> • Roll <strong className="text-slate-900 dark:text-white">{student.rollNumber}</strong> • Diet <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{student.mealPreference}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyToken}
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors shadow-xs"
          >
            <IconCopy className="w-4 h-4 text-slate-500" />
            <span>{copied ? t('tokenCopied') : t('copyToken')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: QR Pass + Status/Review */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* QR Code Pass Card */}
        <div className="lg:col-span-5">
          {!isCheckedIn ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-xs text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center">
                <IconQr className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Attending Mess Today?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Your digital QR pass is currently locked. Please confirm your mess attendance today to activate your QR pass.
                </p>
              </div>

              {checkInMsg && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 p-3 text-xs text-amber-800 dark:text-amber-200">
                  {checkInMsg}
                </div>
              )}

              <label className="flex items-start gap-2.5 text-left cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={confirmCheckInBox}
                  onChange={(e) => setConfirmCheckInBox(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>I confirm I am attending the mess today and request my digital meal pass.</span>
              </label>

              <button
                type="button"
                onClick={handleCheckIn}
                disabled={!confirmCheckInBox || loading}
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
              >
                Activate Digital Meal Pass
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-xs text-center space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                <span>Today's Meal Pass</span>
                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Active Pass
                </span>
              </div>

              <div className="mx-auto flex w-fit justify-center rounded-lg bg-white p-4 border border-slate-200 shadow-xs">
                <QRCode value={student.qrToken ?? 'qr-student-001'} size={180} />
              </div>

              <h4 className="pt-1 text-sm font-bold text-slate-900 dark:text-white">{student.name}</h4>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Token: {student.qrToken}</p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOptOut}
                  disabled={loading}
                  className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 underline transition-colors"
                >
                  Not attending today? (Deactivate Pass)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Box Status & Food Review */}
        <div className="lg:col-span-7 space-y-6">
          {/* Meal Status Banner */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <IconUtensils className="w-4 h-4 text-emerald-600" />
                Real-time Meal Box Status
              </h3>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded border ${
                currentStatus === 'issued'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  : currentStatus === 'returned'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
              }`}>
                {currentStatus === 'issued' ? 'Box Issued' : currentStatus === 'returned' ? 'Box Returned' : 'Ready for Pickup'}
              </span>
            </div>

            {currentStatus === 'issued' ? (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-bold">{t('activeBoxNotice')}</p>
                <p className="mt-1">{t('issuedAtLabel')} {activeBox?.issuedAt ? new Date(activeBox.issuedAt).toLocaleTimeString() : 'Just now'}</p>
                <p className="mt-1 text-amber-700 dark:text-amber-300">
                  {t('returnNotice')}
                </p>
              </div>
            ) : currentStatus === 'returned' ? (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 text-xs text-emerald-900 dark:text-emerald-200">
                <p className="font-bold">{t('returnedNotice')}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t('showQrNotice')}
              </p>
            )}
          </div>

          {/* Food Quality Review Form */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              {t('rateFoodQuality')}
            </h3>

            {reviewMessage && (
              <div className="mb-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <IconCheck className="w-4 h-4 text-emerald-600" />
                <span>{reviewMessage}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('tasteRating')}</label>
                  <select
                    value={reviewForm.taste}
                    onChange={(e) => setReviewForm({ ...reviewForm, taste: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Average</option>
                    <option value={2}>2 - Below Average</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('quantityRating')}</label>
                  <select
                    value={reviewForm.quantity}
                    onChange={(e) => setReviewForm({ ...reviewForm, quantity: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value={5}>5 - Sufficient</option>
                    <option value={4}>4 - Adequate</option>
                    <option value={3}>3 - Less</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('commentLabel')}</label>
                <input
                  type="text"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder={t('shareFeedbackPlaceholder')}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={reviewLoading}
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
              >
                {t('submitFeedback')}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Weekly Mess Menu */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('weeklyMenuSchedule')}</h3>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Week</span>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar border-b border-slate-200 dark:border-slate-700">
          {DAYS_OF_WEEK.map((day) => {
            const isActive = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {selectedMenu?.meals.map((meal, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {meal.mealType}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">{meal.timing}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{meal.mainDish}</h4>
              {meal.sideDishes?.length > 0 && (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Sides: {meal.sideDishes.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
