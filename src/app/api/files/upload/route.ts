import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'
import { Database } from '@/types/database'

// 파일 업로드
export async function POST(request: NextRequest) {
  try {
    console.log('=== FILE UPLOAD STARTED ===')
    console.log('Supabase URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    debugLog.info('File upload request started', null, 'API/files/upload')

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string || null
    const category = formData.get('category') as string || 'general'
    const active = formData.get('active') === 'true'

    if (!file || !title) {
      return NextResponse.json({
        success: false,
        error: '파일과 제목은 필수입니다.'
      }, { status: 400 })
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: '파일 크기는 10MB를 초과할 수 없습니다.'
      }, { status: 400 })
    }

    // 허용된 파일 형식 확인
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: '지원되지 않는 파일 형식입니다. (PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF만 허용)'
      }, { status: 400 })
    }

    // 파일명 생성 (타임스탬프 + 영문 파일명)
    const timestamp = Date.now()
    // 파일 확장자 추출
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf'
    // 영문과 숫자만 남기고 안전한 파일명 생성
    const baseName = file.name
      .split('.')[0] // 확장자 제거
      .replace(/[^a-zA-Z0-9]/g, '_') // 영문/숫자 외 모든 문자를 언더스코어로
      .replace(/_+/g, '_') // 연속된 언더스코어 정리
      .substring(0, 30) // 길이 제한

    // 기본 파일명이 비어있거나 너무 짧으면 카테고리 기반 이름 사용
    const safeBaseName = baseName.length > 2 ? baseName : `${category}_file`
    const fileName = `${timestamp}_${safeBaseName}.${fileExt}`

    // Supabase에서 사용할 저장 경로
    const storagePath = `${category}/${fileName}`
    const supabase = createSupabaseServiceRoleClient()

    let publicUrl: string

    try {
      // 파일을 ArrayBuffer로 변환
      const bytes = await file.arrayBuffer()

      // Supabase Storage에 파일 업로드
      const { error: uploadError } = await supabase.storage
        .from('owners-recruit-guide') // 실제 만든 버킷 이름
        .upload(storagePath, new Uint8Array(bytes), {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        debugLog.error('Supabase Storage upload error details', {
          error: uploadError,
          bucket: 'owners-recruit-guide',
          path: storagePath,
          fileSize: file.size,
          fileType: file.type
        }, 'API/files/upload')
        throw new Error(`Supabase Storage upload failed: ${uploadError.message}`)
      }

      debugLog.info('File saved to Supabase Storage', { storagePath, size: file.size }, 'API/files/upload')

      // Supabase Storage에서 public URL 생성
      const { data: { publicUrl: generatedUrl } } = supabase.storage
        .from('owners-recruit-guide')
        .getPublicUrl(storagePath)

      publicUrl = generatedUrl

    } catch (fileError) {
      console.error('=== SUPABASE STORAGE ERROR ===')
      console.error('File error details:', fileError)
      console.error('File error message:', fileError instanceof Error ? fileError.message : 'Unknown file error')
      debugLog.error('Error saving file to Supabase Storage', fileError, 'API/files/upload')
      return NextResponse.json({
        success: false,
        error: '파일 저장에 실패했습니다.'
      }, { status: 500 })
    }

    // 데이터베이스에 파일 정보 저장
    const fileData = {
      title,
      description,
      file_name: fileName,
      file_path: publicUrl, // Supabase Storage public URL
      file_size: file.size,
      file_type: file.type,
      category,
      active: active !== undefined ? active : true
    }

    const { data: newFile, error } = await (supabase as any)
      .from('downloadable_files')
      .insert(fileData)
      .select()
      .single()

    const typedNewFile = newFile as Database['public']['Tables']['downloadable_files']['Row'] | null

    if (error) {
      debugLog.error('Database error saving file info', error, 'API/files/upload')
      console.error('API Error saving file info:', error)
      return NextResponse.json({
        success: false,
        error: `파일 정보 저장에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('File uploaded successfully', {
      fileId: typedNewFile?.id,
      title: typedNewFile?.title,
      size: file.size
    }, 'API/files/upload')

    return NextResponse.json({
      success: true,
      data: typedNewFile
    }, { status: 201 })

  } catch (error) {
    console.error('=== FILE UPLOAD ERROR ===')
    console.error('Error details:', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    debugLog.error('Unexpected error in file upload', error, 'API/files/upload')
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}