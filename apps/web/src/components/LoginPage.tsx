import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, requestPasswordReset, firstTimeSetup, registerAdmin, getPublicTenantsList } from '../lib/api';
import { useTranslation, translations, type Language } from '../lib/translations';

type Role = 'student' | 'mess_staff' | 'admin' | 'developer';

const roleMeta: Record<Role, { labelKey: keyof typeof translations.en; icon: string; badge: string }> = {
  student: {
    labelKey: 'roleStudent',
    icon: '🎫',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
  },
  mess_staff: {
    labelKey: 'roleStaff',
    icon: '🍱',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  admin: {
    labelKey: 'roleWarden',
    icon: '👮',
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
  },
  developer: {
    labelKey: 'roleDeveloper',
    icon: '👑',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  }
};

interface LoginPageProps {
  onLoginSuccess?: (user: { id?: string; name: string; email?: string; role: any }, token: string) => void;
  lang?: Language;
  onSelectLang?: (lang: Language) => void;
}

export function LoginPage({ onLoginSuccess, lang: propLang = 'en', onSelectLang }: LoginPageProps) {
  const navigate = useNavigate();
  const lang = propLang;
  const t = useTranslation(lang);
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredTenants, setRegisteredTenants] = useState<any[]>([]);

  useEffect(() => {
    getPublicTenantsList()
      .then((data) => {
        if (Array.isArray(data)) setRegisteredTenants(data);
      })
      .catch((err) => console.error('Failed to load registered hostels:', err));
  }, []);

  const [mode, setMode] = useState<'login' | 'forgot' | 'first_time' | 'register_admin'>('login');
  const [requestMobile, setRequestMobile] = useState('');
  const [setupPassword, setSetupPassword] = useState('');

  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    hostelName: ''
  });

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setMode('login');
    setError('');
    setSuccessMessage('');
    setMobileNumber('');
    setPassword('');
  };

  const handleDemoLogin = async (role: Role) => {
    let demoPhone = '';
    let demoPass = '';
    if (role === 'student') {
      demoPhone = '9876543210';
      demoPass = 'student123';
    } else if (role === 'mess_staff') {
      demoPhone = '9876543220';
      demoPass = 'staff123';
    } else if (role === 'admin') {
      demoPhone = '9876543299';
      demoPass = 'warden123';
    } else if (role === 'developer') {
      demoPhone = 'DEV9999';
      demoPass = '#harsh107';
    }

    setSelectedRole(role);
    setMobileNumber(demoPhone);
    setPassword(demoPass);
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const result = await login(demoPhone, demoPass);
      localStorage.setItem('hostelos-token', result.token);
      onLoginSuccess?.(result.user, result.token);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Demo authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const phoneToUse = mobileNumber.trim();
    const passToUse = password;

    if (!phoneToUse) {
      setError(selectedRole === 'developer' ? 'Please enter your Developer ID.' : 'Please enter your mobile number.');
      return;
    }

    if (selectedRole !== 'developer' && !passToUse) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const result = await login(phoneToUse, passToUse);

      if (rememberMe) {
        localStorage.setItem('hostelos-token', result.token);
      } else {
        sessionStorage.setItem('hostelos-token', result.token);
        localStorage.setItem('hostelos-token', result.token);
      }

      onLoginSuccess?.(result.user, result.token);
      const isDevOrAdmin = result.user.role === 'admin' || result.user.role === 'super_admin' || result.user.role === 'developer';
      const targetRoute = isDevOrAdmin ? '/admin' : result.user.role === 'mess_staff' ? '/staff' : '/student';
      navigate(targetRoute);
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || 'Invalid credentials or ID.';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const phone = requestMobile.trim();
    if (!phone) {
      setError('Please enter your registered mobile number.');
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset(phone, `Password reset requested for ${selectedRole}`);
      if (result.ok) {
        setSuccessMessage(result.message);
        setMode('login');
      } else {
        setError(result.message || 'Failed to submit reset request.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to request password reset. Verify mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleFirstTimeSetup = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const phone = requestMobile.trim();
    if (!phone) {
      setError('Please enter your Warden-registered mobile number.');
      return;
    }
    if (!setupPassword || setupPassword.length < 4) {
      setError('Please choose a password with at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = await firstTimeSetup(phone, setupPassword);
      if (result.ok) {
        setSuccessMessage(result.message);
        setMobileNumber(phone);
        setPassword(setupPassword);
        setMode('login');
      } else {
        setError(result.message || 'Mobile number not found in warden pre-registration records.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'First-time setup failed. Check if warden has registered your mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRegistration = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!adminForm.name || !adminForm.phoneNumber || !adminForm.password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerAdmin(adminForm);
      if (result.ok) {
        if (result.isPending) {
          setSuccessMessage(result.message || 'Warden registration request sent to Developer Admin for approval!');
          setMode('login');
        } else if (result.token) {
          setSuccessMessage(`Warden account created! Welcome ${result.user.name}.`);
          localStorage.setItem('hostelos-token', result.token);
          onLoginSuccess?.(result.user, result.token);
          navigate('/admin');
        }
      } else {
        setError(result.message || 'Failed to register warden.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Mobile number or email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 overflow-hidden font-sans">
      {/* Vibrant Ambient Glass Aurora Backdrops */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/6 left-1/5 w-[30rem] h-[30rem] rounded-full bg-emerald-400/30 dark:bg-emerald-500/20 blur-[130px] animate-ambient-orb-1" />
        <div className="absolute bottom-1/6 right-1/5 w-[32rem] h-[32rem] rounded-full bg-cyan-400/30 dark:bg-teal-500/20 blur-[140px] animate-ambient-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] rounded-full bg-indigo-400/25 dark:bg-indigo-500/15 blur-[150px] animate-ambient-orb-3" />
      </div>

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-0 card-super-glass rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/40 dark:border-white/10 backdrop-blur-3xl">
        {/* Left Side: Brand Header & Role Tabs */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-white/30 dark:bg-slate-950/40 backdrop-blur-2xl border-b lg:border-b-0 lg:border-r border-white/20 dark:border-white/10 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="relative group">
                <div className="h-12 w-12 rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950 flex items-center justify-center shadow-md">
                  <img
                    src="/logo.jpg"
                    alt="Scan2Eat Logo"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement!;
                      parent.innerHTML = `<div class="flex h-full w-full items-center justify-center bg-emerald-600 text-white font-bold text-xl">🍱</div>`;
                    }}
                  />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase">
                  <span className="brand-text-animated">Scan2Eat</span>
                </h1>
                <p className="text-xs text-emerald-400 font-semibold tracking-wide">HostelOS Meal Operations</p>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-emerald-950/40 border border-emerald-800/40 p-3 text-xs text-emerald-300">
              {t('loginWelcomeMessage')}
            </div>

            {/* Role Switcher */}
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              {t('selectRole')}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(roleMeta) as Role[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition-all backdrop-blur-xl ${
                    selectedRole === role
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10'
                      : 'border-white/20 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-emerald-500/30 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="text-base">{roleMeta[role].icon}</span>
                  <span>{t(roleMeta[role].labelKey as any)}</span>
                </button>
              ))}
            </div>

            {/* Language Switcher */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/20 dark:border-white/10">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('switchLanguage')}:</span>
              <div className="flex items-center gap-1 rounded-full bg-white/40 dark:bg-slate-950/60 p-1 border border-white/20 dark:border-white/10 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => onSelectLang?.('en')}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                    lang === 'en' ? 'bg-slate-950 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => onSelectLang?.('hi')}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                    lang === 'hi' ? 'bg-slate-950 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>
          </div>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-8 pt-4 border-t border-white/20 dark:border-white/10">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-2.5">{t('demoPresets')}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                className="px-3 py-1.5 text-[11px] font-bold rounded-full bg-white/50 dark:bg-slate-900/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-white/30 dark:border-emerald-500/30 shadow-xs backdrop-blur-md"
              >
                🎫 Student Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('mess_staff')}
                className="px-3 py-1.5 text-[11px] font-bold rounded-full bg-white/50 dark:bg-slate-900/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-white/30 dark:border-emerald-500/30 shadow-xs backdrop-blur-md"
              >
                🍱 Staff Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="px-3 py-1.5 text-[11px] font-bold rounded-full bg-white/50 dark:bg-slate-900/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-white/30 dark:border-emerald-500/30 shadow-xs backdrop-blur-md"
              >
                👮 Warden Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('developer')}
                className="px-3 py-1.5 text-[11px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-all border border-amber-500/40 shadow-xs backdrop-blur-md"
              >
                👑 Developer Demo
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
          <div className="mb-4">
            <span className={`inline-block text-xs font-bold px-4 py-1.5 rounded-full border backdrop-blur-md shadow-xs ${roleMeta[selectedRole].badge}`}>
              {t(roleMeta[selectedRole].labelKey as any)} {t('signIn')}
            </span>
          </div>

          {selectedRole === 'developer' && (
            <div className="mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-amber-300 backdrop-blur-md">
              👑 <strong>Developer Access Mode:</strong> Authentication via Developer ID only (`DEV9999` or `harsh dev`). Password is not required.
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-300 backdrop-blur-md">
              ✅ {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-300 backdrop-blur-md">
              ⚠️ {error}
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {selectedRole === 'developer' ? 'Developer Access ID' : t('mobileNumber')}
                </label>
                <input
                  type="text"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder={selectedRole === 'developer' ? 'Enter Developer ID (e.g. DEV9999 or harsh dev)' : t('enterMobile')}
                  className="w-full rounded-2xl glass-input px-4 py-3 text-sm focus:border-emerald-500"
                />
              </div>

              {selectedRole !== 'developer' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('password')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-emerald-500 dark:text-emerald-400 hover:underline font-semibold"
                    >
                      {t('forgotPassword')}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('enterPassword')}
                      className="w-full rounded-2xl glass-input px-4 py-3 text-sm focus:border-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-0"
                  />
                  <span>{t('rememberMe')}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-pill-dark text-sm shadow-2xl disabled:opacity-50 mt-2"
              >
                {loading ? '...' : selectedRole === 'developer' ? '👑 Enter Developer Portal' : t('signIn')}
              </button>

              <div className="pt-2 flex flex-col gap-1.5 text-center text-xs">
                <button
                  type="button"
                  onClick={() => setMode('first_time')}
                  className="text-emerald-400 hover:underline"
                >
                  {t('firstTimeSetup')}
                </button>
                {selectedRole === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setMode('register_admin')}
                    className="text-slate-400 hover:text-slate-200 hover:underline"
                  >
                    {t('newWardenRegister')}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* MODE 2: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotRequest} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your registered mobile number. A reset request will be dispatched to your hostel warden/administrator.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Registered Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={requestMobile}
                  onChange={(e) => setRequestMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-2xl glass-input px-4 py-3 text-sm focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex-1 rounded-full border border-white/20 bg-white/40 dark:bg-slate-800/60 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white/60 backdrop-blur-md transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-pill-dark text-xs py-3 disabled:opacity-50"
                >
                  Request Reset
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: FIRST TIME STUDENT SETUP */}
          {mode === 'first_time' && (
            <form onSubmit={handleFirstTimeSetup} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                If your mobile number was pre-registered by your Warden, set your password here to activate your digital meal pass.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={requestMobile}
                  onChange={(e) => setRequestMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-2xl glass-input px-4 py-3 text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Choose New Password
                </label>
                <input
                  type="password"
                  required
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Minimum 4 characters"
                  className="w-full rounded-2xl glass-input px-4 py-3 text-sm focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex-1 rounded-full border border-white/20 bg-white/40 dark:bg-slate-800/60 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white/60 backdrop-blur-md transition-all shadow-sm"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-pill-dark text-xs py-3 disabled:opacity-50"
                >
                  Activate Pass
                </button>
              </div>
            </form>
          )}

          {/* MODE 4: WARDEN REGISTRATION */}
          {mode === 'register_admin' && (
            <form onSubmit={handleAdminRegistration} className="space-y-3.5">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register a new Hostel Warden account:
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="Dr. Rajesh Sharma"
                  className="w-full rounded-2xl glass-input px-4 py-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number (Sign In ID)
                </label>
                <input
                  type="tel"
                  required
                  value={adminForm.phoneNumber}
                  onChange={(e) => setAdminForm({ ...adminForm, phoneNumber: e.target.value })}
                  placeholder="9876543299"
                  className="w-full rounded-2xl glass-input px-4 py-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="Enter secure password"
                  className="w-full rounded-2xl glass-input px-4 py-2.5 text-xs"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex-1 rounded-full border border-white/20 bg-white/40 dark:bg-slate-800/60 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white/60 backdrop-blur-md transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-pill-dark text-xs py-3 disabled:opacity-50"
                >
                  Register Warden
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
