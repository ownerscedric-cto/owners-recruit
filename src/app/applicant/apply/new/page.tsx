"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/shared/header";
import { AddressSearch } from "@/components/forms/address-search";
import { BankSelect } from "@/components/forms/bank-select";
import { DocumentGuide } from "@/components/forms/document-guide";
import { DocumentSummary } from "@/components/forms/document-summary";
import { DatePicker } from "@/components/ui/date-picker";
import {
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  GraduationCap,
  FileText,
  Check,
  AlertCircle,
  Calendar,
  Users,
} from "lucide-react";

interface NewApplicantFormData {
  // 기본 정보
  name: string;
  residentNumber: string;
  address: string;
  phone: string;
  email: string;
  bankAccount: string;
  bankName: string;

  // 보험 관련
  lifeInsurancePassDate: string;
  lifeEducationDate: string;

  // 학력
  finalSchool: string;

  // 서류 준비 확인
  documentsConfirmed: boolean;
  documentPreparationDate: string;

  // 모집자
  recruiterName: string;
}

const steps = [
  { id: 1, name: "기본정보", icon: User },
  { id: 2, name: "주소/연락처", icon: MapPin },
  { id: 3, name: "학력/자격", icon: GraduationCap },
  { id: 4, name: "서류안내", icon: FileText },
  { id: 5, name: "완료", icon: Check },
];

