import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { Database } from '@/types/database'

type ApplicantRow = Database['public']['Tables']['applicants']['Row']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json()
    const { id } = await params

    console.log('🔄 API: Updating applicant status:', { id, status, timestamp: new Date().toISOString() })

    if (!id || id === 'undefined') {
      console.error('❌ API: Invalid ID provided:', id)
      return NextResponse.json(
        { success: false, error: '유효하지 않은 지원자 ID입니다.' },
        { status: 400 }
      )
    }

    // 서버 사이드에서 서비스 롤 사용
    const supabaseService = createSupabaseServiceRoleClient()

    // 먼저 해당 ID가 존재하는지 확인
    const { data: existingData, error: checkError } = await supabaseService
      .from('applicants')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingData) {
      console.error('❌ API: Applicant not found or error:', { id, error: checkError })
      return NextResponse.json(
        { success: false, error: '해당 지원자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.log('✅ API: Found existing applicant:', {
      id: (existingData as ApplicantRow).id,
      currentStatus: (existingData as ApplicantRow).status,
      newStatus: status
    })

    // 업데이트 수행 (타입 체크 우회)
    const updateResult = await (supabaseService as any)
      .from('applicants')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    console.log('📝 API: Full update result:', {
      data: updateResult.data,
      error: updateResult.error
    })

    if (updateResult.error) {
      console.error('❌ API: Supabase update error:', updateResult.error)
      return NextResponse.json(
        { success: false, error: `상태 업데이트에 실패했습니다: ${updateResult.error.message}` },
        { status: 500 }
      )
    }

    if (updateResult.data) {
      const updatedRecord = updateResult.data as ApplicantRow
      console.log('✅ API: Update successful:', {
        id: updatedRecord.id,
        oldStatus: (existingData as ApplicantRow).status,
        newStatus: updatedRecord.status,
        updateSuccess: updatedRecord.status === status
      })

      return NextResponse.json({
        success: true,
        data: updatedRecord
      })
    }

    console.error('❌ API: No data returned after update')
    return NextResponse.json(
      { success: false, error: '업데이트 후 데이터를 가져올 수 없습니다.' },
      { status: 500 }
    )
  } catch (error) {
    console.error('💥 API: Error in status update:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}