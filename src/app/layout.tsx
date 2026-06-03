import type { Metadata } from 'next';
import './globals.css';
import { ApexProvider } from '../lib/store';
import { Nav } from '../components/Nav';

export const metadata: Metadata = {
  title: 'APEX v2 — Trading Terminal',
  description: 'Autonomous Polymarket edge execution — trading platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApexProvider>
          <Nav />
          <main className="md:ml-60 min-h-screen pt-14 md:pt-0 pb-20 md:pb-0">{children}</main>
        </ApexProvider>
      </body>
    </html>
  );
}
