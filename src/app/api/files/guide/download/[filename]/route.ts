import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

// 가이드 파일 직접 다운로드 (데이터베이스 연결 불가 시 대안)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params

    // 파일명 검증 (보안상 중요)
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({
        success: false,
        error: '잘못된 파일명입니다.'
      }, { status: 400 })
    }

    // PDF 파일만 허용
    if (!filename.endsWith('.pdf')) {
      return NextResponse.json({
        success: false,
        error: 'PDF 파일만 다운로드 가능합니다.'
      }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', 'guide', filename)

    try {
      const fileBuffer = await readFile(filePath)

      // 파일명에서 원래 제목 추출 및 한글 파일명 복원
      let displayName = '위촉해촉안내서.pdf'

      // 타임스탬프 제거 후 원래 파일명 추출
      const originalName = filename.replace(/^\d+_/, '')

      // 언더스코어가 많이 연속된 부분을 정리하고 의미있는 파일명으로 변환
      if (originalName.includes('___')) {
        // 언더스코어가 많은 경우 기본 이름 사용
        displayName = '위촉해촉안내서.pdf'
      } else if (originalName.length > 5 && !originalName.startsWith('_')) {
        // 의미있는 파일명이 있는 경우 사용
        displayName = originalName
      }

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(displayName)}"`,
          'Content-Length': String(fileBuffer.length),
        },
      })

    } catch (fileError) {
      return NextResponse.json({
        success: false,
        error: '파일을 찾을 수 없습니다.'
      }, { status: 404 })
    }

  } catch (error) {
    console.error('Error in guide file download:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}