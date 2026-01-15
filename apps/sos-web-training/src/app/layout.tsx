import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RootProviders } from '../components/provider/RootProviders';
import localFont from 'next/font/local';
import CookieConsent from '../components/cookiesConsent';
import RouteLoader from '@/components/layout/routeLoader';

const localPoppin = localFont({
  src: [
    {
      path: './fonts/Poppins-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Poppins-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/Poppins-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: './fonts/Poppins-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'StrengthOS Training',
  description: 'Training platform for strength athletes and coaches',
  keywords: ['strength training', 'fitness', 'workout', 'coaching'],
  authors: [{ name: 'StrengthOS' }],
  creator: 'StrengthOS',
  publisher: 'StrengthOS',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={'en'}>
      <body className={`antialiased ${localPoppin.className} min-h-screen bg-background`}>
        <RootProviders>
          <RouteLoader />
          {children}
          <CookieConsent />
        </RootProviders>
      </body>
    </html>
  );
}
