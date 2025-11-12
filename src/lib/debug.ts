import { isDebugMode } from './settings-cache'

export interface DebugInfo {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: any
  location?: string
}

class DebugLogger {
  private logs: DebugInfo[] = []
  private maxLogs = 1000

  async log(level: DebugInfo['level'], message: string, data?: any, location?: string) {
    // 디버그 모드가 활성화되어 있을 때만 로그 수집
    const debugEnabled = await isDebugMode()
    if (!debugEnabled && level !== 'error') {
      return
    }

    const debugInfo: DebugInfo = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      location
    }

    // 메모리 관리: 최대 로그 수 제한
    if (this.logs.length >= this.maxLogs) {
      this.logs.shift()
    }

    this.logs.push(debugInfo)

    // 디버그 모드에서는 콘솔에도 출력
    if (debugEnabled) {
      const logMethod = level === 'error' ? console.error :
                       level === 'warn' ? console.warn :
                       level === 'debug' ? console.debug : console.log

      const prefix = `[${level.toUpperCase()}] ${new Date().toISOString()}`
      const locationStr = location ? ` [${location}]` : ''

      if (data) {
        logMethod(`${prefix}${locationStr}: ${message}`, data)
      } else {
        logMethod(`${prefix}${locationStr}: ${message}`)
      }
    }
  }

  info(message: string, data?: any, location?: string) {
    return this.log('info', message, data, location)
  }

  warn(message: string, data?: any, location?: string) {
    return this.log('warn', message, data, location)
  }

  error(message: string, data?: any, location?: string) {
    return this.log('error', message, data, location)
  }

  debug(message: string, data?: any, location?: string) {
    return this.log('debug', message, data, location)
  }

  // 최근 로그 조회 (관리자용)
  async getRecentLogs(count = 100): Promise<DebugInfo[]> {
    const debugEnabled = await isDebugMode()
    if (!debugEnabled) {
      return []
    }

    return this.logs.slice(-count).reverse()
  }

  // 로그 초기화 (관리자용)
  async clearLogs(): Promise<void> {
    const debugEnabled = await isDebugMode()
    if (debugEnabled) {
      this.logs = []
    }
  }

  // 필터링된 로그 조회
  async getFilteredLogs(level?: DebugInfo['level'], searchTerm?: string): Promise<DebugInfo[]> {
    const debugEnabled = await isDebugMode()
    if (!debugEnabled) {
      return []
    }

    let filtered = this.logs

    if (level) {
      filtered = filtered.filter(log => log.level === level)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(term) ||
        (log.location && log.location.toLowerCase().includes(term))
      )
    }

    return filtered.reverse()
  }
}

// 싱글톤 인스턴스
export const debugLogger = new DebugLogger()

// 편의 함수들
export const debugLog = {
  info: (message: string, data?: any, location?: string) =>
    debugLogger.info(message, data, location),
  warn: (message: string, data?: any, location?: string) =>
    debugLogger.warn(message, data, location),
  error: (message: string, data?: any, location?: string) =>
    debugLogger.error(message, data, location),
  debug: (message: string, data?: any, location?: string) =>
    debugLogger.debug(message, data, location),
}

// React용 디버그 훅
export function useDebug() {
  return {
    log: debugLog,
    isDebugMode: isDebugMode,
  }
}

// API 요청 디버깅 헬퍼
export function debugApiCall(endpoint: string, method: string, data?: any) {
  return debugLog.debug(`API Call: ${method} ${endpoint}`, data, 'API')
}

// 퍼포먼스 측정 헬퍼
export class DebugTimer {
  private startTime: number
  private name: string

  constructor(name: string) {
    this.name = name
    this.startTime = performance.now()
    debugLog.debug(`Timer started: ${name}`, null, 'TIMER')
  }

  stop() {
    const endTime = performance.now()
    const duration = endTime - this.startTime
    debugLog.debug(`Timer ended: ${this.name} - ${duration.toFixed(2)}ms`, { duration }, 'TIMER')
    return duration
  }
}

export function debugTimer(name: string) {
  return new DebugTimer(name)
}