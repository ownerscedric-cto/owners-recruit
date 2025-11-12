import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient()

    // 현재 설정 확인
    const { data: existing, error: checkError } = await (supabase as any)
      .from('system_settings')
      .select('*')
      .in('key', ['contact_email', 'contact_phone', 'contact_description'])

    if (checkError) {
      return NextResponse.json({ error: 'Failed to check settings' }, { status: 500 })
    }


    // 기본 연락처 설정
    const defaultSettings = [
      {
        category: 'contact',
        key: 'contact_email',
        value: 'contact@owners.co.kr',
        data_type: 'string',
        is_encrypted: false,
        description: '대표 문의 이메일'
      },
      {
        category: 'contact',
        key: 'contact_phone',
        value: '02-1234-5678',
        data_type: 'string',
        is_encrypted: false,
        description: '대표 문의 전화번호'
      },
      {
        category: 'contact',
        key: 'contact_description',
        value: '궁금한 사항이 있으시면 언제든지 연락해 주세요.',
        data_type: 'string',
        is_encrypted: false,
        description: '문의 안내 메시지'
      }
    ]

    const results = []

    for (const setting of defaultSettings) {
      const existingSetting = existing?.find((s: any) => s.key === setting.key)

      if (!existingSetting) {
        // 없으면 새로 추가
        const { data, error: insertError } = await (supabase as any)
          .from('system_settings')
          .insert([setting])
          .select()
          .single()

        if (insertError) {
          results.push({ key: setting.key, status: 'error', error: insertError.message })
        } else {
          results.push({ key: setting.key, status: 'added', data })
        }
      } else {
        results.push({ key: setting.key, status: 'exists', data: existingSetting })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Contact settings setup completed',
      results
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to setup contact settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}