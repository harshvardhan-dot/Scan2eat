import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, requestPasswordReset, firstTimeSetup, registerAdmin, getPublicTenantsList } from '../lib/api';

type Role = 'student' | 'mess_staff' | 'admin' | 'developer';

const roleMeta: Record<Role, { label: string; accent: string; badge: string }> = {
  student: {
    label: 'Student',
    accent: 'from-cyan-500 to-sky-500 text-cyan-400 border-cyan-500/30',
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
  },
  mess_staff: {
    label: 'Mess Staff',
    accent: 'from-emerald-500 to-teal-500 text-emerald-400 border-emerald-500/30',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
  },
  admin: {
    label: 'Warden',
    accent: 'from-violet-500 to-fuchsia-500 text-violet-400 border-violet-500/30',
    badge: 'bg-violet-500/10 text-violet-300 border-violet-500/20'
  },
  developer: {
    label: 'Developer',
    accent: 'from-amber-500 to-orange-500 text-amber-400 border-amber-500/30',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20'
  }
};

const roleBgStyles: Record<Role, { dark: string; light: string }> = {
  student: {
    dark: 'bg-[radial-gradient(ellipse_at_20%_20%,rgba(6,182,212,0.25),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(14,165,233,0.15),transparent_50%),linear-gradient(135deg,#03141f_0%,#092030_60%,#05121b_100%)] text-slate-100',
    light: 'bg-gradient-to-br from-cyan-100/70 via-sky-50 to-slate-100 text-slate-900'
  },
  mess_staff: {
    dark: 'bg-[radial-gradient(ellipse_at_20%_20%,rgba(16,185,129,0.25),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(20,184,166,0.15),transparent_50%),linear-gradient(135deg,#021711_0%,#06261d_60%,#031813_100%)] text-slate-100',
    light: 'bg-gradient-to-br from-emerald-100/70 via-teal-50 to-slate-100 text-slate-900'
  },
  admin: {
    dark: 'bg-[radial-gradient(ellipse_at_20%_20%,rgba(139,92,246,0.25),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(217,70,239,0.15),transparent_50%),linear-gradient(135deg,#0c061e_0%,#160e31_60%,#0e0920_100%)] text-slate-100',
    light: 'bg-gradient-to-br from-violet-100/70 via-fuchsia-50 to-slate-100 text-slate-900'
  },
  developer: {
    dark: 'bg-[radial-gradient(ellipse_at_20%_20%,rgba(245,158,11,0.28),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(217,119,6,0.18),transparent_50%),linear-gradient(135deg,#1c1103_0%,#2e1b05_60%,#180e02_100%)] text-slate-100',
    light: 'bg-gradient-to-br from-amber-100/80 via-orange-50 to-amber-50 text-slate-900'
  }
};

