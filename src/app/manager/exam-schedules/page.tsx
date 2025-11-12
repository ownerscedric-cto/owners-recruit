'use client'

import { ManagerLayout } from '@/components/shared/manager-layout'
import ExamSchedulesManagement from '@/components/management/exam-schedules-management'

export default function ManagerExamSchedulesPage() {
  return (
    <ExamSchedulesManagement>
      {(content) => (
        <ManagerLayout title="시험 일정 관리" currentPage="exam-schedules">
          {content}
        </ManagerLayout>
      )}
    </ExamSchedulesManagement>
  )
}