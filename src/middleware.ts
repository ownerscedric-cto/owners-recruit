import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateAdminAccess } from './lib/admin-auth-edge'

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
async function validateAdminAccessMiddleware(request: NextRequest): Promise<{ valid: boolean; admin?: any }> {
  const token = request.cookies.get('admin_token')?.value
  const pathname = request.nextUrl.pathname

  console.log('Middleware cookie token:', token ? 'exists' : 'not found')

  return await validateAdminAccess(token, pathname)
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

// 유지보수 모드 확인 (환경 변수 사용)
function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === 'true'
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
      const { valid, admin } = await validateAdminAccessMiddleware(request)

      if (!valid) {
        // 인증되지 않은 경우 로그인 페이지로 리다이렉트
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // 권한 확인은 이미 validateAdminAccess에서 처리됨
      // 추가 권한 확인이 필요한 경우만 여기서 처리
    }

    // 유지보수 모드 확인
    const maintenanceEnabled = isMaintenanceMode()

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

// Edge runtime을 사용하도록 설정 (더 빠름)
export const runtime = 'experimental-edge'