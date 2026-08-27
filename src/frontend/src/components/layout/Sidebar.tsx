'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/components/ui/cn';
import { canAccessAdmin, canAccessHR, roleLabel, useAuth } from '@/lib/auth';
import type { Role } from '@/types';

interface NavItem { href: string; label: string; roles?: (r: Role) => boolean }
interface NavGroup { label?: string; items: NavItem[] }

/**
 * Navigation reproduces the approved prototype exactly. The prototype renders
 * every group because it is a static click-through; here the groups are filtered
 * by role, which is the role-based access control the proposal requires.
 */
const GROUPS: NavGroup[] = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/ask', label: 'Ask AI' },
      { href: '/search', label: 'Policy Search' },
      { href: '/leave', label: 'Leave Request' },
      { href: '/acknowledgements', label: 'Acknowledgements' },
    ],
  },
  {
    label: 'HR Officer',
    items: [
      { href: '/hr/dashboard', label: 'HR Dashboard', roles: canAccessHR },
      { href: '/hr/upload', label: 'Upload Policy', roles: canAccessHR },
      { href: '/hr/library', label: 'Policy Library', roles: canAccessHR },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/admin/governance', label: 'AI Governance', roles: canAccessAdmin },
      { href: '/admin/system', label: 'System Overview', roles: canAccessAdmin },
    ],
  },
];

export function Sidebar({ mobileOpen, onNavigate }: { mobileOpen: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const visibleGroups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.roles || i.roles(user.role)),
  })).filter((g) => g.items.length > 0);

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        'sidebar-scope fixed inset-y-0 left-0 z-40 flex w-[242px] flex-col bg-sidebar transition-transform duration-200 lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="px-6 pb-6 pt-7">
        <p className="text-xl font-bold leading-tight text-white">HR Policy</p>
        <p className="text-sm text-sidebar-label">Knowledge Assistant</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {visibleGroups.map((group, gi) => (
          <div key={group.label ?? `group-${gi}`} className={gi > 0 ? 'mt-7' : ''}>
            {group.label ? (
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-sidebar-label">
                {group.label}
              </p>
            ) : null}
            <ul className="space-y-2">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'block rounded-lg px-4 py-2.5 text-sm transition-colors duration-150',
                        active
                          ? 'bg-brand font-semibold text-white'
                          : group.label
                            ? 'text-sidebar-label hover:bg-sidebar-item hover:text-white'
                            : 'bg-sidebar-item text-white/85 hover:bg-sidebar-hover hover:text-white',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-6 py-5">
        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
        <p className="text-xs text-sidebar-label">{roleLabel(user.role)} • Active</p>
        <button
          onClick={async () => { setSigningOut(true); await logout(); }}
          disabled={signingOut}
          className="mt-3 text-xs font-medium text-sidebar-label underline-offset-2 transition-colors hover:text-white hover:underline disabled:opacity-60"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </nav>
  );
}
