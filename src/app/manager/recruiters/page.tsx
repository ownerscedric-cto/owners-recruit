'use client'

import { ManagerLayout } from '@/components/shared/manager-layout'
import RecruitersManagement from '@/components/management/recruiters-management'

export default function ManagerRecruitersPage() {
  return (
    <RecruitersManagement>
      {(content) => (
        <ManagerLayout title="모집인 관리" currentPage="recruiters">
          {content}
        </ManagerLayout>
      )}
    </RecruitersManagement>
  )
}