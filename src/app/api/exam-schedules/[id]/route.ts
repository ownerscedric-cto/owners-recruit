import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const supabase = createSupabaseServiceRoleClient()

    // @ts-ignore - Supabase 타입 정의 이슈로 인한 임시 우회
    const { data: schedule, error } = await supabase
      .from('exam_schedules')
      .update(data)
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

    const { error } = await supabase
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