import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'

// 특정 파일 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    debugLog.info('File GET request started', { fileId: id }, 'API/files')
    const supabase = createSupabaseServiceRoleClient()

    const { data, error } = await supabase
      .from('downloadable_files')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      debugLog.error('Database error fetching file', error, 'API/files')
      console.error('API Error fetching file:', error)
      return NextResponse.json({
        success: false,
        error: `파일 조회에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        error: '파일을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    debugLog.info('File retrieved successfully', { fileId: id, title: data.title }, 'API/files')
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    debugLog.error('Unexpected error in file GET', error, 'API/files')
    console.error('API Error in file GET:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// 파일 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    debugLog.info('File update request started', { fileId: id }, 'API/files')

    const supabase = createSupabaseServiceRoleClient()

    // 파일 존재 확인
    const { data: existingFile, error: fetchError } = await supabase
      .from('downloadable_files')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingFile) {
      return NextResponse.json({
        success: false,
        error: '파일을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 업데이트할 데이터 준비
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.category !== undefined) updateData.category = data.category
    if (data.active !== undefined) updateData.active = data.active

    // 파일 정보 업데이트
    const { data: updatedFile, error } = await supabase
      .from('downloadable_files')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      debugLog.error('Database error updating file', error, 'API/files')
      console.error('API Error updating file:', error)
      return NextResponse.json({
        success: false,
        error: `파일 정보 수정에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('File updated successfully', { fileId: id, title: updatedFile.title }, 'API/files')
    return NextResponse.json({
      success: true,
      data: updatedFile
    })
  } catch (error) {
    debugLog.error('Unexpected error in file update', error, 'API/files')
    console.error('API Error in file update:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// 파일 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    debugLog.info('File deletion request started', { fileId: id }, 'API/files')

    const supabase = createSupabaseServiceRoleClient()

    // 파일 존재 확인
    const { data: existingFile, error: fetchError } = await supabase
      .from('downloadable_files')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingFile) {
      return NextResponse.json({
        success: false,
        error: '파일을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 파일 삭제
    const { error } = await supabase
      .from('downloadable_files')
      .delete()
      .eq('id', id)

    if (error) {
      debugLog.error('Database error deleting file', error, 'API/files')
      console.error('API Error deleting file:', error)
      return NextResponse.json({
        success: false,
        error: `파일 삭제에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('File deleted successfully', { fileId: id, title: existingFile.title }, 'API/files')
    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 삭제되었습니다.'
    })
  } catch (error) {
    debugLog.error('Unexpected error in file deletion', error, 'API/files')
    console.error('API Error in file deletion:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}