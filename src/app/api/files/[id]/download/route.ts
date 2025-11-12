import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'
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

      let fileBuffer: ArrayBuffer

      if (typedFile.file_path.startsWith('http')) {
        // 이미 public URL인 경우 - extract storage path and use Supabase API
        const url = new URL(typedFile.file_path)
        const pathParts = url.pathname.split('/object/public/owners-recruit-guide/')

        if (pathParts.length > 1) {
          const storagePath = pathParts[1]

          // Use Supabase storage download method instead of public URL
          const { data, error } = await supabase.storage
            .from('owners-recruit-guide')
            .download(storagePath)

          if (error) {
            throw new Error(`Supabase storage download failed: ${error.message}`)
          }

          if (!data) {
            throw new Error('No file data received from Supabase storage')
          }

          fileBuffer = await data.arrayBuffer()
        } else {
          // Fallback to direct fetch for external URLs
          const response = await fetch(typedFile.file_path)

          if (!response.ok) {
            throw new Error(`File download failed with status: ${response.status}`)
          }

          fileBuffer = await response.arrayBuffer()
        }
      } else {
        // Storage path인 경우 직접 Supabase storage download 사용
        const { data, error } = await supabase.storage
          .from('owners-recruit-guide')
          .download(typedFile.file_path)

        if (error) {
          throw new Error(`Supabase storage download failed: ${error.message}`)
        }

        if (!data) {
          throw new Error('No file data received from Supabase storage')
        }

        fileBuffer = await data.arrayBuffer()
      }

      // 다운로드 횟수 증가
      await (supabase as any)
        .from('downloadable_files')
        .update({ download_count: typedFile.download_count + 1 })
        .eq('id', id)

      debugLog.info('File downloaded successfully from Supabase Storage', {
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
          'Content-Length': String(fileBuffer.byteLength),
        },
      })

    } catch (fileError) {
      debugLog.error('Error downloading file from Supabase Storage', fileError, 'API/files/download')
      return NextResponse.json({
        success: false,
        error: '파일을 다운로드할 수 없습니다. 파일이 존재하지 않거나 접근할 수 없습니다.'
      }, { status: 500 })
    }

  } catch (error) {
    debugLog.error('Unexpected error in file download', error, 'API/files/download')
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}