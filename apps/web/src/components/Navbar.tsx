import { Link, useLocation } from 'react-router-dom';

type Role = 'student' | 'mess_staff' | 'admin' | 'super_admin' | 'developer';

interface NavbarProps {
  user: { name: string; role: Role; email?: string } | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogout: () => void;
}

const roleMeta: Record<Role, { label: string; badgeClass: string }> = {
  student: { label: 'Student', badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
  mess_staff: { label: 'Mess Staff', badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  admin: { label: 'Warden', badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  super_admin: { label: 'Developer', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  developer: { label: 'Developer', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
};

export function Navbar({ user, theme, onToggleTheme, onLogout }: NavbarProps) {
  const location = useLocation();
  const isDark = theme === 'dark';

  if (!user) return null;

  const userRole = user.role;

  return (
    <header className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-3 sm:p-4 transition-all ${
      isDark
        ? 'border-slate-800 bg-slate-900/90 shadow-sm'
        : 'border-slate-200 bg-white/90 shadow-sm'
    }`}>
      {/* Brand Logo & Animated Color Name */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div className="h-10 w-10 rounded-lg overflow-hidden border border-emerald-500/30 bg-slate-900 flex items-center justify-center shadow-xs">
            <img
              src="/logo.jpg"
              alt="Scan2Eat Logo"
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement!;
                parent.innerHTML = `<div class="flex h-full w-full items-center justify-center bg-emerald-600 text-white font-bold text-lg">🍱</div>`;
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight uppercase">
              <span className="brand-text-animated">Scan2Eat</span>
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              HostelOS
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Hostel Mess & Meal Operations</p>
        </div>
      </div>

      {/* Navigation Pills */}
      <nav className={`flex items-center gap-1 rounded-lg border p-1 ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        {userRole === 'student' && (
          <Link
            to="/student"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              location.pathname === '/student'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎫 Digital Meal Pass
          </Link>
        )}

        {(userRole === 'mess_staff' || userRole === 'admin' || userRole === 'developer') && (
          <Link
            to="/staff"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              location.pathname === '/staff'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Mess Issue Desk
          </Link>
        )}

        {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'developer') && (
          <Link
            to="/admin"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              location.pathname === '/admin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {userRole === 'admin' ? '🏠 Warden Admin' : '👑 Developer Admin'}
          </Link>
        )}
      </nav>

      {/* User Info & Theme Controls */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
          <span className={`text-[10px] font-medium border px-1.5 py-0.2 rounded-md ${roleMeta[userRole].badgeClass}`}>
            {roleMeta[userRole].label}
          </span>
        </div>

        {/* Aesthetic Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            isDark
              ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
              : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
          }`}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          <span className="transition-transform duration-300 active:rotate-180">
            {isDark ? '☀️' : '🌙'}
          </span>
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
