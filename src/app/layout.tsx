import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'APEX v2 — Autonomous Execution',
  description: 'Polymarket autonomous trading agent dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
