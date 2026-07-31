import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { getStudentStatus, getWeeklyMenu, getStudentVanDrivers, submitFoodReview, returnSecondLunchBox, studentCheckIn, submitComplaint, getStudentComplaints } from '../lib/api';

interface StudentPortalProps {
  user: { id?: string; name: string; email?: string; role: string };
  isDark: boolean;
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

export function StudentPortal({ user, isDark }: StudentPortalProps) {
  const [copied, setCopied] = useState(false);
  const [liveData, setLiveData] = useState<any>(null);
  const [weeklyMenu, setWeeklyMenu] = useState<DayMenu[]>([]);
  const [vanDrivers, setVanDrivers] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(true);
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
      setCheckInMsg(res.message);
      await fetchStatus();
    } catch {
      setCheckInMsg('Check-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSecondReturn = async () => {
    setReviewLoading(true);
    try {
      const res = await returnSecondLunchBox(studentId);
      setReviewMessage(res.message);
      await fetchStatus();
    } catch {
      setReviewMessage('Failed to record 2nd time lunch box return.');
    } finally {
      setReviewLoading(false);
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
      const data = await getStudentStatus(studentId);
      setLiveData(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch live student status', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuAndDrivers = async () => {
    try {
      const [menu, drivers] = await Promise.all([
        getWeeklyMenu(),
        getStudentVanDrivers()
      ]);
      if (menu) setWeeklyMenu(menu);
      if (drivers) setVanDrivers(drivers);
    } catch (err) {
      console.error('Failed to fetch menu or drivers', err);
    }
  };

  const [complaintForm, setComplaintForm] = useState({
    category: 'Food Quality',
    subject: '',
    description: '',
    urgency: 'Normal'
  });
  const [complaintMsg, setComplaintMsg] = useState('');
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [studentComplaints, setStudentComplaintsList] = useState<any[]>([]);

  const fetchComplaints = async () => {
    try {
      const list = await getStudentComplaints(studentId);
      if (list) setStudentComplaintsList(list);
    } catch (e) {
      console.error('Failed to fetch student complaints', e);
    }
  };

  const handleComplaintSubmit = async (e: any) => {
    e.preventDefault();
    if (!complaintForm.subject || !complaintForm.description) {
      setComplaintMsg('Please fill in subject and description.');
      return;
    }
    setComplaintLoading(true);
    try {
      const res = await submitComplaint({
        studentId,
        studentName: student.name,
        roomNumber: student.roomNumber,
        category: complaintForm.category,
        subject: complaintForm.subject,
        description: complaintForm.description,
        urgency: complaintForm.urgency
      });
      setComplaintMsg(res.message || 'Complaint submitted to Warden successfully!');
      setComplaintForm({ category: 'Food Quality', subject: '', description: '', urgency: 'Normal' });
      await fetchComplaints();
    } catch {
      setComplaintMsg('Failed to submit complaint. Please try again.');
    } finally {
      setComplaintLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
    void fetchMenuAndDrivers();
    void fetchComplaints();

    // Auto-poll status & complaints every 2 seconds for real-time warden sync
    const interval = setInterval(() => {
      void fetchStatus();
      void fetchComplaints();
    }, 2000);

    return () => clearInterval(interval);
  }, [studentId]);

  const student = liveData?.student ?? {
    name: user.name ?? 'Asha Patel',
    email: user.email ?? 'student@example.com',
    roomNumber: 'B-204',
    rollNumber: 'R-101',
    mealPreference: 'Veg',
    qrToken: 'qr-student-001'
  };

  const currentStatus = liveData?.status ?? 'pending';
  const activeBox = liveData?.activeLunchBox;
  const latestBox = liveData?.latestLunchBox;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(student.qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentDayMenu = weeklyMenu.find((m) => m.day.toLowerCase() === selectedDay.toLowerCase()) ?? weeklyMenu[0];

  const cardClass = isDark
    ? 'border-slate-700 bg-slate-900/70 text-slate-100'
    : 'border-violet-200 bg-white text-slate-900 shadow-md';

  const panelClass = isDark
    ? 'border-slate-700 bg-slate-900/60'
    : 'border-violet-200 bg-slate-50/80';

  const mutedText = isDark ? 'text-slate-400' : 'text-slate-600';
  const headText = isDark ? 'text-white' : 'text-slate-900';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className={`rounded-3xl border p-6 backdrop-blur ${panelClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400 border border-cyan-500/20">
              Live Student Pass
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Digital QR Pass & Mess Menu</h1>
            <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
              Present your QR pass at the mess counter and view the complete weekly menu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                void fetchStatus();
                void fetchMenuAndDrivers();
              }}
              className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                isDark ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              🔄 Refresh {lastUpdated ? `(${lastUpdated})` : ''}
            </button>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-emerald-400 text-sm font-semibold flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync Active
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
        {/* QR Code Card (Gated by Check-in) */}
        {!isCheckedIn ? (
          <div className={`rounded-3xl border p-6 text-center flex flex-col items-center justify-center ${cardClass} bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950`}>
            <div className="rounded-full bg-amber-500/20 text-amber-300 p-4 border border-amber-500/30 mb-3 animate-pulse">
              <span className="text-3xl">⏰</span>
            </div>
            <h2 className="text-xl font-bold text-amber-300">Check-in Required for Lunch QR Pass</h2>
            <p className={`mt-2 text-xs leading-relaxed max-w-xs ${mutedText}`}>
              Standard hostel check-in time cutoff: <strong>11:30 AM</strong>.
              <br />
              Checking in confirms your meal attendance so mess staff can allocate and issue your fresh lunch box today.
            </p>

            {checkInMsg && (
              <div className="mt-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 p-2.5 text-xs text-emerald-300 font-semibold">
                {checkInMsg}
              </div>
            )}

            <label className="mt-4 flex items-start gap-2.5 text-left cursor-pointer rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <input
                type="checkbox"
                checked={confirmCheckInBox}
                onChange={(e) => setConfirmCheckInBox(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-500 text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
              />
              <span className="font-semibold leading-tight">
                I confirm I am present in the hostel & request my fresh meal lunch box today.
              </span>
            </label>

            <button
              onClick={handleCheckIn}
              disabled={loading || !confirmCheckInBox}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {confirmCheckInBox ? "👉 Generate & Issue My QR Pass Now" : "🔒 Check the box above to generate QR Pass"}
            </button>
          </div>
        ) : (
          <div className={`rounded-3xl border p-6 text-center flex flex-col items-center justify-center ${cardClass}`}>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              QR Pass Issued & Active
            </div>
            
            <div className="mt-2 rounded-2xl bg-white p-5 shadow-2xl ring-4 ring-cyan-500/20">
              <QRCode value={student.qrToken ?? 'qr-student-001'} size={210} />
            </div>

            <p className="mt-5 text-lg font-bold">{student.name}</p>
            <p className={`text-xs ${mutedText}`}>Token: <code className="font-mono text-cyan-400">{student.qrToken}</code></p>

            <button
              onClick={handleCopyToken}
              className={`mt-4 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                isDark ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {copied ? '✓ Token Copied' : '📋 Copy Token Code'}
            </button>
          </div>
        )}

        {/* Student Details & Live Scanning Status */}
        <div className="space-y-6">
          {/* Real-time Scan Status Card */}
          <div className={`rounded-3xl border p-6 ${
            currentStatus === 'issued'
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
              : currentStatus === 'returned'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : cardClass
          }`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>⚡</span> Real-time Meal Box Status
              </h2>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                currentStatus === 'issued'
                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                  : currentStatus === 'returned'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                {currentStatus === 'issued' ? '🍱 Box Issued' : currentStatus === 'returned' ? '🔄 Box Returned' : '⏳ Ready for Pickup'}
              </span>
            </div>

            <div className="mt-4">
              {currentStatus === 'issued' ? (
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-amber-300 text-base">You have an active lunch box issued!</p>
                  <p className="text-xs text-amber-200/80">
                    Issued at: {activeBox?.issuedAt ? new Date(activeBox.issuedAt).toLocaleTimeString() : 'Just now'}
                  </p>
                  <p className="text-xs text-amber-200/80">Meal Type: {activeBox?.mealType?.toUpperCase() ?? 'LUNCH'}</p>
                  <p className="text-xs text-amber-200/80">Issued by: Staff #{activeBox?.issuedByStaffId ?? 'staff-1'}</p>
                  <div className="mt-3 rounded-xl bg-amber-500/20 p-3 text-xs text-amber-200 border border-amber-500/30">
                    ⚠️ Please return your lunch box to the mess counter after completing your meal.
                  </div>
                </div>
              ) : currentStatus === 'returned' ? (
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-emerald-400 text-base">Lunch box returned successfully!</p>
                  <p className="text-xs text-emerald-300/80">
                    Returned at: {latestBox?.returnedAt ? new Date(latestBox.returnedAt).toLocaleTimeString() : 'Recently'}
                  </p>
                  <p className="text-xs text-emerald-300/80">Received by: Staff #{latestBox?.returnedByStaffId ?? 'staff-1'}</p>
                  <div className="mt-3 rounded-xl bg-emerald-500/20 p-3 text-xs text-emerald-200 border border-emerald-500/30">
                    ✓ Thank you for returning your meal box on time!
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-cyan-300">Ready for meal pickup</p>
                  <p className={`text-xs ${mutedText}`}>
                    Show your QR code above to the mess staff at the counter to receive your lunch box.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* FOOD QUALITY RATING & REVIEW CARD */}
          <div className={`rounded-3xl border p-6 ${cardClass}`}>
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
              <span>⭐</span> Rate & Review Today's Food Quality
            </h2>
            <p className={`text-xs ${mutedText} mb-4`}>
              Your food rating directly impacts your hostel's rank on the Developer Hostel Leaderboard!
            </p>

            {currentStatus !== 'returned' ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-center gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="font-bold">Food Review Opens After Lunch Box Return</p>
                  <p className="text-[11px] text-amber-200/80 mt-0.5">
                    Return your meal box to the mess counter. Once mess staff approves/scans your returned box, the food review form will automatically unlock here!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {reviewMessage ? (
                  <div className="mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300 font-semibold flex items-center gap-2">
                    <span>✅</span>
                    <span>{reviewMessage}</span>
                  </div>
                ) : null}

                <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">Taste Rating</label>
                      <select
                        value={reviewForm.taste}
                        onChange={(e) => setReviewForm({ ...reviewForm, taste: Number(e.target.value) })}
                        className={`w-full rounded-xl border px-3 py-2 outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white'}`}
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5 - Delicious)</option>
                        <option value={4}>⭐⭐⭐⭐ (4 - Good)</option>
                        <option value={3}>⭐⭐⭐ (3 - Average)</option>
                        <option value={2}>⭐⭐ (2 - Poor)</option>
                        <option value={1}>⭐ (1 - Terrible)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">Portion Quantity</label>
                      <select
                        value={reviewForm.quantity}
                        onChange={(e) => setReviewForm({ ...reviewForm, quantity: Number(e.target.value) })}
                        className={`w-full rounded-xl border px-3 py-2 outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white'}`}
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5 - Generous)</option>
                        <option value={4}>⭐⭐⭐⭐ (4 - Sufficient)</option>
                        <option value={3}>⭐⭐⭐ (3 - Okay)</option>
                        <option value={2}>⭐⭐ (2 - Low)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">Food Freshness</label>
                      <select
                        value={reviewForm.freshness}
                        onChange={(e) => setReviewForm({ ...reviewForm, freshness: Number(e.target.value) })}
                        className={`w-full rounded-xl border px-3 py-2 outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white'}`}
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5 - Freshly Cooked)</option>
                        <option value={4}>⭐⭐⭐⭐ (4 - Good)</option>
                        <option value={3}>⭐⭐⭐ (3 - Average)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">Temperature</label>
                      <select
                        value={reviewForm.temperature}
                        onChange={(e) => setReviewForm({ ...reviewForm, temperature: Number(e.target.value) })}
                        className={`w-full rounded-xl border px-3 py-2 outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white'}`}
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5 - Piping Hot)</option>
                        <option value={4}>⭐⭐⭐⭐ (4 - Warm)</option>
                        <option value={3}>⭐⭐⭐ (3 - Lukewarm)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">Comment / Feedback</label>
                    <input
                      type="text"
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="e.g. Paneer masala was great! Roti was warm."
                      className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-slate-300 bg-white'}`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 transition"
                  >
                    {reviewLoading ? 'Submitting Review...' : '⭐ Submit Food Review & Rating'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Student Profile Card */}
          <div className={`rounded-3xl border p-6 ${cardClass}`}>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>👤</span> Resident Profile
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className={`rounded-2xl border p-3.5 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs ${mutedText}`}>Roll Number</p>
                <p className="mt-1 font-semibold text-base">{student.rollNumber}</p>
              </div>
              <div className={`rounded-2xl border p-3.5 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs ${mutedText}`}>Room Number</p>
                <p className="mt-1 font-semibold text-base">{student.roomNumber}</p>
              </div>
              <div className={`rounded-2xl border p-3.5 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs ${mutedText}`}>Meal Preference</p>
                <p className="mt-1 font-semibold text-base text-emerald-400">{student.mealPreference}</p>
              </div>
              <div className={`rounded-2xl border p-3.5 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs ${mutedText}`}>Mobile Number</p>
                <p className="mt-1 font-semibold text-base text-cyan-400">{student.phoneNumber ?? '9876543210'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL WEEKLY MESS MENU SECTION */}
      <div className={`rounded-3xl border p-6 ${cardClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🍽️</span> Weekly Mess Menu
            </h2>
            <p className={`text-xs ${mutedText} mt-1`}>
              Browse what's being served across the week for Breakfast, Lunch, and Dinner.
            </p>
          </div>
        </div>

        {/* Day Switcher */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-700 pb-4">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                selectedDay === day
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : `border border-slate-700 ${isDark ? 'bg-slate-950 text-slate-200 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Selected Day Meals Grid */}
        {currentDayMenu ? (
          <div className="grid gap-4 md:grid-cols-3">
            {currentDayMenu.meals.map((meal) => (
              <div
                key={meal.mealType}
                className={`rounded-2xl border p-5 flex flex-col justify-between ${
                  isDark ? 'border-slate-700 bg-slate-900/60' : 'border-violet-200 bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                      {meal.mealType === 'breakfast' ? '🍳 Breakfast' : meal.mealType === 'lunch' ? '🍱 Lunch' : '🌙 Dinner'}
                    </span>
                    <span className="text-[11px] font-mono opacity-75">{meal.timing}</span>
                  </div>

                  <h3 className={`text-base font-bold ${headText} mb-2`}>{meal.mainDish}</h3>

                  {meal.sideDishes && meal.sideDishes.length > 0 ? (
                    <div className="space-y-1 mb-4">
                      <p className={`text-xs uppercase tracking-wider font-semibold ${mutedText}`}>Sides:</p>
                      <ul className={`text-xs space-y-0.5 list-disc list-inside ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        {meal.sideDishes.map((side, i) => (
                          <li key={i}>{side}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/70 flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    meal.dietaryTags?.includes('Non-Veg')
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : meal.dietaryTags?.includes('Vegan')
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                  }`}>
                    {meal.dietaryTags?.join(', ') || 'Veg'}
                  </span>
                  <span className={`text-[11px] ${mutedText}`}>Hostel Mess Kitchen</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-center py-6 ${mutedText} text-sm`}>No menu items published for {selectedDay} yet.</p>
        )}
      </div>

      {/* TIFFIN VAN DRIVERS SECTION */}
      <div className={`rounded-3xl border p-6 ${cardClass}`}>
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
          <span>🚐</span> Tiffin Delivery Van Fleet & Driver Contacts
        </h2>
        <p className={`text-xs ${mutedText} mb-4`}>
          Contact your assigned delivery driver if you have questions about your lunch box drop-off.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {vanDrivers.length > 0 ? (
            vanDrivers.map((driver: any) => (
              <div key={driver.id} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-violet-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold ${headText} text-base`}>{driver.driverName}</h3>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium">
                    Active Delivery
                  </span>
                </div>
                <p className="text-xs font-mono text-cyan-500 font-semibold mt-1">🚚 Vehicle: {driver.vehicleNumber}</p>
                <p className="text-xs font-mono text-emerald-500 font-semibold mt-0.5">📱 Phone: {driver.phoneNumber}</p>
                <p className={`text-xs ${mutedText} mt-2`}>Route: <span className={`font-medium ${headText}`}>{driver.assignedRoute}</span></p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-300">No delivery drivers listed at the moment.</p>
          )}
        </div>
      </div>

      {/* STUDENT COMPLAINT BOX TO WARDEN */}
      <div className={`rounded-3xl border p-6 ${cardClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>📩</span> Submit Official Complaint to Warden
            </h2>
            <p className={`text-xs ${mutedText} mt-1`}>
              Report mess food quality issues, damaged lunch boxes, or hygiene concerns directly to your Warden Desk.
            </p>
          </div>
        </div>

        {complaintMsg && (
          <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300 flex items-center justify-between">
            <span>ℹ️ {complaintMsg}</span>
            <button onClick={() => setComplaintMsg('')} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        <form onSubmit={handleComplaintSubmit} className="grid gap-4 sm:grid-cols-2 text-xs">
          <div>
            <label className={`block font-semibold uppercase ${mutedText} mb-1`}>Complaint Category *</label>
            <select
              value={complaintForm.category}
              onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
              className={`w-full rounded-2xl border px-4 py-2.5 text-sm font-semibold outline-none ${
                isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-violet-300 bg-white text-slate-900'
              }`}
            >
              <option value="Food Quality">🍱 Food Quality / Taste</option>
              <option value="Mess Hygiene">🧼 Mess Hygiene & Cleanliness</option>
              <option value="Lunch Box Damage">📦 Lunch Box Damaged / Missing</option>
              <option value="Delivery Timing">⏰ Late Delivery / Timing Issue</option>
              <option value="Staff Behavior">👥 Staff / Driver Behavior</option>
              <option value="Other">❓ Other Facility Concern</option>
            </select>
          </div>

          <div>
            <label className={`block font-semibold uppercase ${mutedText} mb-1`}>Urgency Level *</label>
            <select
              value={complaintForm.urgency}
              onChange={(e) => setComplaintForm({ ...complaintForm, urgency: e.target.value })}
              className={`w-full rounded-2xl border px-4 py-2.5 text-sm font-semibold outline-none ${
                isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-violet-300 bg-white text-slate-900'
              }`}
            >
              <option value="Normal">🟢 Normal (Review within 24h)</option>
              <option value="Urgent">🟡 Urgent (Requires Today's Action)</option>
              <option value="Critical">🔴 Critical (Immediate Attention)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={`block font-semibold uppercase ${mutedText} mb-1`}>Subject / Issue Title *</label>
            <input
              type="text"
              required
              value={complaintForm.subject}
              onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
              placeholder="e.g. Lunch box lid was cracked / Food served was cold today"
              className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none ${
                isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-violet-300 bg-white text-slate-900'
              }`}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={`block font-semibold uppercase ${mutedText} mb-1`}>Detailed Description *</label>
            <textarea
              required
              rows={3}
              value={complaintForm.description}
              onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
              placeholder="Describe what happened in detail so the Warden can take quick corrective action..."
              className={`w-full rounded-2xl border p-4 text-sm outline-none ${
                isDark ? 'border-slate-600 bg-slate-950 text-white' : 'border-violet-300 bg-white text-slate-900'
              }`}
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={complaintLoading}
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:brightness-110 transition disabled:opacity-50"
            >
              {complaintLoading ? 'Submitting to Warden...' : '📩 Submit Official Complaint to Warden Box'}
            </button>
          </div>
        </form>

        {/* MY FILED COMPLAINTS HISTORY */}
        {studentComplaints.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-700/70 space-y-3">
            <h3 className="text-sm font-bold text-cyan-400">📋 My Filed Complaints & Warden Responses ({studentComplaints.length})</h3>
            <div className="space-y-3">
              {studentComplaints.map((c) => (
                <div key={c.id} className={`rounded-2xl border p-4 text-xs space-y-2 ${
                  isDark ? 'border-slate-800 bg-slate-950/70' : 'border-violet-200 bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{c.subject}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      c.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {c.status === 'Resolved' ? '🟢 Resolved by Warden' : '🟡 Open / In Review'}
                    </span>
                  </div>
                  <p className="text-slate-300">{c.description}</p>
                  {c.response && (
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-emerald-300">
                      <p className="font-bold text-xs">👮 Official Warden Response:</p>
                      <p className="mt-0.5 text-xs text-white">{c.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

