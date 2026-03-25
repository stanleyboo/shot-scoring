import type { Metadata, Viewport } from 'next';
import { Oswald, Inter } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';
import ToastProvider from '@/components/ToastProvider';
import KangarooBg from '@/components/KangarooBg';

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
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
      <head>
        <script defer src="https://cloud.umami.is/script.js" data-website-id="c0a9cb0a-3178-4154-8b33-4feda376c3aa" />
      </head>
      <body className={`${inter.variable} ${oswald.variable} font-[family-name:var(--font-body)] min-h-screen antialiased`}>
        <KangarooBg />
        <ToastProvider>
          <Nav />
          <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
