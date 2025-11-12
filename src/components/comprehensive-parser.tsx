'use client'

import React, { useState, useCallback } from 'react'
import { comprehensiveParse, saveParsedSchedules } from '@/lib/exam-schedules'

interface ComprehensiveParserProps {
  onSuccess?: (schedules: any[]) => void
  onError?: (error: string) => void
}

export default function ComprehensiveParser({ onSuccess, onError }: ComprehensiveParserProps) {
  const [image, setImage] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)

      // 이미지 미리보기 생성
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleImageRemove = useCallback(() => {
    setImage(null)
    setImagePreview(null)
    const input = document.getElementById('comp-image-input') as HTMLInputElement
    if (input) input.value = ''
  }, [])

  const handleComprehensiveParse = async () => {
    if (!image && !text.trim()) {
      onError?.('이미지 또는 텍스트 중 하나는 입력해주세요.')
      return
    }

    setParsing(true)
    setResult(null)

    try {
      console.log(`종합 파싱 시작: ${year}년 ${month}월`)

      const parseResult = await comprehensiveParse(
        image || undefined,
        text.trim() || undefined,
        year,
        month
      )

      if (parseResult.success) {
        setResult(parseResult.data)
        onSuccess?.(parseResult.data.comprehensiveSchedules)
      } else {
        onError?.(parseResult.error)
      }
    } catch (error) {
      console.error('종합 파싱 오류:', error)
      onError?.(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setParsing(false)
    }
  }

  const handleSaveSchedules = async () => {
    if (!result?.comprehensiveSchedules) {
      onError?.('저장할 일정이 없습니다.')
      return
    }

    setSaving(true)

    try {
      const saveResult = await saveParsedSchedules(result.comprehensiveSchedules)

      if (saveResult.success) {
        alert('시험 일정이 성공적으로 저장되었습니다!')
        // 초기화
        setImage(null)
        setText('')
        setResult(null)
        setImagePreview(null)
        const input = document.getElementById('comp-image-input') as HTMLInputElement
        if (input) input.value = ''
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

  const getDataSourceBadge = (dataSource: string) => {
    const badges = {
      'comprehensive_match': { text: '🎯 완전 매칭', color: 'bg-green-100 text-green-800' },
      'image_internal': { text: '🖼️ 이미지+내부', color: 'bg-blue-100 text-blue-800' },
      'image_crawled': { text: '🖼️ 이미지+크롤링', color: 'bg-purple-100 text-purple-800' },
      'crawled_internal': { text: '🕷️ 크롤링+내부', color: 'bg-orange-100 text-orange-800' },
      'image_only': { text: '🖼️ 이미지만', color: 'bg-gray-100 text-gray-800' },
      'crawled_only': { text: '🕷️ 크롤링만', color: 'bg-yellow-100 text-yellow-800' },
      'internal_only': { text: '🏢 내부만', color: 'bg-red-100 text-red-800' }
    }

    const badge = badges[dataSource as keyof typeof badges] || badges['image_only']
    return badge
  }

  return (
    <div className="space-y-6 bg-white rounded-lg shadow-sm border p-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">🎯 종합 시험일정 파싱</h2>
        <p className="text-sm text-gray-600 mt-1">
          이미지, 크롤링, 내부일정을 종합적으로 분석하여 가장 정확하고 완전한 시험일정 정보를 생성합니다.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* 이미지 업로드 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            🖼️ 시험일정표 이미지
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
            <input
              id="comp-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label
              htmlFor="comp-image-input"
              className="cursor-pointer block text-center"
            >
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-32 mx-auto rounded border"
                  />
                  <div className="flex justify-center space-x-2">
                    <span className="text-sm text-gray-600">{image?.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        handleImageRemove()
                      }}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-gray-400 text-2xl">📷</div>
                  <div className="text-sm text-gray-600">
                    차수별 상세 정보 추출
                  </div>
                  <div className="text-xs text-gray-500">
                    JPG, PNG, GIF 지원
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* 크롤링 설정 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            🕷️ 크롤링 설정
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">년도</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">월</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded-lg">
            <strong>📡 자동 수집:</strong><br />
            • 생명보험협회 공식 일정<br />
            • 지역별 시험 정보<br />
            • 정확한 날짜/시간
          </div>
        </div>

        {/* 내부 마감일정 텍스트 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            🏢 내부 마감일정
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="예: 1~4차 시험접수마감: 11월 4일(화) 오전 11시&#10;수험표 공지: 11월 7일(금) 오후 2시"
            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
          <div className="text-xs text-gray-500">
            내부 신청 마감일, 수험표 공지일 등
          </div>
        </div>
      </div>

      {/* 종합 파싱 버튼 */}
      <div className="flex justify-center">
        <button
          onClick={handleComprehensiveParse}
          disabled={parsing || (!image && !text.trim())}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
        >
          {parsing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>종합 분석 중... (1분 소요)</span>
            </>
          ) : (
            <>
              <span>🎯</span>
              <span>종합 파싱 시작</span>
            </>
          )}
        </button>
      </div>

      {/* 종합 파싱 결과 */}
      {result && (
        <div className="space-y-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900">🎯 종합 분석 결과</h3>

          {/* 데이터 소스별 요약 */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">{result.summary?.totalSchedules || 0}</div>
                <div className="text-sm text-gray-600">총 일정</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{result.summary?.imageCount || 0}</div>
                <div className="text-sm text-gray-600">이미지</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{result.summary?.crawledCount || 0}</div>
                <div className="text-sm text-gray-600">크롤링</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{result.summary?.internalCount || 0}</div>
                <div className="text-sm text-gray-600">내부</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{result.summary?.fullyMatchedCount || 0}</div>
                <div className="text-sm text-gray-600">완전매칭</div>
              </div>
            </div>
          </div>

          {/* 상세 결과 목록 */}
          {result.comprehensiveSchedules?.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">종합 매칭된 일정 목록:</h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {result.comprehensiveSchedules.map((schedule: any, index: number) => {
                  const badge = getDataSourceBadge(schedule.data_source)

                  return (
                    <div key={index} className="flex items-center justify-between bg-white border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-lg">
                          {formatSchedulePreview(schedule)}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                            {badge.text}
                          </span>
                          {schedule.has_internal_deadline && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              내부 마감
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        {schedule.exam_date && (
                          <div className="text-sm font-medium text-blue-600">
                            {new Date(schedule.exam_date).toLocaleDateString('ko-KR')}
                          </div>
                        )}
                        {schedule.locations && schedule.locations.length > 0 && (
                          <div className="text-xs text-gray-600">
                            {schedule.locations.slice(0, 2).join(', ')}
                            {schedule.locations.length > 2 && ` 외 ${schedule.locations.length - 2}곳`}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 저장 버튼 */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleSaveSchedules}
              disabled={saving || !result.comprehensiveSchedules?.length}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
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