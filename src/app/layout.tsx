import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'ShotScore — Netball Shot Tracker',
  description: 'Track netball shooting percentages live during training',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <Nav />
        <main className="mx-auto max-w-2xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
