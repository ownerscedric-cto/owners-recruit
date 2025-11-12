export interface ExamScheduleData {
  year: number
  exam_type: string
  session_number: number
  session_range?: string
  registration_start_date?: string
  registration_end_date?: string
  exam_date?: string
  exam_time_start?: string
  exam_time_end?: string
  locations: string[]
  internal_deadline_date?: string
  internal_deadline_time?: string
  notice_date?: string
  notice_time?: string
  has_internal_deadline?: boolean
  data_source?: 'combined' | 'official_only' | 'internal_only' | 'manual'
  notes?: string
  combined_notes?: string
}

export interface ExamSchedule extends ExamScheduleData {
  id: string
  created_at: string
  updated_at: string
}

export async function getExamSchedules(year?: number, exam_type?: string) {
  try {
    const params = new URLSearchParams()
    if (year) params.append('year', year.toString())
    if (exam_type) params.append('exam_type', exam_type)

    const response = await fetch(`/api/exam-schedules?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '시험 일정 조회에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in getExamSchedules:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function createExamSchedule(data: ExamScheduleData) {
  try {
    const response = await fetch('/api/exam-schedules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '시험 일정 등록에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in createExamSchedule:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function updateExamSchedule(id: string, data: Partial<ExamScheduleData>) {
  try {
    const response = await fetch(`/api/exam-schedules/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '시험 일정 수정에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in updateExamSchedule:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function deleteExamSchedule(id: string) {
  try {
    const response = await fetch(`/api/exam-schedules/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '시험 일정 삭제에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in deleteExamSchedule:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

export async function createBulkExamSchedules(schedules: ExamScheduleData[]) {
  try {
    const response = await fetch('/api/exam-schedules/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ schedules }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '시험 일정 일괄 등록에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in createBulkExamSchedules:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

// 복합 파싱 API (이미지 + 텍스트 동시 처리)
export async function parseCombinedSchedule(image?: File, text?: string) {
  try {
    if (!image && !text) {
      throw new Error('이미지 또는 텍스트 중 하나는 제공되어야 합니다.')
    }

    const formData = new FormData()
    if (image) {
      formData.append('image', image)
    }
    if (text) {
      formData.append('text', text)
    }

    const response = await fetch('/api/exam-schedules/parse-combined', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '일정 파싱에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in parseCombinedSchedule:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

// 복합 파싱 결과를 데이터베이스에 저장
export async function saveParsedSchedules(combinedSchedules: ExamScheduleData[]) {
  try {
    const response = await fetch('/api/exam-schedules/save-parsed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ schedules: combinedSchedules }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '파싱된 일정 저장에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in saveParsedSchedules:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

// 공식 시험일정 크롤링
export async function crawlOfficialSchedules(year: number, month: number) {
  try {
    const response = await fetch('/api/exam-schedules/crawl-official', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ year, month }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '공식 시험일정 크롤링에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in crawlOfficialSchedules:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

// 크롤링 + 내부 일정 매칭
export async function crawlAndMatchSchedules(year: number, month: number, internalText?: string) {
  try {
    const response = await fetch('/api/exam-schedules/crawl-and-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ year, month, internalText }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '크롤링 및 매칭에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in crawlAndMatchSchedules:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

// 종합 파싱 (이미지 + 크롤링 + 내부일정)
export async function comprehensiveParse(image?: File, text?: string, year?: number, month?: number) {
  try {
    const formData = new FormData()
    if (image) {
      formData.append('image', image)
    }
    if (text) {
      formData.append('text', text)
    }
    if (year) {
      formData.append('year', year.toString())
    }
    if (month) {
      formData.append('month', month.toString())
    }

    const response = await fetch('/api/exam-schedules/comprehensive-parse', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '종합 파싱에 실패했습니다.')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in comprehensiveParse:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}