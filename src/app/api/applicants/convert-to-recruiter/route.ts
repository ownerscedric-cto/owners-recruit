import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { applicantId } = await request.json()

    if (!applicantId) {
      return NextResponse.json({
        success: false,
        error: '지원자 ID가 필요합니다.'
      }, { status: 400 })
    }

    const supabase = createSupabaseServiceRoleClient()

    // 1. 지원자 정보 조회
    const { data: applicant, error: applicantError } = await (supabase as any)
      .from('applicants')
      .select('*, recruiters(name, team)')
      .eq('id', applicantId)
      .eq('status', 'completed')
      .single()

    if (applicantError || !applicant) {
      return NextResponse.json({
        success: false,
        error: '승인 완료된 지원자를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 2. 이미 모집인으로 등록되어 있는지 확인 (이메일 또는 전화번호로)
    const { data: existingRecruiter } = await (supabase as any)
      .from('recruiters')
      .select('id, name')
      .or(`email.eq.${applicant.email},phone.eq.${applicant.phone}`)
      .single()

    if (existingRecruiter) {
      return NextResponse.json({
        success: false,
        error: `이미 모집인으로 등록되어 있습니다. (${existingRecruiter.name})`
      }, { status: 400 })
    }

    // 3. 모집인 테이블에 추가
    const recruiterData = {
      name: applicant.name,
      email: applicant.email,
      phone: applicant.phone,
      team: applicant.recruiters?.team || '미배정',
      position: '사원', // 기본 직급
      active: true
    }

    const { data: newRecruiter, error: insertError } = await (supabase as any)
      .from('recruiters')
      .insert(recruiterData)
      .select()
      .single()

    if (insertError) {
      console.error('모집인 추가 오류:', insertError)
      return NextResponse.json({
        success: false,
        error: `모집인 등록에 실패했습니다: ${insertError.message}`
      }, { status: 500 })
    }

    // 4. 지원자 상태를 'converted'로 변경 (또는 삭제 대신 표시용)
    // 선택: 지원자를 삭제하거나 상태만 변경
    // 여기서는 soft delete 방식으로 상태만 변경
    const { error: updateError } = await (supabase as any)
      .from('applicants')
      .update({
        status: 'converted',
        converted_to_recruiter_id: newRecruiter.id,
        converted_at: new Date().toISOString()
      })
      .eq('id', applicantId)

    if (updateError) {
      // 모집인은 추가되었지만 지원자 상태 업데이트 실패
      // 롤백하지 않고 경고만 반환
      console.error('지원자 상태 업데이트 오류:', updateError)
    }

    return NextResponse.json({
      success: true,
      data: {
        recruiter: newRecruiter,
        message: `${applicant.name}님이 모집인으로 전환되었습니다.`
      }
    })

  } catch (error) {
    console.error('모집인 전환 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
