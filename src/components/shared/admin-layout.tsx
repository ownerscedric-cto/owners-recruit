import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import {
  Settings,
  Users,
  Calendar,
  Home,
  Shield,
  Building,
  FileText,
  FormInput,
  Eye,
  LogOut,
  User
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  currentPage: string
}

const navigation = [
  { name: '시스템 설정', href: '/admin/settings', icon: Settings, id: 'settings' },
  { name: '팀 관리', href: '/admin/teams', icon: Building, id: 'teams' },
  { name: '모집인 관리', href: '/admin/recruiters', icon: Users, id: 'recruiters' },
  { name: '시험 일정 관리', href: '/admin/exam-schedules', icon: Calendar, id: 'exam-schedules' },
  { name: '파일 관리', href: '/admin/files', icon: FileText, id: 'files' },
  { name: '폼 설정 관리', href: '/admin/form-config', icon: FormInput, id: 'form-config' },
  { name: '폼 미리보기', href: '/admin/form-preview', icon: Eye, id: 'form-preview' },
]

export function AdminLayout({ children, title, currentPage }: AdminLayoutProps) {
  const { admin, logout, loading } = useAdminAuth()

  // 로딩이 완료된 후 admin이 null이면 즉시 로그인 페이지로 리디렉션
  useEffect(() => {
    if (!loading && admin === null) {
      console.log('🚪 [AdminLayout] No admin after loading, redirecting to login')
      window.location.replace('/login')
    }
  }, [admin, loading])

  const handleLogout = async () => {
    if (confirm('정말 로그아웃 하시겠습니까?')) {
      await logout()
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'system_admin': return '시스템 관리자'
      case 'hr_manager': return '인사팀 관리자'
      default: return '관리자'
    }
  }

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
              <div className="ml-6 flex items-center">
                <Image
                  src="/owners_logo.png"
                  alt="오너스경영연구소 로고"
                  width={120}
                  height={40}
                  className="h-10 w-auto mr-3"
                  priority
                />
                <h1 className="text-xl font-bold text-gray-900">
                  시스템 관리자
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {admin && (
                <>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-sm text-gray-700">{admin.username}</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-red-600" />
                    <span className="text-sm text-gray-700">{getRoleText(admin.role)}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </Button>
                </>
              )}
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
                          ? 'bg-red-100 text-red-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 ${
                          isActive ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'
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