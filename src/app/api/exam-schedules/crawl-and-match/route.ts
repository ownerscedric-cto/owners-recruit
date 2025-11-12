import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { year, month, internalText } = await request.json()

    if (!year || !month) {
      return NextResponse.json(
        { error: '년도와 월 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log(`크롤링 및 매칭 시작: ${year}년 ${month}월`)

    // 1. 공식 시험일정 크롤링
    const crawlResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/exam-schedules/crawl-official`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month })
    })

    if (!crawlResponse.ok) {
      throw new Error('공식 시험일정 크롤링에 실패했습니다.')
    }

    const crawlData = await crawlResponse.json()
    const officialSchedules = crawlData.data.schedules

    console.log(`크롤링된 공식 일정 수: ${officialSchedules.length}`)

    // 2. 내부 마감일정 파싱 (텍스트가 있는 경우)
    let internalSchedules: any[] = []
    if (internalText && internalText.trim()) {
      const internalResponse = await parseInternalDeadline(internalText)
      internalSchedules = internalResponse
    }

    console.log(`파싱된 내부 일정 수: ${internalSchedules.length}`)

    // 3. 공식 데이터와 내부 일정 매칭
    const combinedSchedules = matchOfficialWithInternal(officialSchedules, internalSchedules)

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        officialSchedules,
        internalSchedules,
        combinedSchedules,
        summary: {
          totalSchedules: combinedSchedules.length,
          officialCount: officialSchedules.length,
          internalCount: internalSchedules.length,
          matchedCount: combinedSchedules.filter(s => s.has_internal_deadline).length
        },
        crawledAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('크롤링 및 매칭 오류:', error)
    return NextResponse.json(
      {
        error: '크롤링 및 매칭 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

async function parseInternalDeadline(text: string): Promise<any[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다.')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `다음은 생명보험협회 보험 설계사 시험 관련 **내부 신청 마감일정 텍스트**입니다.
이 데이터를 분석하여 내부 마감일정 정보를 구조화된 JSON으로 변환하세요.

### 📦 출력 형식 (반드시 아래 JSON 형식으로만 응답)

{
"schedules": [
  {
    "year": 2025,
    "exam_type": "생보",              // 생명보험협회 시험
    "session_range": "1~4차",        // 차수 범위
    "session_numbers": [1, 2, 3, 4], // 해당 차수들
    "internal_deadline_date": "2025-11-04", // 내부 마감일
    "internal_deadline_time": "11:00",      // 마감시간
    "notice_date": "2025-11-07",           // 수험표 공지일
    "notice_time": "14:00",                // 공지시간
    "notes": "본사 자체 신청 마감일"
  }
]
}

### 📐 처리 규칙

1. **내부 신청마감 처리**:
  - "시험접수마감" 문구가 포함된 경우 internal_deadline_date로 인식
  - session_range는 "1~4차", "5~6차" 형태로 추출
  - session_numbers는 해당 차수들을 배열로 [1,2,3,4]
  - internal_deadline_time은 마감시간 (예: "오전 11시" → "11:00")
  - notice_date는 수험표 공지일 (예: "11월 7일" → "2025-11-07")
  - notice_time은 공지시간 (예: "오후 2시" → "14:00")
  - notes에 "본사 자체 신청 마감일" 명시

2. **날짜 형식 변환**:
  - 반드시 "YYYY-MM-DD" 형식으로 변환
  - 월/일 앞에 0을 붙임 (예: 11월 4일 → "2025-11-04")

3. **시간 변환**:
  - **시간 추출**: "오전 11시" → "11:00", "오후 2시" → "14:00" 등 정확히 변환
  - 시간이 명시되지 않으면 10:00 기본값 사용
  - 24시간 표기법으로 변환

4. **시험 종류**:
  - 기본값: "생보" (생명보험협회 시험)
  - 필요 시 "손보", "제3보험"으로 변경 가능

5. **예시**:
  - 입력 텍스트: "1~4차 시험접수마감: 11월 4일(화) 오전 11시"
    → session_range = "1~4차", session_numbers = [1,2,3,4], internal_deadline_date = "2025-11-04", internal_deadline_time = "11:00"

### ⚙️ 출력 규칙
- JSON 외의 텍스트, 주석, 설명 등을 절대 포함하지 말 것
- 배열 내 각 객체는 **마감일정별로 구분**

출력은 반드시 완전한 JSON이어야 합니다.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API 오류 (${response.status})`)
    }

    const result = await response.json()
    const aiResponse = result.choices?.[0]?.message?.content

    if (!aiResponse) {
      throw new Error('AI에서 응답을 생성하지 못했습니다.')
    }

    let cleanResponse = aiResponse.trim()
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/\s*```$/, '')
    }
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/\s*```$/, '')
    }

    const parsedData = JSON.parse(cleanResponse)

    if (!parsedData.schedules || !Array.isArray(parsedData.schedules)) {
      throw new Error('유효한 일정 데이터가 생성되지 않았습니다.')
    }

    return parsedData.schedules
  } catch (error) {
    console.error('내부 마감일정 파싱 오류:', error)
    throw new Error(`내부 마감일정을 파싱할 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  }
}

