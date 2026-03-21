import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, DM_Mono } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';
import ToastProvider from '@/components/ToastProvider';

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Langwith Netball',
  description: 'Track Langwith Netball matches, players, and team leaderboards',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
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
      <body className={`${dmMono.variable} ${bebasNeue.variable} font-[family-name:var(--font-body)] min-h-screen antialiased`}>
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
