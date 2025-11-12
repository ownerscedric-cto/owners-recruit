"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MultiStepDynamicForm } from "@/components/forms/multi-step-dynamic-form"
import { createApplicant, checkDuplicateApplicant, ApplicantFormData } from "@/lib/applicants"
import { Header } from "@/components/shared/header"
import { Check, AlertCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function NewDynamicApplicantPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [duplicateData, setDuplicateData] = useState<{name: string, phone: string, status: string} | null>(null)

  const handleGoToStatus = () => {
    if (duplicateData) {
      const params = new URLSearchParams({
        name: duplicateData.name,
        phone: duplicateData.phone
      })
      router.push(`/applicant/status?${params.toString()}`)
    }
  }

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      // Check for duplicates if name and phone are provided
      if (formData.name && formData.phone) {
        const duplicateResult = await checkDuplicateApplicant(formData.name, formData.phone)
        if (duplicateResult.success && duplicateResult.isDuplicate) {
          setDuplicateData({
            name: formData.name,
            phone: formData.phone,
            status: duplicateResult.applicant?.status || '알 수 없음'
          })
          setIsDuplicate(true)
          return
        }
      }

      setIsSubmitting(true)
      setSubmitError(null)

      // Convert form data to applicant format
      const applicantData: ApplicantFormData = {
        name: formData.name || '',
        phone: formData.phone || '',
        email: formData.email || '',
        address: formData.address || '',
        birth_date: formData.birth_date || '',
        ...formData,
        applicant_type: 'new' as const,
        // Convert date fields if they exist
        life_insurance_pass_date: formData.life_insurance_pass_date || undefined,
        life_education_date: formData.life_education_date || undefined,
        document_preparation_date: formData.document_preparation_date || undefined,
      }

      const result = await createApplicant(applicantData)

      if (!result.success) {
        setSubmitError(result.error || '신청 등록에 실패했습니다.')
        return
      }

      setIsSubmitted(true)
      console.log('지원자 등록 성공:', result.data)
    } catch (error) {
      console.error('신청 중 오류:', error)
      setSubmitError('시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 중복 신청자 발견 시 UI
  if (isDuplicate && duplicateData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          title="입사 신청 확인"
          showBackButton
          backUrl="/applicant/apply"
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-700">
                <AlertCircle className="mr-2 h-6 w-6" />
                이미 신청하신 이력이 있습니다
              </CardTitle>
              <CardDescription className="text-amber-600">
                동일한 이름과 연락처로 신청된 내역을 발견했습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <h4 className="font-medium text-gray-900 mb-2">신청자 정보</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">이름:</span> {duplicateData.name}</p>
                  <p><span className="font-medium">연락처:</span> {duplicateData.phone}</p>
                  <p><span className="font-medium">현재 상태:</span>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {duplicateData.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>진행 상황을 확인하시겠습니까?</strong>
                  <br />
                  현재 신청 상태와 다음 단계를 확인할 수 있습니다.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleGoToStatus}
                  className="flex-1"
                >
                  진행 상황 확인하기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDuplicate(false)}
                  className="flex-1"
                >
                  돌아가기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          title="신입자 입사 신청 완료"
          showBackButton
          backUrl="/applicant/apply"
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">
                  신입자 입사 신청이 완료되었습니다!
                </h3>
                <p className="text-gray-600 mb-6">
                  신청 정보가 성공적으로 등록되었습니다.
                  <br />
                  서류 제출 링크는 본사에서 별도로 발송됩니다.
                </p>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => (window.location.href = "/applicant/status")}
                  >
                    진행 상황 확인
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => (window.location.href = "/")}
                  >
                    홈으로 돌아가기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="신입자 입사 신청 (단계별 동적 폼)"
        showBackButton
        backUrl="/applicant/apply"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <MultiStepDynamicForm
          onSubmit={handleSubmit}
          applicantType="new"
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </div>
    </div>
  )
}