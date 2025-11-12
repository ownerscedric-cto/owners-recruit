import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AdminAuthProvider } from '@/hooks/use-admin-auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '오너스경영연구소 스마트 리크루팅 시스템',
  description: '효율적이고 안전한 입사 프로세스를 통해 인재와 기업을 연결하는 디지털 게이트웨이',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: '오너스경영연구소 스마트 리크루팅 시스템',
    description: '효율적이고 안전한 입사 프로세스를 통해 인재와 기업을 연결하는 디지털 게이트웨이',
    images: ['/owners_logo.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AdminAuthProvider>
          {children}
        </AdminAuthProvider>
      </body>
    </html>
  )
}