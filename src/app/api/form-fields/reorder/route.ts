import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'
import { Database } from '@/types/database'

// 폼 필드 순서 변경
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { field_ids } = data

    if (!Array.isArray(field_ids) || field_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: '필드 ID 목록은 필수입니다.'
      }, { status: 400 })
    }

    debugLog.info('Form fields reorder request started', { fieldCount: field_ids.length }, 'API/form-fields/reorder')
    const supabase = createSupabaseServiceRoleClient()

    // 트랜잭션으로 순서 업데이트
    const updates = field_ids.map((fieldId: string, index: number) => ({
      id: fieldId,
      display_order: index + 1
    }))

    // 각 필드의 display_order 업데이트
    const updatePromises = updates.map(({ id, display_order }) =>
      (supabase as any)
        .from('form_fields')
        .update({ display_order })
        .eq('id', id)
    )

    const results = await Promise.all(updatePromises)

    // 오류 확인
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      debugLog.error('Database error reordering form fields', errors, 'API/form-fields/reorder')
      console.error('API Error reordering form fields:', errors)
      return NextResponse.json({
        success: false,
        error: '폼 필드 순서 변경에 실패했습니다.'
      }, { status: 500 })
    }

    debugLog.info('Form fields reordered successfully', { fieldCount: field_ids.length }, 'API/form-fields/reorder')
    return NextResponse.json({
      success: true,
      message: '폼 필드 순서가 성공적으로 변경되었습니다.'
    })
  } catch (error) {
    debugLog.error('Unexpected error in form fields reorder', error, 'API/form-fields/reorder')
    console.error('API Error in form fields reorder:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}