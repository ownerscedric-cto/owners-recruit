'use client'

import { AdminLayout } from '@/components/shared/admin-layout'
import RecruitersManagement from '@/components/management/recruiters-management'

export default function AdminRecruitersPage() {
  return (
    <RecruitersManagement>
      {(content) => (
        <AdminLayout title="모집인 관리" currentPage="recruiters">
          {content}
        </AdminLayout>
      )}
    </RecruitersManagement>
  )
}