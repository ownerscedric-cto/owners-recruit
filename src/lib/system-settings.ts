export interface SystemSetting {
  id: string
  category: string
  key: string
  value: string
  data_type: string
  description?: string
  is_encrypted: boolean
  created_at: string
  updated_at: string
}

export interface SystemSettingsData {
  // 시스템 설정
  system_name: string
  system_version: string
  maintenance_mode: boolean
  debug_mode: boolean

  // 데이터베이스 설정
  backup_enabled: boolean
  backup_interval: number
  retention_days: number

  // 이메일 설정
  notifications_enabled: boolean
  smtp_server: string
  smtp_port: number
  email_from: string

  // 보안 설정
  session_timeout: number
  password_policy: boolean
  two_factor_auth: boolean
  ip_whitelist: string

  // 일반 설정
  timezone: string
  language: string
  date_format: string
  records_per_page: number
}

export async function getSystemSettings(): Promise<{ success: boolean; data?: SystemSettingsData; error?: string }> {
  try {
    const response = await fetch('/api/system-settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '시스템 설정 조회에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in getSystemSettings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function updateSystemSettings(settings: Partial<SystemSettingsData>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/system-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '시스템 설정 저장에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in updateSystemSettings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function getSettingsByCategory(category: string): Promise<{ success: boolean; data?: SystemSetting[]; error?: string }> {
  try {
    const response = await fetch(`/api/system-settings/${category}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '카테고리별 설정 조회에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in getSettingsByCategory:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function updateSetting(category: string, key: string, value: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/system-settings/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category, key, value }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '설정 업데이트에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in updateSetting:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

// 값 타입 변환 헬퍼 함수들
export function parseSettingValue(value: string, dataType: string): any {
  switch (dataType) {
    case 'boolean':
      return value === 'true'
    case 'number':
      return parseFloat(value)
    case 'json':
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    default:
      return value
  }
}

export function stringifySettingValue(value: any): string {
  if (typeof value === 'boolean') {
    return value.toString()
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}