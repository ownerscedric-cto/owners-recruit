import { supabase } from './supabase'

export interface Career {
  id: string
  applicant_id: string
  company: string
  position: string
  start_date: string
  end_date: string
  description: string | null
  company_type: 'insurance' | 'financial'
  termination_status: 'completed' | 'in_progress' | 'need_help' | null
  termination_date: string | null
  created_at: string
  updated_at: string
}

export async function getCareersByApplicant(applicantId: string) {
  try {
    const { data, error } = await supabase
      .from('careers')
      .select('*')
      .eq('applicant_id', applicantId)
      .order('start_date', { ascending: false })

    if (error) {
      throw new Error(`경력 정보 조회에 실패했습니다: ${error.message}`)
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      data: []
    }
  }
}