import { NextRequest, NextResponse } from 'next/server'

interface CrawledSchedule {
  year: number
  exam_type: string
  exam_date: string
  exam_time_start?: string
  exam_time_end?: string
  region_name: string
  region_code: string
  registration_period?: string
  result_date?: string
  notes?: string
  data_source: string
}

interface GroupedSchedule {
  year: number
  exam_type: string
  session_number: number
  session_range?: string
  exam_date: string
  exam_time_start?: string
  exam_time_end?: string
  locations: string[]
  region_codes: string[]
  registration_period?: string
  result_date?: string
  notes?: string
  data_source: string
  has_internal_deadline: boolean
  internal_deadline_date?: string
  internal_deadline_time?: string
  notice_date?: string
  notice_time?: string
}

interface InternalDeadline {
  deadline_date: string
  deadline_time?: string
  notice_date?: string
  notice_time?: string
  session_range?: string
}

export async function POST(request: NextRequest) {
  try {
    const { year, month, internalText, crawledSchedules } = await request.json()

    if (!year || !month) {
      return NextResponse.json({
        error: '년도와 월 정보가 필요합니다.'
      }, { status: 400 })
    }

    console.log(`크롤링 기반 그룹핑 시작: ${year}년 ${month}월`)

    let rawSchedules: CrawledSchedule[] = []
    let debugInfo: any = null

    // 1. 크롤링된 데이터가 제공된 경우 사용, 아니면 새로 크롤링
    if (crawledSchedules && crawledSchedules.length > 0) {
      console.log(`제공된 크롤링 데이터 사용: ${crawledSchedules.length}개 일정`)
      rawSchedules = crawledSchedules
      debugInfo = { message: '제공된 크롤링 데이터 사용' }
    } else {
      // 지역별 크롤링 수행
      const crawlResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/exam-schedules/crawl-official`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month })
      })

      if (!crawlResponse.ok) {
        throw new Error(`크롤링 실패: ${crawlResponse.status}`)
      }

      const crawlData = await crawlResponse.json()
      rawSchedules = crawlData.data?.schedules || []
      debugInfo = crawlData.data?.debugInfo

      console.log(`크롤링 완료: ${rawSchedules.length}개 일정`)
    }

    // 2. 내부 마감일정 파싱
    const internalDeadlines = parseInternalDeadlines(internalText || '')

    // 3. 크롤링 데이터를 날짜별로 그룹핑
    const groupedSchedules = groupSchedulesByDate(rawSchedules, internalDeadlines)

    console.log(`그룹핑 완료: ${groupedSchedules.length}개 차수`)

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        totalCrawled: rawSchedules.length,
        totalGrouped: groupedSchedules.length,
        schedules: groupedSchedules,
        internalDeadlines: internalDeadlines,
        debugInfo: {
          rawSchedules: rawSchedules.slice(0, 5), // 처음 5개만 디버그용
          crawlInfo: debugInfo
        }
      }
    })

  } catch (error) {
    console.error('크롤링 기반 그룹핑 오류:', error)
    return NextResponse.json({
      error: '크롤링 기반 그룹핑 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}

function parseInternalDeadlines(text: string): InternalDeadline[] {
  const deadlines: InternalDeadline[] = []

  if (!text.trim()) {
    return deadlines
  }

  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)

  for (const line of lines) {
    console.log('처리 중인 라인:', line)

    // "1~4차 시험접수마감: 11월 4일(화) 오전 11시" 패턴
    const deadlineMatch = line.match(/(\d+)(?:~(\d+))?차\s*시험접수마감\s*:\s*(\d+)월\s*(\d+)일.*?(?:오전|오후)\s*(\d+)시/)
    if (deadlineMatch) {
      console.log('마감일정 매칭:', deadlineMatch)
      const startSession = parseInt(deadlineMatch[1])
      const endSession = deadlineMatch[2] ? parseInt(deadlineMatch[2]) : startSession
      const month = parseInt(deadlineMatch[3])
      const day = parseInt(deadlineMatch[4])
      const hour = parseInt(deadlineMatch[5])
      const isPM = line.includes('오후')

      const actualHour = isPM && hour !== 12 ? hour + 12 : (isPM ? hour : hour === 12 ? 0 : hour)

      deadlines.push({
        deadline_date: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        deadline_time: `${String(actualHour).padStart(2, '0')}:00`,
        session_range: endSession > startSession ? `${startSession}~${endSession}` : `${startSession}`
      })
      continue
    }

    // "수험표 공지 예정 : 11월 7일 오후 2시 이후" 패턴
    const noticeMatch = line.match(/수험표\s*공지\s*(?:예정\s*)?:\s*(\d+)월\s*(\d+)일.*?(?:오전|오후)\s*(\d+)시/)
    if (noticeMatch) {
      console.log('공지일정 매칭:', noticeMatch)
      const month = parseInt(noticeMatch[1])
      const day = parseInt(noticeMatch[2])
      const hour = parseInt(noticeMatch[3])
      const isPM = line.includes('오후')

      const actualHour = isPM && hour !== 12 ? hour + 12 : (isPM ? hour : hour === 12 ? 0 : hour)

      // 가장 최근 추가된 deadline에 공지일 추가
      if (deadlines.length > 0) {
        deadlines[deadlines.length - 1].notice_date = `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        deadlines[deadlines.length - 1].notice_time = `${String(actualHour).padStart(2, '0')}:00`
      }
    }
  }

  console.log('파싱된 내부 마감일정:', deadlines)
  return deadlines
}

