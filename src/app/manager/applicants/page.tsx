'use client'

import { useState, useEffect } from 'react'
import { ManagerLayout } from '@/components/shared/manager-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { getApplicants, updateApplicantStatus, updateApplicantRecruiter } from '@/lib/applicants'
import { getActiveRecruiters, type Recruiter } from '@/lib/recruiters'
import { getExamApplicationsByApplicant } from '@/lib/exam-applications'
import { getCareersByApplicant, type Career } from '@/lib/careers'
import { Database } from '@/types/database'
import { decryptResidentNumber } from '@/lib/encryption'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { BankSelect } from '@/components/forms/bank-select'

type ApplicantStatus = Database['public']['Tables']['applicants']['Row']['status']
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  X,
  Trash2,
  AlertTriangle,
  Edit,
  Save
} from 'lucide-react'

interface Applicant {
  id: string
  name: string
  email: string
  phone: string
  address: string
  birth_date: string
  resident_number: string | null
  bank_name: string | null
  bank_account: string | null
  life_insurance_pass_date: string | null
  life_education_date: string | null
  final_school: string | null
  documents_confirmed: boolean
  document_preparation_date: string | null
  applicant_type: 'new' | 'experienced'
  status: ApplicantStatus
  submitted_at: string
  appointment_deadline?: string | null
  recruiters?: {
    name: string
    team: string
  }
}

