import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { Database } from '@/types/database'

type ExamScheduleUpdate = Database['public']['Tables']['exam_schedules']['Update']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updateData: ExamScheduleUpdate = await request.json()
    const supabase = createSupabaseServiceRoleClient()

    // 빈 문자열을 null로 변환 (PostgreSQL date/time 타입 호환성)
    const dateFields = [
      'registration_start_date',
      'registration_end_date',
      'exam_date',
      'internal_deadline_date',
      'notice_date'
    ]
    const timeFields = [
      'exam_time_start',
      'exam_time_end',
      'internal_deadline_time',
      'notice_time'
    ]
    const stringFields = [
      'session_range',
      'notes',
      'combined_notes'
    ]

    // 날짜 필드: 빈 문자열 -> null
    for (const field of dateFields) {
      if (field in updateData && (updateData as any)[field] === '') {
        (updateData as any)[field] = null
      }
    }

    // 시간 필드: 빈 문자열 -> null
    for (const field of timeFields) {
      if (field in updateData && (updateData as any)[field] === '') {
        (updateData as any)[field] = null
      }
    }

    // 문자열 필드: 빈 문자열 -> null (선택적)
    for (const field of stringFields) {
      if (field in updateData && (updateData as any)[field] === '') {
        (updateData as any)[field] = null
      }
    }

    const { data: schedule, error } = await (supabase as any)
      .from('exam_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('API Error updating exam schedule:', error)
      return NextResponse.json({
        success: false,
        error: `시험 일정 수정에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: schedule
    })
  } catch (error) {
    console.error('API Error in exam schedule PATCH:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createSupabaseServiceRoleClient()

    const { error } = await (supabase as any)
      .from('exam_schedules')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('API Error deleting exam schedule:', error)
      return NextResponse.json({
        success: false,
        error: `시험 일정 삭제에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('API Error in exam schedule DELETE:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}