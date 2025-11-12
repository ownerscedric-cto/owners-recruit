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
    const { data: recruiter, error } = await supabase
      .from('recruiters')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('API Error updating recruiter:', error)
      return NextResponse.json({
        success: false,
        error: `모집인 정보 수정에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: recruiter
    })
  } catch (error) {
    console.error('API Error in recruiter PATCH:', error)
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

    // 먼저 이 모집인과 연결된 지원자가 있는지 확인
    const { data: applicants, error: checkError } = await supabase
      .from('applicants')
      .select('id')
      .eq('recruiter_id', id)
      .limit(1)

    if (checkError) {
      return NextResponse.json({
        success: false,
        error: `연결된 지원자 확인에 실패했습니다: ${checkError.message}`
      }, { status: 500 })
    }

    if (applicants && applicants.length > 0) {
      return NextResponse.json({
        success: false,
        error: '이 모집인과 연결된 지원자가 있어 삭제할 수 없습니다. 먼저 연결을 해제하거나 비활성화하세요.'
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('recruiters')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('API Error deleting recruiter:', error)
      return NextResponse.json({
        success: false,
        error: `모집인 삭제에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('API Error in recruiter DELETE:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}