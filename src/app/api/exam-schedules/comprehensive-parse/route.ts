import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File | null
    const text = formData.get('text') as string | null
    const year = parseInt(formData.get('year') as string) || new Date().getFullYear()
    const month = parseInt(formData.get('month') as string) || new Date().getMonth() + 1

    console.log(`종합 파싱 시작: ${year}년 ${month}월`)

    let imageSchedules: any[] = []
    let crawledSchedules: any[] = []
    let internalSchedules: any[] = []
    let extractedImageText = ''

    // 1. 이미지에서 차수별 상세 정보 추출
    if (image) {
      try {
        console.log('이미지에서 차수 정보 추출 중...')
        const imageResult = await parseImageForSessionDetails(image)
        imageSchedules = imageResult.schedules
        extractedImageText = imageResult.extractedText
      } catch (error) {
        console.error('이미지 파싱 오류:', error)
      }
    }

    // 2. 공식 사이트 크롤링으로 기본 정보 수집
    try {
      console.log('공식 사이트 크롤링 중...')
      const crawlResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/exam-schedules/crawl-official`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month })
      })

      if (crawlResponse.ok) {
        const crawlData = await crawlResponse.json()
        crawledSchedules = crawlData.data?.schedules || []
      }
    } catch (error) {
      console.error('크롤링 오류:', error)
    }

    // 3. 내부 마감일정 파싱
    if (text && text.trim()) {
      try {
        console.log('내부 마감일정 파싱 중...')
        internalSchedules = await parseInternalDeadline(text)
      } catch (error) {
        console.error('내부 일정 파싱 오류:', error)
      }
    }

    // 4. 3방 데이터 종합 매칭
    const comprehensiveSchedules = performComprehensiveMatching({
      imageSchedules,
      crawledSchedules,
      internalSchedules
    })

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        extractedImageText,
        providedText: text,
        imageSchedules,
        crawledSchedules,
        internalSchedules,
        comprehensiveSchedules,
        summary: {
          totalSchedules: comprehensiveSchedules.length,
          imageCount: imageSchedules.length,
          crawledCount: crawledSchedules.length,
          internalCount: internalSchedules.length,
          fullyMatchedCount: comprehensiveSchedules.filter(s =>
            s.data_source === 'comprehensive_match').length
        },
        processedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('종합 파싱 오류:', error)
    return NextResponse.json(
      {
        error: '종합 파싱 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

// 이미지에서 차수별 상세 정보 추출
async function parseImageForSessionDetails(file: File) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다.')
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = file.type || 'image/jpeg'

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `이 이미지는 보험설계사 시험일정표입니다.

차수별 상세 정보를 정확히 추출해주세요:

1. **차수 정보**: 1차, 2차, 3차... 등
2. **시험 날짜**: 각 차수별 정확한 시험일
3. **지역 정보**: 각 차수별 시험 지역
4. **시간 정보**: 시험 시간 (있다면)

다음 JSON 형식으로 응답해주세요:
{
  "extractedText": "전체 이미지 텍스트",
  "schedules": [
    {
      "year": 2025,
      "exam_type": "생보",
      "session_number": 1,
      "exam_date": "2025-11-10",
      "exam_time_start": "10:00",
      "exam_time_end": "12:00",
      "locations": ["서울", "인천", "제주"],
      "notes": "이미지에서 추출된 차수별 정보",
      "data_source": "image_extracted"
    }
  ]
}

지역 매핑 규칙:
- 수도권 → ["서울", "인천", "제주"]
- 영남 → ["부산", "울산"]
- 대구 → ["대구"]
- 호남 → ["광주", "전주"]
- 중부 → ["대전", "서산"]
- 원주 → ["원주", "강릉", "춘천"]`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API 오류 (${response.status})`)
    }

    const result = await response.json()
    const aiResponse = result.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('이미지에서 정보를 추출할 수 없습니다.')
    }

    let cleanResponse = aiResponse.trim()
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/\s*```$/, '')
    }
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/\s*```$/, '')
    }

    const parsedData = JSON.parse(cleanResponse)

    return {
      extractedText: parsedData.extractedText || '',
      schedules: parsedData.schedules || []
    }
  } catch (error) {
    console.error('이미지 차수 정보 추출 오류:', error)
    return {
      extractedText: '',
      schedules: []
    }
  }
}

// 내부 마감일정 파싱 (기존과 동일)
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
            content: `내부 마감일정 텍스트를 파싱하여 JSON으로 변환하세요.

출력 형식:
{
  "schedules": [
    {
      "year": 2025,
      "exam_type": "생보",
      "session_range": "1~4차",
      "session_numbers": [1, 2, 3, 4],
      "internal_deadline_date": "2025-11-04",
      "internal_deadline_time": "11:00",
      "notice_date": "2025-11-07",
      "notice_time": "14:00",
      "notes": "본사 자체 신청 마감일"
    }
  ]
}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API 오류 (${response.status})`)
    }

    const result = await response.json()
    const aiResponse = result.choices?.[0]?.message?.content

    if (!aiResponse) {
      throw new Error('내부 일정을 파싱할 수 없습니다.')
    }

    let cleanResponse = aiResponse.trim()
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/\s*```$/, '')
    }
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/\s*```$/, '')
    }

    const parsedData = JSON.parse(cleanResponse)
    return parsedData.schedules || []
  } catch (error) {
    console.error('내부 마감일정 파싱 오류:', error)
    return []
  }
}

