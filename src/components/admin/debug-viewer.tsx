'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Bug,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  Info,
  AlertCircle,
  Zap,
  Clock
} from 'lucide-react'

interface DebugLog {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: any
  location?: string
}

interface DebugViewerProps {
  isDebugMode: boolean
}

export function DebugViewer({ isDebugMode }: DebugViewerProps) {
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (levelFilter && levelFilter !== 'all') params.append('level', levelFilter)
      params.append('count', '200')

      const response = await fetch(`/api/debug/logs?${params}`)
      const result = await response.json()

      if (result.success) {
        setLogs(result.data.logs)
      } else {
        setError(result.error || '로그를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('로그 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    if (!confirm('모든 디버그 로그를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch('/api/debug/logs', { method: 'DELETE' })
      const result = await response.json()

      if (result.success) {
        setSuccess('로그가 성공적으로 삭제되었습니다.')
        setLogs([])
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(result.error || '로그 삭제에 실패했습니다.')
      }
    } catch (err) {
      setError('로그 삭제 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    if (isDebugMode) {
      fetchLogs()
    }
  }, [isDebugMode, searchTerm, levelFilter])

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="h-4 w-4" />
      case 'warn': return <AlertTriangle className="h-4 w-4" />
      case 'info': return <Info className="h-4 w-4" />
      case 'debug': return <Zap className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'destructive'
      case 'warn': return 'secondary'
      case 'info': return 'default'
      case 'debug': return 'outline'
      default: return 'default'
    }
  }

  if (!isDebugMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bug className="h-5 w-5 mr-2" />
            디버그 로그 뷰어
          </CardTitle>
          <CardDescription>
            개발 및 디버깅을 위한 시스템 로그 뷰어입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              디버그 모드가 비활성화되어 있습니다. 시스템 설정에서 디버그 모드를 활성화하면 로그를 확인할 수 있습니다.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 알림 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bug className="h-5 w-5 mr-2" />
            디버그 로그 뷰어
          </CardTitle>
          <CardDescription>
            실시간 시스템 로그 및 디버그 정보를 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 컨트롤 바 */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="메시지 또는 위치로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 레벨</SelectItem>
                <SelectItem value="error">오류</SelectItem>
                <SelectItem value="warn">경고</SelectItem>
                <SelectItem value="info">정보</SelectItem>
                <SelectItem value="debug">디버그</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchLogs} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
            <Button onClick={clearLogs} variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              로그 삭제
            </Button>
          </div>

          {/* 로그 목록 */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>로그를 불러오는 중...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bug className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>표시할 로그가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getLevelColor(log.level) as any} className="text-xs">
                          {getLevelIcon(log.level)}
                          <span className="ml-1">{log.level.toUpperCase()}</span>
                        </Badge>
                        {log.location && (
                          <Badge variant="outline" className="text-xs">
                            {log.location}
                          </Badge>
                        )}
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(log.timestamp).toLocaleString('ko-KR')}
                        </div>
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{log.message}</p>
                      {log.data && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            데이터 보기
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500">
            총 {logs.length}개의 로그 항목
          </div>
        </CardContent>
      </Card>
    </div>
  )
}