export default function NewApplicantPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<NewApplicantFormData>({
    name: "",
    residentNumber: "",
    address: "",
    phone: "",
    email: "",
    bankAccount: "",
    bankName: "",
    lifeInsurancePassDate: "",
    lifeEducationDate: "",
    finalSchool: "",
    documentsConfirmed: false,
    documentPreparationDate: "",
    recruiterName: "",
  });

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    // 4단계(서류안내)에서 검증
    if (currentStep === 4) {
      if (!formData.documentsConfirmed) {
        alert("필수 서류를 확인했는지 체크해주세요.");
        return;
      }
      if (!formData.documentPreparationDate) {
        alert("서류 준비 완료 예정일을 선택해주세요.");
        return;
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "documentsConfirmed" ? value === "true" : value,
    }));
  };

  const formatResidentNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 6) {
      return numbers;
    }
    return numbers.slice(0, 6) + "-" + numbers.slice(6, 13);
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 3) {
      return numbers;
    }
    if (numbers.length <= 7) {
      return numbers.slice(0, 3) + "-" + numbers.slice(3);
    }
    return (
      numbers.slice(0, 3) +
      "-" +
      numbers.slice(3, 7) +
      "-" +
      numbers.slice(7, 11)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="신입자 입사 신청"
        showBackButton
        backUrl="/applicant/apply"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-600" />
              신입자 신청 진행 상황
            </h2>
            <span className="text-sm text-gray-500">
              {currentStep}/{steps.length} 단계
            </span>
          </div>
          <Progress value={progress} className="h-2" />

          <div className="flex justify-between mt-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : isCurrent
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-gray-200 border-gray-300 text-gray-400"
                    }`}
                  >
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs mt-2 text-center ${
                      isCurrent ? "text-blue-600 font-medium" : "text-gray-500"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1]?.name}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "기본 개인정보를 입력해주세요."}
              {currentStep === 2 && "주소 및 연락처 정보를 입력해주세요."}
              {currentStep === 3 && "학력 및 자격증 정보를 입력해주세요."}
              {currentStep === 4 &&
                "입사에 필요한 서류를 확인하시고 준비 계획을 세워주세요."}
              {currentStep === 5 && "신입자 입사 신청이 완료되었습니다."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: 기본정보 */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="홍길동"
                    />
                  </div>
                  <div>
                    <Label htmlFor="residentNumber">주민등록번호 *</Label>
                    <Input
                      id="residentNumber"
                      value={formData.residentNumber}
                      onChange={(e) =>
                        handleInputChange(
                          "residentNumber",
                          formatResidentNumber(e.target.value)
                        )
                      }
                      placeholder="000000-0000000"
                      maxLength={14}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recruiterName">도입자(모집자)명 *</Label>
                    <Input
                      id="recruiterName"
                      value={formData.recruiterName}
                      onChange={(e) =>
                        handleInputChange("recruiterName", e.target.value)
                      }
                      placeholder="김모집"
                    />
                  </div>
                  <BankSelect
                    label="은행명"
                    value={formData.bankName}
                    onChange={(value) => handleInputChange("bankName", value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="bankAccount">계좌번호 *</Label>
                  <Input
                    id="bankAccount"
                    value={formData.bankAccount}
                    onChange={(e) =>
                      handleInputChange("bankAccount", e.target.value)
                    }
                    placeholder="123456-12-123456"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    급여 입금용 계좌를 입력해주세요.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: 주소/연락처 */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <AddressSearch
                  label="자택주소"
                  value={formData.address}
                  onChange={(address) => handleInputChange("address", address)}
                  required
                  description="주민등록등본상의 주소와 동일하게 입력해주세요."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">휴대폰 번호 *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange(
                          "phone",
                          formatPhoneNumber(e.target.value)
                        )
                      }
                      placeholder="010-1234-5678"
                      maxLength={13}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">이메일 *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="hong@example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: 학력/자격 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="finalSchool">학력 (최종학교명) *</Label>
                  <Input
                    id="finalSchool"
                    value={formData.finalSchool}
                    onChange={(e) =>
                      handleInputChange("finalSchool", e.target.value)
                    }
                    placeholder="○○대학교 또는 ○○고등학교"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    최종 졸업한 학교명을 입력해주세요.
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    보험 자격 정보
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lifeInsurancePassDate">
                        생명보험 합격 예정일 *
                      </Label>
                      <DatePicker
                        id="lifeInsurancePassDate"
                        value={formData.lifeInsurancePassDate}
                        onChange={(date) =>
                          handleInputChange("lifeInsurancePassDate", date)
                        }
                        placeholder="생명보험 합격 예정일 선택"
                      />
                      <p className="text-xs text-green-600 mt-1">
                        생명보험 시험 응시 또는 합격 예정일을 선택해주세요
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="lifeEducationDate">
                        생명교육 이수 예정일 *
                      </Label>
                      <DatePicker
                        id="lifeEducationDate"
                        value={formData.lifeEducationDate}
                        onChange={(date) =>
                          handleInputChange("lifeEducationDate", date)
                        }
                        placeholder="생명교육 이수 예정일 선택"
                      />
                      <p className="text-xs text-green-600 mt-1">
                        보험연수원 교육 수강 또는 이수 예정일을 선택해주세요
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: 서류안내 */}
            {currentStep === 4 && (
              <DocumentGuide
                type="new"
                documentsConfirmed={formData.documentsConfirmed}
                documentPreparationDate={formData.documentPreparationDate}
                onDocumentsConfirmedChange={(confirmed) =>
                  handleInputChange("documentsConfirmed", confirmed.toString())
                }
                onPreparationDateChange={(date) =>
                  handleInputChange("documentPreparationDate", date)
                }
              />
            )}

            {/* Step 5: 완료 */}
            {currentStep === 5 && (
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

                {formData.documentPreparationDate && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
                    <h4 className="font-semibold text-blue-700 mb-2">
                      📅 서류 준비 예정일
                    </h4>
                    <p className="text-sm text-blue-600">
                      {new Date(
                        formData.documentPreparationDate
                      ).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "long",
                      })}
                      까지 서류를 준비해주세요.
                    </p>
                  </div>
                )}

                <div className="bg-green-50 p-4 rounded-lg mb-6 text-left">
                  <h4 className="font-semibold text-green-700 mb-2">
                    다음 단계 안내
                  </h4>
                  <ul className="text-sm text-green-600 space-y-1">
                    <li>• 서류 제출 링크 발송 (본사)</li>
                    <li>• 필수 서류 제출</li>
                    <li>• 서류 검토 및 승인</li>
                    <li>• 시험 일정 안내</li>
                    <li>• 교육 과정 진행</li>
                    <li>• 위촉 절차 완료</li>
                  </ul>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg mb-6 text-left">
                  <h4 className="font-semibold text-amber-700 mb-2">
                    📋 준비할 필수 서류
                  </h4>
                  <p className="text-sm text-amber-700 mb-3">
                    서류 제출 링크 수신 전까지 아래 서류들을 미리 준비해주세요.
                    <br />
                    각 서류별 링크를 클릭하여 발급받으실 수 있습니다.
                  </p>
                  <DocumentSummary type="new" />
                </div>

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
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        {currentStep < 5 && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              이전
            </Button>
            <Button onClick={handleNext}>
              다음
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
