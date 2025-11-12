import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'
import { Database } from '@/types/database'
import { stringifySettingValue } from '@/lib/system-settings'

// 개별 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const { category, key, value } = await request.json()

    if (!category || !key) {
      return NextResponse.json({
        success: false,
        error: '카테고리와 키는 필수입니다.'
      }, { status: 400 })
    }

    const supabase = createSupabaseServiceRoleClient()
    const stringValue = stringifySettingValue(value)

    // @ts-ignore - Supabase 타입 정의 이슈로 인한 임시 우회
    const { data, error } = await (supabase as any)
      .from('system_settings')
      .update({
        value: stringValue,
        updated_at: new Date().toISOString()
      })
      .eq('category', category)
      .eq('key', key)
      .select()
      .single()

    if (error) {
      console.error('API Error updating setting:', error)
      return NextResponse.json({
        success: false,
        error: `설정 업데이트에 실패했습니다: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: '설정이 성공적으로 업데이트되었습니다.'
    })
  } catch (error) {
    console.error('API Error in setting update PUT:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '설정 업데이트에 실패했습니다'
    }, { status: 500 })
  }
}