'use client'

import React, { useState, useCallback } from 'react'
import { crawlAndMatchSchedules, saveParsedSchedules } from '@/lib/exam-schedules'

interface CrawlBasedParserProps {
  onSuccess?: (schedules: any[]) => void
  onError?: (error: string) => void
}

export default function CrawlBasedParser({ onSuccess, onError }: CrawlBasedParserProps) {
  const [text, setText] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [crawling, setCrawling] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const handleTestCrawl = async () => {
    setCrawling(true)
    setResult(null)

    try {
      console.log('테스트 크롤링 시작')

      const response = await fetch('/api/exam-schedules/test-crawl')
      const testResult = await response.json()

      if (testResult.success) {
        setResult({
          ...testResult.data,
          summary: {
            totalSchedules: testResult.data.schedules?.length || 0,
            officialCount: testResult.data.schedules?.length || 0,
            internalCount: 0,
            matchedCount: 0
          }
        })
        onSuccess?.(testResult.data.schedules || [])
      } else {
        onError?.(testResult.error)
      }
    } catch (error) {
      console.error('테스트 크롤링 오류:', error)
      onError?.(error instanceof Error ? error.message : '테스트 크롤링 중 오류가 발생했습니다.')
    } finally {
      setCrawling(false)
    }
  }

  const handleCrawlAndMatch = async () => {
    if (!year || !month) {
      onError?.('년도와 월을 선택해주세요.')
      return
    }

    setCrawling(true)
    setResult(null)

    try {
      console.log(`크롤링 시작: ${year}년 ${month}월`)

      const crawlResult = await crawlAndMatchSchedules(year, month, text.trim() || undefined)

      if (crawlResult.success) {
        setResult(crawlResult.data)
        onSuccess?.(crawlResult.data.combinedSchedules)
      } else {
        onError?.(crawlResult.error)
      }
    } catch (error) {
      console.error('크롤링 오류:', error)
      onError?.(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setCrawling(false)
    }
  }

  const handleSaveSchedules = async () => {
    if (!result?.combinedSchedules) {
      onError?.('저장할 일정이 없습니다.')
      return
    }

    setSaving(true)

    try {
      const saveResult = await saveParsedSchedules(result.combinedSchedules)

      if (saveResult.success) {
        alert('시험 일정이 성공적으로 저장되었습니다!')
        // 초기화
        setText('')
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
        <h2 className="text-xl font-bold text-gray-900">🕷️ 크롤링 기반 시험일정 수집</h2>
        <p className="text-sm text-gray-600 mt-1">
          생명보험협회 공식 사이트에서 실시간 시험일정을 크롤링하고, 내부 마감일정과 자동으로 매칭합니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 크롤링 설정 */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">📅 크롤링 설정</h3>

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

          <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded-lg">
            <strong>📡 크롤링 대상:</strong><br />
            • 생명보험협회 공식 시험일정 (https://exam.insure.or.kr)<br />
            • 지역별 시험일정 자동 수집<br />
            • 정확한 날짜/시간 정보 추출
          </div>
        </div>

        {/* 내부 마감일정 텍스트 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            📝 내부 마감일정 텍스트 (선택)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="예: 1~4차 시험접수마감: 11월 4일(화) 오전 11시&#10;수험표 공지: 11월 7일(금) 오후 2시"
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="text-xs text-gray-500">
            내부 신청 마감일, 수험표 공지일 등을 입력하면 크롤링된 공식 일정과 자동으로 매칭됩니다.
          </div>
        </div>
      </div>

      {/* 크롤링 실행 버튼 */}
      <div className="flex justify-center space-x-3">
        <button
          onClick={handleTestCrawl}
          disabled={crawling}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <span>🔍</span>
          <span>테스트 크롤링</span>
        </button>
        <button
          onClick={handleCrawlAndMatch}
          disabled={crawling}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {crawling ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>크롤링 중... (30초 소요)</span>
            </>
          ) : (
            <>
              <span>🕷️</span>
              <span>공식 사이트 크롤링 시작</span>
            </>
          )}
        </button>
      </div>

      {/* 크롤링 결과 */}
      {result && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900">크롤링 결과</h3>

          {/* 요약 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{result.summary?.totalSchedules || 0}</div>
                <div className="text-sm text-gray-600">총 일정</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{result.summary?.officialCount || 0}</div>
                <div className="text-sm text-gray-600">공식 크롤링</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{result.summary?.internalCount || 0}</div>
                <div className="text-sm text-gray-600">내부 마감</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{result.summary?.matchedCount || 0}</div>
                <div className="text-sm text-gray-600">매칭 완료</div>
              </div>
            </div>
          </div>

          {/* 크롤링 디버그 정보 */}
          {result.debugInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">🔍 지역별 크롤링 디버그 정보</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>처리된 지역:</strong> {result.debugInfo.regionsProcessed?.length || 0}개
                </div>
                <div>
                  <strong>총 파싱된 일정:</strong> {result.debugInfo.totalSchedules || 0}개
                </div>
                {result.debugInfo.errors && result.debugInfo.errors.length > 0 && (
                  <div>
                    <strong className="text-red-600">오류 발생:</strong> {result.debugInfo.errors.length}개 지역
                  </div>
                )}
              </div>

              {/* 지역별 처리 결과 */}
              {result.debugInfo.regionsProcessed && result.debugInfo.regionsProcessed.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">🌍 지역별 처리 결과:</h5>
                  <div className="bg-white border rounded p-3 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-2">
                      {result.debugInfo.regionsProcessed.map((region: any, index: number) => (
                        <div key={index} className="text-xs">
                          <span className="font-medium text-blue-600">{region.region}</span>
                          <span className="text-gray-500"> ({region.code})</span>
                          <br />
                          <span className="text-green-600">{region.scheduleCount}개 일정</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 오류 정보 */}
              {result.debugInfo.errors && result.debugInfo.errors.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2 text-red-600">❌ 오류 발생 지역:</h5>
                  <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                    {result.debugInfo.errors.map((error: any, index: number) => (
                      <div key={index} className="text-xs text-red-700 mb-1">
                        <strong>{error.region}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 원본 지역별 데이터 (선택적 표시) */}
              {result.rawData && result.rawData.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">📋 지역별 원본 데이터:</h5>
                  <div className="bg-white border rounded p-3 max-h-60 overflow-y-auto">
                    {result.rawData.slice(0, 3).map((regionData: any, regionIndex: number) => (
                      <div key={regionIndex} className="mb-4 border-b pb-2">
                        <div className="font-medium text-sm text-purple-600">
                          {regionData.region} ({regionData.regionCode})
                        </div>
                        {regionData.data && regionData.data.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {regionData.data.length}개 테이블 데이터 수집됨
                          </div>
                        )}
                      </div>
                    ))}
                    {result.rawData.length > 3 && (
                      <div className="text-xs text-gray-400">
                        ... 외 {result.rawData.length - 3}개 지역 데이터
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 상세 결과 */}
          {result.combinedSchedules?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">통합된 일정 목록:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {result.combinedSchedules.map((schedule: any, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-white border rounded-lg p-3">
                    <div>
                      <div className="font-medium">
                        {formatSchedulePreview(schedule)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {schedule.data_source === 'crawled_combined' ? '🔗 크롤링+매칭' :
                         schedule.data_source === 'official_crawled' ? '🕷️ 크롤링만' :
                         schedule.data_source === 'internal_only' ? '🏢 내부만' : '📝 기타'}
                      </div>
                    </div>
                    <div className="text-right">
                      {schedule.region_name && (
                        <div className="text-xs font-medium text-purple-600 mb-1">
                          📍 {schedule.region_name}
                        </div>
                      )}
                      {schedule.has_internal_deadline && (
                        <div className="text-xs text-orange-600">내부 마감</div>
                      )}
                      {schedule.exam_date && (
                        <div className="text-sm text-blue-600">
                          {new Date(schedule.exam_date).toLocaleDateString('ko-KR')}
                        </div>
                      )}
                      {schedule.locations && schedule.locations.length > 0 && (
                        <div className="text-xs text-gray-600">
                          🏢 {schedule.locations.join(', ')}
                        </div>
                      )}
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
              disabled={saving || !result.combinedSchedules?.length}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
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