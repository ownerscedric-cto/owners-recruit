'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/shared/admin-layout'
import { DownloadableFile, DownloadableFileData, getDownloadableFiles, updateDownloadableFile, deleteDownloadableFile, uploadFile } from '@/lib/files'

const CATEGORIES = [
  { value: 'guide', label: '입사 가이드' },
  { value: 'form', label: '양식' },
  { value: 'manual', label: '매뉴얼' },
  { value: 'general', label: '일반' }
]

const FILE_TYPE_LABELS: { [key: string]: string } = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'text/plain': 'TXT',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/gif': 'GIF'
}

export default function AdminFilesPage() {
  const [files, setFiles] = useState<DownloadableFile[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<DownloadableFile | null>(null)
  const [formData, setFormData] = useState<DownloadableFileData & { file?: File }>({
    title: '',
    description: '',
    file_name: '',
    file_path: '',
    file_size: 0,
    file_type: '',
    category: 'guide',
    active: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filter, setFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const result = await getDownloadableFiles(false)
      if (result.success) {
        setFiles(result.data || [])
      } else {
        alert(result.error || '파일 목록 조회에 실패했습니다.')
      }
    } catch (error) {
      alert('파일 목록 조회 중 오류가 발생했습니다.')
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      file_name: '',
      file_path: '',
      file_size: 0,
      file_type: '',
      category: 'guide',
      active: true
    })
    setSelectedFile(null)
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      alert('제목은 필수입니다.')
      return
    }

    if (!formData.file) {
      alert('파일을 선택해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await uploadFile(formData.file, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        active: formData.active
      })

      if (result.success) {
        setIsCreateModalOpen(false)
        resetForm()
        await fetchFiles()
        alert('파일이 성공적으로 업로드되었습니다.')
      } else {
        alert(result.error || '파일 업로드에 실패했습니다.')
      }
    } catch (error) {
      alert('파일 업로드 중 오류가 발생했습니다.')
      console.error('Error creating file:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedFile || !formData.title.trim()) {
      alert('제목은 필수입니다.')
      return
    }

    setIsSubmitting(true)
    try {
      const updateData: Partial<DownloadableFileData> = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        active: formData.active
      }

      const result = await updateDownloadableFile(selectedFile.id, updateData)
      if (result.success) {
        setIsEditModalOpen(false)
        resetForm()
        await fetchFiles()
        alert('파일 정보가 성공적으로 수정되었습니다.')
      } else {
        alert(result.error || '파일 정보 수정에 실패했습니다.')
      }
    } catch (error) {
      alert('파일 정보 수정 중 오류가 발생했습니다.')
      console.error('Error updating file:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (file: DownloadableFile) => {
    if (!confirm(`정말로 "${file.title}" 파일을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const result = await deleteDownloadableFile(file.id)
      if (result.success) {
        await fetchFiles()
        alert('파일이 성공적으로 삭제되었습니다.')
      } else {
        alert(result.error || '파일 삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('파일 삭제 중 오류가 발생했습니다.')
      console.error('Error deleting file:', error)
    }
  }

  const openCreateModal = () => {
    resetForm()
    setIsCreateModalOpen(true)
  }

  const openEditModal = (file: DownloadableFile) => {
    setSelectedFile(file)
    setFormData({
      title: file.title,
      description: file.description || '',
      file_name: file.file_name,
      file_path: file.file_path,
      file_size: file.file_size,
      file_type: file.file_type,
      category: file.category,
      active: file.active
    })
    setIsEditModalOpen(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, file }))
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = filter === '' ||
      file.title.toLowerCase().includes(filter.toLowerCase()) ||
      file.file_name.toLowerCase().includes(filter.toLowerCase())

    const matchesCategory = categoryFilter === '' || file.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  return (
    <AdminLayout title="파일 관리" currentPage="files">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          파일 업로드
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="파일 제목 또는 파일명으로 검색..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">모든 카테고리</option>
          {CATEGORIES.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* 파일 목록 */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {filter || categoryFilter ? '검색 조건에 맞는 파일이 없습니다.' : '등록된 파일이 없습니다.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    파일 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    다운로드 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{file.title}</div>
                        {file.description && (
                          <div className="text-sm text-gray-500">{file.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {CATEGORIES.find(c => c.value === file.category)?.label || file.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{file.file_name}</div>
                      <div className="text-sm text-gray-500">
                        {(file.file_type && FILE_TYPE_LABELS[file.file_type]) || file.file_type || 'Unknown'} • {formatFileSize(file.file_size || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {file.download_count}회
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        file.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {file.active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(file)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(file)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                        <a
                          href={`/api/files/${file.id}/download`}
                          className="text-green-600 hover:text-green-900"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          다운로드
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 파일 업로드 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">파일 업로드</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    파일 *
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF 파일만 업로드 가능 (최대 10MB)
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                    활성화
                  </label>
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
                    {isSubmitting ? '업로드 중...' : '업로드'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 파일 정보 수정 모달 */}
      {isEditModalOpen && selectedFile && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">파일 정보 수정</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    현재 파일
                  </label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {selectedFile.file_name}
                    <br />
                    <span className="text-xs">
                      {(selectedFile.file_type && FILE_TYPE_LABELS[selectedFile.file_type]) || selectedFile.file_type || 'Unknown'} • {formatFileSize(selectedFile.file_size || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editActive"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editActive" className="ml-2 block text-sm text-gray-700">
                    활성화
                  </label>
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
    </AdminLayout>
  )
}