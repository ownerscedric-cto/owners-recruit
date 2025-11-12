import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createSupabaseServiceRoleClient } from './supabase'
import { Database } from '@/types/database'

export type AdminUser = Database['public']['Tables']['admins']['Row']
export type AdminSession = Database['public']['Tables']['admin_sessions']['Row']

const JWT_SECRET = process.env.JWT_SECRET || 'owners-recruit-admin-secret'
const SESSION_EXPIRES_IN = 24 * 60 * 60 * 1000 // 24시간

export interface AdminAuthResult {
  success: boolean
  admin?: AdminUser
  token?: string
  error?: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateSessionToken(adminId: string): string {
  return jwt.sign(
    {
      adminId,
      type: 'admin_session',
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

export function verifySessionToken(token: string): { adminId: string } | null {
  try {
    console.log('Verifying token with secret length:', JWT_SECRET.length)
    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log('Token decoded successfully, type:', decoded.type, 'adminId:', decoded.adminId)
    if (decoded.type !== 'admin_session') {
      console.log('Invalid token type:', decoded.type)
      return null
    }
    return { adminId: decoded.adminId }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export async function authenticateAdmin(username: string, password: string): Promise<AdminAuthResult> {
  try {
    const supabase = createSupabaseServiceRoleClient()

    // 관리자 계정 조회
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .eq('active', true)
      .single()

    if (adminError || !admin) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' }
    }

    // 비밀번호 확인
    const isValidPassword = await comparePassword(password, admin.password_hash)
    if (!isValidPassword) {
      return { success: false, error: '비밀번호가 일치하지 않습니다.' }
    }

    // 세션 토큰 생성
    const sessionToken = generateSessionToken(admin.id)
    const expiresAt = new Date(Date.now() + SESSION_EXPIRES_IN).toISOString()

    // 기존 세션 정리 (만료된 세션 제거)
    await supabase
      .from('admin_sessions')
      .delete()
      .eq('admin_id', admin.id)
      .lt('expires_at', new Date().toISOString())

    // 새 세션 생성
    const { error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        admin_id: admin.id,
        session_token: sessionToken,
        expires_at: expiresAt
      })

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return { success: false, error: '세션 생성에 실패했습니다.' }
    }

    // 마지막 로그인 시간 업데이트
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id)

    return {
      success: true,
      admin,
      token: sessionToken
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error: '인증 처리 중 오류가 발생했습니다.' }
  }
}

export async function validateAdminSession(token: string): Promise<AdminUser | null> {
  try {
    const supabase = createSupabaseServiceRoleClient()

    // 토큰 검증
    const decoded = verifySessionToken(token)
    if (!decoded) return null

    // 세션 확인
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*, admins(*)')
      .eq('session_token', token)
      .eq('admin_id', decoded.adminId)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return null
    }

    return session.admins as AdminUser
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

export async function logoutAdmin(token: string): Promise<boolean> {
  try {
    const supabase = createSupabaseServiceRoleClient()

    const { error } = await supabase
      .from('admin_sessions')
      .delete()
      .eq('session_token', token)

    return !error
  } catch (error) {
    console.error('Logout error:', error)
    return false
  }
}

export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const supabase = createSupabaseServiceRoleClient()

    await supabase
      .from('admin_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())
  } catch (error) {
    console.error('Cleanup expired sessions error:', error)
  }
}

// 권한 확인 함수
export function hasPermission(admin: AdminUser, requiredRole: AdminUser['role'] | AdminUser['role'][]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

  // system_admin은 모든 권한
  if (admin.role === 'system_admin') return true

  return roles.includes(admin.role)
}

// 관리자 경로 권한 확인
export function canAccessAdminPath(admin: AdminUser, path: string): boolean {
  const adminPath = path.split('/')[1] // /admin/... 또는 /manager/...

  switch (adminPath) {
    case 'admin':
      return hasPermission(admin, 'system_admin')
    case 'manager':
      return hasPermission(admin, ['hr_manager', 'system_admin'])
    default:
      return false
  }
}