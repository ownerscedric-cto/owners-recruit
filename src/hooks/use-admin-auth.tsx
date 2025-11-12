'use client'

import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface AdminUser {
  id: string
  username: string
  email: string
  role: string
}

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
      const token = localStorage.getItem('admin_token')
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
        setAdmin(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      localStorage.removeItem('admin_token')
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