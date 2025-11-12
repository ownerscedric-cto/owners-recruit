import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'

// 폼 단계 순서 변경
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { step_ids } = data

    debugLog.info('Form steps reorder request started', { stepCount: step_ids?.length }, 'API/form-steps')

    if (!Array.isArray(step_ids) || step_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: '단계 ID 배열이 필요합니다.'
      }, { status: 400 })
    }

    const supabase = createSupabaseServiceRoleClient()

    // 트랜잭션처럼 동작하도록 순차적으로 업데이트
    const updatePromises = step_ids.map((stepId: string, index: number) =>
      supabase
        .from('form_steps')
        .update({ step_order: index + 1 })
        .eq('id', stepId)
    )

    const results = await Promise.all(updatePromises)

    // 에러 체크
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      debugLog.error('Database error reordering form steps', errors[0].error, 'API/form-steps')
      console.error('API Error reordering form steps:', errors[0].error)
      return NextResponse.json({
        success: false,
        error: `폼 단계 순서 변경에 실패했습니다: ${errors[0].error.message}`
      }, { status: 500 })
    }

    debugLog.info('Form steps reordered successfully', { stepCount: step_ids.length }, 'API/form-steps')
    return NextResponse.json({
      success: true,
      message: '폼 단계 순서가 성공적으로 변경되었습니다.'
    })
  } catch (error) {
    debugLog.error('Unexpected error in form steps reorder', error, 'API/form-steps')
    console.error('API Error in form steps reorder:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}