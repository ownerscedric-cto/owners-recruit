import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { parseSettingValue, stringifySettingValue } from '@/lib/system-settings'
import { debugLog } from '@/lib/debug'
import { Database } from '@/types/database'
import { invalidateSettingsCache } from '@/lib/settings-cache'

// 모든 시스템 설정 조회
export async function GET() {
  try {
    debugLog.info('System settings GET request started', null, 'API/settings')
    const supabase = createSupabaseServiceRoleClient()

    const { data, error } = await (supabase as any)
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true })

    const typedData = data as Database['public']['Tables']['system_settings']['Row'][] | null

    if (error) {
      debugLog.error('Database error fetching system settings', error, 'API/settings')
      console.error('API Error fetching system settings:', error)
      return NextResponse.json({
        success: false,
        error: `시스템 설정 조회에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    // 설정을 구조화된 객체로 변환
    const settings: any = {}
    typedData?.forEach((setting) => {
      const value = parseSettingValue(setting.value, setting.data_type)

      // 카테고리별로 그룹화하지 않고 flat한 구조로 변환
      const key = setting.key
      settings[key] = value
    })

    debugLog.info('System settings retrieved successfully', { settingsCount: Object.keys(settings).length }, 'API/settings')
    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error) {
    debugLog.error('Unexpected error in system settings GET', error, 'API/settings')
    console.error('API Error in system settings GET:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// 시스템 설정 일괄 업데이트
export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json()
    debugLog.info('System settings UPDATE request started', { settingsKeys: Object.keys(settings) }, 'API/settings')
    const supabase = createSupabaseServiceRoleClient()

    // 각 설정을 개별적으로 업데이트
    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      // 기존 설정 정보 조회
      const { data: existingSetting, error: fetchError } = await (supabase as any)
        .from('system_settings')
        .select('data_type')
        .eq('key', key)
        .single()

      if (fetchError) {
        throw new Error(`설정 조회 실패: ${key}`)
      }

      // 값을 문자열로 변환
      const stringValue = stringifySettingValue(value)

      // 설정 업데이트
      const { error: updateError } = await (supabase as any)
        .from('system_settings')
        .update({
          value: stringValue,
          updated_at: new Date().toISOString()
        })
        .eq('key', key)

      if (updateError) {
        throw new Error(`설정 업데이트 실패: ${key}`)
      }
    })

    await Promise.all(updatePromises)

    // 설정 캐시 무효화
    invalidateSettingsCache()

    debugLog.info('System settings updated successfully', { updatedSettings: Object.keys(settings) }, 'API/settings')

    // 설정 변경 후 Next.js 재검증 (캐시 무효화)
    // revalidateTag 또는 revalidatePath를 사용할 수 있지만,
    // 여기서는 간단히 응답에 캐시 헤더를 추가
    const response = NextResponse.json({
      success: true,
      message: '시스템 설정이 성공적으로 저장되었습니다.'
    })

    // 캐시 무효화를 위한 헤더 추가
    response.headers.set('Cache-Control', 'no-store, must-revalidate')

    return response
  } catch (error) {
    debugLog.error('Error updating system settings', error, 'API/settings')
    console.error('API Error in system settings PUT:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '설정 저장에 실패했습니다'
    }, { status: 500 })
  }
}