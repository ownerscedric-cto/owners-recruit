import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { Database } from '@/types/database'

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient()
    const { applicantId, appointmentDeadline } = await request.json()

    if (!applicantId) {
      return NextResponse.json(
        { success: false, error: '지원자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase as any)
      .from('applicants')
      .update({
        appointment_deadline: appointmentDeadline || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicantId)
      .select()

    if (error) {
      console.error('위촉 마감일 업데이트 오류:', error)
      return NextResponse.json(
        { success: false, error: '위촉 마감일 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data[0]
    })

  } catch (error) {
    console.error('위촉 마감일 업데이트 API 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}