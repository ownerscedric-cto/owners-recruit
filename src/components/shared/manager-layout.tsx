import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  BarChart3,
  Users,
  FileText,
  Settings,
  Home,
  Bell,
  UserCheck,
  Building,
  Calendar
} from 'lucide-react'

interface ManagerLayoutProps {
  children: React.ReactNode
  title: string
  currentPage: string
}

const navigation = [
  { name: '대시보드', href: '/manager/dashboard', icon: BarChart3, id: 'dashboard' },
  { name: '지원자 관리', href: '/manager/applicants', icon: Users, id: 'applicants' },
  { name: '모집인 관리', href: '/manager/recruiters', icon: UserCheck, id: 'recruiters' },
  { name: '팀 관리', href: '/manager/teams', icon: Building, id: 'teams' },
  { name: '시험 일정 관리', href: '/manager/exam-schedules', icon: Calendar, id: 'exam-schedules' },
  { name: '보고서', href: '/manager/reports', icon: FileText, id: 'reports' },
]

export function ManagerLayout({ children, title, currentPage }: ManagerLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  홈
                </Button>
              </Link>
              <div className="ml-6">
                <h1 className="text-xl font-bold text-gray-900">
                  오너스경영연구소 인사팀
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center">
                <span className="text-sm text-gray-700">인사팀</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm h-screen sticky top-0">
          <nav className="mt-8 px-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 ${
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}