import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { Database } from '@/types/database'

type ApplicantRow = Database['public']['Tables']['applicants']['Row']

export async function GET() {
  try {
    const supabaseService = createSupabaseServiceRoleClient()

    const { data, error } = await supabaseService
      .from('applicants')
      .select(`
        id,
        name,
        email,
        phone,
        address,
        birth_date,
        resident_number,
        bank_name,
        bank_account,
        life_insurance_pass_date,
        life_education_date,
        final_school,
        documents_confirmed,
        document_preparation_date,
        applicant_type,
        waiting_for_schedule,
        status,
        submitted_at,
        appointment_deadline,
        recruiters:recruiters!applicants_recruiter_id_fkey (
          name,
          team
        )
      `)
      .is('deleted_at', null)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('API: Error fetching applicants:', error)
      return NextResponse.json(
        { success: false, error: `지원자 목록 조회에 실패했습니다: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API: Error in GET applicants:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    const { previousCompanies, ...applicantData } = requestData

    console.log('🔄 API: Creating applicant:', {
      name: applicantData.name,
      email: applicantData.email,
      applicant_type: applicantData.applicant_type,
      hasCareerData: !!previousCompanies?.length,
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

    const applicantId = (applicant as ApplicantRow).id

    // 경력자인 경우 경력 정보도 저장
    if (applicantData.applicant_type === 'experienced' && previousCompanies?.length > 0) {
      console.log('🔄 API: Saving career data:', {
        applicantId,
        careerCount: previousCompanies.length
      })

      const careerInserts = previousCompanies.map((career: any) => ({
        applicant_id: applicantId,
        company: career.companyName,
        position: career.position,
        start_date: career.startDate,
        end_date: career.endDate,
        description: null, // 설명은 현재 폼에서 입력받지 않음
        company_type: career.companyType,
        termination_status: career.terminationStatus || null,
        termination_date: career.terminationDate || null
      }))

      const { error: careerError } = await supabaseService
        .from('careers')
        .insert(careerInserts)

      if (careerError) {
        console.error('❌ API: Career insert error:', careerError)
        // 지원자는 이미 생성되었으므로 경력 정보 저장 실패만 로그
        console.warn('⚠️ API: Applicant created but career data failed to save')
      } else {
        console.log('✅ API: Career data saved successfully')
      }
    }

    console.log('✅ API: Applicant created successfully:', {
      id: applicantId,
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