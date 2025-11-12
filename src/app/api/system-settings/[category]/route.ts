import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { Database } from '@/types/database'

// 카테고리별 설정 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params
    const supabase = createSupabaseServiceRoleClient()

    const { data, error } = await (supabase as any)
      .from('system_settings')
      .select('*')
      .eq('category', category)
      .order('key', { ascending: true })

    if (error) {
      console.error('API Error fetching category settings:', error)
      return NextResponse.json({
        success: false,
        error: `카테고리 설정 조회에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('API Error in category settings GET:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}