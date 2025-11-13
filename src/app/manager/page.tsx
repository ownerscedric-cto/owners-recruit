'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/use-admin-auth'

export default function ManagerPage() {
  const router = useRouter()
  const { admin, loading } = useAdminAuth()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // 이미 리다이렉트했으면 중복 실행 방지
    if (hasRedirected.current) return

    if (!loading) {
      hasRedirected.current = true

      // 토큰 존재 여부를 추가로 확인
      const token = localStorage.getItem('admin_token')
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('admin_token='))
        ?.split('=')[1]

      console.log('🔍 [Manager Redirect] Admin:', admin ? 'exists' : 'null')
      console.log('🔍 [Manager Redirect] LocalStorage token:', token ? 'exists' : 'null')
      console.log('🔍 [Manager Redirect] Cookie token:', cookieToken ? 'exists' : 'null')

      if (!admin || (!token && !cookieToken)) {
        // 인증되지 않은 경우 또는 토큰이 없는 경우 로그인 페이지로
        console.log('🚪 [Manager Redirect] Redirecting to login - no auth')
        router.replace('/login')
      } else if (admin && (token || cookieToken)) {
        // 인증된 경우 대시보드로 리다이렉트
        console.log('✅ [Manager Redirect] Redirecting to dashboard - authenticated')
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