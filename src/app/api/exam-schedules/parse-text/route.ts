import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: '텍스트가 제공되지 않았습니다.' }, { status: 400 })
    }

    // AI API를 사용해서 텍스트를 시험 일정 데이터로 파싱
    const parsedSchedules = await parseScheduleText(text)

    return NextResponse.json({
      success: true,
      data: {
        extractedText: text,
        parsedSchedules
      }
    })
  } catch (error) {
    console.error('텍스트 파싱 오류:', error)
    return NextResponse.json({
      error: '텍스트 파싱 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}

async function parseScheduleText(text: string): Promise<any[]> {
  try {
    // OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다.')
    }

    // OpenAI GPT API를 사용해서 텍스트를 구조화된 데이터로 변환
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
            content: `다음은 보험 시험 일정 관련 텍스트입니다. 이 텍스트를 분석해서 시험 일정 데이터로 변환해주세요.

            텍스트 유형을 구분해주세요:
            1. **공식 시험일정** (금융감독원 발표): 실제 시험접수 기간과 시험일이 포함된 정식 일정표
            2. **내부 신청마감** (회사 자체): 본사에서 정한 자체 신청 마감일 ("시험접수마감: X월 X일" 형태)

            응답은 반드시 다음 JSON 형식으로만 해주세요:
            {
              "schedules": [
                {
                  "year": 2025,
                  "exam_type": "생보" | "손보" | "제3보험",
                  "session_range": "1~4차",
                  "session_numbers": [1, 2, 3, 4],
                  "internal_deadline_date": "2025-11-04",
                  "internal_deadline_time": "11:00",
                  "notice_date": "2025-11-07",
                  "notice_time": "14:00",
                  "locations": [],
                  "notes": "본사 자체 신청 마감일"
                }
              ]
            }

            처리 규칙:
            1. **내부 신청마감인 경우**:
               - session_range는 "1~4차", "5~6차" 형태로 추출
               - session_numbers는 해당 차수들을 배열로 [1,2,3,4]
               - internal_deadline_date는 마감일 (예: "11월 4일" → "2025-11-04")
               - internal_deadline_time은 마감시간 (예: "오전 11시" → "11:00")
               - notice_date는 수험표 공지일 (예: "11월 7일" → "2025-11-07")
               - notice_time은 공지시간 (예: "오후 2시" → "14:00")
               - notes에 "본사 자체 신청 마감일" 명시

            2. **공식 시험일정인 경우**:
               - 제공된 정확한 날짜 정보 사용
               - 시험접수 기간과 실제 시험일 구분해서 설정

            3. **공통 규칙**:
               - 날짜는 YYYY-MM-DD 형식으로 변환
               - 시간은 HH:MM 형식으로 변환 (24시간 표기)
               - 시험 종류는 "생보", "손보", "제3보험" 중 하나로 매핑
               - 지역은 배열로 변환하되, 텍스트에 명시된 지역만 포함 (서울, 부산, 대구, 광주, 전주, 대전, 서산, 원주, 강릉, 춘천 등)
               - 지역이 명시되지 않았으면 빈 배열 [] 사용
               - **시간 추출**: "오전 11시" → "11:00", "오후 2시" → "14:00" 등 정확히 변환
               - 시간이 명시되지 않으면 10:00-12:00 기본값 사용
               - 내부 신청마감일의 경우 마감 시간을 정확히 파싱하여 반영
               - JSON 외의 다른 텍스트는 절대 포함하지 마세요`
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

    // HTTP 응답 상태 확인
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: '알 수 없는 오류' } }))

      if (response.status === 401) {
        throw new Error('OpenAI API 키가 유효하지 않습니다.')
      } else if (response.status === 429) {
        if (errorData.error?.code === 'insufficient_quota') {
          // OpenAI 할당량 초과시 데모 데이터 반환 (개발 테스트용)
          console.warn('OpenAI API 할당량 초과 - 데모 데이터 사용')
          return generateDemoSchedule(text)
        } else {
          throw new Error('API 요청 한도가 초과되었습니다. 잠시 후 다시 시도해주세요.')
        }
      } else {
        throw new Error(`OpenAI API 오류 (${response.status}): ${errorData.error?.message || '알 수 없는 오류'}`)
      }
    }

    const result = await response.json()
    const aiResponse = result.choices?.[0]?.message?.content

    if (!aiResponse) {
      throw new Error('AI에서 응답을 생성하지 못했습니다.')
    }

    // JSON 파싱 전에 불필요한 텍스트 제거
    let cleanResponse = aiResponse.trim()
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/\s*```$/, '')
    }
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/\s*```$/, '')
    }

    // JSON 파싱
    const parsedData = JSON.parse(cleanResponse)

    if (!parsedData.schedules || !Array.isArray(parsedData.schedules)) {
      throw new Error('유효한 일정 데이터가 생성되지 않았습니다.')
    }

    return parsedData.schedules
  } catch (error) {
    console.error('AI 파싱 오류:', error)

    // 더 자세한 오류 정보 제공
    if (error instanceof SyntaxError) {
      throw new Error('AI가 생성한 응답이 올바른 JSON 형식이 아닙니다.')
    }

    throw new Error(`텍스트를 일정 데이터로 변환할 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  }
}

// 데모용 일정 생성 함수 (OpenAI API 할당량 초과시 사용)
function generateDemoSchedule(text: string): any[] {
  const currentYear = new Date().getFullYear()

  // 텍스트에서 시험 종류 추정
  let examType = '생보'
  if (text.includes('손보') || text.includes('손해보험')) {
    examType = '손보'
  } else if (text.includes('제3') || text.includes('제삼')) {
    examType = '제3보험'
  }

  // 텍스트에서 지역 정보 추출 시도
  const locations = extractLocationsFromText(text)

  // 텍스트에서 날짜 정보 추출 시도
  const dateInfo = extractDateFromText(text)

  // 텍스트에 마감일이 언급된 경우 내부 신청마감으로 처리
  const isInternalDeadline = text.includes('마감') || text.includes('신청')

  if (isInternalDeadline) {
    return [{
      year: currentYear,
      exam_type: examType,
      session_number: 1,
      registration_start_date: dateInfo.registrationStart,
      registration_end_date: dateInfo.registrationEnd,
      exam_date: dateInfo.examDate,
      exam_time_start: dateInfo.timeStart,
      exam_time_end: dateInfo.timeEnd,
      locations: locations,
      notes: '본사 자체 신청 마감일 (데모 데이터)'
    }]
  } else {
    return [{
      year: currentYear,
      exam_type: examType,
      session_number: 1,
      registration_start_date: dateInfo.registrationStart,
      registration_end_date: dateInfo.registrationEnd,
      exam_date: dateInfo.examDate,
      exam_time_start: dateInfo.timeStart,
      exam_time_end: dateInfo.timeEnd,
      locations: locations.length > 0 ? locations : ['서울', '부산', '대구', '광주', '대전'],
      notes: '공식 시험일정 (데모 데이터)'
    }]
  }
}

// 텍스트에서 지역 정보 추출
function extractLocationsFromText(text: string): string[] {
  const commonLocations = ['서울', '부산', '대구', '광주', '전주', '대전', '서산', '원주', '강릉', '춘천', '제주', '인천', '수원', '울산', '창원']
  const foundLocations: string[] = []

  for (const location of commonLocations) {
    if (text.includes(location)) {
      foundLocations.push(location)
    }
  }

  return foundLocations
}

// 텍스트에서 날짜 정보 추출
function extractDateFromText(text: string): {
  registrationStart: string
  registrationEnd: string
  examDate: string
  timeStart: string
  timeEnd: string
} {
  const currentYear = new Date().getFullYear()

  // "11월 4일" 형태의 날짜 찾기
  const dateMatch = text.match(/(\d+)월\s*(\d+)일/)

  if (dateMatch) {
    const month = parseInt(dateMatch[1])
    const day = parseInt(dateMatch[2])

    // 마감일을 registration_end_date로 설정
    const endDate = new Date(currentYear, month - 1, day)
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 10) // 10일 전을 시작일로

    // 시험일은 마감일 이후 2주로 설정
    const examDate = new Date(endDate)
    examDate.setDate(examDate.getDate() + 14)

    // 시간 추출 (오전 11시 등)
    let timeStart = '10:00'
    let timeEnd = '12:00'

    const timeMatch = text.match(/(오전|오후)\s*(\d+)시/)
    if (timeMatch) {
      let hour = parseInt(timeMatch[2])
      if (timeMatch[1] === '오후' && hour !== 12) {
        hour += 12
      } else if (timeMatch[1] === '오전' && hour === 12) {
        hour = 0
      }
      timeStart = `${String(hour).padStart(2, '0')}:00`
      timeEnd = `${String(hour + 2).padStart(2, '0')}:00`
    }

    return {
      registrationStart: formatDate(startDate),
      registrationEnd: formatDate(endDate),
      examDate: formatDate(examDate),
      timeStart,
      timeEnd
    }
  }

  // 기본값 반환
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)
  const nextMonth = new Date(today)
  nextMonth.setDate(today.getDate() + 30)

  return {
    registrationStart: formatDate(today),
    registrationEnd: formatDate(nextWeek),
    examDate: formatDate(nextMonth),
    timeStart: '10:00',
    timeEnd: '12:00'
  }
}

// 날짜를 YYYY-MM-DD 형식으로 포맷
function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}