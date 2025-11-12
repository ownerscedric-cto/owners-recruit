import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { debugLog } from '@/lib/debug'

// 팀 목록 조회
export async function GET() {
  try {
    debugLog.info('Teams GET request started', null, 'API/teams')
    const supabase = createSupabaseServiceRoleClient()

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      debugLog.error('Database error fetching teams', error, 'API/teams')
      console.error('API Error fetching teams:', error)
      return NextResponse.json({
        success: false,
        error: `팀 목록 조회에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('Teams retrieved successfully', { teamCount: data?.length || 0 }, 'API/teams')
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    debugLog.error('Unexpected error in teams GET', error, 'API/teams')
    console.error('API Error in teams GET:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// 새 팀 생성
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    debugLog.info('Team creation request started', { teamName: data.name }, 'API/teams')

    // 필수 필드 검증
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({
        success: false,
        error: '팀 이름은 필수입니다.'
      }, { status: 400 })
    }

    const supabase = createSupabaseServiceRoleClient()

    // 중복 팀명 검사
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('name', data.name.trim())
      .single()

    if (existingTeam) {
      return NextResponse.json({
        success: false,
        error: '이미 존재하는 팀명입니다.'
      }, { status: 400 })
    }

    // 팀 생성
    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert({
        name: data.name.trim(),
        description: data.description?.trim() || null
      })
      .select()
      .single()

    if (error) {
      debugLog.error('Database error creating team', error, 'API/teams')
      console.error('API Error creating team:', error)
      return NextResponse.json({
        success: false,
        error: `팀 생성에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    debugLog.info('Team created successfully', { teamId: newTeam.id, teamName: newTeam.name }, 'API/teams')
    return NextResponse.json({
      success: true,
      data: newTeam
    }, { status: 201 })
  } catch (error) {
    debugLog.error('Unexpected error in team creation', error, 'API/teams')
    console.error('API Error in team creation:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}