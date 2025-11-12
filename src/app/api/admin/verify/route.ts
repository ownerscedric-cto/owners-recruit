import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      )
    }

    const admin = await validateAdminSession(token)

    if (admin) {
      return NextResponse.json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Verify API error:', error)
    return NextResponse.json(
      { success: false, error: 'Token verification failed' },
      { status: 500 }
    )
  }
}