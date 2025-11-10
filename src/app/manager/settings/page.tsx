'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/shared/admin-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Settings,
  Users,
  Bell,
  Shield,
  Database,
  Mail,
  FileText,
  Plus,
  Trash2,
  Edit,
  Save
} from 'lucide-react'

// 더미 데이터
const systemSettings = {
  autoApproval: false,
  emailNotifications: true,
  smsNotifications: true,
  documentExpiry: 90,
  maxFileSize: 10,
  processingDeadline: 3,
  backupInterval: 24
}

const formFields = [
  { id: 'name', label: '이름', type: 'text', required: true, enabled: true },
  { id: 'email', label: '이메일', type: 'email', required: true, enabled: true },
  { id: 'phone', label: '전화번호', type: 'tel', required: true, enabled: true },
  { id: 'birthDate', label: '생년월일', type: 'date', required: true, enabled: true },
  { id: 'address', label: '주소', type: 'text', required: true, enabled: true },
  { id: 'career', label: '경력정보', type: 'textarea', required: false, enabled: true },
  { id: 'certificate', label: '자격증', type: 'textarea', required: false, enabled: true },
]

const userRoles = [
  { id: 1, name: '김관리', email: 'admin@owners.com', role: 'admin', status: 'active', lastLogin: '2024-11-10T14:30:00Z' },
  { id: 2, name: '이인사', email: 'hr@owners.com', role: 'hr', status: 'active', lastLogin: '2024-11-10T13:15:00Z' },
  { id: 3, name: '박매니저', email: 'manager@owners.com', role: 'manager', status: 'active', lastLogin: '2024-11-09T16:45:00Z' },
]

