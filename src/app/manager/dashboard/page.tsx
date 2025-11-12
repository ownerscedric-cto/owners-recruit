'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ManagerLayout } from '@/components/shared/manager-layout'
import { getApplicants } from '@/lib/applicants'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  UserPlus
} from 'lucide-react'

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1']

interface Applicant {
  id: string
  name: string
  status: string
  submitted_at: string
  recruiters?: { name: string }
}

export default function ManagerDashboard() {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalApplicants: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    reviewing: 0,
    thisMonth: 0,
    lastMonth: 0,
    avgProcessingTime: 2.8
  })

  const fetchData = async () => {
    try {
      const result = await getApplicants()
      if (result.success && result.data) {
        setApplicants(result.data)

        // 통계 계산
        const total = result.data.length
        const pending = result.data.filter((a: any) => a.status === 'pending').length
        const reviewing = result.data.filter((a: any) => a.status === 'reviewing').length
        const approved = result.data.filter((a: any) => a.status === 'approved').length
        const rejected = result.data.filter((a: any) => a.status === 'rejected').length
        const completed = result.data.filter((a: any) => a.status === 'completed').length

        // 이번 달 지원자 계산
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        const thisMonth = result.data.filter((a: any) => {
          const createdDate = new Date(a.submitted_at)
          return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
        }).length

        // 지난 달 계산
        const lastMonthDate = new Date(currentYear, currentMonth - 1)
        const lastMonth = result.data.filter((a: any) => {
          const createdDate = new Date(a.submitted_at)
          return createdDate.getMonth() === lastMonthDate.getMonth() &&
                 createdDate.getFullYear() === lastMonthDate.getFullYear()
        }).length

        setStats({
          totalApplicants: total,
          pendingReview: pending + reviewing, // 대기 중인 전체 (pending + reviewing)
          approved,
          rejected,
          completed,
          reviewing,
          thisMonth,
          lastMonth,
          avgProcessingTime: 2.8
        })
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 실시간 업데이트를 위한 주기적 새로고침 (선택적)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData()
    }, 30000) // 30초마다 새로고침

    return () => clearInterval(interval)
  }, [])

  // 차트 데이터 생성
  const statusData = [
    { name: '승인', value: stats.approved, color: '#10B981' },
    { name: '대기/검토', value: stats.pendingReview, color: '#F59E0B' },
    { name: '반려', value: stats.rejected, color: '#EF4444' },
    { name: '완료', value: stats.completed, color: '#6366F1' },
  ].filter(item => item.value > 0) // 값이 0인 항목은 제외

  // 주간 데이터 생성 (최근 7일)
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
    const dateStr = date.toISOString().split('T')[0]

    const dayApplicants = applicants.filter(a => a.submitted_at?.split('T')[0] === dateStr)
    const dayApproved = dayApplicants.filter(a => a.status === 'approved')
    const dayRejected = dayApplicants.filter(a => a.status === 'rejected')

    return {
      name: dayName,
      applicants: dayApplicants.length,
      approved: dayApproved.length,
      rejected: dayRejected.length
    }
  })

  // 월별 트렌드 데이터 (최근 5개월)
  const monthlyTrend = Array.from({ length: 5 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (4 - i))
    const monthName = `${date.getMonth() + 1}월`
    const month = date.getMonth()
    const year = date.getFullYear()

    const monthApplicants = applicants.filter(a => {
      const createdDate = new Date(a.submitted_at)
      return createdDate.getMonth() === month && createdDate.getFullYear() === year
    })

    return {
      month: monthName,
      count: monthApplicants.length
    }
  })

  // 최근 지원자 목록 (최대 5명)
  const recentApplicants = applicants
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 5)

  return (
    <ManagerLayout title="대시보드" currentPage="dashboard">
      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 지원자</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplicants}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">
                전월 대비 +{stats.thisMonth - stats.lastMonth}명
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">검토 대기</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReview}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-600">
                평균 처리 시간: {stats.avgProcessingTime}일
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600">
                승인률: {stats.totalApplicants > 0 ? Math.round((stats.approved / stats.totalApplicants) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserPlus className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">입사 완료</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-purple-600">
                완료율: {stats.totalApplicants > 0 ? Math.round((stats.completed / stats.totalApplicants) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 주간 신청 현황 */}
        <Card>
          <CardHeader>
            <CardTitle>주간 신청 현황</CardTitle>
            <CardDescription>최근 7일간 지원자 신청 및 처리 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="applicants" fill="#3B82F6" name="신청자" />
                  <Bar dataKey="approved" fill="#10B981" name="승인" />
                  <Bar dataKey="rejected" fill="#EF4444" name="반려" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 처리 상태 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>처리 상태 분포</CardTitle>
            <CardDescription>전체 지원자의 현재 상태 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 월별 트렌드 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>월별 지원자 트렌드</CardTitle>
            <CardDescription>최근 5개월간 지원자 수 변화</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 최근 지원자 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              최근 지원자
            </CardTitle>
            <CardDescription>오늘 접수된 지원서</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-gray-500">
                  데이터 로딩 중...
                </div>
              ) : recentApplicants.length > 0 ? (
                recentApplicants.map((applicant) => (
                  <div key={applicant.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{applicant.name}</p>
                      <p className="text-xs text-gray-500">
                        {applicant.recruiters?.name || '모집인 없음'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(applicant.submitted_at).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      {applicant.status === 'pending' && (
                        <Badge variant="outline" className="text-yellow-600">대기</Badge>
                      )}
                      {applicant.status === 'approved' && (
                        <Badge className="bg-green-600">승인</Badge>
                      )}
                      {applicant.status === 'reviewing' && (
                        <Badge className="bg-blue-600">검토중</Badge>
                      )}
                      {applicant.status === 'completed' && (
                        <Badge className="bg-purple-600">완료</Badge>
                      )}
                      {applicant.status === 'rejected' && (
                        <Badge className="bg-red-600">반려</Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  등록된 지원자가 없습니다
                </div>
              )}
            </div>
            <div className="mt-4">
              <Link href="/manager/applicants">
                <Button className="w-full" variant="outline" size="sm">
                  전체 보기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </ManagerLayout>
  )
}