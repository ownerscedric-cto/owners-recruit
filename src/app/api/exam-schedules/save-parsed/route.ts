import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 새로운 data_source 값들을 데이터베이스에서 허용하는 값들로 매핑
function mapDataSourceForDatabase(dataSource: string): string {
  const mapping: Record<string, string> = {
    // 종합 파싱 결과
    'comprehensive_match': 'combined',
    'image_internal': 'combined',
    'image_crawled': 'combined',
    'crawled_internal': 'combined',
    'image_only': 'official_only',
    'crawled_only': 'official_only',
    'official_crawled': 'official_only',
    'internal_only': 'internal_only',
    // 스마트 크롤링 결과
    'crawled_grouped': 'combined',
    // 기존 값들 (그대로 유지)
    'combined': 'combined',
    'official_only': 'official_only',
    'manual': 'manual'
  }

  return mapping[dataSource] || 'combined'
}

export async function POST(request: NextRequest) {
  try {
    const { schedules } = await request.json()

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json({
        error: '유효한 일정 배열이 제공되지 않았습니다.'
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const results = []
    const errors = []

    // 각 스케줄을 개별적으로 처리
    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i]

      try {
        // 데이터베이스 함수 호출하여 UPSERT 처리
        const { data, error } = await supabase.rpc('insert_combined_schedule', {
          p_year: schedule.year,
          p_exam_type: schedule.exam_type,
          p_session_number: schedule.session_number,
          p_session_range: schedule.session_range || null,
          p_registration_start_date: schedule.registration_start_date || null,
          p_registration_end_date: schedule.registration_end_date || null,
          p_exam_date: schedule.exam_date || null,
          p_exam_time_start: schedule.exam_time_start || null,
          p_exam_time_end: schedule.exam_time_end || null,
          p_locations: schedule.locations || [],
          p_internal_deadline_date: schedule.internal_deadline_date || null,
          p_internal_deadline_time: schedule.internal_deadline_time || null,
          p_notice_date: schedule.notice_date || null,
          p_notice_time: schedule.notice_time || null,
          p_has_internal_deadline: schedule.has_internal_deadline || false,
          p_data_source: mapDataSourceForDatabase(schedule.data_source || 'combined'),
          p_notes: schedule.notes || null,
          p_combined_notes: schedule.combined_notes || null
        })

        if (error) {
          console.error(`일정 ${i + 1} 저장 오류:`, error)
          errors.push({
            index: i + 1,
            schedule: schedule,
            error: error.message
          })
        } else {
          results.push({
            index: i + 1,
            schedule_id: data,
            schedule: schedule
          })
        }
      } catch (scheduleError) {
        console.error(`일정 ${i + 1} 처리 오류:`, scheduleError)
        errors.push({
          index: i + 1,
          schedule: schedule,
          error: scheduleError instanceof Error ? scheduleError.message : '알 수 없는 오류'
        })
      }
    }

    // 결과 반환
    const response = {
      success: errors.length === 0,
      totalProcessed: schedules.length,
      successCount: results.length,
      errorCount: errors.length,
      results: results,
      errors: errors.length > 0 ? errors : undefined
    }

    if (errors.length > 0 && results.length === 0) {
      // 모든 저장이 실패한 경우
      return NextResponse.json({
        ...response,
        error: '모든 일정 저장에 실패했습니다.'
      }, { status: 500 })
    } else if (errors.length > 0) {
      // 일부 저장이 실패한 경우
      return NextResponse.json({
        ...response,
        warning: `${errors.length}개 일정 저장에 실패했습니다.`
      }, { status: 207 }) // 207 Multi-Status
    } else {
      // 모든 저장이 성공한 경우
      return NextResponse.json(response)
    }

  } catch (error) {
    console.error('일정 저장 처리 오류:', error)
    return NextResponse.json({
      error: '일정 저장 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}