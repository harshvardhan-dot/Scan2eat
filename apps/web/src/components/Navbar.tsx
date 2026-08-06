import { Link, useLocation } from 'react-router-dom';
import { useTranslation, Language } from '../lib/translations';
import { IconGlobe, IconLogOut, IconMoon, IconSun } from './Icons';

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
  student: { labelKey: 'roleStudent', badgeClass: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600' },
  mess_staff: { labelKey: 'roleStaff', badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  admin: { labelKey: 'roleWarden', badgeClass: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600' },
  super_admin: { labelKey: 'roleDeveloper', badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  developer: { labelKey: 'roleDeveloper', badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' }
};

export function Navbar({ user, theme, lang, onSelectLang, onToggleTheme, onLogout }: NavbarProps) {
  const location = useLocation();
  const isDark = theme === 'dark';
  const t = useTranslation(lang);

  if (!user) return null;

  const userRole = user.role;

  return (
    <header className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-4">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
          S2E
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
              {t('appName')}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
              HostelOS
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('appSubtitle')}</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
        {userRole === 'student' && (
          <Link
            to="/student"
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              location.pathname === '/student'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('navDigitalPass')}
          </Link>
        )}

        {(userRole === 'mess_staff' || userRole === 'admin' || userRole === 'developer') && (
          <Link
            to="/staff"
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              location.pathname === '/staff'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('navIssueDesk')}
          </Link>
        )}

        {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'developer') && (
          <Link
            to="/admin"
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              location.pathname === '/admin'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {userRole === 'admin' ? t('navWardenAdmin') : t('navDevAdmin')}
          </Link>
        )}
      </nav>

      {/* Controls: Profile, Language, Theme, Logout */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.name}</span>
          <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded ${roleMeta[userRole].badgeClass}`}>
            {t(roleMeta[userRole].labelKey as any)}
          </span>
        </div>

        {/* Global Language Toggle (EN / हिंदी) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-lg border border-slate-200 dark:border-slate-600 text-xs">
          <IconGlobe className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
          <button
            type="button"
            onClick={() => onSelectLang('en')}
            className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors ${
              lang === 'en'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => onSelectLang('hi')}
            className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors ${
              lang === 'hi'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            हिंदी
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <IconSun className="w-4 h-4 text-amber-400" /> : <IconMoon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <IconLogOut className="w-3.5 h-3.5 text-slate-500" />
          <span>{t('signOut')}</span>
        </button>
      </div>
    </header>
  );
}
