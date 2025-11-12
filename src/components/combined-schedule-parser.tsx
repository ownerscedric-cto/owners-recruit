'use client'

import React, { useState, useCallback } from 'react'
import { parseCombinedSchedule, saveParsedSchedules, ExamScheduleData } from '@/lib/exam-schedules'

interface CombinedScheduleParserProps {
  onSuccess?: (schedules: ExamScheduleData[]) => void
  onError?: (error: string) => void
}

export default function CombinedScheduleParser({ onSuccess, onError }: CombinedScheduleParserProps) {
  const [image, setImage] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<any>(null)
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
    const input = document.getElementById('image-input') as HTMLInputElement
    if (input) input.value = ''
  }, [])

  const handleParseSchedule = async () => {
    if (!image && !text.trim()) {
      onError?.('이미지 또는 텍스트 중 하나는 입력해주세요.')
      return
    }

    setParsing(true)
    setParsed(null)

    try {
      const result = await parseCombinedSchedule(image || undefined, text.trim() || undefined)

      if (result.success) {
        setParsed(result.data)
        onSuccess?.(result.data.combinedSchedules)
      } else {
        onError?.(result.error)
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setParsing(false)
    }
  }

  const handleSaveSchedules = async () => {
    if (!parsed?.combinedSchedules) {
      onError?.('저장할 일정이 없습니다.')
      return
    }

    setSaving(true)

    try {
      const result = await saveParsedSchedules(parsed.combinedSchedules)

      if (result.success) {
        alert('시험 일정이 성공적으로 저장되었습니다!')
        // 초기화
        setImage(null)
        setText('')
        setParsed(null)
        setImagePreview(null)
        const input = document.getElementById('image-input') as HTMLInputElement
        if (input) input.value = ''
      } else {
        onError?.(result.error)
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
        <h2 className="text-xl font-bold text-gray-900">시험 일정 파싱</h2>
        <p className="text-sm text-gray-600 mt-1">
          공식 시험 일정표 이미지와 내부 마감일정 텍스트를 함께 업로드하여 자동으로 파싱할 수 있습니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 이미지 업로드 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            📄 공식 시험일정표 이미지 (선택)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
            <input
              id="image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label
              htmlFor="image-input"
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
                    클릭하여 이미지 업로드
                  </div>
                  <div className="text-xs text-gray-500">
                    JPG, PNG, GIF 지원
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* 텍스트 입력 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            📝 내부 마감일정 텍스트 (선택)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="예: 1~4차 시험접수마감: 11월 4일(화) 오전 11시&#10;수험표 공지: 11월 7일(금) 오후 2시"
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="text-xs text-gray-500">
            내부 신청 마감일, 수험표 공지일 등을 입력해주세요.
          </div>
        </div>
      </div>

      {/* 파싱 버튼 */}
      <div className="flex justify-center">
        <button
          onClick={handleParseSchedule}
          disabled={parsing || (!image && !text.trim())}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {parsing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>파싱 중...</span>
            </>
          ) : (
            <>
              <span>🔍</span>
              <span>일정 파싱하기</span>
            </>
          )}
        </button>
      </div>

      {/* 파싱 결과 */}
      {parsed && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900">파싱 결과</h3>

          {/* 요약 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{parsed.summary?.totalSchedules || 0}</div>
                <div className="text-sm text-gray-600">총 일정</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{parsed.summary?.officialSchedules || 0}</div>
                <div className="text-sm text-gray-600">공식 일정</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{parsed.summary?.internalDeadlines || 0}</div>
                <div className="text-sm text-gray-600">내부 마감</div>
              </div>
            </div>
          </div>

          {/* 상세 결과 */}
          {parsed.combinedSchedules?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">통합된 일정 목록:</h4>
              <div className="space-y-2">
                {parsed.combinedSchedules.map((schedule: any, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-white border rounded-lg p-3">
                    <div>
                      <div className="font-medium">
                        {formatSchedulePreview(schedule)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {schedule.data_source === 'combined' ? '🔗 통합 데이터' :
                         schedule.data_source === 'official_only' ? '📋 공식만' :
                         schedule.data_source === 'internal_only' ? '🏢 내부만' : '📝 수동'}
                      </div>
                    </div>
                    <div className="text-right">
                      {schedule.has_internal_deadline && (
                        <div className="text-xs text-orange-600">내부 마감</div>
                      )}
                      {schedule.exam_date && (
                        <div className="text-sm text-blue-600">
                          {new Date(schedule.exam_date).toLocaleDateString('ko-KR')}
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
              disabled={saving || !parsed.combinedSchedules?.length}
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