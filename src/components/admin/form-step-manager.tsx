'use client'

import { useState, useEffect } from 'react'
import { FormStep, FormStepData, FormField, getFormSteps, createFormStep, updateFormStep, deleteFormStep, reorderFormSteps, getFormFields, updateFormField } from '@/lib/form-fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  User,
  Phone,
  FileText,
  GraduationCap,
  Briefcase,
  Shield,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react'

interface FormStepManagerProps {
  className?: string
}

const stepIcons = {
  'user': User,
  'phone': Phone,
  'file-text': FileText,
  'graduation-cap': GraduationCap,
  'briefcase': Briefcase,
  'shield': Shield,
  'settings': Settings,
}

export function FormStepManager({ className }: FormStepManagerProps) {
  const [selectedFormType, setSelectedFormType] = useState<'common' | 'new' | 'experienced'>('common')
  const [steps, setSteps] = useState<FormStep[]>([])
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<FormStep | null>(null)
  const [isFieldAssignDialogOpen, setIsFieldAssignDialogOpen] = useState(false)
  const [selectedStep, setSelectedStep] = useState<FormStep | null>(null)

  // 폼 데이터
  const [formData, setFormData] = useState<FormStepData>({
    step_name: '',
    step_label: '',
    step_description: '',
    step_order: 1,
    form_type: 'common',
    step_icon: 'user',
    is_active: true
  })

  useEffect(() => {
    loadSteps()
    loadFields()
  }, [selectedFormType])

  const loadSteps = async () => {
    setLoading(true)
    try {
      const result = await getFormSteps(selectedFormType)
      if (result.success) {
        setSteps(result.data || [])
      } else {
        setError(result.error || '단계를 불러올 수 없습니다.')
      }
    } catch (error) {
      setError('단계를 불러오는 중 오류가 발생했습니다.')
      console.error('Error loading steps:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFields = async () => {
    try {
      const result = await getFormFields()
      if (result.success) {
        setFields(result.data || [])
      }
    } catch (error) {
      console.error('Error loading fields:', error)
    }
  }

  const handleCreateStep = async () => {
    try {
      const stepData: FormStepData = {
        ...formData,
        form_type: selectedFormType,
        step_order: steps.length + 1
      }

      const result = await createFormStep(stepData)
      if (result.success) {
        await loadSteps()
        setIsDialogOpen(false)
        resetForm()
      } else {
        setError(result.error || '단계 생성에 실패했습니다.')
      }
    } catch (error) {
      setError('단계 생성 중 오류가 발생했습니다.')
      console.error('Error creating step:', error)
    }
  }

  const handleUpdateStep = async () => {
    if (!editingStep) return

    try {
      const result = await updateFormStep(editingStep.id, formData)
      if (result.success) {
        await loadSteps()
        setIsDialogOpen(false)
        setEditingStep(null)
        resetForm()
      } else {
        setError(result.error || '단계 수정에 실패했습니다.')
      }
    } catch (error) {
      setError('단계 수정 중 오류가 발생했습니다.')
      console.error('Error updating step:', error)
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('이 단계를 삭제하시겠습니까?')) return

    try {
      const result = await deleteFormStep(stepId)
      if (result.success) {
        await loadSteps()
      } else {
        setError(result.error || '단계 삭제에 실패했습니다.')
      }
    } catch (error) {
      setError('단계 삭제 중 오류가 발생했습니다.')
      console.error('Error deleting step:', error)
    }
  }

  const handleAssignField = async (fieldId: string, stepId: string | null) => {
    try {
      const result = await updateFormField(fieldId, { step_id: stepId })
      if (result.success) {
        await loadFields()
      } else {
        setError(result.error || '필드 할당에 실패했습니다.')
      }
    } catch (error) {
      setError('필드 할당 중 오류가 발생했습니다.')
      console.error('Error assigning field:', error)
    }
  }

  const openCreateDialog = () => {
    resetForm()
    setFormData(prev => ({ ...prev, form_type: selectedFormType }))
    setEditingStep(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (step: FormStep) => {
    setFormData({
      step_name: step.step_name,
      step_label: step.step_label,
      step_description: step.step_description || '',
      step_order: step.step_order,
      form_type: step.form_type,
      step_icon: step.step_icon || 'user',
      is_active: step.is_active
    })
    setEditingStep(step)
    setIsDialogOpen(true)
  }

  const openFieldAssignDialog = (step: FormStep) => {
    setSelectedStep(step)
    setIsFieldAssignDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      step_name: '',
      step_label: '',
      step_description: '',
      step_order: 1,
      form_type: 'common',
      step_icon: 'user',
      is_active: true
    })
  }

  const getStepFields = (stepId: string) => {
    return fields.filter(field => field.step_id === stepId)
  }

  const getUnassignedFields = () => {
    return fields.filter(field =>
      !field.step_id &&
      (field.form_type === selectedFormType || field.form_type === 'common')
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">폼 단계 관리</h2>
          <p className="text-gray-600">폼의 단계를 설정하고 필드를 할당하세요</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          단계 추가
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-sm text-red-600 hover:text-red-800 underline mt-1"
          >
            닫기
          </button>
        </div>
      )}

      {/* 폼 타입 선택 */}
      <Tabs value={selectedFormType} onValueChange={(value) => setSelectedFormType(value as any)}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="common">공통</TabsTrigger>
          <TabsTrigger value="new">신입자</TabsTrigger>
          <TabsTrigger value="experienced">경력자</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedFormType}>
          <div className="grid gap-4">
            {steps.map((step) => {
              const IconComponent = stepIcons[step.step_icon as keyof typeof stepIcons] || User
              const stepFields = getStepFields(step.id)

              return (
                <Card key={step.id} className={step.is_active ? '' : 'opacity-60'}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <IconComponent className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{step.step_label}</CardTitle>
                          <CardDescription className="flex items-center space-x-2">
                            <span>순서: {step.step_order}</span>
                            <span>•</span>
                            <span>{step.step_name}</span>
                            {!step.is_active && (
                              <>
                                <span>•</span>
                                <Badge variant="secondary">비활성</Badge>
                              </>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openFieldAssignDialog(step)}
                        >
                          필드 할당 ({stepFields.length})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(step)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStep(step.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-3">{step.step_description}</p>
                    <div className="flex flex-wrap gap-2">
                      {stepFields.map((field) => (
                        <Badge key={field.id} variant="outline">
                          {field.label}
                        </Badge>
                      ))}
                      {stepFields.length === 0 && (
                        <span className="text-gray-400 text-sm">할당된 필드가 없습니다</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* 할당되지 않은 필드들 */}
            {getUnassignedFields().length > 0 && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-600">할당되지 않은 필드</CardTitle>
                  <CardDescription>
                    아래 필드들을 적절한 단계에 할당해주세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {getUnassignedFields().map((field) => (
                      <Badge key={field.id} variant="secondary">
                        {field.label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 단계 생성/편집 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStep ? '단계 수정' : '새 단계 생성'}
            </DialogTitle>
            <DialogDescription>
              {editingStep ? '단계 정보를 수정하세요' : '새로운 단계를 생성하세요'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="step_name">단계 이름 (영문)</Label>
              <Input
                id="step_name"
                value={formData.step_name}
                onChange={(e) => setFormData({ ...formData, step_name: e.target.value })}
                placeholder="예: personal_info"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="step_label">단계 라벨</Label>
              <Input
                id="step_label"
                value={formData.step_label}
                onChange={(e) => setFormData({ ...formData, step_label: e.target.value })}
                placeholder="예: 기본 정보"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="step_description">단계 설명</Label>
              <Textarea
                id="step_description"
                value={formData.step_description}
                onChange={(e) => setFormData({ ...formData, step_description: e.target.value })}
                placeholder="이 단계에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="step_icon">아이콘</Label>
              <Select
                value={formData.step_icon}
                onValueChange={(value) => setFormData({ ...formData, step_icon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">사용자</SelectItem>
                  <SelectItem value="phone">전화</SelectItem>
                  <SelectItem value="file-text">문서</SelectItem>
                  <SelectItem value="graduation-cap">졸업모자</SelectItem>
                  <SelectItem value="briefcase">서류가방</SelectItem>
                  <SelectItem value="shield">방패</SelectItem>
                  <SelectItem value="settings">설정</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_active">활성화</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={editingStep ? handleUpdateStep : handleCreateStep}>
              {editingStep ? '수정' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 필드 할당 다이얼로그 */}
      <Dialog open={isFieldAssignDialogOpen} onOpenChange={setIsFieldAssignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStep?.step_label} - 필드 할당
            </DialogTitle>
            <DialogDescription>
              이 단계에 표시될 필드를 선택하세요
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <h4 className="font-medium mb-2">현재 할당된 필드</h4>
              <div className="space-y-2">
                {selectedStep && getStepFields(selectedStep.id).map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{field.label}</span>
                      <span className="text-gray-500 ml-2">({field.field_type})</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignField(field.id, null)}
                    >
                      제거
                    </Button>
                  </div>
                ))}
                {selectedStep && getStepFields(selectedStep.id).length === 0 && (
                  <p className="text-gray-500">할당된 필드가 없습니다</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">사용 가능한 필드</h4>
              <div className="space-y-2">
                {fields
                  .filter(field =>
                    (field.form_type === selectedFormType || field.form_type === 'common') &&
                    (!field.step_id || field.step_id !== selectedStep?.id)
                  )
                  .map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{field.label}</span>
                        <span className="text-gray-500 ml-2">({field.field_type})</span>
                        {field.step_id && (
                          <Badge variant="secondary" className="ml-2">
                            다른 단계에 할당됨
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignField(field.id, selectedStep?.id || null)}
                        disabled={!!field.step_id}
                      >
                        할당
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsFieldAssignDialogOpen(false)}>
              완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}