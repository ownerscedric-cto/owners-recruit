import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { schedules } = await request.json()
    const supabase = createSupabaseServiceRoleClient()

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json({
        success: false,
        error: '유효한 시험 일정 배열이 필요합니다.'
      }, { status: 400 })
    }

    const { data: createdSchedules, error } = await (supabase as any)
      .from('exam_schedules')
      .insert(schedules)
      .select()

    if (error) {
      console.error('API Error creating bulk exam schedules:', error)
      return NextResponse.json({
        success: false,
        error: `시험 일정 일괄 등록에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: createdSchedules,
      count: createdSchedules.length
    })
  } catch (error) {
    console.error('API Error in bulk exam schedules POST:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}