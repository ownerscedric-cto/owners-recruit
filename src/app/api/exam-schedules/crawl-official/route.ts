import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function POST(request: NextRequest) {
  try {
    const { year, month } = await request.json()

    if (!year || !month) {
      return NextResponse.json(
        { error: '년도와 월 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log(`지역별 크롤링 시작: ${year}년 ${month}월`)

    // 지역별 시험일정 크롤링
    const crawlResult = await crawlRegionalExamSchedules(year, month)

    console.log(`크롤링 완료: 총 ${crawlResult.schedules.length}개 일정 수집`)

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        schedules: crawlResult.schedules,
        rawData: crawlResult.rawData,
        debugInfo: crawlResult.debugInfo,
        crawledAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('크롤링 오류:', error)
    return NextResponse.json(
      {
        error: '공식 시험일정 크롤링 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

async function crawlRegionalExamSchedules(year: number, month: number) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  })

  try {
    // 지역 코드 정의 (실제 사이트에서 확인한 올바른 코드)
    const regions = [
      { code: "10", name: "서울" },
      { code: "12", name: "인천" },
      { code: "55", name: "제주" },  // 수정: 13 → 55
      { code: "30", name: "부산" },
      { code: "32", name: "울산" },
      { code: "40", name: "대구" },
      { code: "50", name: "광주" },
      { code: "87", name: "전주" },  // 수정: 52 → 87
      { code: "60", name: "대전" },
      { code: "65", name: "서산" },  // 수정: 62 → 65
      { code: "70", name: "강릉" },  // 수정: 72 → 70
      { code: "71", name: "원주" },  // 수정: 70 → 71
      { code: "78", name: "춘천" }   // 수정: 74 → 78
    ]

    console.log(`지역별 크롤링 시작: ${regions.length}개 지역`)

    const allSchedules: any[] = []
    const rawData: any[] = []
    const debugInfo: any = {
      regionsProcessed: [],
      totalSchedules: 0,
      errors: []
    }

    const searchDate = `${year}-${String(month).padStart(2, '0')}`

    // 각 지역별로 데이터 수집
    for (const region of regions) {
      try {
        console.log(`${region.name}(${region.code}) 지역 크롤링 시작`)

        const page = await browser.newPage()
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        )

        // 생명보험협회 사이트로 이동
        await page.goto('https://exam.insure.or.kr/lp/schd/list', {
          waitUntil: 'networkidle2',
          timeout: 30000
        })

        // 지역별 POST 요청을 통해 데이터 가져오기
        const regionSchedules = await page.evaluate(async (searchDate, regionCode, regionName, year, month) => {
          try {
            // 한국어 날짜 파싱 함수 (브라우저 context에서 실행)
            function parseKoreanDate(dateStr: string, year: number, month: number): string {
              if (!dateStr) return ''

              try {
                // "11월 10일" 형태 파싱
                const monthDayMatch = dateStr.match(/(\d+)월\s*(\d+)일/)
                if (monthDayMatch) {
                  const m = parseInt(monthDayMatch[1])
                  const d = parseInt(monthDayMatch[2])
                  return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                }

                // "2025.11.10" 형태 파싱
                const dotDateMatch = dateStr.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/)
                if (dotDateMatch) {
                  const y = parseInt(dotDateMatch[1])
                  const m = parseInt(dotDateMatch[2])
                  const d = parseInt(dotDateMatch[3])
                  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                }

                // "2025-11-10" 형태 파싱
                const dashDateMatch = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
                if (dashDateMatch) {
                  const y = parseInt(dashDateMatch[1])
                  const m = parseInt(dashDateMatch[2])
                  const d = parseInt(dashDateMatch[3])
                  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                }

                return ''
              } catch (error) {
                console.error('날짜 파싱 오류:', error)
                return ''
              }
            }

            // URLSearchParams로 POST 요청 (Firebase Functions와 동일하게)
            const searchDateWithDay = `${year}-${month}-1`
            const formData = new URLSearchParams()
            formData.append('searchDate', searchDateWithDay)
            formData.append('pageType', regionCode)
            formData.append('pageTypeNm', regionName)

            const response = await fetch('https://exam.insure.or.kr/lp/schd/list', {
              method: 'POST',
              body: formData,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'https://exam.insure.or.kr/lp/schd/list',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
              }
            })

            const html = await response.text()

            // 디버깅: HTML 응답 로그
            console.log(`${regionName} 지역 HTML 응답 길이:`, html.length)
            console.log(`${regionName} 지역 HTML 첫 500자:`, html.substring(0, 500))

            // 임시 DOM 생성하여 응답 파싱
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = html

            const schedules: any[] = []

            // 다양한 선택자 시도 (Firebase Functions와 유사)
            const tableSelectors = [
              '.table_t01 table tbody tr',
              '.mobile_t01 table tbody tr',
              '.mt_t01 table tbody tr',
              'table tbody tr',
              'table tr'
            ]

            let rows: Element[] = []

            for (const selector of tableSelectors) {
              const foundRows = Array.from(tempDiv.querySelectorAll(selector))
              if (foundRows.length > 0) {
                console.log(`${regionName} 지역: ${selector}로 ${foundRows.length}개 행 발견`)
                rows = foundRows
                break
              }
            }

            if (rows.length === 0) {
              console.log(`${regionName} 지역: 테이블 행을 찾을 수 없음`)
              console.log(`${regionName} 지역 HTML 샘플:`, html.substring(0, 1000))
            }

            rows.forEach((row, rowIndex) => {
              const cells = Array.from(row.querySelectorAll('td')).map(cell => cell.textContent?.trim() || '')

              if (cells.length >= 3) {
                // 시험일 컬럼 (첫 번째 컬럼)
                const examDateRaw = cells[0]
                // 접수기간 컬럼 (두 번째 컬럼)
                const registrationPeriod = cells[1]
                // 발표일 컬럼 (세 번째 컬럼)
                const resultDateRaw = cells[2]

                // 날짜 패턴 확인
                const datePattern = /\d{4}[.-]\d{1,2}[.-]\d{1,2}|\d{1,2}월\s*\d{1,2}일/

                if (examDateRaw && datePattern.test(examDateRaw)) {
                  // 시험일에서 "2025-11-10(월)\n\t\t\t열기" 같은 형태에서 날짜만 추출
                  const cleanExamDate = examDateRaw.replace(/\([가-힣]\).*$/g, '').replace(/[\n\t\r\s]+.*$/g, '').trim()
                  const examDate = parseKoreanDate(cleanExamDate, year, month)

                  // 발표일에서 날짜만 추출
                  const cleanResultDate = resultDateRaw.replace(/\([가-힣]\).*$/g, '').replace(/[\n\t\r\s]+.*$/g, '').trim()
                  const resultDate = parseKoreanDate(cleanResultDate, year, month)

                  if (examDate) {
                    schedules.push({
                      year: year,
                      exam_type: '생보',
                      session_number: schedules.length + 1,
                      exam_date: examDate,
                      registration_period: registrationPeriod,
                      result_date: resultDate,
                      exam_time_start: '10:00',
                      exam_time_end: '12:00',
                      locations: [regionName],
                      notes: `공식 시험일정 (${regionName} 지역) - 원본: ${cells.join(' | ')}`,
                      data_source: 'official_crawled',
                      region_code: regionCode,
                      region_name: regionName
                    })
                  }
                }
              }
            })

            return {
              schedules,
              tableData: []
            }
          } catch (error) {
            console.error('지역 데이터 처리 오류:', error)
            return { schedules: [], tableData: [] }
          }
        }, searchDate, region.code, region.name, year, month)

        console.log(`${region.name}: ${regionSchedules.schedules.length}개 일정 발견`)

        // 디버깅: 추가 정보 로그
        console.log(`${region.name} 지역 완료 - 스케줄: ${regionSchedules.schedules.length}개, 테이블: ${regionSchedules.tableData.length}개`)

        allSchedules.push(...regionSchedules.schedules)
        rawData.push({
          region: region.name,
          regionCode: region.code,
          scheduleCount: regionSchedules.schedules.length,
          data: regionSchedules.tableData
        })

        debugInfo.regionsProcessed.push({
          region: region.name,
          code: region.code,
          scheduleCount: regionSchedules.schedules.length
        })

        await page.close()

        // 서버 부하 방지를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`${region.name} 지역 크롤링 오류:`, error)
        debugInfo.errors.push({
          region: region.name,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        })
      }
    }

    debugInfo.totalSchedules = allSchedules.length
    console.log(`크롤링 완료: 총 ${allSchedules.length}개 일정 수집`)

    return {
      schedules: allSchedules,
      rawData: rawData,
      debugInfo: debugInfo
    }
  } finally {
    await browser.close()
  }
}