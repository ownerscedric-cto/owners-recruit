import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// 파일 업로드
export async function POST(request: NextRequest) {
  try {
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

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now()
    const fileExtension = path.extname(file.name)
    // 한글과 영문, 숫자를 보존하면서 파일 시스템에 안전한 파일명 생성
    const sanitizedName = file.name
      .replace(/[<>:"/\\|?*]/g, '_') // 파일 시스템에서 금지된 문자만 제거
      .replace(/\s+/g, '_') // 공백을 언더스코어로 변경
    const fileName = `${timestamp}_${sanitizedName}`

    // 업로드 디렉토리 경로
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', category)
    const filePath = path.join(uploadDir, fileName)
    const publicPath = `/uploads/${category}/${fileName}`

    try {
      // 디렉토리 생성 (존재하지 않는 경우)
      await mkdir(uploadDir, { recursive: true })

      // 파일 저장
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      debugLog.info('File saved to disk', { filePath, size: file.size }, 'API/files/upload')

    } catch (fileError) {
      debugLog.error('Error saving file to disk', fileError, 'API/files/upload')
      return NextResponse.json({
        success: false,
        error: '파일 저장에 실패했습니다.'
      }, { status: 500 })
    }

    // 데이터베이스에 파일 정보 저장
    const supabase = createSupabaseServiceRoleClient()

    const fileData = {
      title,
      description,
      file_name: fileName,
      file_path: publicPath,
      file_size: file.size,
      file_type: file.type,
      category,
      active: active !== undefined ? active : true
    }

    const { data: newFile, error } = await supabase
      .from('downloadable_files')
      .insert(fileData)
      .select()
      .single()

    if (error) {
      debugLog.error('Database error saving file info', error, 'API/files/upload')
      console.error('API Error saving file info:', error)
      return NextResponse.json({
        success: false,
        error: `파일 정보 저장에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('File uploaded successfully', {
      fileId: newFile.id,
      title: newFile.title,
      size: file.size
    }, 'API/files/upload')

    return NextResponse.json({
      success: true,
      data: newFile
    }, { status: 201 })

  } catch (error) {
    debugLog.error('Unexpected error in file upload', error, 'API/files/upload')
    console.error('API Error in file upload:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}