interface LoginPageProps {
  onLoginSuccess?: (user: { id?: string; name: string; email?: string; role: any }, token: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate();
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

  // Form mode: 'login' | 'forgot' | 'first_time' | 'register_admin'
  const [mode, setMode] = useState<'login' | 'forgot' | 'first_time' | 'register_admin'>('login');
  const [requestMobile, setRequestMobile] = useState('');
  const [setupPassword, setSetupPassword] = useState('');

  // Warden Registration State
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    hostelName: ''
  });

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setMobileNumber('');
    setPassword('');
    setMode('login');
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

    if (!adminForm.name || !adminForm.email || !adminForm.phoneNumber || !adminForm.password) {
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
          if (rememberMe) {
            localStorage.setItem('hostelos-token', result.token);
          } else {
            sessionStorage.setItem('hostelos-token', result.token);
          }
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

  const isDark = !document.documentElement.classList.contains('light');

  return (
    <div className={`relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 transition-all duration-500 ${
      isDark ? roleBgStyles[selectedRole].dark : roleBgStyles[selectedRole].light
    }`}>
      <div className={`w-full max-w-5xl flex flex-col gap-6 rounded-[32px] border p-6 backdrop-blur-xl lg:flex-row lg:p-8 ${
        isDark
          ? 'border-slate-700/70 bg-slate-900/60 shadow-[0_30px_90px_rgba(2,6,23,0.7)]'
          : 'border-violet-200 bg-white/95 shadow-2xl text-slate-900'
      }`}>
        
        {/* Left Side: Brand & Role Selector */}
        <div className={`flex-1 flex flex-col justify-between rounded-3xl border p-6 sm:p-8 ${
          isDark ? 'border-slate-700/70 bg-slate-900/60' : 'border-violet-200 bg-violet-50/50'
        }`}>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl overflow-hidden ring-2 ring-violet-500/40 animate-float">
                <img src="/logo.jpg" alt="Scan2eat" className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
                />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-shimmer">Scan2eat</p>
            </div>

            <h1 className={`mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Hostel Meal Portal
            </h1>
          </div>

          <div className="mt-8">
            <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Select Login Role:</p>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 stagger">
              {(Object.keys(roleMeta) as Role[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`animate-fade-up card-hover rounded-2xl border px-4 py-3 text-center text-sm transition-all duration-200 ${
                    selectedRole === role
                      ? `bg-gradient-to-r ${roleMeta[role].accent.split(' ')[0]} ${roleMeta[role].accent.split(' ')[1]} text-slate-950 font-bold shadow-lg scale-[1.03]`
                      : isDark
                      ? 'border-slate-700 bg-slate-900/60 text-slate-200 hover:border-slate-600 hover:bg-slate-800/80'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold">{roleMeta[role].label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Dynamic Form */}
        <div className="w-full max-w-md flex flex-col justify-center rounded-3xl border border-slate-700/90 bg-slate-900/90 p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${roleMeta[selectedRole].badge}`}>
                {roleMeta[selectedRole].label} Portal
              </span>
              <h2 className="mt-2 text-2xl font-bold text-white">
                {mode === 'login'
                  ? 'Sign In'
                  : mode === 'forgot'
                  ? 'Request Password Reset'
                  : mode === 'first_time'
                  ? 'First Time Student Setup'
                  : 'Register New Warden'}
              </h2>
            </div>
          </div>

          {successMessage ? (
            <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
              <span>✅</span>
              <span>{successMessage}</span>
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          ) : null}

          {/* MODE 1: REGISTER NEW WARDEN */}
          {mode === 'register_admin' && (
            <form onSubmit={handleAdminRegistration} className="space-y-3.5">
              <p className="text-xs text-slate-300 leading-relaxed">
                First time using Scan2eat? Create your Hostel Warden credentials below to gain instant management access.
              </p>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="e.g. rajesh@hostel.edu"
                  className="w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Mobile Number (For Sign In) *
                </label>
                <input
                  type="tel"
                  required
                  value={adminForm.phoneNumber}
                  onChange={(e) => setAdminForm({ ...adminForm, phoneNumber: e.target.value })}
                  placeholder="e.g. 9876543299"
                  className="w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Select Registered Hostel Institution *
                </label>
                <select
                  required
                  value={adminForm.hostelName}
                  onChange={(e) => setAdminForm({ ...adminForm, hostelName: e.target.value })}
                  className="w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-400"
                >
                  <option value="">-- Select Developer Registered Hostel --</option>
                  {registeredTenants.map((t: any) => (
                    <option key={t.id} value={t.hostelName}>
                      🏫 {t.hostelName} ({t.organizationName} • {t.location})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:brightness-110 active:scale-[0.99] disabled:opacity-70"
              >
                {loading ? 'Registering Warden...' : 'Register & Authenticate Warden Account'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="w-full py-2 text-xs font-semibold text-slate-300 hover:text-white transition text-center"
              >
                ← Back to Sign In
              </button>
            </form>
          )}

          {/* MODE 2: FORGOT PASSWORD REQUEST TO WARDEN */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotRequest} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your registered mobile number below. A password change request will be sent to the Hostel Warden for verification and reset.
              </p>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-200" htmlFor="reqMobile">
                  Registered Mobile Number
                </label>
                <input
                  id="reqMobile"
                  type="tel"
                  required
                  value={requestMobile}
                  onChange={(e) => setRequestMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3.5 text-sm text-white placeholder:text-violet-400 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-70"
              >
                {loading ? 'Submitting Request...' : 'Send Password Change Request to Warden'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="w-full py-2 text-xs font-semibold text-slate-300 hover:text-white transition text-center"
              >
                ← Back to Sign In
              </button>
            </form>
          )}

          {/* MODE 3: FIRST TIME STUDENT SETUP */}
          {mode === 'first_time' && (
            <form onSubmit={handleFirstTimeSetup} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you a new resident registered by the Warden? Enter your registered mobile number and create your password for first-time usage.
              </p>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-200" htmlFor="setupMobile">
                  Warden-Registered Mobile Number
                </label>
                <input
                  id="setupMobile"
                  type="tel"
                  required
                  value={requestMobile}
                  onChange={(e) => setRequestMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3.5 text-sm text-white placeholder:text-violet-400 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-200" htmlFor="setupPass">
                  Create Initial Password
                </label>
                <input
                  id="setupPass"
                  type="password"
                  required
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Choose initial password"
                  className="w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3.5 text-sm text-white placeholder:text-violet-400 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-70"
              >
                {loading ? 'Activating Account...' : 'Set Password & Activate Account'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="w-full py-2 text-xs font-semibold text-slate-300 hover:text-white transition text-center"
              >
                ← Back to Sign In
              </button>
            </form>
          )}

          {/* MODE 4: STANDARD LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-200" htmlFor="mobileNumber">
                  {selectedRole === 'developer' ? 'Developer Mobile / ID' : 'Mobile Number'}
                </label>
                <input
                  id="mobileNumber"
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder={selectedRole === 'developer' ? 'e.g. 0000000000' : 'e.g. 9876543210'}
                  className="w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3.5 text-sm text-white placeholder:text-violet-400 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-200" htmlFor="password">
                    Password
                  </label>
                  {selectedRole !== 'developer' && (
                    <button
                      type="button"
                      onClick={() => {
                        setRequestMobile(mobileNumber);
                        setMode('forgot');
                        setError('');
                        setSuccessMessage('');
                      }}
                      className="text-xs font-semibold text-cyan-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-2xl border border-slate-600 bg-slate-950 pl-4 pr-16 py-3.5 text-sm text-white placeholder:text-violet-400 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white hover:border-slate-500 transition flex items-center gap-1 select-none"
                    title={showPassword ? "Hide password" : "View password"}
                  >
                    <span>{showPassword ? '🙈 Hide' : '👁️ View'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span>Remember me</span>
                </label>

                {selectedRole === 'student' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRequestMobile(mobileNumber);
                      setMode('first_time');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-xs font-bold text-emerald-400 hover:underline"
                  >
                    First Time Setup?
                  </button>
                )}

                {selectedRole === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register_admin');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-xs font-bold text-violet-400 hover:underline"
                  >
                    Register New Warden?
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-2xl px-4 py-3.5 text-sm font-bold shadow-lg transition hover:brightness-110 active:scale-[0.99] disabled:opacity-70 ${
                  selectedRole === 'developer'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-amber-500/20'
                    : selectedRole === 'admin'
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-violet-500/20'
                    : selectedRole === 'mess_staff'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-cyan-500/20'
                }`}
              >
                {loading ? 'Authenticating...' : `Sign In as ${roleMeta[selectedRole].label}`}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
