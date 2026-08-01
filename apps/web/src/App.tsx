import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { StudentPortal } from './components/StudentPortal';
import { StaffPortal } from './components/StaffPortal';
import { AdminPortal } from './components/AdminPortal';
import { getMe } from './lib/api';

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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
          🍱
        </div>
        <p className="text-slate-300 font-medium tracking-wide text-sm">Loading Scan2Eat...</p>
      </div>
    );
  }

  // Unauthenticated routing
  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (!user && location.pathname === '/login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isDark = theme === 'dark';
  const isDevOrAdmin = user!.role === 'admin' || user!.role === 'super_admin' || user!.role === 'developer';

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-[#080d16] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    } p-3 sm:p-6 lg:p-8`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <Navbar
          user={user}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onLogout={handleLogout}
        />

        <main className="page-enter">
          <Routes>
            <Route
              path="/student"
              element={<StudentPortal user={user!} isDark={isDark} />}
            />

            <Route
              path="/staff"
              element={
                user!.role === 'mess_staff' || isDevOrAdmin ? (
                  <StaffPortal user={user!} isDark={isDark} />
                ) : (
                  <Navigate to="/student" replace />
                )
              }
            />

            <Route
              path="/admin"
              element={
                isDevOrAdmin ? (
                  <AdminPortal user={user!} isDark={isDark} />
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
