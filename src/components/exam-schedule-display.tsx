'use client'

import React, { useState, useEffect } from 'react'
import { ExamSchedule, getExamSchedules } from '@/lib/exam-schedules'

interface ExamScheduleDisplayProps {
  year?: number
  exam_type?: string
  showUpcoming?: boolean
  compact?: boolean
}

export default function ExamScheduleDisplay({
  year = new Date().getFullYear(),
  exam_type,
  showUpcoming = false,
  compact = false
}: ExamScheduleDisplayProps) {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>(exam_type || '전체')

  const EXAM_TYPES = ['전체', '생보', '손보', '제3보험']

// 지역 그룹 매핑
const LOCATION_GROUPS = {
  '수도권': ['서울', '인천', '제주'],
  '영남': ['부산', '울산'],
  '대구': ['대구'],
  '호남': ['광주', '전주'],
  '중부': ['대전', '서산'],
  '원주': ['원주', '강릉', '춘천']
}

  useEffect(() => {
    loadSchedules()
  }, [year, selectedType])

  const loadSchedules = async () => {
    setLoading(true)
    setError('')

    const typeParam = selectedType === '전체' ? undefined : selectedType
    const result = await getExamSchedules(year, typeParam)

    if (result.success) {
      let filteredSchedules = result.data

      // 향후 일정만 보기 옵션이 활성화된 경우
      if (showUpcoming) {
        const today = new Date().toISOString().split('T')[0]
        filteredSchedules = filteredSchedules.filter((schedule: ExamSchedule) =>
          schedule.exam_date && schedule.exam_date >= today
        )
      }

      setSchedules(filteredSchedules)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5)
  }

  const getRegistrationStatus = (schedule: ExamSchedule) => {
    const today = new Date().toISOString().split('T')[0]

    // 내부 마감일정이 있는 경우 우선 확인
    if (schedule.has_internal_deadline && schedule.internal_deadline_date) {
      if (today < schedule.internal_deadline_date) {
        return { status: 'internal_open', text: '내부 접수중', color: 'text-orange-600 bg-orange-50' }
      } else if (today === schedule.internal_deadline_date) {
        return { status: 'internal_open', text: '내부 마감 당일', color: 'text-red-600 bg-red-50' }
      } else {
        return { status: 'internal_closed', text: '내부 마감', color: 'text-gray-600 bg-gray-50' }
      }
    }

    // 공식 접수일정이 없는 경우
    if (!schedule.registration_start_date || !schedule.registration_end_date) {
      return { status: 'no_schedule', text: '일정 미정', color: 'text-gray-600 bg-gray-50' }
    }

    const startDate = schedule.registration_start_date
    const endDate = schedule.registration_end_date

    if (today < startDate) {
      return { status: 'upcoming', text: '접수 예정', color: 'text-blue-600 bg-blue-50' }
    } else if (today >= startDate && today <= endDate) {
      return { status: 'open', text: '접수 중', color: 'text-green-600 bg-green-50' }
    } else {
      return { status: 'closed', text: '접수 마감', color: 'text-gray-600 bg-gray-50' }
    }
  }

  const getTimeUntilDeadline = (endDate: string) => {
    const today = new Date()
    const deadline = new Date(endDate)
    const timeDiff = deadline.getTime() - today.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

    if (daysDiff > 0) {
      return `${daysDiff}일 남음`
    } else if (daysDiff === 0) {
      return '오늘 마감'
    } else {
      return '마감됨'
    }
  }

  const formatLocationDisplay = (locations: string[]) => {
    if (!locations || locations.length === 0) {
      return '미정'
    }

    // 지역 그룹별로 분류
    const groupedLocations: { [key: string]: string[] } = {}
    const ungroupedLocations: string[] = []

    locations.forEach(location => {
      let found = false
      Object.entries(LOCATION_GROUPS).forEach(([groupName, groupLocations]) => {
        if (groupLocations.includes(location)) {
          if (!groupedLocations[groupName]) {
            groupedLocations[groupName] = []
          }
          groupedLocations[groupName].push(location)
          found = true
        }
      })
      if (!found) {
        ungroupedLocations.push(location)
      }
    })

    // 결과 문자열 생성
    const result: string[] = []

    Object.entries(groupedLocations).forEach(([groupName, groupLocations]) => {
      const fullGroup = LOCATION_GROUPS[groupName as keyof typeof LOCATION_GROUPS]
      if (groupLocations.length === fullGroup.length) {
        // 그룹 전체가 포함된 경우
        result.push(`${groupName}(${groupLocations.join(', ')})`)
      } else {
        // 그룹 일부만 포함된 경우
        result.push(groupLocations.join(', '))
      }
    })

    // 그룹에 속하지 않는 지역들 추가
    if (ungroupedLocations.length > 0) {
      result.push(...ungroupedLocations)
    }

    return result.join(', ')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">시험 일정을 불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {year}년 시험 일정
            {showUpcoming && ' (향후 일정)'}
          </h2>

          <div className="flex space-x-2">
            {EXAM_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {schedules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {showUpcoming ? '예정된 시험 일정이 없습니다.' : '등록된 시험 일정이 없습니다.'}
        </div>
      ) : (
        <div className={compact ? 'space-y-2' : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
          {schedules.map((schedule) => {
            const registrationStatus = getRegistrationStatus(schedule)
            const deadlineDate = schedule.has_internal_deadline && schedule.internal_deadline_date
              ? schedule.internal_deadline_date
              : schedule.registration_end_date
            const timeUntilDeadline = deadlineDate ? getTimeUntilDeadline(deadlineDate) : null

            return (
              <div
                key={schedule.id}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  compact ? 'border-gray-200' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-lg'} text-gray-900`}>
                      {schedule.exam_type} {schedule.session_number}차
                      {schedule.session_range && (
                        <span className="text-xs text-gray-500 ml-1">({schedule.session_range})</span>
                      )}
                    </h3>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${registrationStatus.color}`}>
                      {registrationStatus.text}
                    </div>
                    {schedule.data_source && schedule.data_source !== 'manual' && (
                      <span className="inline-block px-1 py-0.5 rounded text-xs bg-gray-100 text-gray-600 ml-2">
                        {schedule.data_source === 'combined' ? '통합' :
                         schedule.data_source === 'official_only' ? '공식' :
                         schedule.data_source === 'internal_only' ? '내부' : ''}
                      </span>
                    )}
                  </div>
                  {(registrationStatus.status === 'open' || registrationStatus.status === 'internal_open') && timeUntilDeadline && (
                    <div className="text-right">
                      <div className="text-xs text-orange-600 font-medium">
                        {timeUntilDeadline}
                      </div>
                    </div>
                  )}
                </div>

                <div className={`space-y-2 ${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>
                  {/* 내부 마감일정 표시 */}
                  {schedule.has_internal_deadline && (
                    <div className="bg-orange-50 border border-orange-200 rounded p-2">
                      <span className="font-medium text-orange-800">🏢 내부 신청 마감:</span>
                      <div className="mt-1 text-orange-700">
                        {schedule.internal_deadline_date && formatDate(schedule.internal_deadline_date)}
                        {schedule.internal_deadline_time && (
                          <span className="ml-2">{formatTime(schedule.internal_deadline_time)}</span>
                        )}
                      </div>
                      {schedule.notice_date && (
                        <div className="mt-1 text-xs text-orange-600">
                          수험표 공지: {formatDate(schedule.notice_date)}
                          {schedule.notice_time && ` ${formatTime(schedule.notice_time)}`}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 공식 접수 기간 */}
                  {schedule.registration_start_date && schedule.registration_end_date && (
                    <div>
                      <span className="font-medium">공식 접수 기간:</span>
                      <div className="mt-1">
                        {formatDate(schedule.registration_start_date)} ~<br />
                        {formatDate(schedule.registration_end_date)}
                      </div>
                    </div>
                  )}

                  {/* 시험일 */}
                  {schedule.exam_date ? (
                    <div>
                      <span className="font-medium">시험일:</span>
                      <div className="mt-1 text-blue-600 font-medium">
                        {formatDate(schedule.exam_date)}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="font-medium">시험일:</span>
                      <div className="mt-1 text-gray-400 italic">
                        미정
                      </div>
                    </div>
                  )}

                  {/* 시험 시간 */}
                  {schedule.exam_time_start && schedule.exam_time_end && (
                    <div>
                      <span className="font-medium">시험 시간:</span>
                      <div className="mt-1">
                        {formatTime(schedule.exam_time_start)} ~ {formatTime(schedule.exam_time_end)}
                      </div>
                    </div>
                  )}

                  {/* 시험 지역 */}
                  <div>
                    <span className="font-medium">시험 지역:</span>
                    <div className="mt-1">
                      {formatLocationDisplay(schedule.locations)}
                    </div>
                  </div>

                  {/* 통합 노트 또는 일반 노트 */}
                  {(schedule.combined_notes || schedule.notes) && (
                    <div>
                      <span className="font-medium">비고:</span>
                      <div className="mt-1 text-gray-700">
                        {schedule.combined_notes || schedule.notes}
                      </div>
                    </div>
                  )}
                </div>

                {/* 접수 중인 경우 강조 표시 */}
                {registrationStatus.status === 'open' && !compact && schedule.registration_end_date && (
                  <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded">
                    <div className="text-sm text-green-800 font-medium">
                      🟢 현재 접수 중입니다
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      접수 마감: {formatDate(schedule.registration_end_date)} {timeUntilDeadline && `(${timeUntilDeadline})`}
                    </div>
                  </div>
                )}

                {/* 내부 접수 중인 경우 강조 표시 */}
                {registrationStatus.status === 'internal_open' && !compact && schedule.internal_deadline_date && (
                  <div className="mt-4 p-2 bg-orange-50 border border-orange-200 rounded">
                    <div className="text-sm text-orange-800 font-medium">
                      🏢 내부 접수 중입니다
                    </div>
                    <div className="text-xs text-orange-700 mt-1">
                      내부 마감: {formatDate(schedule.internal_deadline_date)} {timeUntilDeadline && `(${timeUntilDeadline})`}
                    </div>
                  </div>
                )}

                {/* 접수 예정인 경우 안내 */}
                {registrationStatus.status === 'upcoming' && !compact && schedule.registration_start_date && (
                  <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-sm text-blue-800 font-medium">
                      📅 접수 예정
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      접수 시작: {formatDate(schedule.registration_start_date)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}