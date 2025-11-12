'use client'

import { AdminLayout } from '@/components/shared/admin-layout'
import ExamSchedulesManagement from '@/components/management/exam-schedules-management'

export default function AdminExamSchedulesPage() {
  return (
    <ExamSchedulesManagement>
      {(content) => (
        <AdminLayout title="시험 일정 관리" currentPage="exam-schedules">
          {content}
        </AdminLayout>
      )}
    </ExamSchedulesManagement>
  )
}