import { supabase } from './supabase'
import { Database } from '@/types/database'

export type ExamApplication = Database['public']['Tables']['exam_applications']['Row']
export type ExamApplicationInsert = Database['public']['Tables']['exam_applications']['Insert']
export type ExamApplicationUpdate = Database['public']['Tables']['exam_applications']['Update']

export async function getExamApplicationsByApplicant(applicantId: string): Promise<ExamApplication[]> {
  const { data, error } = await supabase
    .from('exam_applications')
    .select('*')
    .eq('applicant_id', applicantId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching exam applications:', error)
    throw error
  }

  return data || []
}

export async function createExamApplication(application: ExamApplicationInsert): Promise<ExamApplication> {
  const { data, error } = await supabase
    .from('exam_applications')
    .insert([application])
    .select()
    .single()

  if (error) {
    console.error('Error creating exam application:', error.message, error)
    throw new Error(error.message || 'Failed to create exam application')
  }

  return data
}

export async function updateExamApplication(
  id: string,
  updates: ExamApplicationUpdate
): Promise<ExamApplication> {
  const { data, error } = await supabase
    .from('exam_applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating exam application:', error)
    throw error
  }

  return data
}

export async function deleteExamApplication(id: string): Promise<void> {
  const { error } = await supabase
    .from('exam_applications')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting exam application:', error)
    throw error
  }
}

export async function getAllExamApplications(): Promise<ExamApplication[]> {
  const { data, error } = await supabase
    .from('exam_applications')
    .select(`
      *,
      applicant:applicants (
        name,
        phone,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all exam applications:', error)
    throw error
  }

  return data || []
}