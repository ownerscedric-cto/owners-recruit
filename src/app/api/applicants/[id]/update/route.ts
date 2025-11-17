import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateAdminSession } from '@/lib/admin-auth'
import { encryptResidentNumber } from '@/lib/encryption'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 관리자 권한 확인
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ success: false, error: '인증 토큰이 필요합니다.' }, { status: 401 })
    }

    const admin = await validateAdminSession(token)
    if (!admin) {
      return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
    }

    const { id } = await params
    const data = await request.json()

    // 주민번호가 있으면 암호화
    if (data.resident_number && !data.resident_number.startsWith('encrypted:')) {
      data.resident_number = encryptResidentNumber(data.resident_number)
    }

    // 업데이트할 수 있는 필드들
    const updateableFields = [
      'email',
      'phone',
      'address',
      'birth_date',
      'bank_name',
      'bank_account',
      'life_insurance_pass_date',
      'life_education_date'
    ]

    // 업데이트할 데이터만 필터링
    const updateData: any = {}
    for (const field of updateableFields) {
      if (data.hasOwnProperty(field)) {
        updateData[field] = data[field]
      }
    }

    // 지원자 정보 업데이트
    const { data: updatedApplicant, error } = await supabase
      .from('applicants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating applicant:', error)
      return NextResponse.json({ success: false, error: '지원자 정보 업데이트에 실패했습니다.' }, { status: 500 })
    }

    // 업데이트 로그 기록
    await supabase
      .from('activity_logs')
      .insert({
        user_id: admin.id,
        action: 'update_applicant',
        target: `applicants:${id}`,
        details: {
          updated_fields: Object.keys(updateData),
          updated_by: admin.username
        }
      })

    return NextResponse.json({
      success: true,
      data: updatedApplicant,
      message: '지원자 정보가 성공적으로 업데이트되었습니다.'
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}