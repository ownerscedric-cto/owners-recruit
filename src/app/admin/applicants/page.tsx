'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/shared/admin-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Mail,
  Phone
} from 'lucide-react'

// 더미 데이터
const applicants = [
  {
    id: 'APP-001',
    name: '김영희',
    email: 'kim@example.com',
    phone: '010-1234-5678',
    status: 'pending',
    recruiter: '이모집',
    submittedAt: '2024-11-10T14:30:00Z',
    updatedAt: '2024-11-10T14:30:00Z',
    documents: ['주민등록등본', '증명사진'],
    hasCareer: false
  },
  {
    id: 'APP-002',
    name: '박철수',
    email: 'park@example.com',
    phone: '010-2345-6789',
    status: 'approved',
    recruiter: '김모집',
    submittedAt: '2024-11-10T13:15:00Z',
    updatedAt: '2024-11-10T15:20:00Z',
    documents: ['주민등록등본', '증명사진', '경력증명서', '말소확인증'],
    hasCareer: true
  },
  {
    id: 'APP-003',
    name: '이민정',
    email: 'lee@example.com',
    phone: '010-3456-7890',
    status: 'reviewing',
    recruiter: '박모집',
    submittedAt: '2024-11-10T11:45:00Z',
    updatedAt: '2024-11-10T12:00:00Z',
    documents: ['주민등록등본', '증명사진'],
    hasCareer: false
  },
  {
    id: 'APP-004',
    name: '정현수',
    email: 'jung@example.com',
    phone: '010-4567-8901',
    status: 'rejected',
    recruiter: '이모집',
    submittedAt: '2024-11-10T10:20:00Z',
    updatedAt: '2024-11-10T16:30:00Z',
    documents: ['주민등록등본'],
    hasCareer: false
  },
  {
    id: 'APP-005',
    name: '황미영',
    email: 'hwang@example.com',
    phone: '010-5678-9012',
    status: 'completed',
    recruiter: '김모집',
    submittedAt: '2024-11-10T09:30:00Z',
    updatedAt: '2024-11-10T17:00:00Z',
    documents: ['주민등록등본', '증명사진', '자격증사본'],
    hasCareer: false
  },
]

const statusFilters = [
  { value: 'all', label: '전체', count: 5 },
  { value: 'pending', label: '대기', count: 1 },
  { value: 'reviewing', label: '검토중', count: 1 },
  { value: 'approved', label: '승인', count: 1 },
  { value: 'rejected', label: '반려', count: 1 },
  { value: 'completed', label: '완료', count: 1 },
]

export default function ApplicantsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([])

  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch = applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         applicant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         applicant.recruiter.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = selectedStatus === 'all' || applicant.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">대기</Badge>
      case 'reviewing':
        return <Badge variant="default" className="bg-blue-600">검토중</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-600">승인</Badge>
      case 'rejected':
        return <Badge variant="destructive">반려</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-purple-600">완료</Badge>
      default:
        return <Badge variant="outline">알 수 없음</Badge>
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplicants(filteredApplicants.map(a => a.id))
    } else {
      setSelectedApplicants([])
    }
  }

  const handleSelectApplicant = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApplicants([...selectedApplicants, id])
    } else {
      setSelectedApplicants(selectedApplicants.filter(aid => aid !== id))
    }
  }

  return (
    <AdminLayout title="지원자 관리" currentPage="applicants">
      {/* 상단 필터 및 액션 바 */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="이름, 이메일, 모집인으로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              필터
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {selectedApplicants.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedApplicants.length}개 선택됨
                </span>
                <Button size="sm" variant="outline">
                  일괄 승인
                </Button>
                <Button size="sm" variant="outline">
                  일괄 반려
                </Button>
              </div>
            )}
            <Button>
              <Download className="h-4 w-4 mr-2" />
              엑셀 다운로드
            </Button>
          </div>
        </div>

        {/* 상태 필터 탭 */}
        <div className="flex items-center space-x-1 mt-4">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={selectedStatus === filter.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedStatus(filter.value)}
              className="flex items-center space-x-1"
            >
              <span>{filter.label}</span>
              <Badge variant="secondary" className="ml-1">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* 지원자 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>지원자 목록</CardTitle>
          <CardDescription>
            총 {filteredApplicants.length}명의 지원자가 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedApplicants.length === filteredApplicants.length && filteredApplicants.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>신청번호</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>모집인</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>경력</TableHead>
                <TableHead>신청일</TableHead>
                <TableHead>처리일</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplicants.map((applicant) => (
                <TableRow key={applicant.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedApplicants.includes(applicant.id)}
                      onChange={(e) => handleSelectApplicant(applicant.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {applicant.id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{applicant.name}</div>
                      <div className="text-sm text-gray-500">{applicant.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{applicant.phone}</TableCell>
                  <TableCell>{applicant.recruiter}</TableCell>
                  <TableCell>{getStatusBadge(applicant.status)}</TableCell>
                  <TableCell>
                    <Badge variant={applicant.hasCareer ? "default" : "secondary"}>
                      {applicant.hasCareer ? '경력' : '신입'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(applicant.submittedAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell>
                    {applicant.status !== 'pending' ?
                      new Date(applicant.updatedAt).toLocaleDateString('ko-KR') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        상세
                      </Button>

                      {applicant.status === 'pending' && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            승인
                          </Button>
                          <Button size="sm" variant="destructive">
                            <XCircle className="h-4 w-4 mr-1" />
                            반려
                          </Button>
                        </>
                      )}

                      {applicant.status === 'reviewing' && (
                        <Button size="sm" variant="outline">
                          <Clock className="h-4 w-4 mr-1" />
                          검토중
                        </Button>
                      )}

                      <Button size="sm" variant="ghost">
                        <Mail className="h-4 w-4 mr-1" />
                        메일
                      </Button>

                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredApplicants.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">검색 조건에 맞는 지원자가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  )
}