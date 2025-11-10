// 지원자 상태
export type ApplicantStatus =
  | 'pending'    // 대기
  | 'reviewing'  // 검토중
  | 'approved'   // 승인
  | 'rejected'   // 반려
  | 'completed'  // 완료

// 지원자 정보
export interface Applicant {
  id: string
  name: string
  email: string
  phone: string
  address: string
  birthDate: string
  status: ApplicantStatus
  recruiterId?: string
  submittedAt: Date
  updatedAt: Date
  documents?: Document[]
  career?: Career[]
  certificates?: Certificate[]
}

// 서류 정보
export interface Document {
  id: string
  name: string
  type: string
  url: string
  uploadedAt: Date
}

// 경력 정보
export interface Career {
  company: string
  position: string
  startDate: string
  endDate: string
  description?: string
}

// 자격증 정보
export interface Certificate {
  name: string
  issuer: string
  issueDate: string
  expiryDate?: string
}

// 모집인 정보
export interface Recruiter {
  id: string
  name: string
  email: string
  phone: string
  team?: string
}

// 대시보드 통계
export interface DashboardStats {
  totalApplicants: number
  pendingReview: number
  approved: number
  completed: number
  rejectedCount: number
}