// 3방 데이터 종합 매칭
function performComprehensiveMatching({
  imageSchedules,
  crawledSchedules,
  internalSchedules
}: {
  imageSchedules: any[]
  crawledSchedules: any[]
  internalSchedules: any[]
}): any[] {
  const comprehensiveSchedules: any[] = []
  const processedSessions = new Set<string>()

  // 우선순위: 이미지 > 크롤링 > 내부 일정

  // 1. 이미지 데이터를 기준으로 매칭
  for (const imageSchedule of imageSchedules) {
    const sessionKey = `${imageSchedule.exam_type}-${imageSchedule.session_number}`

    // 크롤링 데이터에서 매칭되는 정보 찾기
    const matchingCrawled = crawledSchedules.find(crawled =>
      crawled.exam_type === imageSchedule.exam_type &&
      crawled.session_number === imageSchedule.session_number
    )

    // 내부 일정에서 매칭되는 정보 찾기
    const matchingInternal = internalSchedules.find(internal =>
      internal.exam_type === imageSchedule.exam_type &&
      internal.session_numbers?.includes(imageSchedule.session_number)
    )

    comprehensiveSchedules.push({
      // 이미지 데이터 우선 (가장 정확한 차수 정보)
      ...imageSchedule,
      // 크롤링 데이터로 보완 (지역, 접수기간 등)
      registration_period: matchingCrawled?.registration_period || null,
      result_date: matchingCrawled?.result_date || null,
      // 내부 일정 정보 추가
      session_range: matchingInternal?.session_range || null,
      internal_deadline_date: matchingInternal?.internal_deadline_date || null,
      internal_deadline_time: matchingInternal?.internal_deadline_time || null,
      notice_date: matchingInternal?.notice_date || null,
      notice_time: matchingInternal?.notice_time || null,
      // 메타 정보
      has_internal_deadline: !!matchingInternal,
      data_source: matchingInternal && matchingCrawled ? 'comprehensive_match' :
                   matchingInternal ? 'image_internal' :
                   matchingCrawled ? 'image_crawled' : 'image_only',
      combined_notes: [
        imageSchedule.notes || '이미지 추출',
        matchingCrawled?.notes,
        matchingInternal?.notes
      ].filter(Boolean).join(' | ')
    })

    processedSessions.add(sessionKey)
  }

  // 2. 크롤링만 있는 데이터 추가
  for (const crawledSchedule of crawledSchedules) {
    const sessionKey = `${crawledSchedule.exam_type}-${crawledSchedule.session_number}`

    if (!processedSessions.has(sessionKey)) {
      const matchingInternal = internalSchedules.find(internal =>
        internal.exam_type === crawledSchedule.exam_type &&
        internal.session_numbers?.includes(crawledSchedule.session_number)
      )

      comprehensiveSchedules.push({
        ...crawledSchedule,
        session_range: matchingInternal?.session_range || null,
        internal_deadline_date: matchingInternal?.internal_deadline_date || null,
        internal_deadline_time: matchingInternal?.internal_deadline_time || null,
        notice_date: matchingInternal?.notice_date || null,
        notice_time: matchingInternal?.notice_time || null,
        has_internal_deadline: !!matchingInternal,
        data_source: matchingInternal ? 'crawled_internal' : 'crawled_only',
        combined_notes: [
          crawledSchedule.notes || '크롤링 추출',
          matchingInternal?.notes
        ].filter(Boolean).join(' | ')
      })

      processedSessions.add(sessionKey)
    }
  }

  // 3. 내부 일정만 있는 데이터 추가
  for (const internalSchedule of internalSchedules) {
    for (const sessionNumber of internalSchedule.session_numbers || []) {
      const sessionKey = `${internalSchedule.exam_type}-${sessionNumber}`

      if (!processedSessions.has(sessionKey)) {
        comprehensiveSchedules.push({
          year: internalSchedule.year,
          exam_type: internalSchedule.exam_type,
          session_number: sessionNumber,
          session_range: internalSchedule.session_range,
          exam_date: null,
          exam_time_start: null,
          exam_time_end: null,
          locations: [],
          registration_period: null,
          result_date: null,
          internal_deadline_date: internalSchedule.internal_deadline_date,
          internal_deadline_time: internalSchedule.internal_deadline_time,
          notice_date: internalSchedule.notice_date,
          notice_time: internalSchedule.notice_time,
          has_internal_deadline: true,
          data_source: 'internal_only',
          notes: internalSchedule.notes,
          combined_notes: internalSchedule.notes
        })
      }
    }
  }

  return comprehensiveSchedules
}