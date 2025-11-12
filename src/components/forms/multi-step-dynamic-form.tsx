'use client'

import { useState, useEffect, useMemo } from 'react'
import { FormField, FormStep, getFormFields, getFormSteps } from '@/lib/form-fields'
import { DynamicForm, validateDynamicForm } from '@/components/forms/dynamic-form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  FileText,
  GraduationCap,
  Building,
  Check,
  AlertCircle,
} from 'lucide-react'

interface MultiStepDynamicFormProps {
  onSubmit: (data: Record<string, any>) => Promise<void>
  applicantType: 'new' | 'experienced'
  isSubmitting?: boolean
  submitError?: string | null
}

// 단계별 아이콘 맵핑
const stepIcons = {
  'user': User,
  'phone': MapPin,
  'graduation-cap': GraduationCap,
  'briefcase': Building,
  'file-text': FileText,
  'shield': FileText,
  'settings': User,
}

// 설정된 단계를 기반으로 필드를 그룹화하는 함수
const groupFieldsByConfiguredSteps = (fields: FormField[], configuredSteps: FormStep[]) => {
  const steps = configuredSteps
    .filter(step => step.is_active)
    .sort((a, b) => a.step_order - b.step_order)
    .map(step => ({
      ...step,
      fields: fields.filter(field => field.step_id === step.id)
    }))
    .filter(step => step.fields.length > 0)

  return steps
}

// 폴백: 설정된 단계가 없을 때 사용하는 자동 그룹화 함수
const groupFieldsByStep = (fields: FormField[]) => {
  const steps: { [key: string]: FormField[] } = {
    personal: [],
    contact: [],
    education: [],
    career: [],
    insurance: [],
    documents: [],
    others: []
  }

  fields.forEach(field => {
    const fieldName = field.field_name.toLowerCase()

    // 개인정보 관련
    if (fieldName.includes('name') || fieldName.includes('birth') || fieldName.includes('resident')) {
      steps.personal.push(field)
    }
    // 연락처/주소 관련
    else if (fieldName.includes('address') || fieldName.includes('phone') || fieldName.includes('email')) {
      steps.contact.push(field)
    }
    // 학력 관련
    else if (fieldName.includes('school') || fieldName.includes('education') || fieldName.includes('graduation')) {
      steps.education.push(field)
    }
    // 경력 관련
    else if (fieldName.includes('career') || fieldName.includes('experience') || fieldName.includes('resignation')) {
      steps.career.push(field)
    }
    // 보험 관련
    else if (fieldName.includes('insurance') || fieldName.includes('life')) {
      steps.insurance.push(field)
    }
    // 서류/계좌 관련
    else if (fieldName.includes('document') || fieldName.includes('certificate') || fieldName.includes('bank')) {
      steps.documents.push(field)
    }
    // 모집자 등 기타
    else {
      steps.others.push(field)
    }
  })

  // 빈 단계 제거하고 순서 정리
  const orderedSteps = [
    { step_name: 'personal', step_label: '기본정보', step_icon: 'user', fields: steps.personal },
    { step_name: 'contact', step_label: '연락처', step_icon: 'phone', fields: steps.contact },
    { step_name: 'education', step_label: '학력', step_icon: 'graduation-cap', fields: steps.education },
    { step_name: 'career', step_label: '경력', step_icon: 'briefcase', fields: steps.career },
    { step_name: 'insurance', step_label: '보험', step_icon: 'shield', fields: steps.insurance },
    { step_name: 'documents', step_label: '서류/계좌', step_icon: 'file-text', fields: steps.documents },
    { step_name: 'others', step_label: '기타', step_icon: 'settings', fields: steps.others },
  ].filter(step => step.fields.length > 0)

  return orderedSteps
}

