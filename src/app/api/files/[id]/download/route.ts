import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'
import { readFile } from 'fs/promises'
import path from 'path'
import { Database } from '@/types/database'

// 파일 다운로드
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    debugLog.info('File download request started', { fileId: id }, 'API/files/download')
    const supabase = createSupabaseServiceRoleClient()

    // 파일 정보 조회
    const { data: file, error } = await (supabase as any)
      .from('downloadable_files')
      .select('*')
      .eq('id', id)
      .single()

    // Type the file variable properly
    const typedFile = file as Database['public']['Tables']['downloadable_files']['Row'] | null

    if (error || !typedFile) {
      debugLog.error('File not found for download', { fileId: id }, 'API/files/download')
      return NextResponse.json({
        success: false,
        error: '파일을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 비활성 파일은 다운로드 불가
    if (!typedFile.active) {
      return NextResponse.json({
        success: false,
        error: '비활성화된 파일은 다운로드할 수 없습니다.'
      }, { status: 403 })
    }

    try {
      // 파일 경로 (public 폴더 기준)
      const filePath = path.join(process.cwd(), 'public', typedFile.file_path)

      // 파일 읽기
      const fileBuffer = await readFile(filePath)

      // 다운로드 횟수 증가
      await (supabase as any)
        .from('downloadable_files')
        .update({ download_count: typedFile.download_count + 1 })
        .eq('id', id)

      debugLog.info('File downloaded successfully', {
        fileId: id,
        title: typedFile.title,
        downloadCount: typedFile.download_count + 1
      }, 'API/files/download')

      // 파일 응답 반환
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': typedFile.file_type || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(typedFile.file_name)}"`,
          'Content-Length': String(fileBuffer.length),
        },
      })

    } catch (fileError) {
      debugLog.error('Error reading file from disk', fileError, 'API/files/download')
      return NextResponse.json({
        success: false,
        error: '파일을 읽을 수 없습니다. 파일이 존재하지 않거나 손상되었을 수 있습니다.'
      }, { status: 500 })
    }

  } catch (error) {
    debugLog.error('Unexpected error in file download', error, 'API/files/download')
    console.error('API Error in file download:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}