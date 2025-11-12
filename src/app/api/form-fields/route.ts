import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'

// 폼 필드 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const visibleOnly = searchParams.get('visible') === 'true'
    const formType = searchParams.get('form_type') // 'common', 'new', 'experienced', 또는 null

    debugLog.info('Form fields GET request started', { visibleOnly, formType }, 'API/form-fields')
    const supabase = createSupabaseServiceRoleClient()

    let query = supabase
      .from('form_fields')
      .select('*')

    // visibleOnly 파라미터가 true면 가시적인 필드만 조회
    if (visibleOnly) {
      query = query.eq('visible', true)
    }

    // formType 파라미터가 있으면 해당 타입과 공통 필드만 조회
    if (formType) {
      query = query.in('form_type', ['common', formType])
    }

    const { data, error } = await query.order('display_order', { ascending: true })

    if (error) {
      debugLog.error('Database error fetching form fields', error, 'API/form-fields')
      console.error('API Error fetching form fields:', error)
      return NextResponse.json({
        success: false,
        error: `폼 필드 목록 조회에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('Form fields retrieved successfully', { fieldCount: data?.length || 0 }, 'API/form-fields')
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    debugLog.error('Unexpected error in form fields GET', error, 'API/form-fields')
    console.error('API Error in form fields GET:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// 새 폼 필드 생성
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    debugLog.info('Form field creation request started', { fieldName: data.field_name }, 'API/form-fields')

    // 필수 필드 검증
    if (!data.field_name || !data.label || !data.field_type) {
      return NextResponse.json({
        success: false,
        error: '필드명, 라벨, 필드 타입은 필수입니다.'
      }, { status: 400 })
    }

    const supabase = createSupabaseServiceRoleClient()

    // 필드명 중복 검사
    const { data: existingField, error: checkError } = await supabase
      .from('form_fields')
      .select('id')
      .eq('field_name', data.field_name)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      debugLog.error('Database error checking field name', checkError, 'API/form-fields')
      return NextResponse.json({
        success: false,
        error: `필드명 중복 검사에 실패했습니다: ${checkError.message}`
      }, { status: 500 })
    }

    if (existingField) {
      return NextResponse.json({
        success: false,
        error: '이미 존재하는 필드명입니다.'
      }, { status: 400 })
    }

    // display_order가 없으면 마지막 순서로 설정
    if (data.display_order === undefined) {
      const { data: maxOrderData } = await supabase
        .from('form_fields')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)

      data.display_order = (maxOrderData?.[0]?.display_order || 0) + 1
    }

    // 폼 필드 생성
    const fieldData = {
      field_name: data.field_name,
      label: data.label,
      field_type: data.field_type,
      required: data.required !== undefined ? data.required : false,
      visible: data.visible !== undefined ? data.visible : true,
      placeholder: data.placeholder || null,
      description: data.description || null,
      options: data.options || null,
      validation_rules: data.validation_rules || null,
      display_order: data.display_order,
      form_type: data.form_type || 'common',
      step_id: data.step_id || null
    }

    const { data: newField, error } = await supabase
      .from('form_fields')
      .insert(fieldData)
      .select()
      .single()

    if (error) {
      debugLog.error('Database error creating form field', error, 'API/form-fields')
      console.error('API Error creating form field:', error)
      return NextResponse.json({
        success: false,
        error: `폼 필드 생성에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('Form field created successfully', { fieldId: newField.id, fieldName: newField.field_name }, 'API/form-fields')
    return NextResponse.json({
      success: true,
      data: newField
    }, { status: 201 })
  } catch (error) {
    debugLog.error('Unexpected error in form field creation', error, 'API/form-fields')
    console.error('API Error in form field creation:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}