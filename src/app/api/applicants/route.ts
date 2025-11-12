import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { Database } from '@/types/database'

type ApplicantRow = Database['public']['Tables']['applicants']['Row']

export async function POST(request: NextRequest) {
  try {
    const applicantData = await request.json()

    console.log('🔄 API: Creating applicant:', {
      name: applicantData.name,
      email: applicantData.email,
      timestamp: new Date().toISOString()
    })

    // 서버 사이드에서 서비스 롤 사용
    const supabaseService = createSupabaseServiceRoleClient()

    // 지원자 생성
    const { data: applicant, error } = await supabaseService
      .from('applicants')
      .insert(applicantData)
      .select('*')
      .single()

    if (error) {
      console.error('❌ API: Supabase insert error:', error)
      return NextResponse.json(
        { success: false, error: `지원자 등록에 실패했습니다: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('✅ API: Applicant created successfully:', {
      id: (applicant as ApplicantRow).id,
      name: (applicant as ApplicantRow).name,
      email: (applicant as ApplicantRow).email
    })

    return NextResponse.json({
      success: true,
      data: applicant
    })

  } catch (error) {
    console.error('💥 API: Error in applicant creation:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}