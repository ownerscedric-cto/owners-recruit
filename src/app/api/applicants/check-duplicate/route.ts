import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { name, phone } = await request.json()

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: '이름과 연락처를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 전화번호에서 숫자만 추출
    const cleanPhone = phone.replace(/[^0-9]/g, '')

    // 서버 사이드에서 서비스 롤 사용
    const supabaseService = createSupabaseServiceRoleClient()

    // 이름과 전화번호가 일치하는 지원자 찾기
    const { data: existingApplicants, error } = await supabaseService
      .from('applicants')
      .select('id, name, phone, status, submitted_at')
      .eq('name', name)

    if (error) {
      console.error('Error checking duplicate:', error)
      return NextResponse.json(
        { success: false, error: '중복 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 전화번호가 일치하는 지원자 찾기
    const duplicateApplicant = existingApplicants?.find(applicant => {
      const cleanApplicantPhone = applicant.phone?.replace(/[^0-9]/g, '') || ''
      return cleanApplicantPhone === cleanPhone
    })

    if (duplicateApplicant) {
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        applicant: {
          id: duplicateApplicant.id,
          name: duplicateApplicant.name,
          phone: duplicateApplicant.phone,
          status: duplicateApplicant.status,
          createdAt: duplicateApplicant.submitted_at
        }
      })
    }

    return NextResponse.json({
      success: true,
      isDuplicate: false
    })

  } catch (error) {
    console.error('Error in duplicate check:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}