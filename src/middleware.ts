import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseServiceRoleClient } from './lib/supabase'

// 관리자 경로 확인
function isAdminPath(pathname: string): boolean {
  const adminPaths = [
    '/admin',
    '/manager',
    '/api/system-settings',
    '/api/admin',
    '/maintenance'
  ]
  return adminPaths.some(path => pathname.startsWith(path))
}

// 인증이 필요한 관리자 경로 확인
function requiresAuth(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/manager')
}

// 관리자 세션 검증 (Edge Runtime 호환)
async function validateAdminAccess(request: NextRequest): Promise<{ valid: boolean; admin?: any }> {
  try {
    // 쿠키에서 토큰 확인
    const token = request.cookies.get('admin_token')?.value
    console.log('Middleware cookie token:', token ? 'exists' : 'not found')

    if (!token) {
      console.log('Middleware: No token found')
      return { valid: false }
    }

    // API를 통해 토큰 검증
    try {
      const verifyUrl = new URL('/api/admin/verify', request.url)
      const response = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': request.headers.get('cookie') || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Middleware validation result: success')
        return { valid: true, admin: data.admin }
      } else {
        console.log('Middleware validation result: failed')
        return { valid: false }
      }
    } catch (fetchError) {
      console.log('Middleware API call failed:', fetchError)
      return { valid: false }
    }
  } catch (error) {
    console.error('Admin validation error:', error)
    return { valid: false }
  }
}

// 정적 파일 확인
function isStaticFile(pathname: string): boolean {
  return pathname.startsWith('/_next') ||
         pathname.startsWith('/favicon') ||
         pathname.includes('.')
}

// 관리자 IP 확인
function isAdminAccess(request: NextRequest): boolean {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIP || ''

  const adminIPs = [
    '127.0.0.1',
    '::1',
    'localhost'
  ]

  // 로컬 개발 환경에서는 항상 허용
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  return adminIPs.some(adminIP => ip.includes(adminIP)) ||
         ip.startsWith('192.168.') ||
         ip.startsWith('10.0.') ||
         ip.startsWith('172.16.')
}

// 유지보수 모드 확인 (간단한 캐시와 함께)
let maintenanceCache: { enabled: boolean; lastCheck: number } | null = null
const CACHE_DURATION = 30000 // 30초

async function isMaintenanceMode(): Promise<boolean> {
  // 캐시 확인
  if (maintenanceCache && Date.now() - maintenanceCache.lastCheck < CACHE_DURATION) {
    return maintenanceCache.enabled
  }

  try {
    const supabase = createSupabaseServiceRoleClient()

    const { data, error } = await (supabase as any)
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single()

    if (error) {
      console.error('Middleware: Error checking maintenance mode:', error)
      return false
    }

    const isEnabled = data?.value === 'true'

    // 캐시 업데이트
    maintenanceCache = {
      enabled: isEnabled,
      lastCheck: Date.now()
    }

    return isEnabled
  } catch (error) {
    console.error('Middleware: Error in maintenance mode check:', error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 정적 파일은 건너뛰기
  if (isStaticFile(pathname)) {
    return NextResponse.next()
  }

  // 로그인 페이지는 항상 허용
  if (pathname === '/login') {
    return NextResponse.next()
  }

  try {
    // 관리자 인증이 필요한 경로 확인
    if (requiresAuth(pathname)) {
      const { valid, admin } = await validateAdminAccess(request)

      if (!valid) {
        // 인증되지 않은 경우 로그인 페이지로 리다이렉트
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // 권한 확인
      if (pathname.startsWith('/admin') && admin.role !== 'system_admin') {
        // admin 페이지는 system_admin만 접근 가능
        return NextResponse.redirect(new URL('/manager', request.url))
      }

      if (pathname.startsWith('/manager') && !['hr_manager', 'system_admin'].includes(admin.role)) {
        // manager 페이지는 hr_manager, system_admin 접근 가능
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // 유지보수 모드 확인
    const maintenanceEnabled = await isMaintenanceMode()

    if (maintenanceEnabled) {
      // 관리자 경로이거나 관리자 IP면 통과
      if (isAdminPath(pathname) || isAdminAccess(request)) {
        return NextResponse.next()
      }

      // 이미 유지보수 페이지면 통과
      if (pathname === '/maintenance') {
        return NextResponse.next()
      }

      // 일반 사용자는 유지보수 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }

    // 정상 처리
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // 에러 발생 시 정상 처리 (안전 우선)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

// Node.js runtime을 사용하도록 설정
export const runtime = 'nodejs'