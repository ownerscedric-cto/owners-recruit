'use client'

import { AdminLayout } from '@/components/shared/admin-layout'
import TeamsManagement from '@/components/management/teams-management'

export default function AdminTeamsPage() {
  return (
    <TeamsManagement>
      {(content) => (
        <AdminLayout title="팀 관리" currentPage="teams">
          {content}
        </AdminLayout>
      )}
    </TeamsManagement>
  )
}