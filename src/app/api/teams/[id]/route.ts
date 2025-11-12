import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'

// 특정 팀 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    debugLog.info('Team GET request started', { teamId: id }, 'API/teams')
    const supabase = createSupabaseServiceRoleClient()

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      debugLog.error('Database error fetching team', error, 'API/teams')
      console.error('API Error fetching team:', error)
      return NextResponse.json({
        success: false,
        error: `팀 조회에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        error: '팀을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    debugLog.info('Team retrieved successfully', { teamId: id, teamName: data.name }, 'API/teams')
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    debugLog.error('Unexpected error in team GET', error, 'API/teams')
    console.error('API Error in team GET:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// 팀 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    debugLog.info('Team update request started', { teamId: id }, 'API/teams')

    const supabase = createSupabaseServiceRoleClient()

    // 팀 존재 확인
    const { data: existingTeam, error: fetchError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingTeam) {
      return NextResponse.json({
        success: false,
        error: '팀을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 팀명 중복 검사 (다른 팀에서)
    if (data.name && data.name !== existingTeam.name) {
      const { data: duplicateTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('name', data.name.trim())
        .neq('id', id)
        .single()

      if (duplicateTeam) {
        return NextResponse.json({
          success: false,
          error: '이미 존재하는 팀명입니다.'
        }, { status: 400 })
      }
    }

    // 업데이트할 데이터 준비
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.description !== undefined) updateData.description = data.description?.trim() || null

    // 팀 정보 업데이트
    const { data: updatedTeam, error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      debugLog.error('Database error updating team', error, 'API/teams')
      console.error('API Error updating team:', error)
      return NextResponse.json({
        success: false,
        error: `팀 정보 수정에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('Team updated successfully', { teamId: id, teamName: updatedTeam.name }, 'API/teams')
    return NextResponse.json({
      success: true,
      data: updatedTeam
    })
  } catch (error) {
    debugLog.error('Unexpected error in team update', error, 'API/teams')
    console.error('API Error in team update:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// 팀 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    debugLog.info('Team deletion request started', { teamId: id }, 'API/teams')

    const supabase = createSupabaseServiceRoleClient()

    // 팀 존재 확인
    const { data: existingTeam, error: fetchError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingTeam) {
      return NextResponse.json({
        success: false,
        error: '팀을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 팀을 사용하고 있는 모집인이 있는지 확인
    const { data: recruitersUsingTeam, error: recruitersError } = await supabase
      .from('recruiters')
      .select('id, name')
      .eq('team', existingTeam.name)

    if (recruitersError) {
      debugLog.error('Error checking recruiters using team', recruitersError, 'API/teams')
      return NextResponse.json({
        success: false,
        error: '팀 사용 여부 확인 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    if (recruitersUsingTeam && recruitersUsingTeam.length > 0) {
      return NextResponse.json({
        success: false,
        error: `이 팀을 사용하고 있는 모집인이 ${recruitersUsingTeam.length}명 있습니다. 팀을 삭제하기 전에 모집인들의 팀을 변경해주세요.`
      }, { status: 400 })
    }

    // 팀 삭제
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)

    if (error) {
      debugLog.error('Database error deleting team', error, 'API/teams')
      console.error('API Error deleting team:', error)
      return NextResponse.json({
        success: false,
        error: `팀 삭제에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('Team deleted successfully', { teamId: id, teamName: existingTeam.name }, 'API/teams')
    return NextResponse.json({
      success: true,
      message: '팀이 성공적으로 삭제되었습니다.'
    })
  } catch (error) {
    debugLog.error('Unexpected error in team deletion', error, 'API/teams')
    console.error('API Error in team deletion:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}