import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const supabase = createSupabaseServiceRoleClient()

    let query = (supabase as any)
      .from('recruiters')
      .select('*')

    // activeOnly 파라미터가 true면 활성 모집인만 조회
    if (activeOnly) {
      query = query.eq('active', true)
    }

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) {
      console.error('API Error fetching recruiters:', error)
      return NextResponse.json({
        success: false,
        error: `모집인 목록 조회에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    // 직급별 정렬 (지점장 > 부지점장 > 팀장), 같은 직급 내에서는 생성일순
    const positionOrder = { '지점장': 1, '부지점장': 2, '팀장': 3 }
    const sortedData = data?.sort((a: any, b: any) => {
      const aPosition = positionOrder[a.position as keyof typeof positionOrder] || 4
      const bPosition = positionOrder[b.position as keyof typeof positionOrder] || 4

      if (aPosition !== bPosition) {
        return aPosition - bPosition
      }

      // 같은 직급이면 생성일순
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    return NextResponse.json({
      success: true,
      data: sortedData
    })
  } catch (error) {
    console.error('API Error in recruiters GET:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const supabase = createSupabaseServiceRoleClient()

    // 모집인 생성 시 기본적으로 활성 상태로 설정
    const recruiterData = {
      ...data,
      active: data.active !== undefined ? data.active : true,
      position: data.position || '팀장'  // 기본 직급을 팀장으로 설정
    }

    // @ts-ignore - Supabase 타입 정의 이슈로 인한 임시 우회
    const { data: recruiter, error } = await (supabase as any)
      .from('recruiters')
      .insert([recruiterData])
      .select()
      .single()

    if (error) {
      console.error('API Error creating recruiter:', error)
      return NextResponse.json({
        success: false,
        error: `모집인 등록에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: recruiter
    })
  } catch (error) {
    console.error('API Error in recruiters POST:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}