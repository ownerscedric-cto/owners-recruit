import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: '이미지가 제공되지 않았습니다.' }, { status: 400 })
    }

    // 1. OCR API를 사용해서 이미지에서 텍스트 추출
    const extractedText = await extractTextFromImage(file)

    // 2. AI API를 사용해서 텍스트를 시험 일정 데이터로 파싱
    const parsedSchedules = await parseScheduleText(extractedText)

    return NextResponse.json({
      success: true,
      data: {
        extractedText,
        parsedSchedules
      }
    })
  } catch (error) {
    console.error('이미지 파싱 오류:', error)
    return NextResponse.json({ error: '이미지 파싱 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

async function extractTextFromImage(file: File): Promise<string> {
  // OpenAI Vision API 사용 (GPT-4V)

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
                text: '이미지에 있는 모든 텍스트를 정확하게 추출해주세요. 표 형태의 데이터라면 구조를 유지하면서 추출해주세요. 시험 일정표나 공지사항이라면 날짜, 시간, 지역 정보를 놓치지 말고 추출해주세요.'
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
    const extractedText = result.choices[0]?.message?.content

    if (!extractedText) {
      throw new Error('이미지에서 텍스트를 찾을 수 없습니다.')
    }

    return extractedText
  } catch (error) {
    console.error('OCR 오류:', error)
    throw new Error(`이미지에서 텍스트를 추출할 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
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
                  "session_number": 1,
                  "registration_start_date": "2025-01-15",
                  "registration_end_date": "2025-01-25",
                  "exam_date": "2025-02-15",
                  "exam_time_start": "10:00",
                  "exam_time_end": "12:00",
                  "locations": ["서울", "부산", "대구"],
                  "notes": "추가 정보 (내부 마감일인 경우 '본사 자체 신청 마감일' 표기)"
                }
              ]
            }

            처리 규칙:
            1. **내부 신청마감인 경우**:
               - registration_end_date는 본사에서 정한 마감일로 설정
               - registration_start_date는 마감일 10일 전으로 추정
               - exam_date는 마감일 이후 적절한 날짜로 추정 (보통 1-2주 후)
               - notes에 "본사 자체 신청 마감일" 명시

            2. **공식 시험일정인 경우**:
               - 제공된 정확한 날짜 정보 사용
               - 시험접수 기간과 실제 시험일 구분해서 설정

            3. **공통 규칙**:
               - 날짜는 YYYY-MM-DD 형식으로 변환
               - 시간은 HH:MM 형식으로 변환 (24시간 표기)
               - 시험 종류는 "생보", "손보", "제3보험" 중 하나로 매핑
               - 지역이 명시되지 않았으면 빈 배열 [] 사용
               - 불명확한 정보는 합리적으로 추정하거나 기본값 사용
               - 시간이 명시되지 않으면 10:00-12:00 기본값 사용
               - JSON 외의 다른 텍스트는 절대 포함하지 마세요

            4. **지역 매핑 규칙 (중요!)**:
               이미지에서 나오는 지역 그룹을 정확한 지역명으로 변환해주세요:
               - **수도권** → ["서울", "인천", "제주"]
               - **영남** → ["부산", "울산"]
               - **대구** → ["대구"]
               - **호남** → ["광주", "전주"]
               - **중부** → ["대전", "서산"]
               - **원주** → ["원주", "강릉", "춘천"]

               **주의사항**:
               - "수도권", "영남" 등 그룹명을 그대로 사용하지 말고 반드시 구체적인 도시명으로 변환
               - 위 목록에 없는 지역명이 나오면 가장 가까운 그룹에 매핑하거나 제외
               - 예: "사천" → 제외, "서울(인천)" → ["서울", "인천"]`
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
          throw new Error('OpenAI API 할당량이 초과되었습니다. 결제 정보를 확인해주세요.')
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