'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { AdminUser } from '@/lib/admin-auth'

interface AdminGuardProps {
  children: ReactNode
  requiredRole?: AdminUser['role'] | AdminUser['role'][]
  fallbackPath?: string
}

function hasPermission(admin: AdminUser, requiredRole: AdminUser['role'] | AdminUser['role'][]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

  // system_admin은 모든 권한
  if (admin.role === 'system_admin') return true

  return roles.includes(admin.role)
}

export default function AdminGuard({
  children,
  requiredRole,
  fallbackPath = '/login'
}: AdminGuardProps) {
  const { admin, loading } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    // 인증되지 않은 경우
    if (!admin) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    // 권한 확인
    if (requiredRole && !hasPermission(admin, requiredRole)) {
      // 권한이 없는 경우 적절한 페이지로 리다이렉트
      if (admin.role === 'hr_manager') {
        router.push('/manager')
      } else {
        router.push(fallbackPath)
      }
      return
    }
  }, [admin, loading, router, pathname, requiredRole, fallbackPath])

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 인증되지 않음
  if (!admin) {
    return null
  }

  // 권한 없음
  if (requiredRole && !hasPermission(admin, requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다</h2>
          <p className="text-gray-600 mb-6">이 페이지에 접근할 권한이 없습니다.</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            이전 페이지로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}