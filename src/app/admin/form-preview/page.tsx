'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/shared/admin-layout'
import { DynamicForm, validateDynamicForm } from '@/components/forms/dynamic-form'
import { FormField, getFormFields } from '@/lib/form-fields'

export default function FormPreviewPage() {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [showErrors, setShowErrors] = useState(false)
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedFormType, setSelectedFormType] = useState<'new' | 'experienced'>('new')

  const handleFormDataChange = (data: Record<string, any>) => {
    setFormData(data)
  }

  const handleFormTypeChange = (type: 'new' | 'experienced') => {
    setSelectedFormType(type)
    setFormData({}) // 폼 타입 변경 시 데이터 초기화
    setShowErrors(false)
  }

  const handleSubmit = async () => {
    // 선택된 폼 타입의 필드 정보 가져오기
    const fieldsResult = await getFormFields(selectedFormType)
    if (fieldsResult.success) {
      const visibleFields = (fieldsResult.data || []).filter((field: FormField) => field.visible)
      setFields(visibleFields)

      const validation = validateDynamicForm(visibleFields, formData)

      if (validation.isValid) {
        alert('폼이 성공적으로 제출되었습니다!')
        console.log('Form Data:', formData)
        setShowErrors(false)
      } else {
        alert('필수 필드를 모두 입력해주세요.')
        setShowErrors(true)
        console.log('Validation Errors:', validation.errors)
      }
    }
  }

  const handleReset = () => {
    setFormData({})
    setShowErrors(false)
  }

  return (
    <AdminLayout title="폼 미리보기" currentPage="form-preview">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">동적 폼 미리보기</h2>
            <div className="space-x-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                초기화
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                제출 테스트
              </button>
            </div>
          </div>

          {/* 폼 타입 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              미리보기 할 폼 타입 선택
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => handleFormTypeChange('new')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  selectedFormType === 'new'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                신입자 폼
              </button>
              <button
                onClick={() => handleFormTypeChange('experienced')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  selectedFormType === 'experienced'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                경력자 폼
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              현재 선택: <span className="font-medium">
                {selectedFormType === 'new' ? '신입자' : '경력자'} 폼
              </span>
            </p>
          </div>

          <div className="border-t pt-6">
            <DynamicForm
              formData={formData}
              onDataChange={handleFormDataChange}
              showErrors={showErrors}
              applicantType={selectedFormType}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">현재 폼 데이터 (개발자용)</h3>
          <pre className="bg-white p-4 rounded border text-sm overflow-auto max-h-96">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </div>
    </AdminLayout>
  )
}