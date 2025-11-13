import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'
import { Database } from '@/types/database'

// 지원자 소프트 삭제 (관리자 전용)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { deletion_reason, deleted_by } = await request.json()

    if (!deletion_reason) {
      return NextResponse.json({
        success: false,
        error: '삭제 사유를 입력해주세요.'
      }, { status: 400 })
    }

    debugLog.info('Soft deleting applicant', { id, deletion_reason, deleted_by }, 'API/applicants/delete')

    const supabase = createSupabaseServiceRoleClient()

    // 현재 지원자 정보 확인
    const { data: applicant, error: fetchError } = await supabase
      .from('applicants')
      .select('id, name, deleted_at')
      .eq('id', id)
      .single()

    if (fetchError || !applicant) {
      debugLog.error('Applicant not found for deletion', { id }, 'API/applicants/delete')
      return NextResponse.json({
        success: false,
        error: '지원자를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 이미 삭제된 지원자인지 확인
    const applicantWithDeleted = applicant as Database['public']['Tables']['applicants']['Row']
    if (applicantWithDeleted.deleted_at) {
      return NextResponse.json({
        success: false,
        error: '이미 삭제된 지원자입니다.'
      }, { status: 400 })
    }

    // 소프트 삭제 수행 (deleted_at 필드 업데이트)
    const updateData: Database['public']['Tables']['applicants']['Update'] = {
      deleted_at: new Date().toISOString(),
      deletion_reason,
      deleted_by,
      updated_at: new Date().toISOString()
    }

    const { data: updatedApplicant, error: updateError } = await supabase
      .from('applicants')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      debugLog.error('Error soft deleting applicant', updateError, 'API/applicants/delete')
      return NextResponse.json({
        success: false,
        error: '지원자 삭제에 실패했습니다.'
      }, { status: 500 })
    }

    // 삭제 로그 기록
    const auditLogData: Database['public']['Tables']['audit_logs']['Insert'] = {
      entity_type: 'applicant',
      entity_id: id,
      action: 'soft_delete',
      performed_by: deleted_by,
      details: {
        applicant_name: applicantWithDeleted.name,
        deletion_reason,
        deleted_at: new Date().toISOString()
      }
    }

    await supabase
      .from('audit_logs')
      .insert(auditLogData as never)

    debugLog.info('Applicant soft deleted successfully', {
      id,
      name: applicantWithDeleted.name,
      deleted_by,
      deletion_reason
    }, 'API/applicants/delete')

    return NextResponse.json({
      success: true,
      message: '지원자가 삭제되었습니다.',
      data: updatedApplicant
    })

  } catch (error) {
    debugLog.error('Unexpected error in soft delete applicant', error, 'API/applicants/delete')
    return NextResponse.json({
      success: false,
      error: '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 지원자 복구 (관리자 전용)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { restored_by } = await request.json()

    debugLog.info('Restoring deleted applicant', { id, restored_by }, 'API/applicants/restore')

    const supabase = createSupabaseServiceRoleClient()

    // 복구 수행 (deleted_at 필드를 null로)
    const restoreData: Database['public']['Tables']['applicants']['Update'] = {
      deleted_at: null,
      deletion_reason: null,
      deleted_by: null,
      updated_at: new Date().toISOString()
    }

    const { data: restoredApplicant, error: updateError } = await supabase
      .from('applicants')
      .update(restoreData as never)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      debugLog.error('Error restoring applicant', updateError, 'API/applicants/restore')
      return NextResponse.json({
        success: false,
        error: '지원자 복구에 실패했습니다.'
      }, { status: 500 })
    }

    // 복구 로그 기록
    const restoreAuditData: Database['public']['Tables']['audit_logs']['Insert'] = {
      entity_type: 'applicant',
      entity_id: id,
      action: 'restore',
      performed_by: restored_by,
      details: {
        applicant_name: (restoredApplicant as Database['public']['Tables']['applicants']['Row']).name,
        restored_at: new Date().toISOString()
      }
    }

    await supabase
      .from('audit_logs')
      .insert(restoreAuditData as never)

    debugLog.info('Applicant restored successfully', {
      id,
      name: (restoredApplicant as Database['public']['Tables']['applicants']['Row']).name,
      restored_by
    }, 'API/applicants/restore')

    return NextResponse.json({
      success: true,
      message: '지원자가 복구되었습니다.',
      data: restoredApplicant
    })

  } catch (error) {
    debugLog.error('Unexpected error in restore applicant', error, 'API/applicants/restore')
    return NextResponse.json({
      success: false,
      error: '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 })
  }
}