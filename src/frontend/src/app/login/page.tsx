'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : 'Sign-in failed. Please try again.',
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col justify-center gap-12 px-6 py-12 lg:flex-row lg:items-center lg:px-[110px]">
        <div className="lg:flex-1">
          <h1 className="text-[42px] font-bold leading-tight tracking-tight text-ink">
            HR Policy Knowledge Assistant
          </h1>
          <p className="mt-3 text-lg text-ink-muted">
            AI-powered, policy-grounded employee self-service
          </p>
          <div className="mt-10 hidden max-w-md space-y-4 lg:block">
            {[
              ['Grounded answers', 'Every answer is drawn from approved HR policy documents and cited to page and section.'],
              ['Refuses rather than guesses', 'When the policy library does not support an answer, the assistant says so.'],
              ['Explainable retrieval', 'Similarity scores and a retrieval-derived confidence figure accompany each response.'],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="text-sm text-ink-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-[500px]">
          <div className="rounded-card border border-line bg-white p-8 shadow-lift sm:p-[50px]">
            <h2 className="text-[28px] font-bold tracking-tight text-ink">Welcome back</h2>
            <p className="mt-2 text-[15px] text-ink-muted">
              Sign in to access your HR knowledge workspace.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="employee@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error ? (
                <div className="rounded-lg border border-danger/25 bg-danger-wash px-3.5 py-3" role="alert">
                  <p className="text-sm font-medium text-danger">{error}</p>
                </div>
              ) : null}

              <Button type="submit" size="lg" className="w-full" loading={submitting}>
                Sign in
              </Button>
            </form>

            <div className="mt-8 border-t border-line pt-5">
              <p className="text-sm text-ink-muted">
                Prototype accounts: Employee • HR Officer • Admin
              </p>
              <p className="mt-1 text-sm text-ink-subtle">
                Role-based access is demonstrated in this prototype.
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-ink-subtle">
            COIT20254 Information Systems Project — CQUniversity Australia
          </p>
        </div>
      </div>
    </div>
  );
}
