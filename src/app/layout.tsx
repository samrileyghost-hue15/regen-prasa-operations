import type { Metadata, Viewport } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'REGEN Â· PRASA Railway Operations',
    template: '%s Â· REGEN',
  },
  description:
    'REGEN Railway Operations & Infrastructure Management System â€” the central operations, sensor and maintenance platform for PRASA Gauteng.',
  applicationName: 'REGEN',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#040b15',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body className="min-h-screen bg-navy-950 text-slate-200 antialiased">
        {/* Skip-to-content for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[9999] focus:rounded-md focus:bg-green-500 focus:px-3 focus:py-2 focus:text-[12px] focus:font-bold focus:text-navy-950 focus:outline-none"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}

