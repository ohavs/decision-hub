import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Assistant } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { PWARegister } from '@/components/pwa-register'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _assistant = Assistant({ subsets: ["latin", "hebrew"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

const isProd = process.env.NODE_ENV === 'production';
const prefix = isProd ? '/decision-hub' : '';

export const metadata: Metadata = {
  title: 'Decision Hub - Ultimate Group Games',
  description: 'A comprehensive multi-game decision hub for groups with finger dice, coin flip, dice roller, and more',
  generator: 'v0.app',
  manifest: isProd ? '/decision-hub/manifest.json' : '/manifest.json',
  icons: {
    icon: [
      {
        url: `${prefix}/icon-light-32x32.png`,
        media: '(prefers-color-scheme: light)',
      },
      {
        url: `${prefix}/icon-dark-32x32.png`,
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: `${prefix}/icon.svg`,
        type: 'image/svg+xml',
      },
    ],
    apple: `${prefix}/apple-icon.png`,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <PWARegister />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
