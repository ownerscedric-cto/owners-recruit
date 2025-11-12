import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'
import { Database } from '@/types/database'

// 특정 폼 필드 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    debugLog.info('Form field GET request started', { fieldId: id }, 'API/form-fields')
    const supabase = createSupabaseServiceRoleClient()

    const { data, error } = await (supabase as any)
      .from('form_fields')
      .select('*')
      .eq('id', id)
      .single()

    const typedData = data as Database['public']['Tables']['form_fields']['Row'] | null

    if (error) {
      debugLog.error('Database error fetching form field', error, 'API/form-fields')
      console.error('API Error fetching form field:', error)
      return NextResponse.json({
        success: false,
        error: `폼 필드 조회에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    if (!typedData) {
      return NextResponse.json({
        success: false,
        error: '폼 필드를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    debugLog.info('Form field retrieved successfully', { fieldId: id, fieldName: typedData.field_name }, 'API/form-fields')
    return NextResponse.json({
      success: true,
      data: typedData
    })
  } catch (error) {
    debugLog.error('Unexpected error in form field GET', error, 'API/form-fields')
    console.error('API Error in form field GET:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// 폼 필드 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    debugLog.info('Form field update request started', { fieldId: id }, 'API/form-fields')

    const supabase = createSupabaseServiceRoleClient()

    // 폼 필드 존재 확인
    const { data: existingField, error: fetchError } = await (supabase as any)
      .from('form_fields')
      .select('*')
      .eq('id', id)
      .single()

    const typedExistingField = existingField as Database['public']['Tables']['form_fields']['Row'] | null

    if (fetchError || !typedExistingField) {
      return NextResponse.json({
        success: false,
        error: '폼 필드를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 필드명이 변경되는 경우 중복 검사
    if (data.field_name && data.field_name !== typedExistingField.field_name) {
      const { data: duplicateField, error: checkError } = await (supabase as any)
        .from('form_fields')
        .select('id')
        .eq('field_name', data.field_name)
        .neq('id', id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        debugLog.error('Database error checking field name', checkError, 'API/form-fields')
        return NextResponse.json({
          success: false,
          error: `필드명 중복 검사에 실패했습니다: ${checkError.message}`
        }, { status: 500 })
      }

      if (duplicateField) {
        return NextResponse.json({
          success: false,
          error: '이미 존재하는 필드명입니다.'
        }, { status: 400 })
      }
    }

    // 업데이트할 데이터 준비
    const updateData: any = {}
    if (data.field_name !== undefined) updateData.field_name = data.field_name
    if (data.label !== undefined) updateData.label = data.label
    if (data.field_type !== undefined) updateData.field_type = data.field_type
    if (data.required !== undefined) updateData.required = data.required
    if (data.visible !== undefined) updateData.visible = data.visible
    if (data.placeholder !== undefined) updateData.placeholder = data.placeholder
    if (data.description !== undefined) updateData.description = data.description
    if (data.options !== undefined) updateData.options = data.options
    if (data.validation_rules !== undefined) updateData.validation_rules = data.validation_rules
    if (data.display_order !== undefined) updateData.display_order = data.display_order
    if (data.form_type !== undefined) updateData.form_type = data.form_type
    if (data.step_id !== undefined) updateData.step_id = data.step_id

    // 폼 필드 정보 업데이트
    const { data: updatedField, error } = await (supabase as any)
      .from('form_fields')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    const typedUpdatedField = updatedField as Database['public']['Tables']['form_fields']['Row'] | null

    if (error) {
      debugLog.error('Database error updating form field', error, 'API/form-fields')
      console.error('API Error updating form field:', error)
      return NextResponse.json({
        success: false,
        error: `폼 필드 정보 수정에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('Form field updated successfully', { fieldId: id, fieldName: typedUpdatedField?.field_name }, 'API/form-fields')
    return NextResponse.json({
      success: true,
      data: typedUpdatedField
    })
  } catch (error) {
    debugLog.error('Unexpected error in form field update', error, 'API/form-fields')
    console.error('API Error in form field update:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// 폼 필드 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    debugLog.info('Form field deletion request started', { fieldId: id }, 'API/form-fields')

    const supabase = createSupabaseServiceRoleClient()

    // 폼 필드 존재 확인
    const { data: existingField, error: fetchError } = await (supabase as any)
      .from('form_fields')
      .select('*')
      .eq('id', id)
      .single()

    const typedExistingFieldForDelete = existingField as Database['public']['Tables']['form_fields']['Row'] | null

    if (fetchError || !typedExistingFieldForDelete) {
      return NextResponse.json({
        success: false,
        error: '폼 필드를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 폼 필드 삭제
    const { error } = await (supabase as any)
      .from('form_fields')
      .delete()
      .eq('id', id)

    if (error) {
      debugLog.error('Database error deleting form field', error, 'API/form-fields')
      console.error('API Error deleting form field:', error)
      return NextResponse.json({
        success: false,
        error: `폼 필드 삭제에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('Form field deleted successfully', { fieldId: id, fieldName: typedExistingFieldForDelete.field_name }, 'API/form-fields')
    return NextResponse.json({
      success: true,
      message: '폼 필드가 성공적으로 삭제되었습니다.'
    })
  } catch (error) {
    debugLog.error('Unexpected error in form field deletion', error, 'API/form-fields')
    console.error('API Error in form field deletion:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}