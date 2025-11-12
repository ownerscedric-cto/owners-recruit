import { NextRequest, NextResponse } from 'next/server'
import { debugLogger } from '@/lib/debug'
import { isDebugMode } from '@/lib/settings-cache'

// 디버그 로그 조회 (관리자 전용)
export async function GET(request: NextRequest) {
  try {
    // 디버그 모드 확인
    const debugEnabled = await isDebugMode()
    if (!debugEnabled) {
      return NextResponse.json({
        success: false,
        error: '디버그 모드가 비활성화되어 있습니다.'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const count = parseInt(searchParams.get('count') || '100')
    const level = searchParams.get('level') as any
    const searchTerm = searchParams.get('search') || undefined

    let logs
    if (level || searchTerm) {
      logs = await debugLogger.getFilteredLogs(level, searchTerm)
    } else {
      logs = await debugLogger.getRecentLogs(count)
    }

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total: logs.length,
        debugMode: debugEnabled
      }
    })
  } catch (error) {
    console.error('Error fetching debug logs:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '디버그 로그 조회에 실패했습니다.'
    }, { status: 500 })
  }
}

// 디버그 로그 초기화 (관리자 전용)
export async function DELETE() {
  try {
    // 디버그 모드 확인
    const debugEnabled = await isDebugMode()
    if (!debugEnabled) {
      return NextResponse.json({
        success: false,
        error: '디버그 모드가 비활성화되어 있습니다.'
      }, { status: 403 })
    }

    await debugLogger.clearLogs()

    return NextResponse.json({
      success: true,
      message: '디버그 로그가 초기화되었습니다.'
    })
  } catch (error) {
    console.error('Error clearing debug logs:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '디버그 로그 초기화에 실패했습니다.'
    }, { status: 500 })
  }
}