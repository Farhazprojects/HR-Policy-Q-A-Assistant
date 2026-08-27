'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/lib/auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <span className="sr-only">Loading your workspace</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <div className="lg:pl-[242px]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink"
          >
            ☰
          </button>
          <span className="font-semibold text-ink">HR Policy Knowledge Assistant</span>
        </header>

        <main className="mx-auto max-w-[1180px] animate-fade-in px-5 py-8 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
