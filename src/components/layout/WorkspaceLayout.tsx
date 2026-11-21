import { Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';

export interface WorkspaceNavItem {
  to: string;
  label: string;
  end?: boolean;
}

interface WorkspaceLayoutProps {
  brandTitle: string;
  breadcrumb: string;
  navItems: readonly WorkspaceNavItem[];
  primaryAction?: {
    label: string;
    to: string;
  };
  children: ReactNode;
}

export function WorkspaceLayout({
  brandTitle,
  breadcrumb,
  navItems,
  primaryAction,
  children,
}: WorkspaceLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#FAFAF9] text-[#18181B]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#E4E4E7] flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 border-b border-[#E4E4E7] flex items-center justify-between">
          <span className="font-display font-bold text-base tracking-tight text-[#18181B] whitespace-nowrap">
            {brandTitle}
          </span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="md:hidden p-1.5 rounded-md text-[#52525B] hover:bg-[#F4F4F5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav aria-label="Workspace navigation" className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap truncate ${
                  isActive
                    ? 'bg-[#0F766E]/10 text-[#0F766E]'
                    : 'text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/25 md:hidden"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 sm:px-6 bg-white border-b border-[#E4E4E7] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="md:hidden p-2 rounded-lg text-[#52525B] hover:bg-[#F4F4F5] min-w-[40px] min-h-[40px] inline-flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-[#52525B] truncate">
              {breadcrumb}
            </span>
          </div>

          {primaryAction && (
            <Link
              to={primaryAction.to}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] text-[#18181B] whitespace-nowrap shrink-0 transition-colors"
            >
              {primaryAction.label}
            </Link>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
