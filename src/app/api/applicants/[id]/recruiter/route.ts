import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicantId } = await params
    const { recruiterName } = await request.json()

    console.log('🔄 API: Updating applicant recruiter:', {
      applicantId,
      recruiterName,
      timestamp: new Date().toISOString()
    })

    // 서버 사이드에서 서비스 롤 사용
    const supabaseService = createSupabaseServiceRoleClient()

    // 1. 모집인 찾기 (있다면)
    let recruiterId: string | null = null
    if (recruiterName && recruiterName !== 'none') {
      const recruiterQuery = await supabaseService
        .from('recruiters')
        .select('id')
        .eq('name', recruiterName)
        .maybeSingle()

      if (recruiterQuery.data && !recruiterQuery.error) {
        recruiterId = (recruiterQuery.data as { id: string }).id
        console.log('✅ API: Found recruiter:', { recruiterName, recruiterId })
      } else {
        console.log('⚠️ API: Recruiter not found:', { recruiterName })
      }
    } else {
      console.log('ℹ️ API: Removing recruiter assignment')
    }

    // 2. 지원자의 recruiter_id 업데이트
    const updateResult = await supabaseService
      .from('applicants')
      // @ts-ignore - Supabase 타입 정의 이슈로 인한 임시 우회
      .update({ recruiter_id: recruiterId })
      .eq('id', applicantId)
      .select()

    if (updateResult.error) {
      console.error('❌ API: Error updating recruiter:', updateResult.error)
      return NextResponse.json({
        success: false,
        error: `도입자 정보 수정에 실패했습니다: ${updateResult.error?.message || '알 수 없는 오류'}`
      }, { status: 500 })
    }

    if (updateResult.data && updateResult.data.length > 0) {
      const updatedRecord = updateResult.data[0]
      console.log('✅ API: Recruiter update successful:', {
        applicantId,
        oldRecruiterId: 'unknown',
        newRecruiterId: recruiterId,
        updateSuccess: true,
        updatedData: updatedRecord
      })

      return NextResponse.json({
        success: true,
        data: updatedRecord
      })
    }

    console.error('❌ API: No data returned after update')
    return NextResponse.json({
      success: false,
      error: '업데이트 후 데이터를 가져올 수 없습니다.'
    }, { status: 500 })

  } catch (error) {
    console.error('💥 API: Error in recruiter update:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}