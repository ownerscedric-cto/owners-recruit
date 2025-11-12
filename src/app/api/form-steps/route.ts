import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'
import { Database } from '@/types/database'

// 폼 단계 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formType = searchParams.get('form_type') // 'common', 'new', 'experienced', 또는 null

    debugLog.info('Form steps GET request started', { formType }, 'API/form-steps')
    const supabase = createSupabaseServiceRoleClient()

    let query = (supabase as any)
      .from('form_steps')
      .select('*')
      .eq('is_active', true)

    // formType 파라미터가 있으면 해당 타입과 공통 단계만 조회
    if (formType) {
      query = query.in('form_type', ['common', formType])
    }

    const { data, error } = await query.order('step_order', { ascending: true })

    if (error) {
      debugLog.error('Database error fetching form steps', error, 'API/form-steps')
      console.error('API Error fetching form steps:', error)
      return NextResponse.json({
        success: false,
        error: `폼 단계 목록 조회에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('Form steps retrieved successfully', { stepCount: data?.length || 0 }, 'API/form-steps')
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    debugLog.error('Unexpected error in form steps GET', error, 'API/form-steps')
    console.error('API Error in form steps GET:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// 새 폼 단계 생성
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    debugLog.info('Form step creation request started', { stepName: data.step_name }, 'API/form-steps')

    // 필수 필드 검증
    if (!data.step_name || !data.step_label || !data.form_type) {
      return NextResponse.json({
        success: false,
        error: '단계명, 라벨, 폼 타입은 필수입니다.'
      }, { status: 400 })
    }

    const supabase = createSupabaseServiceRoleClient()

    // step_order가 없으면 마지막 순서로 설정
    if (data.step_order === undefined) {
      const { data: maxOrderData } = await (supabase as any)
        .from('form_steps')
        .select('step_order')
        .eq('form_type', data.form_type)
        .eq('is_active', true)
        .order('step_order', { ascending: false })
        .limit(1)

      data.step_order = (maxOrderData?.[0]?.step_order || 0) + 1
    }

    // 폼 단계 생성
    const stepData = {
      step_name: data.step_name,
      step_label: data.step_label,
      step_description: data.step_description || null,
      step_order: data.step_order,
      form_type: data.form_type,
      step_icon: data.step_icon || 'user',
      is_active: data.is_active !== undefined ? data.is_active : true
    }

    const { data: newStep, error } = await (supabase as any)
      .from('form_steps')
      .insert(stepData)
      .select()
      .single()

    if (error) {
      debugLog.error('Database error creating form step', error, 'API/form-steps')
      console.error('API Error creating form step:', error)
      return NextResponse.json({
        success: false,
        error: `폼 단계 생성에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('Form step created successfully', { stepId: newStep.id, stepName: newStep.step_name }, 'API/form-steps')
    return NextResponse.json({
      success: true,
      data: newStep
    }, { status: 201 })
  } catch (error) {
    debugLog.error('Unexpected error in form step creation', error, 'API/form-steps')
    console.error('API Error in form step creation:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}