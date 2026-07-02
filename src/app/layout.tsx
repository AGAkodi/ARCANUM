import type { Metadata } from 'next';
import '../index.css';
import '../App.css';

export const metadata: Metadata = {
  title: 'ΛRCΛNUM',
  description: 'Confidential Institutional Payments on Stellar',
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
