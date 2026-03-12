import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';
import ToastProvider from '@/components/ToastProvider';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
});

export const metadata: Metadata = {
  title: 'Langwith Netball',
  description: 'Track Langwith Netball matches, players, and team leaderboards',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Langwith Netball',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ToastProvider>
          <Nav />
          <main className="mx-auto max-w-7xl px-4 py-8">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
