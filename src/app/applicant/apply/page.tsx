'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/shared/header'
import {
  Users,
  Briefcase,
  ArrowRight,
  Calendar,
  FileCheck,
  Target
} from 'lucide-react'

type ApplicantType = 'new' | 'experienced' | null

export default function ApplicantApplyPage() {
  const [selectedType, setSelectedType] = useState<ApplicantType>(null)

  const handleTypeSelection = (type: ApplicantType) => {
    setSelectedType(type)
  }

  const handleNext = () => {
    if (selectedType === 'new') {
      window.location.href = '/applicant/apply/new'
    } else if (selectedType === 'experienced') {
      window.location.href = '/applicant/apply/experienced'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="입사 신청" showBackButton backUrl="/applicant/guide" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            입사 신청 유형 선택
          </h2>
          <p className="text-lg text-gray-600">
            신입과 경력자는 서로 다른 입사 절차와 필수 조건이 있습니다.<br />
            해당하는 유형을 선택하여 정확한 정보를 확인해주세요.
          </p>
        </div>


        {/* 유형 선택 카드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 신입자 카드 */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedType === 'new' ? 'ring-2 ring-green-500 shadow-lg' : ''
            }`}
            onClick={() => handleTypeSelection('new')}
          >
            <CardHeader className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                selectedType === 'new' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Users className={`h-8 w-8 ${
                  selectedType === 'new' ? 'text-green-600' : 'text-gray-600'
                }`} />
              </div>
              <CardTitle className="text-xl font-bold">신입자</CardTitle>
              <CardDescription className="text-center">
                보험업계 경력이 없거나<br />
                3년 이내 1년 경력이 없는 경우
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Target className="h-4 w-4 mr-2 text-green-500" />
                  <span>시험 신청 및 접수</span>
                </div>
                <div className="flex items-center text-sm">
                  <FileCheck className="h-4 w-4 mr-2 text-green-500" />
                  <span>신입자 교육 과정</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-green-500" />
                  <span>기초 교육 이수 필수</span>
                </div>
              </div>
              {selectedType === 'new' && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ 신입자로 선택되었습니다
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 경력자 카드 */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedType === 'experienced' ? 'ring-2 ring-purple-500 shadow-lg' : ''
            }`}
            onClick={() => handleTypeSelection('experienced')}
          >
            <CardHeader className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                selectedType === 'experienced' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <Briefcase className={`h-8 w-8 ${
                  selectedType === 'experienced' ? 'text-purple-600' : 'text-gray-600'
                }`} />
              </div>
              <CardTitle className="text-xl font-bold">경력자</CardTitle>
              <CardDescription className="text-center">
                보험업계에서<br />
                1년 이상의 경력이 있는 경우
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <FileCheck className="h-4 w-4 mr-2 text-purple-500" />
                  <span>이전 보험사 말소 확인</span>
                </div>
                <div className="flex items-center text-sm">
                  <Target className="h-4 w-4 mr-2 text-purple-500" />
                  <span>경력 증명서 제출</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                  <span>경력자 전환 교육</span>
                </div>
              </div>
              {selectedType === 'experienced' && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700 font-medium">
                    ✓ 경력자로 선택되었습니다
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 구분 기준 안내 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">신입/경력 구분 기준</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-green-700">신입자로 분류되는 경우</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• 보험업계 경력이 전혀 없는 경우</li>
                  <li>• 보험업계 경력이 1년 미만인 경우</li>
                  <li>• 3년 이내 보험업계 경력이 없는 경우</li>
                  <li>• 자격증은 있으나 실무 경력이 없는 경우</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-purple-700">경력자로 분류되는 경우</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• 보험업계에서 1년 이상 근무한 경우</li>
                  <li>• 다른 보험회사 재직 중인 경우</li>
                  <li>• 최근 3년 이내 보험업계 경력이 있는 경우</li>
                  <li>• 보험 관련 실무 경험이 충분한 경우</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 다음 버튼 */}
        <div className="text-center">
          <Button
            onClick={handleNext}
            disabled={!selectedType}
            className="px-8 py-3 text-lg"
            size="lg"
          >
            다음 단계로
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          {!selectedType && (
            <p className="text-sm text-gray-500 mt-2">
              신입자 또는 경력자를 선택해주세요
            </p>
          )}
        </div>
      </div>
    </div>
  )
}