'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/shared/admin-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import {
  Download,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  FileText,
  Filter
} from 'lucide-react'

// 더미 데이터
const performanceData = [
  { month: '7월', applications: 28, approved: 22, rejected: 3, completed: 19 },
  { month: '8월', applications: 35, approved: 28, rejected: 4, completed: 24 },
  { month: '9월', applications: 42, approved: 34, rejected: 5, completed: 29 },
  { month: '10월', applications: 38, approved: 30, rejected: 4, completed: 26 },
  { month: '11월', applications: 45, approved: 35, rejected: 6, completed: 29 },
]

const recruiterData = [
  { name: '이모집', applications: 23, approved: 19, rate: 82.6 },
  { name: '김모집', applications: 18, approved: 15, rate: 83.3 },
  { name: '박모집', applications: 15, approved: 12, rate: 80.0 },
  { name: '최모집', applications: 12, approved: 9, rate: 75.0 },
  { name: '정모집', applications: 10, approved: 8, rate: 80.0 },
]

const processingTimeData = [
  { range: '1일 이내', count: 45 },
  { range: '2-3일', count: 32 },
  { range: '4-5일', count: 18 },
  { range: '6-7일', count: 8 },
  { range: '7일 초과', count: 4 },
]

const statusDistribution = [
  { name: '승인', value: 89, color: '#10B981' },
  { name: '대기', value: 23, color: '#F59E0B' },
  { name: '반려', value: 12, color: '#EF4444' },
  { name: '완료', value: 33, color: '#6366F1' },
]

const dailyActivity = [
  { date: '11-04', applications: 12, reviews: 8, approvals: 6 },
  { date: '11-05', applications: 8, reviews: 10, approvals: 7 },
  { date: '11-06', applications: 15, reviews: 12, approvals: 9 },
  { date: '11-07', applications: 10, reviews: 9, approvals: 8 },
  { date: '11-08', applications: 18, reviews: 15, approvals: 12 },
  { date: '11-09', applications: 6, reviews: 8, approvals: 6 },
  { date: '11-10', applications: 14, reviews: 11, approvals: 9 },
]

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1']

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: '2024-11-01',
    end: '2024-11-10'
  })

  return (
    <AdminLayout title="보고서" currentPage="reports">
      {/* 필터 및 내보내기 섹션 */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              보고서 설정
            </CardTitle>
            <CardDescription>
              기간을 선택하고 원하는 형태로 보고서를 내보낼 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="start-date">시작일</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-date">종료일</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                조회
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 지원자</p>
                <p className="text-2xl font-bold text-gray-900">157</p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +18.5%
                </p>
              </div>
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
                <p className="text-sm font-medium text-gray-600">승인률</p>
                <p className="text-2xl font-bold text-gray-900">84.2%</p>
                <p className="text-xs text-green-600 mt-1">
                  +2.1%p
                </p>
              </div>
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
                <p className="text-sm font-medium text-gray-600">평균 처리시간</p>
                <p className="text-2xl font-bold text-gray-900">2.3일</p>
                <p className="text-xs text-red-600 mt-1">
                  +0.2일
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">완료 건수</p>
                <p className="text-2xl font-bold text-gray-900">127</p>
                <p className="text-xs text-green-600 mt-1">
                  +12건
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 월별 성과 트렌드 */}
        <Card>
          <CardHeader>
            <CardTitle>월별 성과 트렌드</CardTitle>
            <CardDescription>최근 5개월간 지원 및 승인 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="applications" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="지원자" />
                  <Area type="monotone" dataKey="approved" stackId="2" stroke="#10B981" fill="#10B981" name="승인" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 모집인별 성과 */}
        <Card>
          <CardHeader>
            <CardTitle>모집인별 성과</CardTitle>
            <CardDescription>상위 5명 모집인의 지원자 모집 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recruiterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#3B82F6" name="지원자 수" />
                  <Bar dataKey="approved" fill="#10B981" name="승인 수" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* 처리 시간 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>처리 시간 분포</CardTitle>
            <CardDescription>지원서 처리 소요 시간별 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processingTimeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {processingTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 상태 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>현재 상태 분포</CardTitle>
            <CardDescription>전체 지원자의 상태별 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 모집인별 승인률 순위 */}
        <Card>
          <CardHeader>
            <CardTitle>모집인 승인률 순위</CardTitle>
            <CardDescription>승인률 기준 상위 모집인</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...recruiterData]
                .sort((a, b) => b.rate - a.rate)
                .map((recruiter, index) => (
                  <div key={recruiter.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">{recruiter.name}</p>
                        <p className="text-xs text-gray-500">
                          {recruiter.approved}/{recruiter.applications}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{recruiter.rate}%</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 일별 활동 */}
      <Card>
        <CardHeader>
          <CardTitle>일별 활동 현황</CardTitle>
          <CardDescription>최근 7일간 일별 지원, 검토, 승인 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="applications" stroke="#3B82F6" strokeWidth={2} name="신규 지원" />
                <Line type="monotone" dataKey="reviews" stroke="#F59E0B" strokeWidth={2} name="검토 완료" />
                <Line type="monotone" dataKey="approvals" stroke="#10B981" strokeWidth={2} name="승인 완료" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}