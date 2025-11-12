'use client'

import { useState, useEffect } from 'react'
import { FormField, getFormFields } from '@/lib/form-fields'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { AddressSearch } from '@/components/forms/address-search'
import { BankSelect } from '@/components/forms/bank-select'
import { RecruiterSelect } from '@/components/forms/recruiter-select'

interface DynamicFormProps {
  onDataChange: (data: Record<string, any>) => void
  formData: Record<string, any>
  applicantType?: 'new' | 'experienced'
  showErrors?: boolean
  fields?: FormField[] // 외부에서 전달받은 필드 배열 (다단계 폼에서 사용)
}

export function DynamicForm({ onDataChange, formData, applicantType = 'new', showErrors = false, fields: externalFields }: DynamicFormProps) {
  const [internalFields, setInternalFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 외부에서 필드를 전달받은 경우 그것을 사용, 아니면 API에서 로드
  const fieldsToUse = externalFields || internalFields

  useEffect(() => {
    if (!externalFields) {
      fetchFormFields()
    } else {
      setLoading(false)
    }
  }, [externalFields, applicantType])

  const fetchFormFields = async () => {
    setLoading(true)
    try {
      const result = await getFormFields(applicantType)
      if (result.success) {
        // 가시적인 필드만 필터링하고 display_order로 정렬
        const visibleFields = (result.data || [])
          .filter((field: FormField) => field.visible)
          .sort((a: FormField, b: FormField) => a.display_order - b.display_order)
        setInternalFields(visibleFields)
      } else {
        setError(result.error || '폼 설정을 불러올 수 없습니다.')
      }
    } catch (error) {
      setError('폼 설정을 불러오는 중 오류가 발생했습니다.')
      console.error('Error fetching form fields:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    const newData = { ...formData, [fieldName]: value }
    onDataChange(newData)
  }

  const renderField = (field: FormField) => {
    const value = formData[field.field_name] || ''
    const hasError = showErrors && field.required && !value

    // 특수 필드 처리
    if (field.field_name === 'address') {
      return (
        <AddressSearch
          key={field.id}
          value={value}
          onChange={(newValue) => handleFieldChange(field.field_name, newValue)}
          required={field.required}
        />
      )
    }

    if (field.field_name === 'bank_name') {
      return (
        <BankSelect
          key={field.id}
          value={value}
          onChange={(newValue) => handleFieldChange(field.field_name, newValue)}
          required={field.required}
        />
      )
    }

    if (field.field_name === 'recruiter_name') {
      return (
        <RecruiterSelect
          key={field.id}
          value={value}
          onChange={(newValue) => handleFieldChange(field.field_name, newValue)}
          required={field.required}
        />
      )
    }

    // 일반 필드 렌더링
    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.field_name} className={hasError ? 'text-red-600' : ''}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {field.description && (
          <p className="text-sm text-gray-600">{field.description}</p>
        )}

        {field.field_type === 'text' && (
          <Input
            id={field.field_name}
            type="text"
            inputMode={
              field.field_name?.includes('주민등록번호') ||
              field.field_name?.includes('계좌번호') ||
              field.field_name?.includes('전화번호') ||
              field.field_name?.includes('휴대폰') ||
              field.field_name?.includes('residentNumber') ||
              field.field_name?.includes('bankAccount') ||
              field.field_name?.includes('phone') ||
              field.field_name?.includes('accountNumber')
                ? 'numeric'
                : undefined
            }
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            className={hasError ? 'border-red-500' : ''}
          />
        )}

        {field.field_type === 'email' && (
          <Input
            id={field.field_name}
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            className={hasError ? 'border-red-500' : ''}
          />
        )}

        {field.field_type === 'phone' && (
          <Input
            id={field.field_name}
            type="tel"
            inputMode="numeric"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            className={hasError ? 'border-red-500' : ''}
          />
        )}

        {field.field_type === 'textarea' && (
          <Textarea
            id={field.field_name}
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            className={hasError ? 'border-red-500' : ''}
            rows={3}
          />
        )}

        {field.field_type === 'date' && (
          <DatePicker
            id={field.field_name}
            value={value}
            onChange={(newValue) => handleFieldChange(field.field_name, newValue)}
            placeholder={field.placeholder}
            className={hasError ? 'border-red-500' : ''}
          />
        )}

        {field.field_type === 'select' && field.options && (
          <select
            id={field.field_name}
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">{field.placeholder || `${field.label}를 선택해주세요`}</option>
            {field.options.map((option: any, index: number) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {field.field_type === 'radio' && field.options && (
          <div className="space-y-2">
            {field.options.map((option: any, index: number) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  id={`${field.field_name}_${index}`}
                  name={field.field_name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label
                  htmlFor={`${field.field_name}_${index}`}
                  className="ml-2 block text-sm text-gray-700"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        )}

        {field.field_type === 'checkbox' && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.field_name}
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.field_name, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={field.field_name} className="ml-2 block text-sm text-gray-700">
              {field.label}
            </label>
          </div>
        )}

        {field.field_type === 'multiselect' && field.options && (
          <div className="space-y-2">
            {field.options.map((option: any, index: number) => (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`${field.field_name}_${index}`}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : []
                    if (e.target.checked) {
                      handleFieldChange(field.field_name, [...currentValues, option.value])
                    } else {
                      handleFieldChange(field.field_name, currentValues.filter((v: any) => v !== option.value))
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`${field.field_name}_${index}`}
                  className="ml-2 block text-sm text-gray-700"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        )}

        {hasError && (
          <p className="text-sm text-red-600">이 필드는 필수입니다.</p>
        )}
      </div>
    )
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
          onClick={fetchFormFields}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (fieldsToUse.length === 0 && !loading) {
    return (
      <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
        <p className="text-gray-700">폼 필드가 설정되지 않았습니다. 관리자에게 문의해주세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {fieldsToUse.map(renderField)}
    </div>
  )
}

// 폼 검증 유틸리티
export function validateDynamicForm(fields: FormField[], formData: Record<string, any>): {
  isValid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  fields.forEach(field => {
    if (field.required && field.visible) {
      const value = formData[field.field_name]
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors[field.field_name] = `${field.label}은(는) 필수 항목입니다.`
      }
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}