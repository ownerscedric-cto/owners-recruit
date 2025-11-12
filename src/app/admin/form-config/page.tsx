'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/shared/admin-layout'
import { FormField, FormFieldData, FieldType, getFormFields, createFormField, updateFormField, deleteFormField, reorderFormFields } from '@/lib/form-fields'
import { FormStepManager } from '@/components/admin/form-step-manager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: '텍스트' },
  { value: 'email', label: '이메일' },
  { value: 'phone', label: '전화번호' },
  { value: 'textarea', label: '긴 텍스트' },
  { value: 'select', label: '선택박스' },
  { value: 'multiselect', label: '다중선택' },
  { value: 'radio', label: '라디오버튼' },
  { value: 'checkbox', label: '체크박스' },
  { value: 'date', label: '날짜' }
]

export default function AdminFormConfigPage() {
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [currentFormType, setCurrentFormType] = useState<'common' | 'new' | 'experienced'>('common')
  const [formData, setFormData] = useState<FormFieldData>({
    field_name: '',
    label: '',
    field_type: 'text',
    required: false,
    visible: true,
    placeholder: '',
    description: '',
    options: [],
    validation_rules: {},
    display_order: 0,
    form_type: 'common'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [optionText, setOptionText] = useState('')

  useEffect(() => {
    fetchFields()
  }, [currentFormType])

  const fetchFields = async () => {
    setLoading(true)
    try {
      // currentFormType에 따라 필터링된 필드 조회
      const result = await getFormFields()
      if (result.success) {
        // 클라이언트에서 필터링 (API가 form_type 파라미터를 지원하도록 수정됨)
        const filteredFields = (result.data || []).filter((field: FormField) =>
          field.form_type === currentFormType || field.form_type === undefined
        )
        setFields(filteredFields)
      } else {
        alert(result.error || '폼 필드 목록 조회에 실패했습니다.')
      }
    } catch (error) {
      alert('폼 필드 목록 조회 중 오류가 발생했습니다.')
      console.error('Error fetching fields:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      field_name: '',
      label: '',
      field_type: 'text',
      required: false,
      visible: true,
      placeholder: '',
      description: '',
      options: [],
      validation_rules: {},
      display_order: 0,
      form_type: currentFormType
    })
    setSelectedField(null)
    setOptionText('')
  }

  const handleCreate = async () => {
    if (!formData.field_name.trim() || !formData.label.trim()) {
      alert('필드명과 라벨은 필수입니다.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createFormField(formData)
      if (result.success) {
        setIsCreateModalOpen(false)
        resetForm()
        await fetchFields()
        alert('폼 필드가 성공적으로 생성되었습니다.')
      } else {
        alert(result.error || '폼 필드 생성에 실패했습니다.')
      }
    } catch (error) {
      alert('폼 필드 생성 중 오류가 발생했습니다.')
      console.error('Error creating field:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedField || !formData.field_name.trim() || !formData.label.trim()) {
      alert('필드명과 라벨은 필수입니다.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updateFormField(selectedField.id, formData)
      if (result.success) {
        setIsEditModalOpen(false)
        resetForm()
        await fetchFields()
        alert('폼 필드가 성공적으로 수정되었습니다.')
      } else {
        alert(result.error || '폼 필드 수정에 실패했습니다.')
      }
    } catch (error) {
      alert('폼 필드 수정 중 오류가 발생했습니다.')
      console.error('Error updating field:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (field: FormField) => {
    if (!confirm(`정말로 "${field.label}" 필드를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const result = await deleteFormField(field.id)
      if (result.success) {
        await fetchFields()
        alert('폼 필드가 성공적으로 삭제되었습니다.')
      } else {
        alert(result.error || '폼 필드 삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('폼 필드 삭제 중 오류가 발생했습니다.')
      console.error('Error deleting field:', error)
    }
  }

  const openCreateModal = () => {
    resetForm()
    setFormData(prev => ({ ...prev, display_order: fields.length + 1 }))
    setIsCreateModalOpen(true)
  }

  const openEditModal = (field: FormField) => {
    setSelectedField(field)
    setFormData({
      field_name: field.field_name,
      label: field.label,
      field_type: field.field_type,
      required: field.required,
      visible: field.visible,
      placeholder: field.placeholder || '',
      description: field.description || '',
      options: field.options || [],
      validation_rules: field.validation_rules || {},
      display_order: field.display_order
    })
    setIsEditModalOpen(true)
  }

  const addOption = () => {
    if (!optionText.trim()) return

    const newOption = { label: optionText.trim(), value: optionText.trim().toLowerCase() }
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), newOption]
    }))
    setOptionText('')
  }

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: (prev.options || []).filter((_, i) => i !== index)
    }))
  }

  const moveField = async (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = fields.findIndex(f => f.id === fieldId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= fields.length) return

    const newFields = [...fields]
    const [movedField] = newFields.splice(currentIndex, 1)
    newFields.splice(newIndex, 0, movedField)

    try {
      const fieldIds = newFields.map(f => f.id)
      const result = await reorderFormFields(fieldIds)
      if (result.success) {
        await fetchFields()
      } else {
        alert(result.error || '필드 순서 변경에 실패했습니다.')
      }
    } catch (error) {
      alert('필드 순서 변경 중 오류가 발생했습니다.')
      console.error('Error reordering fields:', error)
    }
  }

  const requiresOptions = (fieldType: FieldType) => {
    return ['select', 'multiselect', 'radio'].includes(fieldType)
  }

  return (
    <AdminLayout title="폼 설정 관리" currentPage="form-config">
      {/* 메인 탭 (필드 관리 / 단계 관리) */}
      <Tabs defaultValue="fields" className="space-y-6">
        <TabsList>
          <TabsTrigger value="fields">필드 관리</TabsTrigger>
          <TabsTrigger value="steps">단계 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-6">
          {/* 폼 타입 선택 탭 */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setCurrentFormType('common')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    currentFormType === 'common'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  공통 필드
                </button>
                <button
                  onClick={() => setCurrentFormType('new')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    currentFormType === 'new'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  신입자 전용
                </button>
                <button
                  onClick={() => setCurrentFormType('experienced')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    currentFormType === 'experienced'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  경력자 전용
                </button>
              </nav>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentFormType === 'common' && '공통 필드 관리'}
                {currentFormType === 'new' && '신입자 전용 필드 관리'}
                {currentFormType === 'experienced' && '경력자 전용 필드 관리'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentFormType === 'common' && '신입자와 경력자 모두 사용하는 공통 필드입니다.'}
                {currentFormType === 'new' && '신입자 신청서에만 표시되는 필드입니다.'}
                {currentFormType === 'experienced' && '경력자 신청서에만 표시되는 필드입니다.'}
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              필드 추가
            </button>
          </div>

          {/* 필드 목록 */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">로딩 중...</div>
            ) : fields.length === 0 ? (
              <div className="p-8 text-center text-gray-500">등록된 폼 필드가 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        순서
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        필드명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        라벨
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        타입
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        필수여부
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        표시여부
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fields.map((field, index) => (
                      <tr key={field.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-1">
                            <span>{field.display_order}</span>
                            <div className="flex flex-col space-y-1 ml-2">
                              <button
                                onClick={() => moveField(field.id, 'up')}
                                disabled={index === 0}
                                className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => moveField(field.id, 'down')}
                                disabled={index === fields.length - 1}
                                className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{field.field_name}</div>
                          {field.description && (
                            <div className="text-xs text-gray-500">{field.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {field.label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            field.required
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {field.required ? '필수' : '선택'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            field.visible
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {field.visible ? '표시' : '숨김'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(field)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(field)}
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 필드 생성 모달 */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">새 폼 필드 추가</h3>
                  <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        필드명 *
                      </label>
                      <input
                        type="text"
                        value={formData.field_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: full_name, email, phone"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        라벨 *
                      </label>
                      <input
                        type="text"
                        value={formData.label}
                        onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="사용자에게 표시될 라벨"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        필드 타입
                      </label>
                      <select
                        value={formData.field_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, field_type: e.target.value as FieldType }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {FIELD_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        플레이스홀더
                      </label>
                      <input
                        type="text"
                        value={formData.placeholder}
                        onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="입력 힌트 텍스트"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        설명
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="필드에 대한 추가 설명"
                      />
                    </div>

                    {requiresOptions(formData.field_type) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          옵션 관리
                        </label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={optionText}
                              onChange={(e) => setOptionText(e.target.value)}
                              placeholder="옵션 추가"
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={addOption}
                              className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                            >
                              추가
                            </button>
                          </div>
                          <div className="space-y-1">
                            {(formData.options || []).map((option, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                                <span className="text-sm">{option.label}</span>
                                <button
                                  type="button"
                                  onClick={() => removeOption(index)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  삭제
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="required"
                          checked={formData.required}
                          onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="required" className="ml-2 block text-sm text-gray-700">
                          필수 필드
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="visible"
                          checked={formData.visible}
                          onChange={(e) => setFormData(prev => ({ ...prev, visible: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="visible" className="ml-2 block text-sm text-gray-700">
                          표시
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        disabled={isSubmitting}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSubmitting ? '생성 중...' : '생성'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 필드 수정 모달 */}
          {isEditModalOpen && selectedField && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">폼 필드 수정</h3>
                  <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        필드명 *
                      </label>
                      <input
                        type="text"
                        value={formData.field_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: full_name, email, phone"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        라벨 *
                      </label>
                      <input
                        type="text"
                        value={formData.label}
                        onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="사용자에게 표시될 라벨"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        필드 타입
                      </label>
                      <select
                        value={formData.field_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, field_type: e.target.value as FieldType }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {FIELD_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        플레이스홀더
                      </label>
                      <input
                        type="text"
                        value={formData.placeholder}
                        onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="입력 힌트 텍스트"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        설명
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="필드에 대한 추가 설명"
                      />
                    </div>

                    {requiresOptions(formData.field_type) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          옵션 관리
                        </label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={optionText}
                              onChange={(e) => setOptionText(e.target.value)}
                              placeholder="옵션 추가"
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={addOption}
                              className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                            >
                              추가
                            </button>
                          </div>
                          <div className="space-y-1">
                            {(formData.options || []).map((option, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                                <span className="text-sm">{option.label}</span>
                                <button
                                  type="button"
                                  onClick={() => removeOption(index)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  삭제
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="editRequired"
                          checked={formData.required}
                          onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="editRequired" className="ml-2 block text-sm text-gray-700">
                          필수 필드
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="editVisible"
                          checked={formData.visible}
                          onChange={(e) => setFormData(prev => ({ ...prev, visible: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="editVisible" className="ml-2 block text-sm text-gray-700">
                          표시
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        disabled={isSubmitting}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSubmitting ? '수정 중...' : '수정'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="steps">
          <FormStepManager />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}