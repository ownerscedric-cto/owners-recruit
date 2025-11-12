'use client'

import React from 'react'
import ExamScheduleDisplay from '@/components/exam-schedule-display'

export default function ExamSchedulesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            시험 일정 안내
          </h1>
          <p className="text-lg text-gray-600">
            생명보험, 손해보험, 제3보험 시험 일정을 확인하세요.
          </p>
        </div>

        {/* 향후 시험 일정 섹션 */}
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ExamScheduleDisplay
              year={2025}
              showUpcoming={true}
            />
          </div>
        </div>

        {/* 전체 시험 일정 섹션 */}
        <div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ExamScheduleDisplay
              year={2025}
              showUpcoming={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}