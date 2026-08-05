import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { getStudentStatus, getWeeklyMenu, submitFoodReview, studentCheckIn, setMealOptIn } from '../lib/api';
import { useTranslation, type Language } from '../lib/translations';

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
      setCheckInMsg(res.message || '✅ Confirmed going to college! Your QR Pass is now active.');
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
      setCheckInMsg('Marked as NOT going to college today. QR pass deactivated.');
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Student Profile Header matching reference layout */}
      <div className="card-super-glass rounded-[2.2rem] p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Today's status</span>
            <span className="ml-auto font-bold text-slate-900 dark:text-white bg-white/60 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-white/20">100% Verified</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {student.name}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            Room <strong className="text-slate-900 dark:text-white">{student.roomNumber}</strong> • Roll <strong className="text-slate-900 dark:text-white">{student.rollNumber}</strong> • Diet <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{student.mealPreference}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyToken}
            className="btn-pill-dark text-xs py-3 px-5"
          >
            ⏱️ {copied ? t('tokenCopied') : t('copyToken')}
          </button>
        </div>
      </div>

      {/* Main Grid: QR Pass + Status/Review */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* QR Code Pass Card */}
        <div className="lg:col-span-5">
          {!isCheckedIn ? (
            <div className="card-super-glass rounded-[2.2rem] p-6 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center text-2xl shadow-lg">
                🎓
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Going to College Today?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your meal QR Pass is currently <strong>locked</strong>. Please confirm that you are going to college / attending mess today to activate your QR pass.
              </p>

              {checkInMsg && (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300 backdrop-blur-md">
                  {checkInMsg}
                </div>
              )}

              <label className="flex items-start gap-2 text-left cursor-pointer rounded-2xl border border-white/10 bg-slate-900/40 p-3.5 text-xs text-slate-300 backdrop-blur-md hover:border-emerald-500/40 transition">
                <input
                  type="checkbox"
                  checked={confirmCheckInBox}
                  onChange={(e) => setConfirmCheckInBox(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                />
                <span>I confirm I am going to college today and request my mess meal pass.</span>
              </label>

              <button
                type="button"
                onClick={handleCheckIn}
                disabled={!confirmCheckInBox || loading}
                className="w-full btn-pill-dark text-xs py-3 disabled:opacity-50"
              >
                🎓 I am Going to College — Activate QR Pass
              </button>
            </div>
          ) : (
            <div className="card-super-glass rounded-[2.2rem] p-6 text-center space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">
                <span>Today's Pass</span>
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-0.5 rounded-full border border-emerald-500/20 font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Going to College • Active Pass
                </span>
              </div>

              <div className="mx-auto flex w-fit justify-center rounded-[1.8rem] bg-white p-5 shadow-2xl border border-white/30">
                <QRCode value={student.qrToken ?? 'qr-student-001'} size={190} />
              </div>

              <h4 className="pt-2 text-base font-extrabold text-slate-900 dark:text-white">{student.name}</h4>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Token: {student.qrToken}</p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOptOut}
                  disabled={loading}
                  className="text-xs text-slate-400 hover:text-rose-400 underline transition"
                >
                  Not going to college today? (Deactivate Pass)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Box Status & Food Review */}
        <div className="lg:col-span-7 space-y-6">
          {/* Meal Status Banner */}
          <div className="card-super-glass rounded-[2.2rem] p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                ⚡ Real-time Meal Box Status
              </h3>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                currentStatus === 'issued'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-md'
                  : currentStatus === 'returned'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-md'
                  : 'bg-sky-500/10 text-sky-500 border-sky-500/20 shadow-md'
              }`}>
                {currentStatus === 'issued' ? '🍱 Box Issued' : currentStatus === 'returned' ? '🔄 Box Returned' : '⏳ Ready for Pickup'}
              </span>
            </div>

            {currentStatus === 'issued' ? (
              <div className="rounded-2xl bg-amber-500/10 p-3.5 text-xs text-amber-200 border border-amber-500/20 backdrop-blur-md">
                <p className="font-bold">{t('activeBoxNotice')}</p>
                <p className="mt-1">{t('issuedAtLabel')} {activeBox?.issuedAt ? new Date(activeBox.issuedAt).toLocaleTimeString() : 'Just now'}</p>
                <p className="mt-2 text-[11px] text-amber-300">
                  {t('returnNotice')}
                </p>
              </div>
            ) : currentStatus === 'returned' ? (
              <div className="rounded-2xl bg-emerald-500/10 p-3.5 text-xs text-emerald-200 border border-emerald-500/20 backdrop-blur-md">
                <p className="font-bold">{t('returnedNotice')}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('showQrNotice')}
              </p>
            )}
          </div>

          {/* Food Quality Review Form */}
          <div className="card-super-glass rounded-[2.2rem] p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              {t('rateFoodQuality')}
            </h3>

            {reviewMessage && (
              <div className="mb-3 rounded-2xl bg-emerald-500/10 p-3 text-xs text-emerald-300 border border-emerald-500/20 backdrop-blur-md">
                ✅ {reviewMessage}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{t('tasteRating')}</label>
                  <select
                    value={reviewForm.taste}
                    onChange={(e) => setReviewForm({ ...reviewForm, taste: Number(e.target.value) })}
                    className="w-full rounded-2xl glass-input px-3 py-2 text-xs"
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
                    className="w-full rounded-2xl glass-input px-3 py-2 text-xs"
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
                  className="w-full rounded-2xl glass-input px-3.5 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={reviewLoading}
                className="w-full btn-pill-dark text-xs py-3 disabled:opacity-50"
              >
                {t('submitFeedback')}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Weekly Mess Menu with Reference M T W T F S S Calendar Strip */}
      <div className="card-super-glass rounded-[2.2rem] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t('weeklyMenuSchedule')}</h3>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Aug 2-8</span>
        </div>

        {/* Reference M T W T F S S Day Pill Selector */}
        <div className="calendar-day-strip my-2">
          {DAYS_OF_WEEK.map((day) => {
            const shortChar = day.charAt(0);
            const isActive = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`calendar-day-item ${isActive ? 'active' : ''}`}
                title={day}
              >
                {shortChar}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {selectedMenu?.meals.map((meal, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-4 transition-all hover:border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  {meal.mealType}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{meal.timing}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{meal.mainDish}</h4>
              {meal.sideDishes?.length > 0 && (
                <p className="mt-1 text-xs text-slate-400">
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
