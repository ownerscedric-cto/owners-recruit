'use client'

import React, { useState, useCallback } from 'react'
import { saveParsedSchedules } from '@/lib/exam-schedules'

interface SmartCrawlParserProps {
  onSuccess?: (schedules: any[]) => void
  onError?: (error: string) => void
}

export default function SmartCrawlParser({ onSuccess, onError }: SmartCrawlParserProps) {
  const [internalText, setInternalText] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [crawling, setCrawling] = useState(false)
  const [matching, setMatching] = useState(false)
  const [crawlResult, setCrawlResult] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // 샘플 내부 마감일정 텍스트
  const sampleText = `1~4차 시험접수마감: 11월 4일(화) 오전 11시
수험표 공지: 11월 7일(금) 오후 2시
5~6차 시험접수마감: 11월 10일(일) 오전 11시
수험표 공지: 11월 12일(화) 오후 5시
7~8차 시험접수마감: 11월 13일(수) 오전 11시
수험표 공지: 11월 14일(목) 오후 5시
9~10차 시험접수마감: 11월 17일(일) 오전 11시
수험표 공지: 11월 18일(월) 오후 5시`

  const handleLoadSample = () => {
    setInternalText(sampleText)
  }

  // 1단계: 크롤링만 실행
  const handleCrawlOnly = async () => {
    if (!year || !month) {
      onError?.('년도와 월을 선택해주세요.')
      return
    }

    setCrawling(true)
    setCrawlResult(null)

    try {
      console.log(`크롤링 시작: ${year}년 ${month}월`)

      const response = await fetch('/api/exam-schedules/crawl-official', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month })
      })

      const data = await response.json()

      if (data.success) {
        setCrawlResult(data.data)
        console.log(`크롤링 완료: ${data.data.schedules.length}개 일정 수집`)
      } else {
        onError?.(data.error)
      }
    } catch (error) {
      console.error('크롤링 오류:', error)
      onError?.(error instanceof Error ? error.message : '크롤링 중 오류가 발생했습니다.')
    } finally {
      setCrawling(false)
    }
  }

  // 2단계: AI 매칭 실행
  const handleAIMatching = async () => {
    if (!crawlResult) {
      onError?.('먼저 크롤링을 실행해주세요.')
      return
    }

    setMatching(true)
    setResult(null)

    try {
      console.log(`AI 매칭 시작: ${crawlResult.schedules.length}개 일정`)

      const response = await fetch('/api/exam-schedules/crawl-and-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          internalText: internalText.trim(),
          crawledSchedules: crawlResult.schedules
        })
      })

      const matchResult = await response.json()

      if (matchResult.success) {
        setResult(matchResult.data)
        onSuccess?.(matchResult.data.schedules)
      } else {
        onError?.(matchResult.error)
      }
    } catch (error) {
      console.error('AI 매칭 오류:', error)
      onError?.(error instanceof Error ? error.message : 'AI 매칭 중 오류가 발생했습니다.')
    } finally {
      setMatching(false)
    }
  }

  const handleSaveSchedules = async () => {
    if (!result?.schedules) {
      onError?.('저장할 일정이 없습니다.')
      return
    }

    setSaving(true)

    try {
      const saveResult = await saveParsedSchedules(result.schedules)

      if (saveResult.success) {
        alert('시험 일정이 성공적으로 저장되었습니다!')
        // 초기화
        setInternalText('')
        setResult(null)
      } else {
        onError?.(saveResult.error)
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const formatSchedulePreview = (schedule: any) => {
    const parts = []
    if (schedule.exam_type) parts.push(schedule.exam_type)
    if (schedule.session_number) parts.push(`${schedule.session_number}차`)
    if (schedule.session_range) parts.push(`(${schedule.session_range})`)
    return parts.join(' ')
  }

  return (
    <div className="space-y-6 bg-white rounded-lg shadow-sm border p-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">스마트 크롤링 파서</h2>
        <p className="text-sm text-gray-600 mt-1">
          크롤링 데이터를 시간순으로 정렬하여 자동 차수 배정 후 내부 마감일정과 매칭합니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 크롤링 설정 */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">크롤링 설정</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                년도
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                월
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-gray-500 p-3 bg-green-50 rounded-lg">
            <strong>스마트 알고리즘:</strong><br />
            1. 지역별 시험일정 크롤링<br />
            2. 시험일 기준으로 시간순 정렬<br />
            3. 동일 날짜를 하나의 차수로 그룹핑<br />
            4. 내부 마감일정과 차수 매칭
          </div>
        </div>

        {/* 내부 마감일정 텍스트 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              내부 마감일정 텍스트
            </label>
            <button
              onClick={handleLoadSample}
              className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded"
            >
              샘플 로드
            </button>
          </div>
          <textarea
            value={internalText}
            onChange={(e) => setInternalText(e.target.value)}
            placeholder="예: 1~4차 시험접수마감: 11월 4일(화) 오전 11시&#10;수험표 공지: 11월 7일(금) 오후 2시"
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
          <div className="text-xs text-gray-500">
            차수별 신청 마감일과 공지일을 입력하면 크롤링된 시험일정과 자동 매칭됩니다.
          </div>
        </div>
      </div>

      {/* 실행 버튼 */}
      <div className="flex justify-center space-x-4">
        {/* 1단계: 크롤링 버튼 */}
        <button
          onClick={handleCrawlOnly}
          disabled={crawling}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {crawling ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>크롤링 중... (30초)</span>
            </>
          ) : (
            <>
              <span>크롤링</span>
              <span>1단계: 크롤링</span>
            </>
          )}
        </button>

        {/* 2단계: AI 매칭 버튼 */}
        <button
          onClick={handleAIMatching}
          disabled={matching || !crawlResult}
          className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {matching ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>AI 매칭 중...</span>
            </>
          ) : (
            <>
              <span>분석</span>
              <span>2단계: AI 매칭</span>
            </>
          )}
        </button>
      </div>

      {/* 1단계 크롤링 결과 */}
      {crawlResult && !result && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900">1단계: 크롤링 결과</h3>

          {/* 크롤링 요약 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{crawlResult.schedules?.length || 0}</div>
                <div className="text-sm text-gray-600">크롤링된 일정</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{crawlResult.debugInfo?.regionsProcessed?.length || 0}</div>
                <div className="text-sm text-gray-600">처리된 지역</div>
              </div>
            </div>
          </div>

          {/* 원본 크롤링 데이터 미리보기 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">원본 크롤링 데이터 (처음 10개)</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {crawlResult.schedules?.slice(0, 10).map((schedule: any, index: number) => (
                <div key={index} className="bg-white border rounded p-2 text-sm">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-medium text-blue-600">{schedule.region_name}</span>
                      <span className="text-gray-500"> - {schedule.exam_date}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {schedule.exam_time_start} ~ {schedule.exam_time_end}
                    </div>
                  </div>
                  {schedule.notes && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {schedule.notes}
                    </div>
                  )}
                </div>
              ))}
              {crawlResult.schedules?.length > 10 && (
                <div className="text-xs text-gray-400 text-center">
                  ... 외 {crawlResult.schedules.length - 10}개 일정
                </div>
              )}
            </div>
          </div>

          {/* 다음 단계 안내 */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-purple-600">텍스트</span>
              <span className="font-medium text-purple-900">다음 단계</span>
            </div>
            <p className="text-sm text-purple-700 mt-2">
              크롤링된 원본 데이터를 확인했습니다.
              내부 마감일정을 입력한 후 <strong>2단계: AI 매칭</strong> 버튼을 클릭하여
              지능형 그룹핑과 매칭을 실행하세요.
            </p>
          </div>
        </div>
      )}

      {/* 2단계 AI 매칭 결과 */}
      {result && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900">2단계: AI 매칭 결과</h3>

          {/* 요약 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{result.totalCrawled || 0}</div>
                <div className="text-sm text-gray-600">크롤링 일정</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{result.totalGrouped || 0}</div>
                <div className="text-sm text-gray-600">그룹핑 차수</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{result.internalDeadlines?.length || 0}</div>
                <div className="text-sm text-gray-600">내부 마감</div>
              </div>
            </div>
          </div>

          {/* 내부 마감일정 정보 */}
          {result.internalDeadlines && result.internalDeadlines.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">파싱된 내부 마감일정</h4>
              <div className="space-y-2">
                {result.internalDeadlines.map((deadline: any, index: number) => (
                  <div key={index} className="text-sm bg-white p-2 rounded border">
                    <span className="font-medium text-orange-600">{deadline.session_range}차</span>
                    <span className="mx-2">마감: {deadline.deadline_date} {deadline.deadline_time}</span>
                    {deadline.notice_date && (
                      <span>공지: {deadline.notice_date} {deadline.notice_time}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 상세 결과 */}
          {result.schedules?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">그룹핑된 시험일정:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {result.schedules.map((schedule: any, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-white border rounded-lg p-3">
                    <div>
                      <div className="font-medium">
                        {formatSchedulePreview(schedule)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {schedule.has_internal_deadline ? '마감일정 매칭됨' : '크롤링만'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-600">
                        {new Date(schedule.exam_date).toLocaleDateString('ko-KR')}
                      </div>
                      <div className="text-xs text-purple-600">
                        {schedule.locations.length}개 지역
                      </div>
                      <div className="text-xs text-gray-500">
                        {schedule.locations.slice(0, 3).join(', ')}
                        {schedule.locations.length > 3 && ' 외'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 저장 버튼 */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleSaveSchedules}
              disabled={saving || !result.schedules?.length}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <span>저장</span>
                  <span>데이터베이스에 저장하기</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}