export interface RecruiterData {
  name: string
  email: string
  phone: string
  team: string
  position?: '지점장' | '부지점장' | '팀장'
  active?: boolean
}

export interface Recruiter extends RecruiterData {
  id: string
  position: '지점장' | '부지점장' | '팀장'
  active: boolean
  created_at: string
}

export async function getRecruiters(activeOnly = false) {
  try {
    const url = activeOnly ? '/api/recruiters?active=true' : '/api/recruiters'
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '모집인 목록 조회에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in getRecruiters:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function getActiveRecruiters() {
  return getRecruiters(true)
}

export async function createRecruiter(data: RecruiterData) {
  try {
    const response = await fetch('/api/recruiters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '모집인 등록에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in createRecruiter:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function updateRecruiter(id: string, data: Partial<RecruiterData>) {
  try {
    const response = await fetch(`/api/recruiters/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '모집인 정보 수정에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in updateRecruiter:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function deleteRecruiter(id: string) {
  try {
    const response = await fetch(`/api/recruiters/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '모집인 삭제에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in deleteRecruiter:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function getRecruiterStats(id: string) {
  try {
    const response = await fetch(`/api/recruiters/${id}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '모집인 통계 조회에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in getRecruiterStats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function toggleRecruiterStatus(id: string, active: boolean) {
  try {
    const response = await fetch(`/api/recruiters/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ active }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '모집인 상태 변경에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in toggleRecruiterStatus:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}