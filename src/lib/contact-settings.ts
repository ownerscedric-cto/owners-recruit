import { createSupabaseServiceRoleClient } from './supabase'

interface ContactSettings {
  email: string
  phone: string
  description: string
}

export async function getContactSettings(): Promise<ContactSettings | null> {
  try {
    const supabase = createSupabaseServiceRoleClient()

    const { data, error } = await (supabase as any)
      .from('system_settings')
      .select('key, value')
      .eq('category', 'contact')
      .in('key', ['contact_email', 'contact_phone', 'contact_description'])

    if (error) {
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    // 데이터를 객체로 변환
    const settings: Record<string, string> = {}
    data.forEach((item: any) => {
      settings[item.key] = item.value
    })

    return {
      email: settings.contact_email || '',
      phone: settings.contact_phone || '',
      description: settings.contact_description || ''
    }
  } catch (error) {
    return null
  }
}

export async function updateContactSettings(settings: ContactSettings): Promise<boolean> {
  try {
    const supabase = createSupabaseServiceRoleClient()

    const updates = [
      { key: 'contact_email', value: settings.email },
      { key: 'contact_phone', value: settings.phone },
      { key: 'contact_description', value: settings.description }
    ]

    for (const update of updates) {
      const { error } = await (supabase as any)
        .from('system_settings')
        .update({
          value: update.value,
          updated_at: new Date().toISOString()
        })
        .eq('category', 'contact')
        .eq('key', update.key)

      if (error) {
        return false
      }
    }

    return true
  } catch (error) {
    return false
  }
}