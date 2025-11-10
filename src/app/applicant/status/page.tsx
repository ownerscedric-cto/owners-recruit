import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/shared/header'
import {
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Download,
  Eye,
  MessageCircle
} from 'lucide-react'

// 더미 데이터
const applicantData = {
  id: 'APP-2024-001',
  name: '홍길동',
  email: 'hong@example.com',
  phone: '010-1234-5678',
  submittedAt: '2024-11-10T09:00:00Z',
  status: 'reviewing' as const,
  currentStep: 2,
  totalSteps: 4,
  documents: [
    { name: '주민등록등본', status: 'approved', uploadedAt: '2024-11-10T09:05:00Z' },
    { name: '증명사진', status: 'approved', uploadedAt: '2024-11-10T09:10:00Z' },
    { name: '경력증명서', status: 'pending', uploadedAt: '2024-11-10T09:15:00Z' },
    { name: '말소확인증', status: 'rejected', uploadedAt: '2024-11-10T09:20:00Z', reason: '발급일자가 3개월을 초과했습니다.' },
  ],
  timeline: [
    { step: '신청 접수', status: 'completed', date: '2024-11-10T09:00:00Z', description: '입사 신청서 제출 완료' },
    { step: '서류 검토', status: 'current', date: '2024-11-10T10:00:00Z', description: '제출 서류 검토 중' },
    { step: '승인 처리', status: 'upcoming', date: null, description: '인사팀 승인 대기' },
    { step: '입사 완료', status: 'upcoming', date: null, description: '시스템 등록 및 교육 안내' },
  ],
  messages: [
    {
      id: 1,
      from: '인사팀',
      message: '말소확인증을 재발급받아 다시 제출해주세요.',
      createdAt: '2024-11-10T14:30:00Z',
      isRead: false
    },
    {
      id: 2,
      from: '시스템',
      message: '입사 신청서가 성공적으로 제출되었습니다.',
      createdAt: '2024-11-10T09:00:00Z',
      isRead: true
    }
  ]
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

const getDocumentStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'rejected':
      return <AlertCircle className="h-5 w-5 text-red-600" />
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-600" />
    default:
      return <FileText className="h-5 w-5 text-gray-400" />
  }
}

export default function ApplicantStatusPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="진행 상황 확인" showBackButton backUrl="/applicant/guide" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 지원자 정보 */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-6 w-6 text-blue-600" />
                    지원자 정보
                  </CardTitle>
                  <CardDescription>신청번호: {applicantData.id}</CardDescription>
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
                <div className="md:col-span-3">
                  <span className="text-sm text-gray-500">신청일시</span>
                  <p className="font-medium">
                    {new Date(applicantData.submittedAt).toLocaleString('ko-KR')}
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
                현재 단계: {applicantData.currentStep}/{applicantData.totalSteps}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applicantData.timeline.map((item, index) => (
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

        {/* 제출 서류 상태 */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-6 w-6 text-blue-600" />
                제출 서류 상태
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applicantData.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getDocumentStatusIcon(doc.status)}
                      <div>
                        <h4 className="font-medium">{doc.name}</h4>
                        <p className="text-sm text-gray-500">
                          업로드: {new Date(doc.uploadedAt).toLocaleString('ko-KR')}
                        </p>
                        {doc.status === 'rejected' && doc.reason && (
                          <p className="text-sm text-red-600 mt-1">{doc.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        보기
                      </Button>
                      {doc.status === 'rejected' && (
                        <Button size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          재제출
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 메시지 */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="mr-2 h-6 w-6 text-blue-600" />
                메시지
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applicantData.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      message.isRead
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{message.from}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{message.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1">
            문의하기
          </Button>
          <Button variant="outline" className="flex-1">
            지원서 수정
          </Button>
        </div>
      </div>
    </div>
  )
}