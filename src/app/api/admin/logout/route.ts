import { NextRequest, NextResponse } from 'next/server'
import { logoutAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      await logoutAdmin(token)
    }

    const response = NextResponse.json({ success: true })

    // 쿠키 제거
    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}