import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '병원 노무인사 뉴스 | 종합병원 HR 정보',
  description: '100~500병상 종합병원 인사팀을 위한 노무·인사 뉴스 자동 수집 대시보드',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  )
}
