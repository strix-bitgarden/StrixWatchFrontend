import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
})

export const metadata: Metadata = {
  title: 'strix - watch',
  description: 'Panel de monitoreo y operaciones de strix',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`h-full ${plusJakartaSans.variable}`}>
      <body className={`h-full antialiased ${plusJakartaSans.className}`}>{children}</body>
    </html>
  )
}
