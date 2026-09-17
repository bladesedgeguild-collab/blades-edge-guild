import type { Metadata } from 'next'
import './globals.css'
import { LFGBanner } from '@/components/layout/LFGBanner'
import { GUILD } from '@/lib/guild-config'

export const metadata: Metadata = {
  title: `Blades Edge, ${GUILD.game}`,
  description: `Guild portal for Blades Edge, forming for ${GUILD.game} ${GUILD.faction}`,
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700;900&family=Spectral:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <LFGBanner />
        {children}
      </body>
    </html>
  )
}
