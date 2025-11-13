'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/use-admin-auth'

export default function ManagerPage() {
  const router = useRouter()
  const { admin, loading } = useAdminAuth()

  useEffect(() => {
    if (!loading) {
      if (!admin) {
        // 인증되지 않은 경우 로그인 페이지로
        router.replace('/login')
      } else {
        // 인증된 경우 대시보드로 리다이렉트
        router.replace('/manager/dashboard')
      }
    }
  }, [admin, loading, router])

  // 로딩 중이거나 리다이렉트 중일 때 표시할 로딩 화면
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  // 리다이렉트 중일 때 표시할 화면
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">페이지를 준비 중...</p>
      </div>
    </div>
  )
}