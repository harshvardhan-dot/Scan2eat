import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { StudentPortal } from './components/StudentPortal';
import { StaffPortal } from './components/StaffPortal';
import { AdminPortal } from './components/AdminPortal';
import { getMe } from './lib/api';
import type { Language } from './lib/translations';

type Role = 'student' | 'mess_staff' | 'admin' | 'super_admin' | 'developer';

interface User {
  id?: string;
  name: string;
  email?: string;
  role: Role;
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // App-wide Language state (persisted in localStorage)
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('hostelos-lang');
      if (stored === 'hi' || stored === 'en') return stored;
    }
    return 'en';
  });

  useEffect(() => {
    window.localStorage.setItem('hostelos-lang', lang);
  }, [lang]);

  // App-wide Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('hostelos-theme');
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    window.localStorage.setItem('hostelos-theme', theme);
  }, [theme]);

  useEffect(() => {
    const storedToken = localStorage.getItem('hostelos-token');
    if (storedToken) {
      getMe(storedToken)
        .then((me) => {
          setUser(me);
        })
        .catch(() => {
          localStorage.removeItem('hostelos-token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (nextUser: User, token: string) => {
    setUser(nextUser);
    localStorage.setItem('hostelos-token', token);
    const isDevOrAdmin = nextUser.role === 'admin' || nextUser.role === 'super_admin' || nextUser.role === 'developer';
    const defaultPath = isDevOrAdmin ? '/admin' : nextUser.role === 'mess_staff' ? '/staff' : '/student';
    navigate(defaultPath, { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('hostelos-token');
    setUser(null);
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d16] flex flex-col items-center justify-center gap-5 p-4">
        {/* Animated Logo Container */}
        <div className="relative group animate-float-logo">
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 opacity-60 blur-lg animate-pulse-glow" />
          <div className="relative h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-emerald-400/80 shadow-2xl bg-slate-900 flex items-center justify-center">
            <img
              src="/logo.jpg"
              alt="Scan2Eat Logo"
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement!;
                parent.innerHTML = `<div class="flex h-full w-full items-center justify-center bg-emerald-600 text-white font-bold text-2xl">🍱</div>`;
              }}
            />
          </div>
        </div>

        {/* Animated Brand Title & Loading Indicator */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black tracking-wider uppercase">
            <span className="brand-text-animated">Scan2Eat</span>
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 animate-fade-in">
            HostelOS Meal Operations
          </p>
        </div>

        {/* Bouncing Dots */}
        <div className="flex gap-2 items-center mt-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-bounce shadow-sm shadow-emerald-500/50"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Unauthenticated routing
  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (!user && location.pathname === '/login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        lang={lang}
        onSelectLang={(nextLang) => setLang(nextLang)}
      />
    );
  }

  const isDark = theme === 'dark';
  const isDevOrAdmin = user!.role === 'admin' || user!.role === 'super_admin' || user!.role === 'developer';

  return (
    <div className={`relative min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gradient-to-b from-[#070d1a] via-[#111e38] to-[#1a2c54] text-slate-100' : 'bg-gradient-to-b from-[#94c3e8] via-[#bcdcfa] to-[#e4efff] text-slate-900'
    } p-3 sm:p-6 lg:p-8 overflow-hidden font-sans`}>
      {/* Reference Image Ambient Glass Mesh Backdrops */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 left-1/4 w-[36rem] h-[36rem] rounded-full blur-[140px] opacity-60 animate-ambient-orb-1 ${
          isDark ? 'bg-indigo-600/40' : 'bg-sky-300/70'
        }`} />
        <div className={`absolute top-1/2 -right-40 w-[32rem] h-[32rem] rounded-full blur-[130px] opacity-50 animate-ambient-orb-2 ${
          isDark ? 'bg-blue-600/30' : 'bg-purple-300/50'
        }`} />
        <div className={`absolute -bottom-40 left-10 w-[38rem] h-[38rem] rounded-full blur-[150px] opacity-40 animate-ambient-orb-3 ${
          isDark ? 'bg-cyan-600/30' : 'bg-indigo-200/60'
        }`} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <Navbar
          user={user}
          theme={theme}
          lang={lang}
          onSelectLang={(nextLang) => setLang(nextLang)}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onLogout={handleLogout}
        />

        <main className="page-enter">
          <Routes>
            <Route
              path="/student"
              element={<StudentPortal user={user!} isDark={isDark} lang={lang} />}
            />

            <Route
              path="/staff"
              element={
                user!.role === 'mess_staff' || isDevOrAdmin ? (
                  <StaffPortal user={user!} isDark={isDark} lang={lang} />
                ) : (
                  <Navigate to="/student" replace />
                )
              }
            />

            <Route
              path="/admin"
              element={
                isDevOrAdmin ? (
                  <AdminPortal user={user!} isDark={isDark} lang={lang} />
                ) : (
                  <Navigate to={user!.role === 'mess_staff' ? '/staff' : '/student'} replace />
                )
              }
            />

            <Route
              path="*"
              element={
                <Navigate
                  to={isDevOrAdmin ? '/admin' : user!.role === 'mess_staff' ? '/staff' : '/student'}
                  replace
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
