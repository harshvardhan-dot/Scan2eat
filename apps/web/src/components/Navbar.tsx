import { Link, useLocation } from 'react-router-dom';
import { useTranslation, Language } from '../lib/translations';

type Role = 'student' | 'mess_staff' | 'admin' | 'super_admin' | 'developer';

interface NavbarProps {
  user: { name: string; role: Role; email?: string } | null;
  theme: 'dark' | 'light';
  lang: Language;
  onSelectLang: (lang: Language) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
}

const roleMeta: Record<Role, { labelKey: string; badgeClass: string }> = {
  student: { labelKey: 'roleStudent', badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
  mess_staff: { labelKey: 'roleStaff', badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  admin: { labelKey: 'roleWarden', badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  super_admin: { labelKey: 'roleDeveloper', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  developer: { labelKey: 'roleDeveloper', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
};

export function Navbar({ user, theme, lang, onSelectLang, onToggleTheme, onLogout }: NavbarProps) {
  const location = useLocation();
  const isDark = theme === 'dark';
  const t = useTranslation(lang);

  if (!user) return null;

  const userRole = user.role;

  return (
    <header className="card-super-glass flex flex-wrap items-center justify-between gap-4 rounded-[2rem] p-4 transition-all">
      {/* Brand Logo & Animated Color Name */}
      <div className="flex items-center gap-3.5">
        <div className="relative group">
          <div className="h-11 w-11 rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-900/80 backdrop-blur-md flex items-center justify-center shadow-lg shadow-emerald-500/10">
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
            <span className="text-xl font-black tracking-tight uppercase">
              <span className="brand-text-animated">{t('appName')}</span>
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-950 text-white dark:bg-emerald-500/20 dark:text-emerald-400 border border-transparent dark:border-emerald-500/30 shadow-xs">
              HostelOS
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('appSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <nav className={`flex items-center gap-1 rounded-xl border p-1 backdrop-blur-md ${
        isDark ? 'bg-slate-950/60 border-white/10' : 'bg-slate-100/70 border-slate-200'
      }`}>
        {userRole === 'student' && (
          <Link
            to="/student"
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              location.pathname === '/student'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('navDigitalPass')}
          </Link>
        )}

        {(userRole === 'mess_staff' || userRole === 'admin' || userRole === 'developer') && (
          <Link
            to="/staff"
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              location.pathname === '/staff'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('navIssueDesk')}
          </Link>
        )}

        {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'developer') && (
          <Link
            to="/admin"
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              location.pathname === '/admin'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {userRole === 'admin' ? t('navWardenAdmin') : t('navDevAdmin')}
          </Link>
        )}
      </nav>

      {/* Controls: Language Switcher, Theme Toggle & Sign Out */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
          <span className={`text-[10px] font-medium border px-2 py-0.5 rounded-md backdrop-blur-xs ${roleMeta[userRole].badgeClass}`}>
            {t(roleMeta[userRole].labelKey as any)}
          </span>
        </div>

        {/* Global Language Toggle (EN / हिंदी) */}
        <div className={`flex items-center rounded-xl border p-0.5 text-xs font-medium backdrop-blur-md ${
          isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-300 bg-white/70'
        }`}>
          <button
            type="button"
            onClick={() => onSelectLang('en')}
            className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
              lang === 'en'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => onSelectLang('hi')}
            className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
              lang === 'hi'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            हिंदी
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-all ${
            isDark
              ? 'border-white/10 bg-slate-800/60 text-slate-200 hover:bg-slate-700/70 hover:border-white/20'
              : 'border-slate-300 bg-white/70 text-slate-800 hover:bg-slate-100'
          }`}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          <span className="transition-transform duration-300 active:rotate-180">
            {isDark ? '☀️' : '🌙'}
          </span>
          <span className="hidden md:inline">{isDark ? t('lightMode') : t('darkMode')}</span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-all ${
            isDark
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
              : 'border-slate-300 bg-white/70 text-slate-700 hover:bg-slate-100'
          }`}
        >
          {t('signOut')}
        </button>
      </div>
    </header>
  );
}
