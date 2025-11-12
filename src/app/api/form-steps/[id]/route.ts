import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'

// 폼 단계 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    debugLog.info('Form step update request started', { stepId: id }, 'API/form-steps')

    const supabase = createSupabaseServiceRoleClient()

    // 단계 존재 확인
    const { data: existingStep, error: checkError } = await supabase
      .from('form_steps')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingStep) {
      return NextResponse.json({
        success: false,
        error: '존재하지 않는 단계입니다.'
      }, { status: 404 })
    }

    // 수정할 데이터만 추출
    const updateData: any = {}
    if (data.step_name !== undefined) updateData.step_name = data.step_name
    if (data.step_label !== undefined) updateData.step_label = data.step_label
    if (data.step_description !== undefined) updateData.step_description = data.step_description
    if (data.step_order !== undefined) updateData.step_order = data.step_order
    if (data.form_type !== undefined) updateData.form_type = data.form_type
    if (data.step_icon !== undefined) updateData.step_icon = data.step_icon
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    // 빈 업데이트 방지
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: '수정할 데이터가 없습니다.'
      }, { status: 400 })
    }

    const { data: updatedStep, error } = await supabase
      .from('form_steps')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      debugLog.error('Database error updating form step', error, 'API/form-steps')
      console.error('API Error updating form step:', error)
      return NextResponse.json({
        success: false,
        error: `폼 단계 수정에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('Form step updated successfully', { stepId: id }, 'API/form-steps')
    return NextResponse.json({
      success: true,
      data: updatedStep
    })
  } catch (error) {
    debugLog.error('Unexpected error in form step update', error, 'API/form-steps')
    console.error('API Error in form step update:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// 폼 단계 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    debugLog.info('Form step deletion request started', { stepId: id }, 'API/form-steps')

    const supabase = createSupabaseServiceRoleClient()

    // 단계 존재 확인
    const { data: existingStep, error: checkError } = await supabase
      .from('form_steps')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingStep) {
      return NextResponse.json({
        success: false,
        error: '존재하지 않는 단계입니다.'
      }, { status: 404 })
    }

    // 이 단계에 할당된 필드들의 step_id를 null로 설정
    const { error: updateFieldsError } = await supabase
      .from('form_fields')
      .update({ step_id: null })
      .eq('step_id', id)

    if (updateFieldsError) {
      debugLog.error('Error updating fields when deleting step', updateFieldsError, 'API/form-steps')
      console.warn('Warning: Failed to update fields when deleting step:', updateFieldsError)
    }

    // 단계 삭제
    const { error } = await supabase
      .from('form_steps')
      .delete()
      .eq('id', id)

    if (error) {
      debugLog.error('Database error deleting form step', error, 'API/form-steps')
      console.error('API Error deleting form step:', error)
      return NextResponse.json({
        success: false,
        error: `폼 단계 삭제에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('Form step deleted successfully', { stepId: id }, 'API/form-steps')
    return NextResponse.json({
      success: true,
      message: '폼 단계가 성공적으로 삭제되었습니다.'
    })
  } catch (error) {
    debugLog.error('Unexpected error in form step deletion', error, 'API/form-steps')
    console.error('API Error in form step deletion:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}