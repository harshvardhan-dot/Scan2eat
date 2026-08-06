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
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-4 p-4 text-slate-800 dark:text-slate-100">
        <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
          S2E
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Scan2Eat</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Smarter Meal Operations for Hostels</p>
        </div>
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mt-2" />
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
    <div className={`min-h-screen transition-colors duration-150 ${
      isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
    } p-3 sm:p-6 lg:p-8 font-sans`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <Navbar
          user={user}
          theme={theme}
          lang={lang}
          onSelectLang={(nextLang) => setLang(nextLang)}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onLogout={handleLogout}
        />

        <main>
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
