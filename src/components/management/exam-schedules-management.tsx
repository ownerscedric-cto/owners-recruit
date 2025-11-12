'use client'

import React, { useState, useEffect, ReactNode } from 'react'
import { ExamSchedule, ExamScheduleData, getExamSchedules, createExamSchedule, updateExamSchedule, deleteExamSchedule, createBulkExamSchedules } from '@/lib/exam-schedules'
import SmartCrawlParser from '@/components/smart-crawl-parser'

interface ExamSchedulesManagementProps {
  children: (content: ReactNode) => ReactNode
}

const EXAM_TYPES = ['생보', '손보', '제3보험']
const LOCATIONS = ['서울', '인천', '제주', '부산', '울산', '대구', '광주', '전주', '대전', '서산', '원주', '강릉', '춘천']
const DATA_SOURCES = ['manual', 'official_only', 'internal_only', 'combined']

// 지역 그룹 매핑
const LOCATION_GROUPS = {
  '수도권': ['서울', '인천', '제주'],
  '영남': ['부산', '울산'],
  '대구': ['대구'],
  '호남': ['광주', '전주'],
  '중부': ['대전', '서산'],
  '원주': ['원주', '강릉', '춘천']
}

export default function ExamSchedulesManagement({ children }: ExamSchedulesManagementProps) {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [showSmartCrawlParser, setShowSmartCrawlParser] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const [formData, setFormData] = useState<ExamScheduleData>({
    year: new Date().getFullYear(),
    exam_type: '생보',
    session_number: 1,
    session_range: '',
    registration_start_date: '',
    registration_end_date: '',
    exam_date: '',
    exam_time_start: '10:00',
    exam_time_end: '12:00',
    locations: ['서울'],
    internal_deadline_date: '',
    internal_deadline_time: '',
    notice_date: '',
    notice_time: '',
    has_internal_deadline: false,
    data_source: 'manual',
    notes: '',
    combined_notes: ''
  })

  const [bulkFormData, setBulkFormData] = useState({
    year: new Date().getFullYear(),
    exam_type: '생보',
    sessions: [
      { session_number: 1, registration_start_date: '', registration_end_date: '', exam_date: '' },
    ]
  })

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    setLoading(true)
    const result = await getExamSchedules()
    if (result.success) {
      setSchedules(result.data)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const result = editingSchedule
      ? await updateExamSchedule(editingSchedule.id, formData)
      : await createExamSchedule(formData)

    if (result.success) {
      setSuccess(editingSchedule ? '시험 일정이 수정되었습니다.' : '시험 일정이 등록되었습니다.')
      setShowForm(false)
      setEditingSchedule(null)
      resetForm()
      loadSchedules()
    } else {
      setError(result.error)
    }
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const schedules = bulkFormData.sessions.map(session => ({
      year: bulkFormData.year,
      exam_type: bulkFormData.exam_type,
      session_number: session.session_number,
      registration_start_date: session.registration_start_date,
      registration_end_date: session.registration_end_date,
      exam_date: session.exam_date,
      exam_time_start: formData.exam_time_start,
      exam_time_end: formData.exam_time_end,
      locations: formData.locations,
      notes: formData.notes,
      data_source: 'manual'
    } as ExamScheduleData))

    const result = await createBulkExamSchedules(schedules)
    if (result.success) {
      setSuccess(`${result.count}개의 시험 일정이 등록되었습니다.`)
      setShowBulkForm(false)
      resetBulkForm()
      loadSchedules()
    } else {
      setError(result.error)
    }
  }

  const handleEdit = (schedule: ExamSchedule) => {
    setEditingSchedule(schedule)
    setFormData({
      year: schedule.year,
      exam_type: schedule.exam_type,
      session_number: schedule.session_number,
      session_range: schedule.session_range || '',
      registration_start_date: schedule.registration_start_date || '',
      registration_end_date: schedule.registration_end_date || '',
      exam_date: schedule.exam_date || '',
      exam_time_start: schedule.exam_time_start || '10:00',
      exam_time_end: schedule.exam_time_end || '12:00',
      locations: schedule.locations || ['서울'],
      internal_deadline_date: schedule.internal_deadline_date || '',
      internal_deadline_time: schedule.internal_deadline_time || '',
      notice_date: schedule.notice_date || '',
      notice_time: schedule.notice_time || '',
      has_internal_deadline: schedule.has_internal_deadline || false,
      data_source: schedule.data_source || 'manual',
      notes: schedule.notes || '',
      combined_notes: schedule.combined_notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 시험 일정을 삭제하시겠습니까?')) return

    const result = await deleteExamSchedule(id)
    if (result.success) {
      setSuccess('시험 일정이 삭제되었습니다.')
      loadSchedules()
    } else {
      setError(result.error)
    }
  }

  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear(),
      exam_type: '생보',
      session_number: 1,
      session_range: '',
      registration_start_date: '',
      registration_end_date: '',
      exam_date: '',
      exam_time_start: '10:00',
      exam_time_end: '12:00',
      locations: ['서울'],
      internal_deadline_date: '',
      internal_deadline_time: '',
      notice_date: '',
      notice_time: '',
      has_internal_deadline: false,
      data_source: 'manual',
      notes: '',
      combined_notes: ''
    })
  }

  const resetBulkForm = () => {
    setBulkFormData({
      year: new Date().getFullYear(),
      exam_type: '생보',
      sessions: [
        { session_number: 1, registration_start_date: '', registration_end_date: '', exam_date: '' },
      ]
    })
  }

  const handleSmartCrawlParserSuccess = (schedules: any[]) => {
    setSuccess(`${schedules.length}개의 시험 일정이 스마트 크롤링으로 그룹핑되었습니다.`)
  }

  const handleSmartCrawlParserError = (error: string) => {
    setError(error)
  }

  const addSession = () => {
    setBulkFormData(prev => ({
      ...prev,
      sessions: [...prev.sessions, {
        session_number: prev.sessions.length + 1,
        registration_start_date: '',
        registration_end_date: '',
        exam_date: ''
      }]
    }))
  }

  const removeSession = (index: number) => {
    setBulkFormData(prev => ({
      ...prev,
      sessions: prev.sessions.filter((_, i) => i !== index)
    }))
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const formatDateWithDay = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const days = ['일', '월', '화', '수', '목', '금', '토']
    const dayName = days[date.getDay()]
    return `${date.toLocaleDateString('ko-KR')} (${dayName})`
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return '-'
    return timeString.slice(0, 5)
  }

  const getDataSourceBadge = (dataSource?: string) => {
    const badges = {
      manual: { text: '수동', color: 'bg-gray-100 text-gray-800' },
      official_only: { text: '공식', color: 'bg-blue-100 text-blue-800' },
      internal_only: { text: '내부', color: 'bg-orange-100 text-orange-800' },
      combined: { text: '통합', color: 'bg-green-100 text-green-800' }
    }

    const badge = badges[dataSource as keyof typeof badges] || badges.manual
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  const content = (
    <>
      {loading ? (
        <div className="flex justify-center items-center min-h-64">로딩 중...</div>
      ) : (
        <div>
          <div className="flex justify-end items-center mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSmartCrawlParser(true)}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded hover:from-green-700 hover:to-teal-700 flex items-center space-x-2"
              >
                <span>스마트 크롤링</span>
              </button>
              <button
                onClick={() => setShowBulkForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                일괄 등록
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                일정 추가
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기본정보</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시험일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">내부마감</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">지역</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">출처</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {schedule.year}년 {schedule.exam_type}
                      </div>
                      <div className="text-sm text-gray-500">
                        {schedule.session_number}차
                        {schedule.session_range && (
                          <span className="text-xs text-gray-400 ml-1">({schedule.session_range})</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateWithDay(schedule.exam_date)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {schedule.has_internal_deadline ? (
                        <div className="text-sm text-orange-700">
                          <div>마감: {formatDate(schedule.internal_deadline_date)} {formatTime(schedule.internal_deadline_time)}</div>
                          {schedule.notice_date && (
                            <div>공지: {formatDate(schedule.notice_date)} {formatTime(schedule.notice_time)}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900">
                      {schedule.locations && schedule.locations.length > 0 ? schedule.locations.join(', ') : '-'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getDataSourceBadge(schedule.data_source)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {schedules.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                등록된 시험 일정이 없습니다.
              </div>
            )}
          </div>


          {/* 스마트 크롤링 파서 모달 */}
          {showSmartCrawlParser && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[95vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">스마트 크롤링 파서</h2>
                  <button
                    onClick={() => {
                      setShowSmartCrawlParser(false)
                      loadSchedules() // 파싱 후 데이터 새로고침
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    X
                  </button>
                </div>
                <SmartCrawlParser
                  onSuccess={handleSmartCrawlParserSuccess}
                  onError={handleSmartCrawlParserError}
                />
              </div>
            </div>
          )}

          {/* 단일 등록 폼 */}
          {showForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                  {editingSchedule ? '시험 일정 수정' : '시험 일정 등록'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 기본 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
                      <input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">시험 종류</label>
                      <select
                        value={formData.exam_type}
                        onChange={(e) => setFormData({...formData, exam_type: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      >
                        {EXAM_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">데이터 출처</label>
                      <select
                        value={formData.data_source}
                        onChange={(e) => setFormData({...formData, data_source: e.target.value as any})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="manual">수동 입력</option>
                        <option value="official_only">공식 일정만</option>
                        <option value="internal_only">내부 마감만</option>
                        <option value="combined">통합 데이터</option>
                      </select>
                    </div>
                  </div>

                  {/* 회차 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">회차</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.session_number}
                        onChange={(e) => setFormData({...formData, session_number: parseInt(e.target.value)})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">회차 범위 (선택)</label>
                      <input
                        type="text"
                        placeholder="예: 1~4차"
                        value={formData.session_range}
                        onChange={(e) => setFormData({...formData, session_range: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  {/* 공식 일정 */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">공식 시험일정</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">접수 시작일</label>
                        <input
                          type="date"
                          value={formData.registration_start_date}
                          onChange={(e) => setFormData({...formData, registration_start_date: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">접수 마감일</label>
                        <input
                          type="date"
                          value={formData.registration_end_date}
                          onChange={(e) => setFormData({...formData, registration_end_date: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">시험일</label>
                        <input
                          type="date"
                          value={formData.exam_date}
                          onChange={(e) => setFormData({...formData, exam_date: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
                        <input
                          type="time"
                          value={formData.exam_time_start}
                          onChange={(e) => setFormData({...formData, exam_time_start: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
                        <input
                          type="time"
                          value={formData.exam_time_end}
                          onChange={(e) => setFormData({...formData, exam_time_end: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 내부 마감일정 */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">내부 마감일정</h3>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.has_internal_deadline}
                          onChange={(e) => setFormData({...formData, has_internal_deadline: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm">내부 마감일정 있음</span>
                      </label>
                    </div>

                    {formData.has_internal_deadline && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">내부 마감일</label>
                            <input
                              type="date"
                              value={formData.internal_deadline_date}
                              onChange={(e) => setFormData({...formData, internal_deadline_date: e.target.value})}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">마감 시간</label>
                            <input
                              type="time"
                              value={formData.internal_deadline_time}
                              onChange={(e) => setFormData({...formData, internal_deadline_time: e.target.value})}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">수험표 공지일</label>
                            <input
                              type="date"
                              value={formData.notice_date}
                              onChange={(e) => setFormData({...formData, notice_date: e.target.value})}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">공지 시간</label>
                            <input
                              type="time"
                              value={formData.notice_time}
                              onChange={(e) => setFormData({...formData, notice_time: e.target.value})}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 시험 지역 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시험 지역</label>
                    <div className="grid grid-cols-5 gap-2">
                      {LOCATIONS.map(location => (
                        <label key={location} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.locations.includes(location)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({...formData, locations: [...formData.locations, location]})
                              } else {
                                setFormData({...formData, locations: formData.locations.filter(l => l !== location)})
                              }
                            }}
                            className="mr-1"
                          />
                          {location}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 노트 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">통합 노트</label>
                      <textarea
                        value={formData.combined_notes}
                        onChange={(e) => setFormData({...formData, combined_notes: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        rows={3}
                        placeholder="복합 파싱으로 생성된 통합 정보"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        setEditingSchedule(null)
                        resetForm()
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {editingSchedule ? '수정' : '등록'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 일괄 등록 폼 */}
          {showBulkForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">시험 일정 일괄 등록</h2>

                <form onSubmit={handleBulkSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
                      <input
                        type="number"
                        value={bulkFormData.year}
                        onChange={(e) => setBulkFormData({...bulkFormData, year: parseInt(e.target.value)})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">시험 종류</label>
                      <select
                        value={bulkFormData.exam_type}
                        onChange={(e) => setBulkFormData({...bulkFormData, exam_type: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      >
                        {EXAM_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium mb-2">공통 설정</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
                        <input
                          type="time"
                          value={formData.exam_time_start}
                          onChange={(e) => setFormData({...formData, exam_time_start: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
                        <input
                          type="time"
                          value={formData.exam_time_end}
                          onChange={(e) => setFormData({...formData, exam_time_end: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">시험 지역</label>
                      <div className="grid grid-cols-5 gap-2">
                        {LOCATIONS.map(location => (
                          <label key={location} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.locations.includes(location)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({...formData, locations: [...formData.locations, location]})
                                } else {
                                  setFormData({...formData, locations: formData.locations.filter(l => l !== location)})
                                }
                              }}
                              className="mr-1"
                            />
                            {location}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">회차별 일정</h3>
                      <button
                        type="button"
                        onClick={addSession}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        회차 추가
                      </button>
                    </div>

                    {bulkFormData.sessions.map((session, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4 mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{session.session_number}차</h4>
                          {bulkFormData.sessions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSession(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">접수 시작일</label>
                            <input
                              type="date"
                              value={session.registration_start_date}
                              onChange={(e) => {
                                const newSessions = [...bulkFormData.sessions]
                                newSessions[index].registration_start_date = e.target.value
                                setBulkFormData({...bulkFormData, sessions: newSessions})
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">접수 마감일</label>
                            <input
                              type="date"
                              value={session.registration_end_date}
                              onChange={(e) => {
                                const newSessions = [...bulkFormData.sessions]
                                newSessions[index].registration_end_date = e.target.value
                                setBulkFormData({...bulkFormData, sessions: newSessions})
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">시험일</label>
                            <input
                              type="date"
                              value={session.exam_date}
                              onChange={(e) => {
                                const newSessions = [...bulkFormData.sessions]
                                newSessions[index].exam_date = e.target.value
                                setBulkFormData({...bulkFormData, sessions: newSessions})
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkForm(false)
                        resetBulkForm()
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      일괄 등록
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )

  return children(content)
}