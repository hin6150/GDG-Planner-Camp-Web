import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geistNotoSansKR = localFont({
  src: '../../public/fonts/NotoSansKR.ttf',
  variable: '--font-geist-NotoSansKR',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'GDG-IT-Camp',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistNotoSansKR.variable} h-screen antialiased`}>
        {children}
      </body>
    </html>
  )
}
