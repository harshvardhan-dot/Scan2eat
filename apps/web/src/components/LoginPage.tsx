import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, requestPasswordReset, firstTimeSetup, registerAdmin, getPublicTenantsList } from '../lib/api';
import { useTranslation, type Language } from '../lib/translations';

type Role = 'student' | 'mess_staff' | 'admin' | 'developer';

const roleMeta: Record<Role, { label: string; icon: string; badge: string }> = {
  student: {
    label: 'Student',
    icon: '🎫',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
  },
  mess_staff: {
    label: 'Mess Staff',
    icon: '🍱',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  admin: {
    label: 'Warden',
    icon: '👮',
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
  },
  developer: {
    label: 'Developer',
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
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [password, setPassword] = useState('student123');
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

    // Set demo default credentials based on role for fast testing
    if (role === 'student') {
      setMobileNumber('9876543210');
      setPassword('student123');
    } else if (role === 'mess_staff') {
      setMobileNumber('9876543220');
      setPassword('staff123');
    } else if (role === 'admin') {
      setMobileNumber('9876543299');
      setPassword('admin123');
    } else if (role === 'developer') {
      setMobileNumber('9876543200');
      setPassword('dev123');
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const phoneToUse = mobileNumber.trim();
    const passToUse = password;

    if (!phoneToUse) {
      setError('Please enter your mobile number.');
      return;
    }

    if (!passToUse) {
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
      const serverMessage = err?.response?.data?.message || 'Invalid mobile number or password.';
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Left Side: Brand Header & Role Tabs */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-900/80 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
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
              👋 <strong>Welcome!</strong> Sign in with your registered mobile number to manage or verify hostel meals in real-time.
            </div>

            {/* Role Switcher */}
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Select Your Role:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(roleMeta) as Role[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    selectedRole === role
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400 shadow-xs'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span>{roleMeta[role].icon}</span>
                  <span>{roleMeta[role].label}</span>
                </button>
              ))}
            </div>

            {/* Language Switcher */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-medium">{t('switchLanguage')}:</span>
              <div className="flex items-center gap-1 rounded-md bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => onSelectLang?.('en')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                    lang === 'en' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => onSelectLang?.('hi')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                    lang === 'hi' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>
          </div>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-8 pt-4 border-t border-slate-800">
            <p className="text-[11px] text-slate-500 font-medium mb-2">⚡ Demo Quick Presets:</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectRole('student')}
                className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Student Demo
              </button>
              <button
                type="button"
                onClick={() => handleSelectRole('mess_staff')}
                className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Staff Demo
              </button>
              <button
                type="button"
                onClick={() => handleSelectRole('admin')}
                className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Warden Demo
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
          <div className="mb-4">
            <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-md border ${roleMeta[selectedRole].badge}`}>
              {roleMeta[selectedRole].label} Sign In
            </span>
          </div>

          {successMessage && (
            <div className="mb-4 rounded-lg bg-emerald-950/60 border border-emerald-800 p-3 text-xs text-emerald-300">
              ✅ {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-rose-950/60 border border-rose-800 p-3 text-xs text-rose-300">
              ⚠️ {error}
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-0"
                  />
                  Remember me
                </label>

                {selectedRole === 'student' && (
                  <button
                    type="button"
                    onClick={() => setMode('first_time')}
                    className="text-xs text-sky-400 hover:underline"
                  >
                    First time setup?
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? 'Authenticating...' : `Sign In as ${roleMeta[selectedRole].label}`}
              </button>

              {selectedRole === 'admin' && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setMode('register_admin')}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Need to register a new Hostel Warden account?
                  </button>
                </div>
              )}
            </form>
          )}

          {/* MODE 2: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotRequest} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your registered mobile number. A reset request will be dispatched to your hostel warden/administrator.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Registered Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={requestMobile}
                  onChange={(e) => setRequestMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Request Reset
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: FIRST TIME STUDENT SETUP */}
          {mode === 'first_time' && (
            <form onSubmit={handleFirstTimeSetup} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                If your mobile number was pre-registered by your Warden, set your password here to activate your digital meal pass.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={requestMobile}
                  onChange={(e) => setRequestMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Choose New Password
                </label>
                <input
                  type="password"
                  required
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Minimum 4 characters"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Activate Pass
                </button>
              </div>
            </form>
          )}

          {/* MODE 4: WARDEN REGISTRATION */}
          {mode === 'register_admin' && (
            <form onSubmit={handleAdminRegistration} className="space-y-3.5">
              <p className="text-xs text-slate-400">
                Register a new Hostel Warden account:
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="Dr. Rajesh Sharma"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mobile Number (Sign In ID)
                </label>
                <input
                  type="tel"
                  required
                  value={adminForm.phoneNumber}
                  onChange={(e) => setAdminForm({ ...adminForm, phoneNumber: e.target.value })}
                  placeholder="9876543299"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="Enter secure password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
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