export function MultiStepDynamicForm({
  onSubmit,
  applicantType,
  isSubmitting = false,
  submitError = null
}: MultiStepDynamicFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [showErrors, setShowErrors] = useState(false)
  const [fields, setFields] = useState<FormField[]>([])
  const [configuredSteps, setConfiguredSteps] = useState<FormStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 단계별 필드 그룹화
  const steps = useMemo(() => {
    if (fields.length === 0) return []

    // 설정된 단계가 있으면 그것을 사용, 없으면 자동 그룹화
    if (configuredSteps.length > 0) {
      return groupFieldsByConfiguredSteps(fields, configuredSteps)
    } else {
      return groupFieldsByStep(fields)
    }
  }, [fields, configuredSteps])

  const totalSteps = steps.length
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  // 폼 필드 및 단계 로드
  useEffect(() => {
    loadFormData()
  }, [applicantType])

  const loadFormData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 병렬로 필드와 단계 정보를 로드
      const [fieldsResult, stepsResult] = await Promise.all([
        getFormFields(applicantType),
        getFormSteps(applicantType)
      ])

      if (fieldsResult.success) {
        const visibleFields = (fieldsResult.data || [])
          .filter((field: FormField) => field.visible)
          .sort((a: FormField, b: FormField) => a.display_order - b.display_order)
        setFields(visibleFields)
      } else {
        console.warn('Failed to load form fields:', fieldsResult.error)
      }

      if (stepsResult.success) {
        setConfiguredSteps(stepsResult.data || [])
      } else {
        console.warn('Failed to load form steps, using auto-grouping:', stepsResult.error)
        setConfiguredSteps([])
      }

    } catch (error) {
      setError('폼 설정을 불러오는 중 오류가 발생했습니다.')
      console.error('Error loading form data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormDataChange = (data: Record<string, any>) => {
    setFormData(data)
  }

  // 현재 단계 검증
  const validateCurrentStep = () => {
    if (!steps[currentStep - 1]) return true

    const currentStepFields = steps[currentStep - 1].fields
    const validation = validateDynamicForm(currentStepFields, formData)

    if (!validation.isValid) {
      setShowErrors(true)
      return false
    }

    setShowErrors(false)
    return true
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
        setShowErrors(false)
      } else {
        // 마지막 단계에서는 제출
        handleSubmit()
      }
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setShowErrors(false)
    }
  }

  const handleSubmit = async () => {
    // 전체 폼 검증
    const validation = validateDynamicForm(fields, formData)
    if (!validation.isValid) {
      setShowErrors(true)
      alert('필수 항목을 모두 입력해주세요.')
      return
    }

    await onSubmit(formData)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadFormData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (steps.length === 0) {
    return (
      <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
        <p className="text-gray-700">폼 필드가 설정되지 않았습니다. 관리자에게 문의해주세요.</p>
      </div>
    )
  }

  const currentStepData = steps[currentStep - 1]
  if (!currentStepData) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-700">현재 단계 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium flex items-center">
            {applicantType === 'new' ? '신입자' : '경력자'} 신청 진행 상황
          </h2>
          <span className="text-sm text-gray-500">
            {currentStep}/{totalSteps} 단계
          </span>
        </div>
        <Progress value={progress} className="h-2" />

        <div className="flex justify-between mt-4 overflow-x-auto">
          {steps.map((step, index) => {
            const iconKey = step.step_icon || 'user'
            const StepIcon = stepIcons[iconKey as keyof typeof stepIcons] || User
            const isCompleted = currentStep > index + 1
            const isCurrent = currentStep === index + 1

            return (
              <div key={(step as any).id || step.step_name} className="flex flex-col items-center min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-400'
                  }`}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                <span
                  className={`text-xs mt-2 text-center ${
                    isCurrent ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}
                >
                  {step.step_label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.step_label}</CardTitle>
          <CardDescription>
            {(currentStepData as any).step_description || `${currentStepData.step_label} 정보를 입력해주세요.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {submitError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <h4 className="text-red-800 font-semibold">오류</h4>
              </div>
              <p className="text-red-600 mt-1">{submitError}</p>
            </div>
          )}

          {/* 현재 단계의 필드만 렌더링 */}
          <DynamicForm
            formData={formData}
            onDataChange={handleFormDataChange}
            applicantType={applicantType}
            showErrors={showErrors}
            fields={currentStepData.fields} // 현재 단계 필드만 전달
          />
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          이전
        </Button>
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {currentStep === totalSteps ? '제출 중...' : '처리 중...'}
            </>
          ) : (
            <>
              {currentStep === totalSteps ? '제출하기' : '다음'}
              {currentStep < totalSteps && <ChevronRight className="h-4 w-4 ml-2" />}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}