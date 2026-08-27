import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'HR Policy Knowledge Assistant',
  description:
    'AI-powered, policy-grounded employee self-service. COIT20254 Information Systems Project, CQUniversity.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
