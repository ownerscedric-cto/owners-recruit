import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    console.log('Login attempt:', { username, password: '***' })

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '사용자명과 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    const result = await authenticateAdmin(username, password)
    console.log('Authentication result:', { success: result.success, error: result.error })

    if (result.success) {
      const response = NextResponse.json({
        success: true,
        admin: {
          id: result.admin!.id,
          username: result.admin!.username,
          email: result.admin!.email,
          role: result.admin!.role
        },
        token: result.token
      })

      // HTTP-only 쿠키로도 토큰 설정
      response.cookies.set('admin_token', result.token!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24시간
        path: '/'
      })

      return response
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { success: false, error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}