const documentTypes = [
  { id: 1, name: '주민등록등본', required: true, maxSize: 5, allowedFormats: ['PDF', 'JPG'] },
  { id: 2, name: '증명사진', required: true, maxSize: 2, allowedFormats: ['JPG', 'PNG'] },
  { id: 3, name: '경력증명서', required: false, maxSize: 5, allowedFormats: ['PDF'] },
  { id: 4, name: '말소확인증', required: false, maxSize: 5, allowedFormats: ['PDF'] },
  { id: 5, name: '자격증 사본', required: false, maxSize: 5, allowedFormats: ['PDF', 'JPG'] },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState(systemSettings)
  const [activeTab, setActiveTab] = useState('general')

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const tabs = [
    { id: 'general', name: '일반 설정', icon: Settings },
    { id: 'form', name: '입력 폼 설정', icon: FileText },
    { id: 'users', name: '사용자 관리', icon: Users },
    { id: 'notifications', name: '알림 설정', icon: Bell },
    { id: 'security', name: '보안 설정', icon: Shield },
    { id: 'backup', name: '백업 설정', icon: Database },
  ]

  return (
    <AdminLayout title="시스템 설정" currentPage="settings">
      <div className="flex space-x-8">
        {/* 사이드바 탭 */}
        <div className="w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="mr-3 h-4 w-4" />
                {tab.name}
              </button>
            )
          })}
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1">
          {/* 일반 설정 */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>기본 시스템 설정</CardTitle>
                  <CardDescription>
                    시스템의 기본 동작 방식을 설정합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">자동 승인</Label>
                      <p className="text-sm text-gray-500">조건을 만족하는 지원서를 자동으로 승인합니다.</p>
                    </div>
                    <Switch
                      checked={settings.autoApproval}
                      onCheckedChange={(checked) => updateSetting('autoApproval', checked)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="processingDeadline">처리 기한 (일)</Label>
                      <Input
                        id="processingDeadline"
                        type="number"
                        value={settings.processingDeadline}
                        onChange={(e) => updateSetting('processingDeadline', parseInt(e.target.value))}
                        className="mt-1"
                      />
                      <p className="text-sm text-gray-500 mt-1">지원서 처리 최대 기한</p>
                    </div>

                    <div>
                      <Label htmlFor="documentExpiry">서류 유효기간 (일)</Label>
                      <Input
                        id="documentExpiry"
                        type="number"
                        value={settings.documentExpiry}
                        onChange={(e) => updateSetting('documentExpiry', parseInt(e.target.value))}
                        className="mt-1"
                      />
                      <p className="text-sm text-gray-500 mt-1">업로드된 서류의 유효기간</p>
                    </div>

                    <div>
                      <Label htmlFor="maxFileSize">최대 파일 크기 (MB)</Label>
                      <Input
                        id="maxFileSize"
                        type="number"
                        value={settings.maxFileSize}
                        onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
                        className="mt-1"
                      />
                      <p className="text-sm text-gray-500 mt-1">업로드 가능한 최대 파일 크기</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">취소</Button>
                    <Button>
                      <Save className="h-4 w-4 mr-2" />
                      저장
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 입력 폼 설정 */}
          {activeTab === 'form' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>입력 폼 필드 설정</CardTitle>
                      <CardDescription>
                        지원자가 입력해야 하는 필드를 관리합니다.
                      </CardDescription>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      필드 추가
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>필드명</TableHead>
                        <TableHead>타입</TableHead>
                        <TableHead>필수여부</TableHead>
                        <TableHead>활성화</TableHead>
                        <TableHead className="text-right">액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formFields.map((field) => (
                        <TableRow key={field.id}>
                          <TableCell className="font-medium">{field.label}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{field.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={field.required ? "destructive" : "secondary"}>
                              {field.required ? '필수' : '선택'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Switch checked={field.enabled} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>서류 유형 관리</CardTitle>
                      <CardDescription>
                        업로드 가능한 서류 유형을 관리합니다.
                      </CardDescription>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      서류 유형 추가
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>서류명</TableHead>
                        <TableHead>필수여부</TableHead>
                        <TableHead>최대 크기</TableHead>
                        <TableHead>허용 형식</TableHead>
                        <TableHead className="text-right">액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentTypes.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.name}</TableCell>
                          <TableCell>
                            <Badge variant={doc.required ? "destructive" : "secondary"}>
                              {doc.required ? '필수' : '선택'}
                            </Badge>
                          </TableCell>
                          <TableCell>{doc.maxSize}MB</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              {doc.allowedFormats.map((format) => (
                                <Badge key={format} variant="outline" className="text-xs">
                                  {format}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 사용자 관리 */}
          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>사용자 관리</CardTitle>
                    <CardDescription>
                      시스템 사용자와 권한을 관리합니다.
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    사용자 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>역할</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>마지막 로그인</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === 'admin' ? 'destructive' :
                            user.role === 'hr' ? 'default' : 'secondary'
                          }>
                            {user.role === 'admin' ? '관리자' :
                             user.role === 'hr' ? '인사팀' : '매니저'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'default' : 'outline'}>
                            {user.status === 'active' ? '활성' : '비활성'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.lastLogin).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* 알림 설정 */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
                <CardDescription>
                  이메일과 SMS 알림을 설정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">이메일 알림</Label>
                    <p className="text-sm text-gray-500">새로운 지원서 접수시 이메일로 알림을 받습니다.</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">SMS 알림</Label>
                    <p className="text-sm text-gray-500">긴급한 상황에 SMS로 알림을 받습니다.</p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    저장
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 백업 설정 */}
          {activeTab === 'backup' && (
            <Card>
              <CardHeader>
                <CardTitle>백업 설정</CardTitle>
                <CardDescription>
                  데이터 백업 및 복원 설정을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="backupInterval">백업 주기 (시간)</Label>
                  <Input
                    id="backupInterval"
                    type="number"
                    value={settings.backupInterval}
                    onChange={(e) => updateSetting('backupInterval', parseInt(e.target.value))}
                    className="mt-1 max-w-xs"
                  />
                  <p className="text-sm text-gray-500 mt-1">자동 백업이 실행될 주기를 설정합니다.</p>
                </div>

                <div className="flex space-x-4">
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    즉시 백업
                  </Button>
                  <Button variant="outline">
                    백업 복원
                  </Button>
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    저장
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}