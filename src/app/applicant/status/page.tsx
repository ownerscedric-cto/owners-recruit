'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/shared/header'
import { getApplicants } from '@/lib/applicants'
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  X,
  FileText,
  User,
  Calendar,
  MessageCircle,
  Search,
  Loader2
} from 'lucide-react'

interface ApplicantData {
  id: string
  name: string
  email: string
  phone: string
  status: string
  submitted_at: string
  recruiters?: {
    name: string
    team: string
  }
}

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
      return <Badge variant="default" className="bg-green-600">완료</Badge>
    default:
      return <Badge variant="outline">알 수 없음</Badge>
  }
}


const getStatusMessage = (status: string) => {
  switch (status) {
    case 'pending':
      return '신청서가 접수되었습니다. 담당자가 검토 후 연락드리겠습니다.'
    case 'reviewing':
      return '제출해 주신 서류를 검토하고 있습니다. 추가 서류가 필요한 경우 개별 연락드리겠습니다.'
    case 'approved':
      return '서류 검토가 완료되어 승인되었습니다. 다음 단계 안내를 위해 연락드리겠습니다.'
    case 'rejected':
      return '아쉽게도 이번 신청이 반려되었습니다. 상세한 사유는 개별 안내드렸습니다.'
    case 'completed':
      return '모든 절차가 완료되었습니다. 입사를 축하드리며, 교육 일정을 안내드리겠습니다.'
    default:
      return '현재 상태를 확인할 수 없습니다.'
  }
}

const getTimelineFromStatus = (status: string, createdAt: string) => {
  const steps = [
    { step: '신청 접수', description: '입사 신청서 제출 완료' },
    { step: '서류 검토', description: '제출 서류 검토 중' },
    { step: '승인 처리', description: '인사팀 승인 대기' },
    { step: '입사 완료', description: '시스템 등록 및 교육 안내' },
  ]

  const statusMap: Record<string, number> = {
    pending: 0,
    reviewing: 1,
    approved: 2,
    completed: 3,
    rejected: 1 // rejected shows up to reviewing step
  }

  const currentStepIndex = statusMap[status] ?? 0

  return steps.map((step, index) => ({
    ...step,
    status: index < currentStepIndex ? 'completed' :
           index === currentStepIndex ? 'current' : 'upcoming',
    date: index <= currentStepIndex ? createdAt : null
  }))
}

interface ContactSettings {
  email: string
  phone: string
  description: string
}

