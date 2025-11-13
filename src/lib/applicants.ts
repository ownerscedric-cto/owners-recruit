import { supabase } from './supabase'
import { Database } from '@/types/database'

type ApplicantStatus = Database['public']['Tables']['applicants']['Row']['status']

export interface ApplicantFormData {
  name: string
  phone: string
  email: string
  address: string
  birth_date: string
  resident_number?: string
  recruiter_name?: string
  bank_name?: string
  bank_account?: string
  final_school?: string
  life_insurance_pass_date?: string
  life_education_date?: string
  documents_confirmed?: boolean
  document_preparation_date?: string
  applicant_type?: 'new' | 'experienced'
}

export async function createApplicant(data: ApplicantFormData) {
  try {
    // 1. 모집인 찾기 (있다면)
    let recruiterId: string | null = null
    if (data.recruiter_name) {
      const recruiterQuery = await supabase
        .from('recruiters')
        .select('id')
        .eq('name', data.recruiter_name)
        .maybeSingle()

      if (recruiterQuery.data && !recruiterQuery.error) {
        recruiterId = (recruiterQuery.data as { id: string }).id
      }
    }

    // 2. 생년월일을 주민번호에서 추출 (실제로는 별도 필드 사용)
    const birthDate = data.birth_date || new Date().toISOString().split('T')[0]

    // 3. 지원자 데이터 준비
    const applicantData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      birth_date: birthDate,
      resident_number: data.resident_number || null,
      bank_name: data.bank_name || null,
      bank_account: data.bank_account || null,
      life_insurance_pass_date: data.life_insurance_pass_date || null,
      life_education_date: data.life_education_date || null,
      final_school: data.final_school || null,
      documents_confirmed: data.documents_confirmed || false,
      document_preparation_date: data.document_preparation_date || null,
      applicant_type: data.applicant_type || 'new',
      recruiter_id: recruiterId,
      status: 'pending' as const
    }

    // 4. 지원자 생성 - RPC 호출로 대체하거나 직접 SQL 실행
    const response = await fetch('/api/applicants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicantData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '지원자 등록에 실패했습니다.')
    }

    const result = await response.json()
    return { success: true, data: result.data }
  } catch (error) {
    // Error in createApplicant
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function getApplicants() {
  try {
    const { data, error } = await supabase
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
        status,
        submitted_at,
        recruiters (
          name,
          team
        )
      `)
      .is('deleted_at', null)  // Only fetch non-deleted applicants
      .order('submitted_at', { ascending: false })

    if (error) {
      throw new Error(`지원자 목록 조회에 실패했습니다: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function updateApplicantStatus(id: string, status: ApplicantStatus) {
  try {
    // Updating applicant status via API

    // API 라우트로 요청
    const response = await fetch(`/api/applicants/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    // API Response received

    if (!response.ok) {
      const errorData = await response.json()
      // API Error
      return {
        success: false,
        error: errorData.error || '상태 업데이트에 실패했습니다.'
      }
    }

    const result = await response.json()
    // API call successful

    return result
  } catch (error) {
    // Error calling API
    return {
      success: false,
      error: error instanceof Error ? error.message : '네트워크 오류가 발생했습니다'
    }
  }
}

export async function checkDuplicateApplicant(name: string, phone: string) {
  try {
    const response = await fetch('/api/applicants/check-duplicate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, phone }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || '중복 확인에 실패했습니다.'
      }
    }

    const result = await response.json()
    return result
  } catch (error) {
    // Error checking duplicate
    return {
      success: false,
      error: error instanceof Error ? error.message : '네트워크 오류가 발생했습니다'
    }
  }
}

export async function updateApplicantRecruiter(applicantId: string, recruiterName: string | null) {
  try {
    // Updating applicant recruiter via API

    // API 라우트로 요청
    const response = await fetch(`/api/applicants/${applicantId}/recruiter`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recruiterName }),
    })

    // Recruiter API Response received

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      // Recruiter API Error
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}` || '도입자 정보 수정에 실패했습니다.'
      }
    }

    const result = await response.json()
    // Recruiter API call successful

    return result
  } catch (error) {
    // Error calling recruiter API
    return {
      success: false,
      error: error instanceof Error ? error.message : '네트워크 오류가 발생했습니다'
    }
  }
}