export interface DownloadableFileData {
  title: string
  description?: string
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  category?: string
  active?: boolean
}

export interface DownloadableFile extends DownloadableFileData {
  id: string
  download_count: number
  created_at: string
  updated_at: string
}

export async function getDownloadableFiles(activeOnly = false, category?: string) {
  try {
    const params = new URLSearchParams()
    if (activeOnly) params.append('active', 'true')
    if (category) params.append('category', category)

    const url = `/api/files${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '파일 목록 조회에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in getDownloadableFiles:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function createDownloadableFile(data: DownloadableFileData) {
  try {
    const response = await fetch('/api/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '파일 등록에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in createDownloadableFile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function updateDownloadableFile(id: string, data: Partial<DownloadableFileData>) {
  try {
    const response = await fetch(`/api/files/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '파일 정보 수정에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in updateDownloadableFile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function deleteDownloadableFile(id: string) {
  try {
    const response = await fetch(`/api/files/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '파일 삭제에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in deleteDownloadableFile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function downloadFile(id: string) {
  try {
    const response = await fetch(`/api/files/${id}/download`, {
      method: 'GET',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '파일 다운로드에 실패했습니다.')
    }

    return response
  } catch (error) {
    console.error('Error in downloadFile:', error)
    throw error
  }
}

export async function uploadFile(file: File, data: Omit<DownloadableFileData, 'file_name' | 'file_path' | 'file_size' | 'file_type'>) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    if (data.category) formData.append('category', data.category)
    if (data.active !== undefined) formData.append('active', String(data.active))

    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '파일 업로드에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in uploadFile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}