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
      <div className="min-h-screen bg-[#07050f] flex flex-col items-center justify-center gap-4">
        <div className="animate-float">
          <div className="h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-violet-500/40 shadow-xl shadow-violet-900/50">
            <img src="/logo.jpg" alt="Scan2eat" className="h-full w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
            />
          </div>
        </div>
        <p className="text-violet-400 font-semibold tracking-widest text-sm uppercase animate-fade-in" style={{animationDelay:'0.3s'}}>Loading Scan2eat...</p>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <span key={i} className="h-2 w-2 rounded-full bg-violet-500 animate-bounce" style={{animationDelay:`${i*0.15}s`}} />
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
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isDark = theme === 'dark';
  const isDevOrAdmin = user!.role === 'admin' || user!.role === 'super_admin' || user!.role === 'developer';

  return (
    <div className={`relative min-h-screen transition-colors duration-500 ${
      isDark
        ? 'bg-[radial-gradient(ellipse_at_20%_20%,rgba(139,92,246,0.12),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(245,158,11,0.07),transparent_50%),linear-gradient(135deg,#07050f_0%,#0f0b1e_60%,#0a0816_100%)] text-slate-100'
        : 'bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.15),transparent_60%),linear-gradient(160deg,#f5f3ff,#eef2ff)] text-slate-900'
    } p-4 sm:p-6 lg:p-8`}>
      {/* Ambient glow orbs */}
      {isDark && (
        <>
          <div className="bg-orb w-96 h-96 bg-violet-600 top-[-10%] left-[-5%]" />
          <div className="bg-orb w-72 h-72 bg-amber-500 bottom-[-8%] right-[-3%]" />
        </>
      )}
      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
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
