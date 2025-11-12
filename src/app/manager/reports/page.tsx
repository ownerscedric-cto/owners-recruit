'use client'

import { useState, useEffect } from 'react'
import { ManagerLayout } from '@/components/shared/manager-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Download,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react'

interface Applicant {
  id: string
  name: string
  email: string
  phone: string
  position: string
  experience_level: string
  status: string
  submitted_at: string
  recruiter_name?: string
}

const statusColors = {
  pending: '#f59e0b',
  reviewing: '#3b82f6',
  approved: '#10b981',
  rejected: '#ef4444',
  completed: '#8b5cf6'
}

const statusLabels = {
  pending: '대기중',
  reviewing: '심사중',
  approved: '승인됨',
  rejected: '거부됨',
  completed: '완료됨'
}

export default function ManagerReports() {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')

  useEffect(() => {
    loadApplicants()
  }, [])

  const loadApplicants = async () => {
    try {
      setLoading(true)
      const result = await getApplicants()
      if (result.success) {
        setApplicants(result.data || [])
      }
    } catch (error) {
      console.error('Error loading applicants:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredApplicants = () => {
    let filtered = [...applicants]

    if (selectedPeriod !== 'all') {
      const now = new Date()
      let startDate = new Date()

      switch (selectedPeriod) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
          break
      }

      filtered = filtered.filter(applicant =>
        new Date(applicant.submitted_at) >= startDate
      )
    }

    return filtered
  }

  const filteredApplicants = getFilteredApplicants()

  // 통계 계산
  const totalApplicants = filteredApplicants.length
  const statusStats = filteredApplicants.reduce((acc, applicant) => {
    acc[applicant.status] = (acc[applicant.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const conversionRate = totalApplicants > 0
    ? ((statusStats.approved || 0) / totalApplicants * 100).toFixed(1)
    : '0'

  const avgProcessingTime = '2.8'

  // 차트 데이터 준비
  const statusChartData = Object.entries(statusStats).map(([status, count]) => ({
    name: statusLabels[status as keyof typeof statusLabels],
    value: count,
    fill: statusColors[status as keyof typeof statusColors]
  }))

  const positionStats = filteredApplicants.reduce((acc, applicant) => {
    acc[applicant.position] = (acc[applicant.position] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const positionChartData = Object.entries(positionStats).map(([position, count]) => ({
    position,
    count
  }))

  // 시간별 지원 현황 (최근 7일)
  const timeSeriesData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().split('T')[0]
    const count = filteredApplicants.filter(a =>
      a.submitted_at.split('T')[0] === dateStr
    ).length

    return {
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      count
    }
  })

  const handleExportReport = () => {
    const csvData = filteredApplicants.map(applicant => ({
      이름: applicant.name,
      이메일: applicant.email,
      전화번호: applicant.phone,
      지원직무: applicant.position,
      경력수준: applicant.experience_level,
      상태: statusLabels[applicant.status as keyof typeof statusLabels],
      지원일: new Date(applicant.submitted_at).toLocaleDateString('ko-KR'),
      모집인: applicant.recruiter_name || '-'
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `인사팀_지원자_보고서_${new Date().toLocaleDateString('ko-KR').replace(/\./g, '')}.csv`
    link.click()
  }

  if (loading) {
    return (
      <ManagerLayout title="보고서" currentPage="reports">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </ManagerLayout>
    )
  }

  return (
    <ManagerLayout title="보고서" currentPage="reports">
      {/* 필터 및 내보내기 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>보고서 설정</CardTitle>
          <CardDescription>
            기간을 선택하고 보고서를 내보낼 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">기간:</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="today">오늘</SelectItem>
                <SelectItem value="week">최근 7일</SelectItem>
                <SelectItem value="month">이번 달</SelectItem>
                <SelectItem value="quarter">최근 3개월</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleExportReport} className="ml-auto bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            보고서 내보내기
          </Button>
        </CardContent>
      </Card>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 지원자</p>
              <p className="text-2xl font-bold">{totalApplicants}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">승인률</p>
              <p className="text-2xl font-bold">{conversionRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">평균 처리시간</p>
              <p className="text-2xl font-bold">{avgProcessingTime}일</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">완료된 심사</p>
              <p className="text-2xl font-bold">{statusStats.completed || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 상태별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>지원자 상태별 분포</CardTitle>
            <CardDescription>현재 지원자들의 심사 상태</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 직무별 지원 현황 */}
        <Card>
          <CardHeader>
            <CardTitle>직무별 지원 현황</CardTitle>
            <CardDescription>직무별 지원자 수</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={positionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="position" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 시간별 지원 추이 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 7일 지원 추이</CardTitle>
          <CardDescription>일별 지원자 수 변화</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 상태 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>현재 처리 상태 요약</CardTitle>
          <CardDescription>지원자들의 현재 상태별 상세 정보</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(statusStats).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                <div
                  className="w-4 h-4 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: statusColors[status as keyof typeof statusColors] }}
                />
                <div className="text-sm text-gray-600 mb-1">
                  {statusLabels[status as keyof typeof statusLabels]}
                </div>
                <div className="text-xl font-bold">{count}</div>
                <div className="text-xs text-gray-500">
                  {totalApplicants > 0 ? ((count / totalApplicants) * 100).toFixed(1) : 0}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ManagerLayout>
  )
}