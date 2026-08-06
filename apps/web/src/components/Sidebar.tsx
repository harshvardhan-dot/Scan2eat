import type { ReactNode } from 'react';

type SidebarProps = {
  children?: ReactNode;
  isDark?: boolean;
};

type NavItem = {
  label: string;
  active?: boolean;
};

export function Sidebar({ children }: SidebarProps) {
  const items: NavItem[] = [
    { label: 'Overview', active: true },
    { label: 'Students' },
    { label: 'Meals' },
    { label: 'Reports' }
  ];

  return (
    <aside className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 lg:w-64 shadow-xs">
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3.5">
        <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400">HostelOS</p>
        <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">Operations Hub</p>
      </div>
      <nav className="mt-4 space-y-1">
        {items.map((item) => (
          <button
            key={item.label}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
              item.active
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      {children && (
        <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-xs text-slate-600 dark:text-slate-400">
          {children}
        </div>
      )}
    </aside>
  );
}
