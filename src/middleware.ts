import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseServiceRoleClient } from './lib/supabase'

// 관리자 경로 확인
function isAdminPath(pathname: string): boolean {
  const adminPaths = [
    '/admin',
    '/api/system-settings',
    '/maintenance'
  ]
  return adminPaths.some(path => pathname.startsWith(path))
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
  const ip = forwardedFor?.split(',')[0] || realIP || request.ip || ''

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

    const { data, error } = await supabase
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

  try {
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

    // 유지보수 모드가 아니면 정상 처리
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
     * 다음을 제외한 모든 요청에 대해 실행:
     * - api (API 경로)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘 파일)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}