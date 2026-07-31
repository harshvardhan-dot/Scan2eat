import type { ReactNode } from 'react';

type SidebarProps = {
  children: ReactNode;
  isDark: boolean;
};

type NavItem = {
  label: string;
  icon: string;
  active?: boolean;
};

export function Sidebar({ children, isDark }: SidebarProps) {
  const items: NavItem[] = [
    { label: 'Overview', icon: '◎', active: true },
    { label: 'Students', icon: '◌' },
    { label: 'Meals', icon: '◈' },
    { label: 'Reports', icon: '◍' }
  ];

  return (
    <aside className={`w-full rounded-3xl border p-4 lg:w-72 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-violet-200 bg-white/80'}`}>
      <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/80' : 'border-violet-200 bg-slate-50'}`}>
        <p className={`text-xs uppercase tracking-[0.35em] ${isDark ? 'text-violet-400' : 'text-slate-300'}`}>HostelOS</p>
        <p className={`mt-2 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Operations hub</p>
      </div>
      <nav className="mt-4 space-y-2">
        {items.map((item) => (
          <button key={item.label} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition ${item.active ? 'bg-cyan-500/15 text-cyan-300' : isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'}`}>
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className={`mt-4 rounded-2xl border p-4 text-sm ${isDark ? 'border-slate-700 bg-slate-900/70 text-slate-300' : 'border-violet-200 bg-slate-50 text-slate-600'}`}>
        {children}
      </div>
    </aside>
  );
}
