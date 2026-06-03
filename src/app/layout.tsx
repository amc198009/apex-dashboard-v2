import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ApexProvider } from '../lib/store';
import { Nav } from '../components/Nav';
import { CommandPalette } from '../components/CommandPalette';
import { ToastProvider } from '../components/Toast';
import { AlertsWatcher } from '../components/AlertsWatcher';
import { EvaluateProvider } from '../components/EvaluateModal';

export const metadata: Metadata = {
  title: 'APEX — Trading Terminal',
  description: 'Autonomous Polymarket edge execution — trading platform',
  manifest: '/manifest.webmanifest',
  applicationName: 'APEX',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'APEX' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#0b0d12',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApexProvider>
          <ToastProvider>
            <EvaluateProvider>
              <Nav />
              <main className="md:ml-60 min-h-screen pt-14 md:pt-0 pb-20 md:pb-0">{children}</main>
              <CommandPalette />
              <AlertsWatcher />
            </EvaluateProvider>
          </ToastProvider>
        </ApexProvider>
      </body>
    </html>
  );
}
