import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import path from 'path'

// 가이드 폴더의 파일 목록 조회 (데이터베이스 연결 불가 시 대안)
export async function GET(request: NextRequest) {
  try {
    const guideDir = path.join(process.cwd(), 'public', 'uploads', 'guide')

    try {
      const files = await readdir(guideDir)
      const fileDetails = await Promise.all(
        files
          .filter(file => file.endsWith('.pdf'))
          .map(async (file) => {
            const filePath = path.join(guideDir, file)
            const stats = await stat(filePath)

            // 파일명에서 원래 제목 추출 시도
            const originalName = file.replace(/^\d+_/, '') // 타임스탬프 제거
            const displayTitle = originalName.includes('위촉') || originalName.includes('해촉')
              ? originalName.replace('.pdf', '')
              : '위촉/해촉 안내서'

            return {
              id: file, // 파일명을 ID로 사용
              title: displayTitle,
              file_name: file,
              file_path: `/uploads/guide/${file}`,
              file_size: stats.size,
              file_type: 'application/pdf',
              category: 'guide',
              active: true,
              created_at: stats.birthtime.toISOString(),
              updated_at: stats.mtime.toISOString()
            }
          })
      )

      // 최신 파일 순으로 정렬
      fileDetails.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      return NextResponse.json({
        success: true,
        data: fileDetails
      })

    } catch (dirError) {
      // 디렉토리가 존재하지 않으면 빈 배열 반환
      return NextResponse.json({
        success: true,
        data: []
      })
    }

  } catch (error) {
    console.error('Error in guide files GET:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}