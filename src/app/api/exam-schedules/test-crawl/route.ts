import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('테스트 크롤링 시작')

    // 크롤링 API 호출
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/exam-schedules/crawl-official`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: 2025,
        month: 11
      })
    })

    if (!response.ok) {
      throw new Error(`크롤링 API 호출 실패: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: '크롤링 테스트 완료',
      data
    })
  } catch (error) {
    console.error('테스트 크롤링 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '테스트 크롤링 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}