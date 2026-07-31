import { Link, useLocation } from 'react-router-dom';

type Role = 'student' | 'mess_staff' | 'admin' | 'super_admin' | 'developer';

interface NavbarProps {
  user: { name: string; role: Role; email?: string } | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogout: () => void;
}

const roleMeta: Record<Role, { label: string; accent: string }> = {
  student: { label: 'Student', accent: 'from-cyan-500 to-sky-500' },
  mess_staff: { label: 'Mess Staff', accent: 'from-emerald-500 to-lime-500' },
  admin: { label: 'Warden', accent: 'from-violet-500 to-fuchsia-500' },
  super_admin: { label: 'Developer Owner', accent: 'from-amber-500 to-orange-500' },
  developer: { label: 'Developer Owner', accent: 'from-amber-500 to-orange-500' }
};

export function Navbar({ user, theme, onToggleTheme, onLogout }: NavbarProps) {
  const location = useLocation();
  const isDark = theme === 'dark';

  if (!user) return null;

  const userRole = user.role;

  return (
    <header className={`navbar-slide-in flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-4 sm:p-5 backdrop-blur-xl transition-all duration-300 glass ${
      isDark
        ? 'border-violet-800/30 bg-slate-900/60 shadow-2xl shadow-black/60'
        : 'border-violet-200/60 bg-white/80 shadow-lg shadow-violet-100/50'
    }`}>
      {/* Logo + App Name - Click to return to Login Page */}
      <div className="flex items-center gap-3">
        <button
          onClick={onLogout}
          title="Click Scan2eat to return to Login Page"
          className="flex items-center gap-3 group text-left cursor-pointer outline-none border-0 bg-transparent p-0"
        >
          {/* Logo image with animated ring */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-500 opacity-0 group-hover:opacity-60 blur-md transition-all duration-500" />
            <div className="relative h-11 w-11 rounded-2xl overflow-hidden ring-2 ring-violet-500/30 group-hover:ring-violet-400/70 transition-all duration-300 shadow-lg shadow-slate-900/50">
              <img
                src="/logo.jpg"
                alt="Scan2eat Logo"
                className="h-full w-full object-cover scale-100 group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  // Fallback to emoji if image fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement!;
                  parent.innerHTML = `<div class="flex h-full w-full items-center justify-center bg-gradient-to-tr from-teal-500 to-emerald-500 text-slate-950 font-extrabold text-xl">🍱</div>`;
                }}
              />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-black tracking-[0.18em] uppercase flex items-center gap-1.5">
              <span className="brand-text-animated">Scan2eat</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 group-hover:bg-violet-500/30 tracking-normal normal-case">↩ Login</span>
            </div>
            <div className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-violet-400">
              Hostel Meal Scanner
            </div>
          </div>
        </button>
      </div>

      {/* Navigation Pills */}
      <nav className={`flex items-center gap-1 rounded-2xl border p-1 transition-colors ${
        isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-violet-50/80 border-violet-200'
      }`}>
        {userRole === 'student' && (
          <Link
            to="/student"
            className={`nav-pill rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              location.pathname === '/student'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/30'
                : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/70' : 'text-slate-600 hover:bg-violet-100 hover:text-slate-900'
            }`}
          >
            🎫 My Pass
          </Link>
        )}

        {(userRole === 'mess_staff' || userRole === 'admin') && (
          <Link
            to="/staff"
            className={`nav-pill rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              location.pathname === '/staff'
                ? 'bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/30'
                : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/70' : 'text-slate-600 hover:bg-violet-100 hover:text-slate-900'
            }`}
          >
            📋 Issue Desk
          </Link>
        )}

        {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'developer') && (
          <Link
            to="/admin"
            className={`nav-pill rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              location.pathname === '/admin'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/70' : 'text-slate-600 hover:bg-violet-100 hover:text-slate-900'
            }`}
          >
            {userRole === 'admin' ? '🏠 Warden Dashboard' : '👑 Developer Portal'}
          </Link>
        )}
      </nav>

      {/* Right side — user info + controls */}
      <div className="flex items-center gap-3">
        <div className={`hidden md:flex flex-col text-right ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
          <span className="text-sm font-semibold">{user.name}</span>
          <span className={`text-[10px] font-bold inline-block bg-gradient-to-r ${roleMeta[userRole].accent} bg-clip-text text-transparent uppercase tracking-widest`}>
            {roleMeta[userRole].label}
          </span>
        </div>

        {/* Premium Light/Dark Theme Switcher Pill */}
        <button
          onClick={onToggleTheme}
          className={`relative group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-300 shadow-md active:scale-95 ${
            isDark
              ? 'border-amber-500/40 bg-slate-900/90 text-amber-300 shadow-amber-500/10 hover:border-amber-400 hover:bg-slate-800'
              : 'border-violet-300 bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-900 shadow-violet-500/15 hover:border-violet-400 hover:from-violet-200 hover:to-indigo-200'
          }`}
          title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
          aria-label="Toggle visual theme"
        >
          <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-45 ${
            isDark ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30' : 'bg-violet-600 text-white ring-1 ring-violet-400 shadow-sm'
          }`}>
            {isDark ? '☀️' : '🌙'}
          </span>
          <span className="font-semibold tracking-wide">
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        <button
          onClick={onLogout}
          className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:border-rose-400/60 transition-all duration-200 active:scale-95"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
