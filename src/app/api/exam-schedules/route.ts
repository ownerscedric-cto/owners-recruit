import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const exam_type = searchParams.get('exam_type')

    let query = (supabase as any)
      .from('exam_schedules')
      .select('*')
      .order('exam_date', { ascending: true })

    if (year) {
      query = query.eq('year', year)
    }
    if (exam_type) {
      query = query.eq('exam_type', exam_type)
    }

    const { data, error } = await query

    if (error) {
      console.error('API Error fetching exam schedules:', error)
      return NextResponse.json({
        success: false,
        error: `시험 일정 조회에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('API Error in exam schedules GET:', error)
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

    const { data: schedule, error } = await (supabase as any)
      .from('exam_schedules')
      .insert([data])
      .select()
      .single()

    if (error) {
      console.error('API Error creating exam schedule:', error)
      return NextResponse.json({
        success: false,
        error: `시험 일정 등록에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: schedule
    })
  } catch (error) {
    console.error('API Error in exam schedules POST:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}