function ApplicantStatusContent() {
  const searchParams = useSearchParams()
  const [searchName, setSearchName] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [applicantData, setApplicantData] = useState<ApplicantData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactSettings, setContactSettings] = useState<ContactSettings | null>(null)

  // URL 파라미터 및 localStorage에서 이름과 전화번호 자동 설정
  useEffect(() => {
    const name = searchParams?.get('name') || localStorage.getItem('applicantSearchName')
    const phone = searchParams?.get('phone') || localStorage.getItem('applicantSearchPhone')

    if (name && phone) {
      setSearchName(name)
      setSearchPhone(phone)
      // localStorage에 저장
      localStorage.setItem('applicantSearchName', name)
      localStorage.setItem('applicantSearchPhone', phone)
      // 자동으로 검색 실행
      setTimeout(() => {
        handleSearchWithParams(name, phone)
      }, 100)
    }
  }, [searchParams])

  const fetchContactSettings = async () => {
    try {
      const response = await fetch('/api/contact')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setContactSettings(result.data)
        }
      }
    } catch (error) {
      // Failed to fetch contact settings
    }
  }

  const handleSearchWithParams = async (name: string, phone: string) => {
    if (!name.trim() || !phone.trim()) return

    setLoading(true)
    setError(null)
    setApplicantData(null)
    setHasSearched(true)

    try {
      const result = await getApplicants()
      if (result.success && result.data) {
        const cleanSearchName = name.trim()
        const cleanSearchPhone = phone.replace(/[^0-9]/g, '')

        const foundApplicant = result.data.find((applicant: any) => {
          const cleanApplicantPhone = applicant.phone.replace(/[^0-9]/g, '')
          return applicant.name === cleanSearchName && cleanApplicantPhone === cleanSearchPhone
        })

        if (foundApplicant) {
          setApplicantData(foundApplicant)
          // 성공적으로 찾은 경우 localStorage에 저장
          localStorage.setItem('applicantSearchName', cleanSearchName)
          localStorage.setItem('applicantSearchPhone', cleanSearchPhone)
        } else {
          setError('입력하신 이름과 연락처가 일치하는 지원자를 찾을 수 없습니다.')
        }
      } else {
        setError('지원자 정보를 불러오는 중 오류가 발생했습니다.')
      }
    } catch (error) {
      setError('시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchName.trim() || !searchPhone.trim()) {
      setError('이름과 연락처를 모두 입력해주세요.')
      return
    }

    setLoading(true)
    setError(null)
    setApplicantData(null)
    setHasSearched(true)

    try {
      const result = await getApplicants()
      if (result.success && result.data) {
        // 이름과 전화번호가 모두 일치하는 지원자 찾기
        const cleanSearchName = searchName.trim() // 이름 앞뒤 공백 제거
        const cleanSearchPhone = searchPhone.replace(/[^0-9]/g, '')

        const foundApplicant = result.data.find((applicant: any) => {
          const cleanApplicantPhone = applicant.phone.replace(/[^0-9]/g, '')
          const nameMatch = applicant.name === cleanSearchName // trim된 이름으로 비교
          const phoneMatch = cleanApplicantPhone === cleanSearchPhone


          return nameMatch && phoneMatch
        })

        if (foundApplicant) {
          setApplicantData(foundApplicant)
          // 성공적으로 찾은 경우 localStorage에 저장
          localStorage.setItem('applicantSearchName', cleanSearchName)
          localStorage.setItem('applicantSearchPhone', cleanSearchPhone)
        } else {
          setError('입력하신 이름과 연락처가 일치하는 지원자를 찾을 수 없습니다. 정확한 정보를 입력해주세요.')
        }
      } else {
        setError('지원자 정보를 불러오는 중 오류가 발생했습니다.')
      }
    } catch (error) {
      setError('시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const timeline = applicantData ? getTimelineFromStatus(applicantData.status, applicantData.submitted_at) : []
  const currentStep = timeline.findIndex(step => step.status === 'current') + 1

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="진행 상황 확인" showBackButton backUrl="/applicant/guide" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 폼 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-6 w-6 text-blue-600" />
              지원자 조회
            </CardTitle>
            <CardDescription>
              동명이인을 구분하기 위해 이름과 연락처를 모두 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="searchName">이름 <span className="text-red-500">*</span></Label>
                <Input
                  id="searchName"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="홍길동"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <Label htmlFor="searchPhone">연락처 <span className="text-red-500">*</span></Label>
                <Input
                  id="searchPhone"
                  inputMode="numeric"
                  value={searchPhone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '')
                    if (cleaned.length <= 11) {
                      setSearchPhone(cleaned)
                    }
                  }}
                  placeholder="010-1234-5678"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      검색 중...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      검색
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 오류 메시지 */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 검색 결과 없음 */}
        {hasSearched && !applicantData && !error && !loading && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  지원자 정보를 찾을 수 없습니다
                </h3>
                <p className="text-gray-500">
                  정확한 이름과 연락처를 입력해주세요.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 지원자 정보 */}
        {applicantData && (
          <>
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <User className="mr-2 h-6 w-6 text-blue-600" />
                        지원자 정보
                      </CardTitle>
                    </div>
                    {getStatusBadge(applicantData.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">이름</span>
                      <p className="font-medium">{applicantData.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">이메일</span>
                      <p className="font-medium">{applicantData.email}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">연락처</span>
                      <p className="font-medium">{applicantData.phone}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">담당 모집인</span>
                      <p className="font-medium">
                        {applicantData.recruiters?.name || '없음'}
                      </p>
                      {applicantData.recruiters?.team && (
                        <p className="text-sm text-gray-500">{applicantData.recruiters.team}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-sm text-gray-500">신청일시</span>
                      <p className="font-medium">
                        {new Date(applicantData.submitted_at).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 진행 상황 타임라인 */}
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-6 w-6 text-blue-600" />
                    진행 상황
                  </CardTitle>
                  <CardDescription>
                    현재 단계: {currentStep || 1}/{timeline.length}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {getStatusMessage(applicantData.status)}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {timeline.map((item, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {item.status === 'completed' && (
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                          {item.status === 'current' && (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Clock className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          {item.status === 'upcoming' && (
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium ${
                            item.status === 'current' ? 'text-blue-600' :
                            item.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {item.step}
                          </h4>
                          <p className="text-sm text-gray-500">{item.description}</p>
                          {item.date && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(item.date).toLocaleString('ko-KR')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 다음 단계 안내 */}
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-6 w-6 text-blue-600" />
                    다음 단계 안내
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {applicantData.status === 'pending' && (
                      <p className="text-sm text-gray-600">
                        담당자가 신청서를 검토 중입니다. 추가 서류가 필요한 경우 연락드리겠습니다.
                      </p>
                    )}
                    {applicantData.status === 'reviewing' && (
                      <p className="text-sm text-gray-600">
                        서류 검토가 진행 중입니다. 검토 완료 후 승인 여부를 안내드리겠습니다.
                      </p>
                    )}
                    {applicantData.status === 'approved' && (
                      <p className="text-sm text-gray-600">
                        축하합니다! 서류가 승인되었습니다. 입사 관련 세부 사항을 안내드리기 위해 곧 연락드리겠습니다.
                      </p>
                    )}
                    {applicantData.status === 'rejected' && (
                      <p className="text-sm text-gray-600">
                        이번 신청이 아쉽게도 반려되었습니다. 자세한 사유는 개별 연락을 통해 안내드렸습니다.
                      </p>
                    )}
                    {applicantData.status === 'completed' && (
                      <p className="text-sm text-gray-600">
                        모든 절차가 완료되었습니다! 입사를 축하드리며, 교육 일정 등 세부사항을 안내드리겠습니다.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 문의 안내 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Card className="flex-1">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium mb-2">문의사항이 있으시다면?</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      진행 과정에서 궁금한 사항이 있으시면 언제든지 연락해 주세요.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        fetchContactSettings()
                        setShowContactModal(true)
                      }}
                    >
                      문의하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* 문의하기 모달 */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">문의하기</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContactModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {contactSettings ? (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm mb-4">
                  {contactSettings.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">이메일</div>
                      <div className="text-sm text-gray-500">{contactSettings.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">전화번호</div>
                      <div className="text-sm text-gray-500">{contactSettings.phone}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-gray-500">연락처 정보를 불러오는 중...</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ApplicantStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>페이지를 로드하는 중...</p>
      </div>
    </div>}>
      <ApplicantStatusContent />
    </Suspense>
  )
}