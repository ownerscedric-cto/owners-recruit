'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/shared/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Save,
  Database,
  Mail,
  Shield,
  Globe,
  Settings,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { getSystemSettings, updateSystemSettings, SystemSettingsData } from '@/lib/system-settings'
import { DebugViewer } from '@/components/admin/debug-viewer'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingsData>({
    system_name: '오너스경영연구소 채용관리시스템',
    system_version: '1.0.0',
    maintenance_mode: false,
    debug_mode: false,
    backup_enabled: true,
    backup_interval: 24,
    retention_days: 30,
    notifications_enabled: true,
    smtp_server: 'smtp.gmail.com',
    smtp_port: 587,
    email_from: 'noreply@owners.co.kr',
    session_timeout: 30,
    password_policy: true,
    two_factor_auth: false,
    ip_whitelist: '',
    timezone: 'Asia/Seoul',
    language: 'ko',
    date_format: 'YYYY-MM-DD',
    records_per_page: 20,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    setError('')

    const result = await getSystemSettings()
    if (result.success && result.data) {
      setSettings(result.data)
    } else {
      setError(result.error || '설정을 불러오는데 실패했습니다.')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    const result = await updateSystemSettings(settings)
    if (result.success) {
      setSuccess('설정이 성공적으로 저장되었습니다.')
      setLastSaved(new Date())
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(result.error || '설정 저장에 실패했습니다.')
    }
    setSaving(false)
  }

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (loading) {
    return (
      <AdminLayout title="시스템 설정" currentPage="settings">
        <div className="flex justify-center items-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          설정을 불러오는 중...
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="시스템 설정" currentPage="settings">
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
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">시스템의 전체적인 설정을 관리합니다.</p>
            {lastSaved && (
              <p className="text-sm text-gray-500 mt-1">
                마지막 저장: {lastSaved.toLocaleString('ko-KR')}
              </p>
            )}
          </div>
          <div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  설정 저장
                </>
              )}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="system">시스템</TabsTrigger>
            <TabsTrigger value="database">데이터베이스</TabsTrigger>
            <TabsTrigger value="email">이메일</TabsTrigger>
            <TabsTrigger value="security">보안</TabsTrigger>
            <TabsTrigger value="general">일반</TabsTrigger>
            <TabsTrigger value="debug">디버그</TabsTrigger>
          </TabsList>

          {/* 시스템 설정 */}
          <TabsContent value="system">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    기본 시스템 설정
                  </CardTitle>
                  <CardDescription>
                    시스템의 기본 정보와 운영 모드를 설정합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="systemName">시스템 이름</Label>
                      <Input
                        id="systemName"
                        value={settings.system_name}
                        onChange={(e) => handleInputChange('system_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="systemVersion">버전</Label>
                      <Input
                        id="systemVersion"
                        value={settings.system_version}
                        onChange={(e) => handleInputChange('system_version', e.target.value)}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>유지보수 모드</Label>
                        <p className="text-sm text-gray-500">활성화 시 시스템 접근이 제한됩니다</p>
                      </div>
                      <Switch
                        checked={settings.maintenance_mode}
                        onCheckedChange={(checked) => handleInputChange('maintenance_mode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>디버그 모드</Label>
                        <p className="text-sm text-gray-500">개발자용 상세 로그를 표시합니다</p>
                      </div>
                      <Switch
                        checked={settings.debug_mode}
                        onCheckedChange={(checked) => handleInputChange('debug_mode', checked)}
                      />
                    </div>
                  </div>

                  {settings.maintenance_mode && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-center">
                          <span>유지보수 모드가 활성화되어 있습니다. 일반 사용자의 시스템 접근이 제한됩니다.</span>
                          <a
                            href="/maintenance"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-sm ml-2"
                          >
                            미리보기
                          </a>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 데이터베이스 설정 */}
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  데이터베이스 관리
                </CardTitle>
                <CardDescription>
                  데이터베이스 백업 및 유지보수 설정을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>자동 백업</Label>
                    <p className="text-sm text-gray-500">정기적으로 데이터베이스를 백업합니다</p>
                  </div>
                  <Switch
                    checked={settings.backup_enabled}
                    onCheckedChange={(checked) => handleInputChange('backup_enabled', checked)}
                  />
                </div>

                {settings.backup_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="backupInterval">백업 주기 (시간)</Label>
                      <Input
                        id="backupInterval"
                        type="number"
                        value={settings.backup_interval}
                        onChange={(e) => handleInputChange('backup_interval', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="retentionDays">보관 기간 (일)</Label>
                      <Input
                        id="retentionDays"
                        type="number"
                        value={settings.retention_days}
                        onChange={(e) => handleInputChange('retention_days', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">백업 상태</h4>
                  <p className="text-sm text-blue-700">
                    마지막 백업: 2024-01-15 03:00 KST
                  </p>
                  <p className="text-sm text-blue-700">
                    다음 백업: 2024-01-16 03:00 KST
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 이메일 설정 */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  이메일 설정
                </CardTitle>
                <CardDescription>
                  시스템 이메일 발송을 위한 SMTP 설정을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>이메일 알림</Label>
                    <p className="text-sm text-gray-500">시스템 알림 이메일 발송 여부</p>
                  </div>
                  <Switch
                    checked={settings.notifications_enabled}
                    onCheckedChange={(checked) => handleInputChange('notifications_enabled', checked)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpServer">SMTP 서버</Label>
                    <Input
                      id="smtpServer"
                      value={settings.smtp_server}
                      onChange={(e) => handleInputChange('smtp_server', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">포트</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.smtp_port}
                      onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="emailFrom">발신자 이메일</Label>
                  <Input
                    id="emailFrom"
                    type="email"
                    value={settings.email_from}
                    onChange={(e) => handleInputChange('email_from', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 보안 설정 */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  보안 설정
                </CardTitle>
                <CardDescription>
                  시스템 보안과 관련된 설정을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sessionTimeout">세션 타임아웃 (분)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) => handleInputChange('session_timeout', parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>비밀번호 정책</Label>
                    <p className="text-sm text-gray-500">강력한 비밀번호 정책을 적용합니다</p>
                  </div>
                  <Switch
                    checked={settings.password_policy}
                    onCheckedChange={(checked) => handleInputChange('password_policy', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>2단계 인증</Label>
                    <p className="text-sm text-gray-500">추가 보안을 위한 2단계 인증</p>
                  </div>
                  <Switch
                    checked={settings.two_factor_auth}
                    onCheckedChange={(checked) => handleInputChange('two_factor_auth', checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="ipWhitelist">IP 화이트리스트</Label>
                  <Textarea
                    id="ipWhitelist"
                    placeholder="허용할 IP 주소를 입력하세요 (한 줄에 하나씩)"
                    value={settings.ip_whitelist}
                    onChange={(e) => handleInputChange('ip_whitelist', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 일반 설정 */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  일반 설정
                </CardTitle>
                <CardDescription>
                  언어, 시간대 등 일반적인 시스템 설정을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timezone">시간대</Label>
                    <Input
                      id="timezone"
                      value={settings.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">언어</Label>
                    <Input
                      id="language"
                      value={settings.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateFormat">날짜 형식</Label>
                    <Input
                      id="dateFormat"
                      value={settings.date_format}
                      onChange={(e) => handleInputChange('date_format', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recordsPerPage">페이지당 레코드 수</Label>
                    <Input
                      id="recordsPerPage"
                      type="number"
                      value={settings.records_per_page}
                      onChange={(e) => handleInputChange('records_per_page', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-md">
                  <h4 className="font-medium text-green-900 mb-2">시스템 정보</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>시스템 버전: {settings.system_version}</p>
                    <p>현재 시간: {new Date().toLocaleString('ko-KR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 디버그 설정 */}
          <TabsContent value="debug">
            <DebugViewer isDebugMode={settings.debug_mode} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}