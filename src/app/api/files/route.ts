import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'
import { Database } from '@/types/database'

// 파일 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'
    const category = searchParams.get('category')

    debugLog.info('Downloadable files GET request started', { activeOnly, category }, 'API/files')
    const supabase = createSupabaseServiceRoleClient()

    let query = (supabase as any)
      .from('downloadable_files')
      .select('*')

    // activeOnly 파라미터가 true면 활성 파일만 조회
    if (activeOnly) {
      query = query.eq('active', true)
    }

    // 카테고리 필터링
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      debugLog.error('Database error fetching files', error, 'API/files')
      console.error('API Error fetching files:', error)
      return NextResponse.json({
        success: false,
        error: `파일 목록 조회에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('Files retrieved successfully', { fileCount: data?.length || 0 }, 'API/files')
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    debugLog.error('Unexpected error in files GET', error, 'API/files')
    console.error('API Error in files GET:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// 새 파일 정보 생성 (파일 업로드 없이 정보만 등록)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    debugLog.info('File creation request started', { title: data.title }, 'API/files')

    // 필수 필드 검증
    if (!data.title || !data.file_name || !data.file_path) {
      return NextResponse.json({
        success: false,
        error: '제목, 파일명, 파일 경로는 필수입니다.'
      }, { status: 400 })
    }

    const supabase = createSupabaseServiceRoleClient()

    // 파일 정보 생성
    const fileData = {
      title: data.title,
      description: data.description || null,
      file_name: data.file_name,
      file_path: data.file_path,
      file_size: data.file_size || 0,
      file_type: data.file_type || 'application/octet-stream',
      category: data.category || 'general',
      active: data.active !== undefined ? data.active : true
    }

    const { data: newFile, error } = await (supabase as any)
      .from('downloadable_files')
      .insert(fileData)
      .select()
      .single()

    const typedNewFile = newFile as Database['public']['Tables']['downloadable_files']['Row'] | null

    if (error) {
      debugLog.error('Database error creating file', error, 'API/files')
      console.error('API Error creating file:', error)
      return NextResponse.json({
        success: false,
        error: `파일 등록에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('File created successfully', { fileId: typedNewFile?.id, title: typedNewFile?.title }, 'API/files')
    return NextResponse.json({
      success: true,
      data: typedNewFile
    }, { status: 201 })
  } catch (error) {
    debugLog.error('Unexpected error in file creation', error, 'API/files')
    console.error('API Error in file creation:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}