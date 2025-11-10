'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdminLayout } from '@/components/shared/admin-layout'
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
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileCheck,
  UserPlus
} from 'lucide-react'

// 더미 데이터
const stats = {
  totalApplicants: 157,
  pendingReview: 23,
  approved: 89,
  rejected: 12,
  completed: 33,
  thisMonth: 45,
  lastMonth: 38,
  avgProcessingTime: 2.3
}

const weeklyData = [
  { name: '월', applicants: 12, approved: 8, rejected: 1 },
  { name: '화', applicants: 8, approved: 5, rejected: 2 },
  { name: '수', applicants: 15, approved: 12, rejected: 0 },
  { name: '목', applicants: 10, approved: 7, rejected: 1 },
  { name: '금', applicants: 18, approved: 15, rejected: 1 },
  { name: '토', applicants: 6, approved: 4, rejected: 0 },
  { name: '일', applicants: 3, approved: 2, rejected: 0 },
]

const statusData = [
  { name: '승인', value: 89, color: '#10B981' },
  { name: '대기', value: 23, color: '#F59E0B' },
  { name: '반려', value: 12, color: '#EF4444' },
  { name: '완료', value: 33, color: '#6366F1' },
]

const monthlyTrend = [
  { month: '7월', count: 28 },
  { month: '8월', count: 35 },
  { month: '9월', count: 42 },
  { month: '10월', count: 38 },
  { month: '11월', count: 45 },
]

const recentApplicants = [
  { id: 1, name: '김영희', status: 'pending', submittedAt: '2024-11-10T14:30:00Z', recruiter: '이모집' },
  { id: 2, name: '박철수', status: 'approved', submittedAt: '2024-11-10T13:15:00Z', recruiter: '김모집' },
  { id: 3, name: '이민정', status: 'reviewing', submittedAt: '2024-11-10T11:45:00Z', recruiter: '박모집' },
  { id: 4, name: '정현수', status: 'pending', submittedAt: '2024-11-10T10:20:00Z', recruiter: '이모집' },
  { id: 5, name: '황미영', status: 'completed', submittedAt: '2024-11-10T09:30:00Z', recruiter: '김모집' },
]

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1']

export default function AdminDashboard() {
  return (
    <AdminLayout title="대시보드" currentPage="dashboard">
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
                승인률: {Math.round((stats.approved / stats.totalApplicants) * 100)}%
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
                완료율: {Math.round((stats.completed / stats.totalApplicants) * 100)}%
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
                    {statusData.map((entry, index) => (
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
              {recentApplicants.map((applicant) => (
                <div key={applicant.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{applicant.name}</p>
                    <p className="text-xs text-gray-500">{applicant.recruiter}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(applicant.submittedAt).toLocaleTimeString('ko-KR', {
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
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button className="w-full" variant="outline" size="sm">
                전체 보기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}