function groupSchedulesByDate(schedules: CrawledSchedule[], internalDeadlines: InternalDeadline[]): GroupedSchedule[] {
  // 1. 지역별로 그룹핑 후 날짜순 정렬
  const regionGroups: { [region: string]: CrawledSchedule[] } = {}

  schedules.forEach(schedule => {
    const region = schedule.region_name
    if (!regionGroups[region]) {
      regionGroups[region] = []
    }
    regionGroups[region].push(schedule)
  })

  // 각 지역의 일정을 날짜순으로 정렬
  Object.keys(regionGroups).forEach(region => {
    regionGroups[region].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
  })

  const groupedSchedules: GroupedSchedule[] = []

  // 2. 모든 날짜를 수집하고 정렬
  const allDates = [...new Set(schedules.map(s => s.exam_date))].sort()

  console.log(`전체 시험 날짜: ${allDates.length}개 - ${allDates.join(', ')}`)

  // 3. 각 날짜별로 처리
  allDates.forEach((date, dateIndex) => {
    const sessionNumber = dateIndex + 1

    // 해당 날짜에 시험을 치르는 모든 지역 수집
    const regionsForDate = schedules.filter(s => s.exam_date === date)

    // 지역 정보 수집
    const locations = regionsForDate.map(s => s.region_name)
    const regionCodes = regionsForDate.map(s => s.region_code)

    // 대표 스케줄 정보
    const representative = regionsForDate[0]

    // 내부 마감일정 매칭
    const matchedDeadline = findMatchingDeadline(sessionNumber, internalDeadlines)

    const groupedSchedule: GroupedSchedule = {
      year: representative.year,
      exam_type: representative.exam_type,
      session_number: sessionNumber,
      exam_date: date,
      exam_time_start: representative.exam_time_start,
      exam_time_end: representative.exam_time_end,
      locations: locations,
      region_codes: regionCodes,
      registration_period: representative.registration_period,
      result_date: representative.result_date,
      notes: `${date} - ${locations.join(', ')} (${locations.length}개 지역)`,
      data_source: 'crawled_grouped',
      has_internal_deadline: !!matchedDeadline,
      internal_deadline_date: matchedDeadline?.deadline_date,
      internal_deadline_time: matchedDeadline?.deadline_time,
      notice_date: matchedDeadline?.notice_date,
      notice_time: matchedDeadline?.notice_time,
      session_range: matchedDeadline?.session_range
    }

    groupedSchedules.push(groupedSchedule)
    console.log(`${sessionNumber}차: ${date} - ${locations.join(', ')} (${locations.length}개 지역)`)
  })

  console.log(`그룹핑 결과: ${groupedSchedules.length}개 차수 생성`)
  return groupedSchedules
}

function findMatchingDeadline(sessionNumber: number, deadlines: InternalDeadline[]): InternalDeadline | null {
  // 정확한 차수 범위 매칭
  for (const deadline of deadlines) {
    if (deadline.session_range?.includes('~')) {
      const [start, end] = deadline.session_range.split('~').map(n => parseInt(n))
      if (sessionNumber >= start && sessionNumber <= end) {
        return deadline
      }
    } else {
      const targetSession = parseInt(deadline.session_range || '0')
      if (sessionNumber === targetSession) {
        return deadline
      }
    }
  }

  return null
}