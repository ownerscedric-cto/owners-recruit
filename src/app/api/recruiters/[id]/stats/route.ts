import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createSupabaseServiceRoleClient()

    const { data, error } = await supabase
      .from('applicants')
      .select('status')
      .eq('recruiter_id', id)

    if (error) {
      console.error('API Error fetching recruiter stats:', error)
      return NextResponse.json({
        success: false,
        error: `모집인 통계 조회에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    const stats = {
      total: data.length,
      // @ts-ignore - Supabase 타입 정의 이슈로 인한 임시 우회
      pending: data.filter(a => a.status === 'pending').length,
      // @ts-ignore - Supabase 타입 정의 이슈로 인한 임시 우회
      reviewing: data.filter(a => a.status === 'reviewing').length,
      // @ts-ignore - Supabase 타입 정의 이슈로 인한 임시 우회
      approved: data.filter(a => a.status === 'approved').length,
      // @ts-ignore - Supabase 타입 정의 이슈로 인한 임시 우회
      rejected: data.filter(a => a.status === 'rejected').length,
      // @ts-ignore - Supabase 타입 정의 이슈로 인한 임시 우회
      completed: data.filter(a => a.status === 'completed').length,
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('API Error in recruiter stats GET:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}