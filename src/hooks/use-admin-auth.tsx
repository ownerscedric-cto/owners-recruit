'use client'

import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database'

type AdminUser = Database['public']['Tables']['admins']['Row']

interface AdminAuthContextType {
  admin: AdminUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkAuth = async () => {
    try {
      let token = localStorage.getItem('admin_token')

      // localStorage에 토큰이 없으면 쿠키에서 확인
      if (!token) {
        const cookieToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('admin_token='))
          ?.split('=')[1]

        if (cookieToken) {
          // 쿠키에서 토큰을 찾으면 localStorage에도 저장
          localStorage.setItem('admin_token', cookieToken)
          token = cookieToken
        }
      }

      if (!token) {
        setAdmin(null)
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setAdmin(data.admin)
      } else {
        localStorage.removeItem('admin_token')
        document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        setAdmin(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      localStorage.removeItem('admin_token')
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('admin_token', data.token)
        // 쿠키에도 토큰 저장 (미들웨어 인증용)
        const isSecure = process.env.NODE_ENV === 'production'
        document.cookie = `admin_token=${data.token}; path=/; max-age=${30 * 24 * 60 * 60}; ${isSecure ? 'secure; ' : ''}samesite=strict`
        setAdmin(data.admin)
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (token) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('admin_token')
      // 쿠키도 함께 삭제
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      setAdmin(null)
      router.push('/login')
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
        checkAuth
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}