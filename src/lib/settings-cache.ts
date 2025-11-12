import { createSupabaseServiceRoleClient } from './supabase'

// 설정 캐시 인터페이스
interface SettingsCache {
  maintenance_mode: boolean
  debug_mode: boolean
  lastUpdated: number
}

// 메모리 캐시 (5분간 유효)
let settingsCache: SettingsCache | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5분

export async function getSystemSetting(key: string): Promise<string | null> {
  try {
    const supabase = createSupabaseServiceRoleClient()

    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error) {
      console.error('Error fetching setting:', error)
      return null
    }

    return data?.value || null
  } catch (error) {
    console.error('Error in getSystemSetting:', error)
    return null
  }
}

export async function isMaintenanceMode(): Promise<boolean> {
  try {
    // 캐시 확인
    if (settingsCache && Date.now() - settingsCache.lastUpdated < CACHE_DURATION) {
      return settingsCache.maintenance_mode
    }

    // 데이터베이스에서 최신 값 조회
    const value = await getSystemSetting('maintenance_mode')
    const isMaintenanceEnabled = value === 'true'

    // 캐시 업데이트
    if (!settingsCache) {
      settingsCache = {
        maintenance_mode: isMaintenanceEnabled,
        debug_mode: false,
        lastUpdated: Date.now()
      }
    } else {
      settingsCache.maintenance_mode = isMaintenanceEnabled
      settingsCache.lastUpdated = Date.now()
    }

    return isMaintenanceEnabled
  } catch (error) {
    console.error('Error checking maintenance mode:', error)
    // 에러 발생 시 안전을 위해 false 반환 (접근 허용)
    return false
  }
}

export async function isDebugMode(): Promise<boolean> {
  try {
    const value = await getSystemSetting('debug_mode')
    return value === 'true'
  } catch (error) {
    console.error('Error checking debug mode:', error)
    return false
  }
}

// 캐시 무효화 함수 (설정 변경 시 호출)
export function invalidateSettingsCache(): void {
  settingsCache = null
}

// 관리자 IP 확인 함수 (로컬호스트 및 설정된 IP)
export function isAdminAccess(ip: string): boolean {
  const adminIPs = [
    '127.0.0.1',
    '::1',
    'localhost',
    '192.168.',  // 로컬 네트워크
    '10.0.',     // 로컬 네트워크
    '172.16.',   // 로컬 네트워크
  ]

  return adminIPs.some(adminIP => ip.includes(adminIP))
}

// 관리자 경로 확인
export function isAdminPath(pathname: string): boolean {
  const adminPaths = [
    '/admin',
    '/api/system-settings'
  ]

  return adminPaths.some(path => pathname.startsWith(path))
}