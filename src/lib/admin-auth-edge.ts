// Edge Runtime compatible admin authentication utilities
import { verifySessionToken } from './jwt-edge'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export type AdminUser = Database['public']['Tables']['admins']['Row']

type SessionWithAdmin = {
  id: string
  admin_id: string
  session_token: string
  expires_at: string
  created_at: string
  admins: AdminUser
}

/**
 * Edge Runtime compatible Supabase client
 */
function createSupabaseEdgeClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}

/**
 * Validate admin session for Edge Runtime (middleware)
 */
export async function validateAdminSessionEdge(token: string): Promise<AdminUser | null> {
  try {
    // Verify token using edge-compatible JWT
    const decoded = await verifySessionToken(token)
    if (!decoded) {
      console.log('❌ [Edge Auth] Token verification failed')
      return null
    }

    console.log('✅ [Edge Auth] Token verified, adminId:', decoded.adminId)

    // Get Supabase client for edge runtime
    const supabase = createSupabaseEdgeClient()

    // Verify session in database
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select(`
        *,
        admins (*)
      `)
      .eq('session_token', token)
      .eq('admin_id', decoded.adminId)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      console.log('❌ [Edge Auth] Session not found in database:', sessionError?.message)
      return null
    }

    const sessionWithAdmin = session as SessionWithAdmin
    console.log('✅ [Edge Auth] Session validated for user:', sessionWithAdmin.admins.username)
    return sessionWithAdmin.admins
  } catch (error) {
    console.error('❌ [Edge Auth] Session validation error:', error)
    return null
  }
}

/**
 * Check if admin can access a specific path
 */
export function canAccessAdminPathEdge(admin: AdminUser, path: string): boolean {
  const pathSegments = path.split('/').filter(Boolean)
  const adminPath = pathSegments[0] // 'admin' or 'manager'

  switch (adminPath) {
    case 'admin':
      return admin.role === 'system_admin'
    case 'manager':
      return admin.role === 'hr_manager' || admin.role === 'system_admin'
    default:
      return false
  }
}

/**
 * Validate admin access for middleware
 */
export async function validateAdminAccess(token: string | undefined, path: string): Promise<{ valid: boolean; admin?: AdminUser }> {
  if (!token) {
    console.log('❌ [Edge Middleware] No token provided')
    return { valid: false }
  }

  try {
    // Validate session
    const admin = await validateAdminSessionEdge(token)
    if (!admin) {
      console.log('❌ [Edge Middleware] Session validation failed')
      return { valid: false }
    }

    // Check path access
    if (!canAccessAdminPathEdge(admin, path)) {
      console.log('❌ [Edge Middleware] Access denied for path:', path, 'user role:', admin.role)
      return { valid: false, admin }
    }

    console.log('✅ [Edge Middleware] Access granted for path:', path, 'user:', admin.username)
    return { valid: true, admin }
  } catch (error) {
    console.error('❌ [Edge Middleware] Access validation error:', error)
    return { valid: false }
  }
}