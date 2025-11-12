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

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingsData>({
    // 시스템 설정
    system_name: '오너스경영연구소 채용관리시스템',
    system_version: '1.0.0',
    maintenance_mode: false,
    debug_mode: false,

    // 데이터베이스 설정
    backup_enabled: true,
    backup_interval: 24,
    retention_days: 30,

    // 이메일 설정
    notifications_enabled: true,
    smtp_server: 'smtp.gmail.com',
    smtp_port: 587,
    email_from: 'noreply@owners.co.kr',

    // 보안 설정
    session_timeout: 30,
    password_policy: true,
    two_factor_auth: false,
    ip_whitelist: '',

    // 일반 설정
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

  return (
    <AdminLayout title="시스템 설정" currentPage="settings">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">
              시스템의 전체적인 설정을 관리합니다.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                마지막 저장: {lastSaved.toLocaleTimeString('ko-KR')}
              </span>
            )}
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? '저장 중...' : '설정 저장'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="system">시스템</TabsTrigger>
            <TabsTrigger value="database">데이터베이스</TabsTrigger>
            <TabsTrigger value="email">이메일</TabsTrigger>
            <TabsTrigger value="security">보안</TabsTrigger>
            <TabsTrigger value="general">일반</TabsTrigger>
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
                        value={settings.systemVersion}
                        onChange={(e) => handleInputChange('systemVersion', e.target.value)}
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
                        checked={settings.maintenanceMode}
                        onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>디버그 모드</Label>
                        <p className="text-sm text-gray-500">개발자용 상세 로그를 표시합니다</p>
                      </div>
                      <Switch
                        checked={settings.debugMode}
                        onCheckedChange={(checked) => handleInputChange('debugMode', checked)}
                      />
                    </div>
                  </div>
                  
                  {settings.maintenanceMode && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        유지보수 모드가 활성화되어 있습니다. 일반 사용자의 시스템 접근이 제한됩니다.
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
                    checked={settings.dbBackupEnabled}
                    onCheckedChange={(checked) => handleInputChange('dbBackupEnabled', checked)}
                  />
                </div>
                
                {settings.dbBackupEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="backupInterval">백업 주기 (시간)</Label>
                      <Input
                        id="backupInterval"
                        type="number"
                        value={settings.dbBackupInterval}
                        onChange={(e) => handleInputChange('dbBackupInterval', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="retentionDays">보관 기간 (일)</Label>
                      <Input
                        id="retentionDays"
                        type="number"
                        value={settings.dbRetentionDays}
                        onChange={(e) => handleInputChange('dbRetentionDays', e.target.value)}
                      />
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Database className="h-4 w-4 mr-2" />
                      백업 실행
                    </Button>
                    <Button variant="outline" size="sm">
                      백업 복원
                    </Button>
                    <Button variant="outline" size="sm">
                      백업 목록
                    </Button>
                  </div>
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
                  이메일 알림 설정
                </CardTitle>
                <CardDescription>
                  시스템 알림 및 이메일 발송 설정을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>이메일 알림</Label>
                    <p className="text-sm text-gray-500">시스템 이벤트에 대한 이메일 알림을 전송합니다</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
                  />
                </div>
                
                {settings.emailNotifications && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpServer">SMTP 서버</Label>
                      <Input
                        id="smtpServer"
                        value={settings.smtpServer}
                        onChange={(e) => handleInputChange('smtpServer', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">포트</Label>
                      <Input
                        id="smtpPort"
                        value={settings.smtpPort}
                        onChange={(e) => handleInputChange('smtpPort', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="emailFrom">발신자 이메일</Label>
                      <Input
                        id="emailFrom"
                        type="email"
                        value={settings.emailFrom}
                        onChange={(e) => handleInputChange('emailFrom', e.target.value)}
                      />
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    테스트 이메일 발송
                  </Button>
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
                  보안 정책
                </CardTitle>
                <CardDescription>
                  시스템 보안 및 접근 제어 설정을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sessionTimeout">세션 타임아웃 (분)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>강화된 비밀번호 정책</Label>
                      <p className="text-sm text-gray-500">비밀번호 복잡도 요구사항을 적용합니다</p>
                    </div>
                    <Switch
                      checked={settings.passwordPolicy}
                      onCheckedChange={(checked) => handleInputChange('passwordPolicy', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>2단계 인증</Label>
                      <p className="text-sm text-gray-500">추가 보안 계층을 제공합니다</p>
                    </div>
                    <Switch
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) => handleInputChange('twoFactorAuth', checked)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="ipWhitelist">IP 화이트리스트</Label>
                  <Textarea
                    id="ipWhitelist"
                    placeholder="허용할 IP 주소를 입력하세요 (줄바꿈으로 구분)"
                    value={settings.ipWhitelist}
                    onChange={(e) => handleInputChange('ipWhitelist', e.target.value)}
                    rows={3}
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
                  지역화 및 형식
                </CardTitle>
                <CardDescription>
                  시간대, 언어 및 날짜 형식을 설정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="timezone">시간대</Label>
                    <Input
                      id="timezone"
                      value={settings.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">언어</Label>
                    <Input
                      id="language"
                      value={settings.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateFormat">날짜 형식</Label>
                    <Input
                      id="dateFormat"
                      value={settings.dateFormat}
                      onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* 하단 정보 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>시스템 버전: {settings.systemVersion}</span>
              <span>마지막 업데이트: 2024.11.11</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                시스템 정상 운영 중
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}