export default function ManagerApplicantsPage() {
  const { admin } = useAdminAuth()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [showRecruiterEdit, setShowRecruiterEdit] = useState(false)
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>('')
  const [examApplications, setExamApplications] = useState<any[]>([])
  const [loadingExamApplications, setLoadingExamApplications] = useState(false)
  const [careerData, setCareerData] = useState<Career[]>([])
  const [loadingCareerData, setLoadingCareerData] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [applicantToDelete, setApplicantToDelete] = useState<Applicant | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingData, setEditingData] = useState<Partial<Applicant>>({})
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    fetchApplicants()
    fetchRecruiters()
  }, [admin])

  useEffect(() => {
    // 검색 및 필터링 로직
    let filtered = applicants

    if (searchTerm) {
      filtered = filtered.filter(applicant =>
        applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        applicant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        applicant.phone.includes(searchTerm)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(applicant => applicant.status === statusFilter)
    }

    setFilteredApplicants(filtered)
  }, [applicants, searchTerm, statusFilter])

  const fetchApplicants = async () => {
    try {
      const result = await getApplicants()
      if (result.success && result.data) {
        setApplicants(result.data)
      }
    } catch (error) {
      // 지원자 목록 조회 실패
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: ApplicantStatus) => {
    setUpdating(id)
    try {
      const result = await updateApplicantStatus(id, newStatus)
      if (result.success) {
        // 로컬 상태 업데이트
        setApplicants(prev =>
          prev.map(applicant =>
            applicant.id === id ? { ...applicant, status: newStatus } : applicant
          )
        )
      } else {
        alert('상태 변경에 실패했습니다: ' + result.error)
      }
    } catch (error) {
      // 상태 변경 실패
      alert('상태 변경 중 오류가 발생했습니다.')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" />대기</Badge>
      case 'reviewing':
        return <Badge className="bg-blue-600"><Eye className="h-3 w-3 mr-1" />검토중</Badge>
      case 'approved':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />승인</Badge>
      case 'rejected':
        return <Badge className="bg-red-600"><XCircle className="h-3 w-3 mr-1" />반려</Badge>
      case 'completed':
        return <Badge className="bg-purple-600"><CheckCircle className="h-3 w-3 mr-1" />완료</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleViewDetail = (applicant: Applicant) => {
    setSelectedApplicant(applicant)
    setShowDetailModal(true)
    setIsEditing(false)
    setEditingData({})
    // 시험 신청 내역 가져오기
    fetchExamApplications(applicant.id)
    // 경력자인 경우 경력 정보도 가져오기
    if (applicant.applicant_type === 'experienced') {
      fetchCareerData(applicant.id)
    }
  }

  const fetchRecruiters = async () => {
    try {
      const result = await getActiveRecruiters()
      if (result.success && result.data) {
        setRecruiters(result.data)
      }
    } catch (error) {
      // 모집인 목록 조회 실패
    }
  }

  const handleDeleteClick = (applicant: Applicant) => {
    setApplicantToDelete(applicant)
    setShowDeleteModal(true)
    setDeleteReason('')
  }

  const handleDeleteApplicant = async () => {
    if (!applicantToDelete || !deleteReason.trim()) {
      alert('삭제 사유를 입력해주세요.')
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/applicants/${applicantToDelete.id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deletion_reason: deleteReason,
          deleted_by: admin?.username || 'unknown'
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('지원자가 삭제되었습니다.')
        setShowDeleteModal(false)
        setApplicantToDelete(null)
        setDeleteReason('')
        // 목록 새로고침
        await fetchApplicants()
      } else {
        alert('삭제 실패: ' + result.error)
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const handleAppointmentDeadlineUpdate = async (applicantId: string, deadline: string) => {
    try {
      // 위촉 마감일 업데이트 API 호출
      const response = await fetch('/api/applicants/appointment-deadline', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicantId,
          appointmentDeadline: deadline || null
        }),
      })

      const result = await response.json()

      if (result.success) {
        // 로컬 상태 업데이트
        setApplicants(prev => prev.map(applicant =>
          applicant.id === applicantId
            ? { ...applicant, appointment_deadline: deadline || null }
            : applicant
        ))
        setFilteredApplicants(prev => prev.map(applicant =>
          applicant.id === applicantId
            ? { ...applicant, appointment_deadline: deadline || null }
            : applicant
        ))
      } else {
        alert('위촉 마감일 업데이트에 실패했습니다.')
      }
    } catch (error) {
      alert('위촉 마감일 업데이트 중 오류가 발생했습니다.')
    }
  }

  const fetchExamApplications = async (applicantId: string) => {
    setLoadingExamApplications(true)
    try {
      const data = await getExamApplicationsByApplicant(applicantId)
      setExamApplications(data)
    } catch (error) {
      // 시험 신청 내역 조회 실패
      setExamApplications([])
    } finally {
      setLoadingExamApplications(false)
    }
  }

  const fetchCareerData = async (applicantId: string) => {
    setLoadingCareerData(true)
    try {
      const result = await getCareersByApplicant(applicantId)
      if (result.success) {
        setCareerData(result.data)
      } else {
        setCareerData([])
      }
    } catch (error) {
      // 경력 정보 조회 실패
      setCareerData([])
    } finally {
      setLoadingCareerData(false)
    }
  }

  const handleCloseDetail = () => {
    setSelectedApplicant(null)
    setShowDetailModal(false)
    setShowRecruiterEdit(false)
    setExamApplications([])
    setLoadingExamApplications(false)
    setCareerData([])
    setLoadingCareerData(false)
    setIsEditing(false)
    setEditingData({})
  }

  const handleStartEdit = () => {
    if (selectedApplicant) {
      setIsEditing(true)
      setEditingData({
        ...selectedApplicant,
        resident_number: selectedApplicant.resident_number ? decryptResidentNumber(selectedApplicant.resident_number) : ''
      })
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingData({})
  }

  const handleSaveEdit = async () => {
    if (!selectedApplicant || !admin) return

    setSavingEdit(true)
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/applicants/${selectedApplicant.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingData)
      })

      const result = await response.json()

      if (result.success) {
        alert('지원자 정보가 업데이트되었습니다.')
        await fetchApplicants() // 목록 새로고침
        setIsEditing(false)
        setEditingData({})
        // 상세보기 다시 로드
        const updatedApplicant = applicants.find(a => a.id === selectedApplicant.id)
        if (updatedApplicant) {
          setSelectedApplicant(updatedApplicant)
        }
      } else {
        alert(result.error || '정보 수정에 실패했습니다.')
      }
    } catch (error) {
      alert('정보 수정 중 오류가 발생했습니다.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleEditFieldChange = (field: string, value: any) => {
    setEditingData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRecruiterEdit = () => {
    if (selectedApplicant) {
      setSelectedRecruiter(selectedApplicant.recruiters?.name || 'none')
      setShowRecruiterEdit(true)
    }
  }

  const handleRecruiterUpdate = async () => {
    if (!selectedApplicant) return

    try {
      const recruiterName = selectedRecruiter === 'none' ? null : selectedRecruiter
      const result = await updateApplicantRecruiter(
        selectedApplicant.id,
        recruiterName
      )

      if (result.success) {
        await fetchApplicants() // 목록 새로고침
        setShowRecruiterEdit(false)
        alert('도입자 정보가 업데이트되었습니다.')
      } else {
        alert(result.error || '도입자 수정에 실패했습니다.')
      }
    } catch (error) {
      // Error updating recruiter
      alert('도입자 수정 중 오류가 발생했습니다.')
    }
  }

  const copyApplicantInfo = async (applicant: Applicant) => {
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '';
      try {
        return new Date(dateStr).toLocaleDateString('ko-KR');
      } catch {
        return '';
      }
    };

    // 경력 정보 가져오기 (경력자인 경우)
    let careerInfoText = '';
    if (applicant.applicant_type === 'experienced') {
      try {
        const careerResult = await getCareersByApplicant(applicant.id);
        if (careerResult.success && careerResult.data.length > 0) {
          careerInfoText = '\n\n<경력 사항>\n';
          (careerResult.data as Career[]).forEach((career, index) => {
            careerInfoText += `${index + 1}. 회사명: ${career.company}
   직책: ${career.position}
   근무기간: ${formatDate(career.start_date)} ~ ${formatDate(career.end_date)}
   회사유형: ${career.company_type === 'insurance' ? '보험회사' : '금융회사'}`;

            if (career.termination_status) {
              const terminationStatusText =
                career.termination_status === 'completed' ? '완료' :
                career.termination_status === 'in_progress' ? '진행중' : '도움 필요';
              careerInfoText += `\n   말소 처리: ${terminationStatusText}`;

              if (career.termination_date) {
                careerInfoText += `\n   말소 예정일: ${formatDate(career.termination_date)}`;
              }
            }

            if (career.description) {
              careerInfoText += `\n   설명: ${career.description}`;
            }

            careerInfoText += '\n\n';
          });
        } else {
          careerInfoText = '\n\n<경력 사항>\n등록된 경력 정보가 없습니다.\n\n';
        }
      } catch (error) {
        careerInfoText = '\n\n<경력 사항>\n경력 정보를 불러올 수 없습니다.\n\n';
      }
    }

    // 시험 신청 정보 가져오기
    let examApplicationsText = '';
    try {
      const examApplications = await getExamApplicationsByApplicant(applicant.id);
      if (examApplications.length > 0) {
        examApplicationsText = '\n\n<생명보험 시험 신청 정보>\n';
        examApplications.forEach((exam, index) => {
          const statusMap = {
            'pending': '신청대기',
            'confirmed': '접수완료',
            'cancelled': '취소됨',
            'completed': '시험완료'
          };
          examApplicationsText += `${index + 1}. 시험종류: ${exam.exam_type}
   차수: ${exam.exam_round || '미정'}
   시험일: ${formatDate(exam.exam_date)}
   시험장소: ${exam.exam_location || '미정'}
   신청일: ${formatDate(exam.application_date)}
   상태: ${statusMap[exam.status]}
   ${exam.notes ? `메모: ${exam.notes}` : ''}

`;
        });
      }
    } catch (error) {
      // Error fetching exam applications
      examApplicationsText = '\n\n<생명보험 시험 신청 정보>\n시험 신청 정보를 불러올 수 없습니다.\n\n';
    }

    const info = `<신청자 정보>
1. 이름: ${applicant.name}
2. 주민번호: ${applicant.resident_number ? decryptResidentNumber(applicant.resident_number) : ''}
3. 자택주소: ${applicant.address}
4. 휴대폰 번호: ${applicant.phone}
5. 계좌: ${applicant.bank_name ? `${applicant.bank_name} ${applicant.bank_account || ''}` : ''}
6. 이메일: ${applicant.email}
7. 생명보험합격일: ${formatDate(applicant.life_insurance_pass_date)}
8. 생명교육이수일: ${formatDate(applicant.life_education_date)}
9. 학력(최종학교명): ${applicant.final_school || ''}
10. 신입/경력 여부: ${applicant.applicant_type === 'new' ? '신입' : '경력'}
11. 도입자: ${applicant.recruiters?.name || '없음'}${applicant.recruiters?.team ? ` (${applicant.recruiters.team})` : ''}${careerInfoText}${examApplicationsText}

---
처리 상태: ${getStatusText(applicant.status)}
신청일: ${new Date(applicant.submitted_at).toLocaleDateString('ko-KR')}
서류 확인: ${applicant.documents_confirmed ? '완료' : '미완료'}
서류 준비 예정일: ${formatDate(applicant.document_preparation_date)}
정보 생성일시: ${new Date().toLocaleString('ko-KR')}`

    navigator.clipboard.writeText(info).then(() => {
      alert('지원자 정보가 복사되었습니다.')
    }).catch(() => {
      alert('복사에 실패했습니다.')
    })
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기'
      case 'reviewing': return '검토중'
      case 'approved': return '승인'
      case 'rejected': return '반려'
      case 'completed': return '완료'
      default: return status
    }
  }

  const exportToExcel = () => {
    // 간단한 CSV 다운로드 구현
    const headers = ['이름', '이메일', '연락처', '주소', '상태', '모집인', '신청일']
    const csvContent = [
      headers.join(','),
      ...filteredApplicants.map(applicant =>
        [
          applicant.name,
          applicant.email,
          applicant.phone,
          `"${applicant.address}"`,
          applicant.status,
          applicant.recruiters?.name || '없음',
          new Date(applicant.submitted_at).toLocaleDateString('ko-KR')
        ].join(',')
      )
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `지원자목록_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <ManagerLayout title="지원자 관리" currentPage="applicants">
      <div className="space-y-6">
        {/* 상단 필터 및 액션 */}
        <Card>
          <CardHeader>
            <CardTitle>지원자 목록</CardTitle>
            <CardDescription>
              전체 {applicants.length}명의 지원자가 등록되어 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="이름, 이메일, 연락처로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="pending">대기</SelectItem>
                    <SelectItem value="reviewing">검토중</SelectItem>
                    <SelectItem value="approved">승인</SelectItem>
                    <SelectItem value="rejected">반려</SelectItem>
                    <SelectItem value="completed">완료</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={exportToExcel} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>

            {/* 지원자 테이블 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>모집인</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>신청일</TableHead>
                    <TableHead>위촉 마감일</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">데이터를 불러오는 중...</div>
                      </TableCell>
                    </TableRow>
                  ) : filteredApplicants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          {searchTerm || statusFilter !== 'all'
                            ? '검색 조건에 맞는 지원자가 없습니다.'
                            : '등록된 지원자가 없습니다.'
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplicants.map((applicant) => (
                      <TableRow key={applicant.id}>
                        <TableCell className="font-medium">
                          <div className="font-semibold">{applicant.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{applicant.phone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {applicant.recruiters?.name || '없음'}
                            </div>
                            {applicant.recruiters?.team && (
                              <div className="text-gray-500">{applicant.recruiters.team}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(applicant.status)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(applicant.submitted_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          <div className="w-36">
                            <DatePicker
                              id={`appointment-deadline-${applicant.id}`}
                              value={applicant.appointment_deadline || ''}
                              onChange={(date) => handleAppointmentDeadlineUpdate(applicant.id, date)}
                              placeholder="위촉 마감일 선택"
                              className="text-sm"
                              min={(() => {
                                const submittedDate = new Date(applicant.submitted_at);
                                const twoWeeksBefore = new Date(submittedDate.getTime() - 14 * 24 * 60 * 60 * 1000);
                                return twoWeeksBefore.toISOString().split('T')[0];
                              })()}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetail(applicant)}
                            >
                              상세
                            </Button>
                            {applicant.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusUpdate(applicant.id, 'reviewing')}
                                  disabled={updating === applicant.id}
                                >
                                  검토
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusUpdate(applicant.id, 'approved')}
                                  disabled={updating === applicant.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  승인
                                </Button>
                              </>
                            )}
                            {applicant.status === 'reviewing' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusUpdate(applicant.id, 'approved')}
                                  disabled={updating === applicant.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  승인
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleStatusUpdate(applicant.id, 'rejected')}
                                  disabled={updating === applicant.id}
                                >
                                  반려
                                </Button>
                              </>
                            )}
                            {applicant.status === 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(applicant.id, 'completed')}
                                disabled={updating === applicant.id}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                완료
                              </Button>
                            )}
                            {/* 삭제 버튼 - 관리자만 표시 */}
                            {(admin?.role === 'system_admin' || admin?.role === 'hr_manager') && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteClick(applicant)}
                                className="bg-red-600 hover:bg-red-700 text-white border border-red-600"
                                title="지원자 삭제"
                              >
                                삭제
                              </Button>
                            )}
                            {(applicant.status === 'rejected' || applicant.status === 'completed') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(applicant.id, 'pending')}
                                disabled={updating === applicant.id}
                              >
                                재검토
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: '전체', count: applicants.length, color: 'bg-gray-100' },
            { label: '대기', count: applicants.filter(a => a.status === 'pending').length, color: 'bg-yellow-100' },
            { label: '검토중', count: applicants.filter(a => a.status === 'reviewing').length, color: 'bg-blue-100' },
            { label: '승인', count: applicants.filter(a => a.status === 'approved').length, color: 'bg-green-100' },
            { label: '완료', count: applicants.filter(a => a.status === 'completed').length, color: 'bg-purple-100' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className={`p-4 ${stat.color}`}>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stat.count}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 상세보기 모달 */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  지원자 상세 정보
                </div>
                {!isEditing && !showRecruiterEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartEdit}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    정보 수정
                  </Button>
                )}
              </DialogTitle>
            </DialogHeader>
            {selectedApplicant && (
              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-500">이름</span>
                    </div>
                    <div className="text-lg font-semibold">{selectedApplicant.name}</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-500">이메일</span>
                    </div>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editingData.email || ''}
                        onChange={(e) => handleEditFieldChange('email', e.target.value)}
                        className="text-lg"
                      />
                    ) : (
                      <div className="text-lg break-all">{selectedApplicant.email}</div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-500">연락처</span>
                    </div>
                    {isEditing ? (
                      <Input
                        value={editingData.phone || ''}
                        onChange={(e) => handleEditFieldChange('phone', e.target.value)}
                        className="text-lg"
                      />
                    ) : (
                      <div className="text-lg">{selectedApplicant.phone}</div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-500">신청일</span>
                    </div>
                    <div className="text-lg">
                      {new Date(selectedApplicant.submitted_at).toLocaleString('ko-KR')}
                    </div>
                  </div>
                </div>

                {/* 주소 정보 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-500">주소</span>
                  </div>
                  {isEditing ? (
                    <Input
                      value={editingData.address || ''}
                      onChange={(e) => handleEditFieldChange('address', e.target.value)}
                      className="text-lg"
                    />
                  ) : (
                    <div className="text-lg p-3 bg-gray-50 rounded-lg">
                      {selectedApplicant.address}
                    </div>
                  )}
                </div>

                {/* 모집인 정보 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-500">모집인</span>
                  </div>
                  <div className="text-lg">
                    {selectedApplicant.recruiters?.name ? (
                      <div>
                        <div className="font-medium">{selectedApplicant.recruiters.name}</div>
                        {selectedApplicant.recruiters.team && (
                          <div className="text-gray-600">
                            {selectedApplicant.recruiters.team}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">없음</span>
                    )}
                  </div>
                </div>

                {/* 주민등록번호 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">생년월일</span>
                  </div>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editingData.birth_date || ''}
                      onChange={(e) => handleEditFieldChange('birth_date', e.target.value)}
                      className="text-lg"
                    />
                  ) : (
                    <div className="text-lg">
                      {selectedApplicant.birth_date ? new Date(selectedApplicant.birth_date).toLocaleDateString('ko-KR') : '없음'}
                    </div>
                  )}
                </div>

                {/* 주민등록번호 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">주민등록번호</span>
                  </div>
                  <div className="text-lg">
                    {selectedApplicant.resident_number ? '***************' : '없음'}
                  </div>
                </div>

                {/* 은행 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">은행명</span>
                    </div>
                    {isEditing ? (
                      <BankSelect
                        label=""
                        value={editingData.bank_name || ''}
                        onChange={(value) => handleEditFieldChange('bank_name', value)}
                      />
                    ) : (
                      <div className="text-lg">{selectedApplicant.bank_name || '없음'}</div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">계좌번호</span>
                    </div>
                    {isEditing ? (
                      <Input
                        value={editingData.bank_account || ''}
                        onChange={(e) => handleEditFieldChange('bank_account', e.target.value)}
                        placeholder="계좌번호"
                        className="text-lg"
                      />
                    ) : (
                      <div className="text-lg">{selectedApplicant.bank_account || '없음'}</div>
                    )}
                  </div>
                </div>

                {/* 학력 정보 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">최종학교</span>
                  </div>
                  <div className="text-lg">{selectedApplicant.final_school || '없음'}</div>
                </div>

                {/* 보험 관련 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">생명보험합격일</span>
                    </div>
                    {isEditing ? (
                      <DatePicker
                        value={editingData.life_insurance_pass_date || ''}
                        onChange={(date) => handleEditFieldChange('life_insurance_pass_date', date)}
                        className="text-lg"
                      />
                    ) : (
                      <div className="text-lg">
                        {selectedApplicant.life_insurance_pass_date ?
                          new Date(selectedApplicant.life_insurance_pass_date).toLocaleDateString('ko-KR') :
                          '없음'
                        }
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">생명교육이수일</span>
                    </div>
                    {isEditing ? (
                      <DatePicker
                        value={editingData.life_education_date || ''}
                        onChange={(date) => handleEditFieldChange('life_education_date', date)}
                        className="text-lg"
                      />
                    ) : (
                      <div className="text-lg">
                        {selectedApplicant.life_education_date ?
                          new Date(selectedApplicant.life_education_date).toLocaleDateString('ko-KR') :
                          '없음'
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* 서류 확인 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">서류 확인</span>
                    </div>
                    <div className="text-lg">
                      <Badge variant={selectedApplicant.documents_confirmed ? 'default' : 'secondary'}>
                        {selectedApplicant.documents_confirmed ? '확인완료' : '미확인'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">서류 준비 예정일</span>
                    </div>
                    <div className="text-lg">
                      {selectedApplicant.document_preparation_date ?
                        new Date(selectedApplicant.document_preparation_date).toLocaleDateString('ko-KR') :
                        '없음'
                      }
                    </div>
                  </div>
                </div>

                {/* 위촉 마감일 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">위촉 마감일</span>
                  </div>
                  <div className="text-lg">
                    {selectedApplicant.appointment_deadline ?
                      new Date(selectedApplicant.appointment_deadline).toLocaleDateString('ko-KR') :
                      '없음'
                    }
                  </div>
                </div>

                {/* 편집 모드 버튼들 */}
                {isEditing && (
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={savingEdit}
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                    >
                      {savingEdit ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                )}

                {/* 신입/경력 구분 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">신입/경력 여부</span>
                  </div>
                  <div className="text-lg">
                    <Badge variant={selectedApplicant.applicant_type === 'new' ? 'secondary' : 'outline'}>
                      {selectedApplicant.applicant_type === 'new' ? '신입' : '경력'}
                    </Badge>
                  </div>
                </div>

                {/* 경력 정보 (경력자인 경우에만 표시) */}
                {selectedApplicant.applicant_type === 'experienced' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-500">경력 정보</span>
                    </div>
                    {loadingCareerData ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <div className="text-sm text-gray-600 mt-2">경력 정보를 불러오는 중...</div>
                      </div>
                    ) : careerData.length > 0 ? (
                      <div className="space-y-3">
                        {careerData.map((career) => (
                          <div key={career.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">회사명:</span>{' '}
                                <span>{career.company}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">직책:</span>{' '}
                                <span>{career.position}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">근무기간:</span>{' '}
                                <span>
                                  {new Date(career.start_date).toLocaleDateString('ko-KR')} ~ {new Date(career.end_date).toLocaleDateString('ko-KR')}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">회사유형:</span>{' '}
                                <Badge variant="outline">
                                  {career.company_type === 'insurance' ? '보험회사' : '금융회사'}
                                </Badge>
                              </div>
                              {career.termination_status && (
                                <>
                                  <div>
                                    <span className="font-medium text-gray-700">말소 처리:</span>{' '}
                                    <Badge
                                      variant={
                                        career.termination_status === 'completed' ? 'default' :
                                        career.termination_status === 'in_progress' ? 'secondary' : 'destructive'
                                      }
                                    >
                                      {career.termination_status === 'completed' ? '완료' :
                                       career.termination_status === 'in_progress' ? '진행중' : '도움 필요'}
                                    </Badge>
                                  </div>
                                  {career.termination_date && (
                                    <div>
                                      <span className="font-medium text-gray-700">말소 예정일:</span>{' '}
                                      <span>{new Date(career.termination_date).toLocaleDateString('ko-KR')}</span>
                                    </div>
                                  )}
                                </>
                              )}
                              {career.description && (
                                <div className="md:col-span-2">
                                  <span className="font-medium text-gray-700">설명:</span>{' '}
                                  <span>{career.description}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        등록된 경력 정보가 없습니다.
                      </div>
                    )}
                  </div>
                )}

                {/* 상태 정보 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">처리 상태</span>
                  </div>
                  <div>
                    {getStatusBadge(selectedApplicant.status)}
                  </div>
                </div>


                {/* 생명보험 시험 신청 내역 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">생명보험 시험 신청 내역</span>
                  </div>
                  {loadingExamApplications ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <div className="text-sm text-gray-600 mt-2">로딩 중...</div>
                    </div>
                  ) : examApplications.length > 0 ? (
                    <div className="space-y-3">
                      {examApplications.map((exam) => (
                        <div key={exam.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">시험 종류:</span>{' '}
                              <span>{exam.exam_type}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">차수:</span>{' '}
                              <span>{exam.exam_round || '미정'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">시험일:</span>{' '}
                              <span>{exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('ko-KR') : '미정'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">시험장소:</span>{' '}
                              <span>{exam.exam_location || '미정'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">신청일:</span>{' '}
                              <span>{new Date(exam.application_date).toLocaleDateString('ko-KR')}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">상태:</span>{' '}
                              <Badge
                                variant={
                                  exam.status === 'confirmed' ? 'default' :
                                  exam.status === 'completed' ? 'outline' :
                                  exam.status === 'cancelled' ? 'destructive' : 'secondary'
                                }
                              >
                                {exam.status === 'pending' ? '신청대기' :
                                 exam.status === 'confirmed' ? '접수완료' :
                                 exam.status === 'cancelled' ? '취소됨' : '시험완료'}
                              </Badge>
                            </div>
                            {exam.notes && (
                              <div className="md:col-span-2">
                                <span className="font-medium text-gray-700">메모:</span>{' '}
                                <span>{exam.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      시험 신청 내역이 없습니다.
                    </div>
                  )}
                </div>

                {/* 도입자 수정 */}
                {showRecruiterEdit ? (
                  <div className="pt-4 border-t space-y-3">
                    <h4 className="font-medium">도입자 수정</h4>
                    <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
                      <SelectTrigger>
                        <SelectValue placeholder="도입자를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">없음</SelectItem>
                        {recruiters
                          .filter((recruiter) => recruiter.name && recruiter.name.trim() !== '')
                          .map((recruiter) => (
                            <SelectItem key={recruiter.id} value={recruiter.name}>
                              {recruiter.name} ({recruiter.team})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button onClick={handleRecruiterUpdate} className="flex-1">
                        저장
                      </Button>
                      <Button onClick={() => setShowRecruiterEdit(false)} variant="outline" className="flex-1">
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={handleRecruiterEdit} className="flex-1" variant="outline">
                      도입자 수정
                    </Button>
                    <Button
                      onClick={async () => await copyApplicantInfo(selectedApplicant)}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      총무팀 정보 복사
                    </Button>
                    <Button
                      onClick={handleCloseDetail}
                      variant="outline"
                    >
                      <X className="h-4 w-4 mr-2" />
                      닫기
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 삭제 확인 모달 */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                지원자 삭제 확인
              </DialogTitle>
              <DialogDescription>
                정말 이 지원자를 삭제하시겠습니까?
                {applicantToDelete && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="font-medium">지원자: {applicantToDelete.name}</p>
                    <p className="text-sm text-gray-600">이메일: {applicantToDelete.email}</p>
                    <p className="text-sm text-gray-600">전화번호: {applicantToDelete.phone}</p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="delete-reason">
                  삭제 사유 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="delete-reason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="삭제 사유를 입력해주세요 (필수)"
                  className="min-h-[100px]"
                />
              </div>
              <div className="text-sm text-gray-500">
                ⚠️ 삭제된 데이터는 복구가 가능하나, 기록은 남습니다.
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setApplicantToDelete(null)
                  setDeleteReason('')
                }}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteApplicant}
                disabled={!deleteReason.trim() || deleting}
              >
                {deleting ? '삭제 중...' : '삭제'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ManagerLayout>
  )
}