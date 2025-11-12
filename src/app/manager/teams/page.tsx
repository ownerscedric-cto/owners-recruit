'use client'

import { ManagerLayout } from '@/components/shared/manager-layout'
import TeamsManagement from '@/components/management/teams-management'

export default function ManagerTeamsPage() {
  return (
    <TeamsManagement>
      {(content) => (
        <ManagerLayout title="팀 관리" currentPage="teams">
          {content}
        </ManagerLayout>
      )}
    </TeamsManagement>
  )
}