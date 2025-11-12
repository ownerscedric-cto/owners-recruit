export type FieldType = 'text' | 'email' | 'phone' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'radio' | 'date'

export interface FormFieldOption {
  label: string
  value: string
}

export interface FormStep {
  id: string
  step_name: string
  step_label: string
  step_description?: string
  step_order: number
  form_type: 'common' | 'new' | 'experienced'
  step_icon?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FormStepData {
  step_name: string
  step_label: string
  step_description?: string
  step_order: number
  form_type: 'common' | 'new' | 'experienced'
  step_icon?: string
  is_active?: boolean
}

export interface FormFieldData {
  field_name: string
  label: string
  field_type: FieldType
  required: boolean
  visible: boolean
  placeholder?: string
  description?: string
  options?: FormFieldOption[]
  validation_rules?: Record<string, any>
  display_order: number
  form_type?: 'common' | 'new' | 'experienced'
  step_id?: string
}

export interface FormField extends FormFieldData {
  id: string
  created_at: string
  updated_at: string
}

export async function getFormFields(formType?: 'new' | 'experienced') {
  try {
    const params = new URLSearchParams()
    if (formType) {
      params.append('form_type', formType)
    }

    const url = `/api/form-fields${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '폼 필드 목록 조회에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in getFormFields:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function createFormField(data: FormFieldData) {
  try {
    const response = await fetch('/api/form-fields', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '폼 필드 생성에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in createFormField:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function updateFormField(id: string, data: Partial<FormFieldData>) {
  try {
    const response = await fetch(`/api/form-fields/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '폼 필드 수정에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in updateFormField:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function deleteFormField(id: string) {
  try {
    const response = await fetch(`/api/form-fields/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '폼 필드 삭제에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in deleteFormField:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function reorderFormFields(fieldIds: string[]) {
  try {
    const response = await fetch('/api/form-fields/reorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ field_ids: fieldIds }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '폼 필드 순서 변경에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in reorderFormFields:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

// Form Steps Management

// 기본 단계 설정
export const DEFAULT_STEPS = {
  common: [
    { step_name: 'personal', step_label: '기본정보', step_description: '이름, 생년월일 등 기본 개인정보를 입력해주세요', step_order: 1, form_type: 'common' as const, step_icon: 'user', is_active: true },
    { step_name: 'contact', step_label: '연락처 정보', step_description: '전화번호, 이메일, 주소 정보를 입력해주세요', step_order: 2, form_type: 'common' as const, step_icon: 'phone', is_active: true }
  ],
  new: [
    { step_name: 'education', step_label: '학력 정보', step_description: '학교명, 졸업년도 등 학력 정보를 입력해주세요', step_order: 3, form_type: 'new' as const, step_icon: 'graduation-cap', is_active: true },
    { step_name: 'documents', step_label: '서류 및 계좌', step_description: '필요 서류 및 계좌 정보를 입력해주세요', step_order: 4, form_type: 'new' as const, step_icon: 'file-text', is_active: true }
  ],
  experienced: [
    { step_name: 'career', step_label: '경력 정보', step_description: '이전 근무지 및 경력사항을 입력해주세요', step_order: 3, form_type: 'experienced' as const, step_icon: 'briefcase', is_active: true },
    { step_name: 'insurance', step_label: '보험 정보', step_description: '보험 관련 자격증 및 경험을 입력해주세요', step_order: 4, form_type: 'experienced' as const, step_icon: 'shield', is_active: true },
    { step_name: 'documents', step_label: '서류 및 계좌', step_description: '필요 서류 및 계좌 정보를 입력해주세요', step_order: 5, form_type: 'experienced' as const, step_icon: 'file-text', is_active: true }
  ]
}

// 인메모리 단계 저장소 (데이터베이스 연결 실패 시 사용)
let stepsStorage: FormStep[] = []
let stepIdCounter = 1

// 기본 단계들로 스토리지 초기화
function initializeStepsStorage() {
  if (stepsStorage.length === 0) {
    const allSteps = [...DEFAULT_STEPS.common, ...DEFAULT_STEPS.new, ...DEFAULT_STEPS.experienced]
    stepsStorage = allSteps.map(step => ({
      ...step,
      id: `step_${stepIdCounter++}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  }
}

export async function getFormSteps(formType?: 'new' | 'experienced' | 'common') {
  try {
    const params = new URLSearchParams()
    if (formType) {
      params.append('form_type', formType)
    }

    const url = `/api/form-steps${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn('Database unavailable, using in-memory storage')
      initializeStepsStorage()

      let filteredSteps = stepsStorage
      if (formType) {
        filteredSteps = stepsStorage.filter(step => step.form_type === formType || step.form_type === 'common')
      }

      return {
        success: true,
        data: filteredSteps.sort((a, b) => a.step_order - b.step_order)
      }
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in getFormSteps, falling back to in-memory storage:', error)
    initializeStepsStorage()

    let filteredSteps = stepsStorage
    if (formType) {
      filteredSteps = stepsStorage.filter(step => step.form_type === formType || step.form_type === 'common')
    }

    return {
      success: true,
      data: filteredSteps.sort((a, b) => a.step_order - b.step_order)
    }
  }
}

export async function createFormStep(data: FormStepData) {
  try {
    const response = await fetch('/api/form-steps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      console.warn('Database unavailable, using in-memory storage')
      initializeStepsStorage()

      const newStep: FormStep = {
        ...data,
        id: `step_${stepIdCounter++}`,
        is_active: data.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      stepsStorage.push(newStep)

      return {
        success: true,
        data: newStep
      }
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in createFormStep, falling back to in-memory storage:', error)
    initializeStepsStorage()

    const newStep: FormStep = {
      ...data,
      id: `step_${stepIdCounter++}`,
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    stepsStorage.push(newStep)

    return {
      success: true,
      data: newStep
    }
  }
}

export async function updateFormStep(id: string, data: Partial<FormStepData>) {
  try {
    const response = await fetch(`/api/form-steps/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      console.warn('Database unavailable, using in-memory storage')
      initializeStepsStorage()

      const stepIndex = stepsStorage.findIndex(step => step.id === id)
      if (stepIndex === -1) {
        return {
          success: false,
          error: '단계를 찾을 수 없습니다.'
        }
      }

      stepsStorage[stepIndex] = {
        ...stepsStorage[stepIndex],
        ...data,
        updated_at: new Date().toISOString()
      }

      return {
        success: true,
        data: stepsStorage[stepIndex]
      }
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in updateFormStep, falling back to in-memory storage:', error)
    initializeStepsStorage()

    const stepIndex = stepsStorage.findIndex(step => step.id === id)
    if (stepIndex === -1) {
      return {
        success: false,
        error: '단계를 찾을 수 없습니다.'
      }
    }

    stepsStorage[stepIndex] = {
      ...stepsStorage[stepIndex],
      ...data,
      updated_at: new Date().toISOString()
    }

    return {
      success: true,
      data: stepsStorage[stepIndex]
    }
  }
}

export async function deleteFormStep(id: string) {
  try {
    const response = await fetch(`/api/form-steps/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn('Database unavailable, using in-memory storage')
      initializeStepsStorage()

      const stepIndex = stepsStorage.findIndex(step => step.id === id)
      if (stepIndex === -1) {
        return {
          success: false,
          error: '단계를 찾을 수 없습니다.'
        }
      }

      stepsStorage.splice(stepIndex, 1)

      return {
        success: true,
        message: '단계가 삭제되었습니다.'
      }
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in deleteFormStep, falling back to in-memory storage:', error)
    initializeStepsStorage()

    const stepIndex = stepsStorage.findIndex(step => step.id === id)
    if (stepIndex === -1) {
      return {
        success: false,
        error: '단계를 찾을 수 없습니다.'
      }
    }

    stepsStorage.splice(stepIndex, 1)

    return {
      success: true,
      message: '단계가 삭제되었습니다.'
    }
  }
}

export async function reorderFormSteps(stepIds: string[]) {
  try {
    const response = await fetch('/api/form-steps/reorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ step_ids: stepIds }),
    })

    if (!response.ok) {
      console.warn('Database unavailable, using in-memory storage')
      initializeStepsStorage()

      // 단계 순서 재정렬
      stepIds.forEach((stepId, index) => {
        const stepIndex = stepsStorage.findIndex(step => step.id === stepId)
        if (stepIndex !== -1) {
          stepsStorage[stepIndex].step_order = index + 1
          stepsStorage[stepIndex].updated_at = new Date().toISOString()
        }
      })

      return {
        success: true,
        message: '단계 순서가 변경되었습니다.'
      }
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in reorderFormSteps, falling back to in-memory storage:', error)
    initializeStepsStorage()

    // 단계 순서 재정렬
    stepIds.forEach((stepId, index) => {
      const stepIndex = stepsStorage.findIndex(step => step.id === stepId)
      if (stepIndex !== -1) {
        stepsStorage[stepIndex].step_order = index + 1
        stepsStorage[stepIndex].updated_at = new Date().toISOString()
      }
    })

    return {
      success: true,
      message: '단계 순서가 변경되었습니다.'
    }
  }
}