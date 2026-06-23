import type { Metadata } from 'next';
import { Inter, Playfair_Display, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { RootProviders } from '@/components/providers/root-providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '600', '700'],
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-brand',
  display: 'swap',
  weight: ['400', '700'],
});

const siteUrl = 'https://mhfashion.example.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'M.H.Fashion — Modern Luxury Apparel & Accessories',
    template: '%s | M.H.Fashion',
  },
  description:
    'M.H.Fashion crafts elevated essentials — tees, hoodies, caps, posters and mobile covers — designed for those who wear confidence.',
  keywords: [
    'luxury fashion',
    'premium t-shirts',
    'hoodies',
    'designer caps',
    'mobile covers',
    'art posters',
    'M.H.Fashion',
  ],
  authors: [{ name: 'M.H.Fashion' }],
  openGraph: {
    type: 'website',
    title: 'M.H.Fashion — Modern Luxury Apparel',
    description:
      'Elevated essentials for the modern wardrobe. Tees, hoodies, caps, posters and covers.',
    siteName: 'M.H.Fashion',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'M.H.Fashion',
    description: 'Modern luxury apparel & accessories.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${cormorantGaramond.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