function matchOfficialWithInternal(officialSchedules: any[], internalSchedules: any[]): any[] {
  const combinedSchedules: any[] = []

  // 1. 공식 시험일정을 기본으로 사용
  for (const officialSchedule of officialSchedules) {
    // 해당 시험 종류와 차수에 맞는 내부 마감일정 찾기
    const matchingInternal = internalSchedules.find(internal =>
      internal.exam_type === officialSchedule.exam_type &&
      internal.session_numbers?.includes(officialSchedule.session_number)
    )

    combinedSchedules.push({
      // 공식 시험일정 정보 (크롤링된 정확한 데이터)
      ...officialSchedule,
      // 내부 마감일정 정보 추가
      session_range: matchingInternal?.session_range || null,
      internal_deadline_date: matchingInternal?.internal_deadline_date || null,
      internal_deadline_time: matchingInternal?.internal_deadline_time || null,
      notice_date: matchingInternal?.notice_date || null,
      notice_time: matchingInternal?.notice_time || null,
      // 메타 정보
      has_internal_deadline: !!matchingInternal,
      data_source: matchingInternal ? 'crawled_combined' : 'official_crawled',
      combined_notes: [
        officialSchedule.notes || '공식 시험일정 (크롤링)',
        matchingInternal?.notes
      ].filter(Boolean).join(' | ')
    })
  }

  // 2. 매칭되지 않은 내부 마감일정들도 별도로 추가
  for (const internal of internalSchedules) {
    const sessionNumbers = internal.session_numbers || []

    for (const sessionNumber of sessionNumbers) {
      const alreadyMatched = combinedSchedules.some(combined =>
        combined.exam_type === internal.exam_type &&
        combined.session_number === sessionNumber
      )

      if (!alreadyMatched) {
        // 내부 마감일정만 있는 경우 (공식 일정이 아직 발표되지 않은 경우)
        combinedSchedules.push({
          year: internal.year,
          exam_type: internal.exam_type,
          session_number: sessionNumber,
          session_range: internal.session_range,
          // 공식 정보는 null (아직 발표되지 않음)
          region: null,
          exam_date: null,
          registration_period: null,
          result_date: null,
          exam_time_start: null,
          exam_time_end: null,
          locations: [], // 공식 발표 전까지는 빈 배열
          // 내부 마감일정 정보
          internal_deadline_date: internal.internal_deadline_date,
          internal_deadline_time: internal.internal_deadline_time,
          notice_date: internal.notice_date,
          notice_time: internal.notice_time,
          // 메타 정보
          has_internal_deadline: true,
          data_source: 'internal_only',
          notes: internal.notes,
          combined_notes: internal.notes
        })
      }
    }
  }

  return combinedSchedules
}