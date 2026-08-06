import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, requestPasswordReset, firstTimeSetup, registerAdmin, getPublicTenantsList } from '../lib/api';
import { useTranslation, translations, type Language } from '../lib/translations';
import { IconShield, IconUser, IconUtensils, IconCheck, IconEye, IconEyeOff, IconGlobe, IconActivity } from './Icons';

type Role = 'student' | 'mess_staff' | 'admin' | 'developer';

const roleMeta: Record<Role, { labelKey: keyof typeof translations.en | 'roleDeveloper'; icon: React.ReactNode }> = {
  student: {
    labelKey: 'roleStudent',
    icon: <IconUser className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
  },
  mess_staff: {
    labelKey: 'roleStaff',
    icon: <IconUtensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
  },
  admin: {
    labelKey: 'roleWarden',
    icon: <IconShield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
  },
  developer: {
    labelKey: 'roleDeveloper',
    icon: <IconActivity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
  const [, setRegisteredTenants] = useState<any[]>([]);

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

  const handleDevQuickFill = () => {
    setSelectedRole('developer');
    setMobileNumber('#harsh107');
    setPassword('#harsh107');
    setError('');
    setSuccessMessage('');
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
      const serverMessage = err?.response?.data?.message || 'Invalid mobile number, password, or Developer ID.';
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 font-sans">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: SaaS Branding & Benefits */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div>
            {/* Logo & Brand Name */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                S2E
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white uppercase">Scan2Eat</span>
                <p className="text-[11px] font-medium text-emerald-400">HostelOS Meal Operations</p>
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="text-2xl font-extrabold text-white tracking-tight leading-snug mb-3">
              Smarter meal operations for hostels.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-8">
              Streamline mess verification, track food preparation in real time, and eliminate unauthorized meal access with instant QR validation.
            </p>

            {/* Understated Benefits */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1 text-emerald-400">
                  <IconCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">QR meal verification</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Instant scan and student identity verification at mess counters.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1 text-emerald-400">
                  <IconCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Live meal tracking</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time counts for lunch boxes issued, returned, and pending.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1 text-emerald-400">
                  <IconCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Simple hostel operations</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Automated student rosters, food quality reviews, and warden controls.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-10 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Powered by HostelOS</span>
            <span className="font-semibold text-emerald-400">v2.4 Production</span>
          </div>
        </div>

        {/* Right Column: Authentication Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-white dark:bg-slate-800">
          <div className="max-w-md mx-auto w-full">
            {/* Top Bar with Language Selector */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Welcome back</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sign in to your Scan2Eat portal</p>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
                <IconGlobe className="w-3.5 h-3.5 text-slate-500 ml-1" />
                <button
                  type="button"
                  onClick={() => onSelectLang?.('en')}
                  className={`px-2 py-0.5 text-xs font-semibold rounded ${
                    lang === 'en'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => onSelectLang?.('hi')}
                  className={`px-2 py-0.5 text-xs font-semibold rounded ${
                    lang === 'hi'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>

            {/* Clean Role Selector: Student | Mess Staff | Warden | Developer */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['student', 'mess_staff', 'admin', 'developer'] as Role[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleSelectRole(role)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-colors ${
                      selectedRole === role
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {roleMeta[role].icon}
                    <span>{role === 'developer' ? 'Developer' : t(roleMeta[role].labelKey as any)}</span>
                  </button>
                ))}
              </div>
            </div>


            {/* Alert Messages */}
            {successMessage && (
              <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 p-3 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <IconCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 p-3 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                <span className="shrink-0 font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* MODE 1: LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {selectedRole === 'developer' ? 'Developer Access ID' : t('mobileNumber')}
                  </label>
                  <input
                    type="text"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder={selectedRole === 'developer' ? 'Enter Developer ID (e.g. #harsh107)' : t('enterMobile')}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>

                {selectedRole !== 'developer' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t('password')}
                      </label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
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
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{t('rememberMe')}</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs"
                >
                  {loading ? 'Authenticating...' : selectedRole === 'developer' ? 'Enter Developer Portal' : t('signIn')}
                </button>

                <div className="pt-2 flex flex-col gap-1.5 text-center text-xs">
                  <button
                    type="button"
                    onClick={() => setMode('first_time')}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    {t('firstTimeSetup')}
                  </button>
                  {selectedRole === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setMode('register_admin')}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline"
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
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enter your registered mobile number. A password reset request will be dispatched to your hostel warden or administrator.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registered Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={requestMobile}
                    onChange={(e) => setRequestMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-semibold disabled:opacity-50"
                  >
                    Request Reset
                  </button>
                </div>
              </form>
            )}

            {/* MODE 3: FIRST TIME STUDENT SETUP */}
            {mode === 'first_time' && (
              <form onSubmit={handleFirstTimeSetup} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  If your mobile number was pre-registered by your Warden, set your password here to activate your digital meal pass.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={requestMobile}
                    onChange={(e) => setRequestMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Choose New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-semibold disabled:opacity-50"
                  >
                    Activate Pass
                  </button>
                </div>
              </form>
            )}

            {/* MODE 4: WARDEN REGISTRATION */}
            {mode === 'register_admin' && (
              <form onSubmit={handleAdminRegistration} className="space-y-3.5">
                <p className="text-xs text-slate-600 dark:text-slate-400">
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
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
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
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
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
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-semibold disabled:opacity-50"
                  >
                    Register Warden
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
