"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createApplicant, checkDuplicateApplicant } from "@/lib/applicants";
import { createExamApplication } from "@/lib/exam-applications";
import { encryptResidentNumber } from "@/lib/encryption";
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
import { RecruiterSelect } from "@/components/forms/recruiter-select";
import { DocumentGuide } from "@/components/forms/document-guide";
import { DocumentSummary } from "@/components/forms/document-summary";
// import { DatePicker } from "@/components/ui/date-picker"; // 추후 복구용으로 주석 처리
import {
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  FileText,
  Check,
  AlertCircle,
  Calendar,
  Users,
  Clock,
} from "lucide-react";

// 시험 일정 인터페이스
interface ExamSchedule {
  id: string;
  year: number;
  exam_type: string;
  session_number: number;
  exam_date: string;
  locations: string[];
  has_internal_deadline: boolean;
  internal_deadline_date?: string;
  internal_deadline_time?: string;
}

interface NewApplicantFormData {
  // 기본 정보
  name: string;
  residentNumber: string;
  address: string;
  phone: string;
  email: string;
  bankAccount: string;
  bankName: string;

  // 학력 (2단계로 이동)
  finalSchool: string;

  // 시험 관련 (3단계에 추가)
  examRegion: string;
  selectedScheduleId: string;

  // 보험 관련
  lifeInsurancePassDate: string;
  lifeEducationDate: string;

  // 서류 준비 확인
  documentsConfirmed: boolean;
  documentPreparationDate: string;

  // 모집자
  recruiterName: string;
}

const steps = [
  { id: 1, name: "기본정보", icon: User },
  { id: 2, name: "주소/학력", icon: MapPin },
  { id: 3, name: "시험일정", icon: Calendar },
  { id: 4, name: "서류안내", icon: FileText },
  { id: 5, name: "완료", icon: Check },
];

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return '대기';
    case 'reviewing': return '검토중';
    case 'approved': return '승인';
    case 'rejected': return '반려';
    case 'completed': return '완료';
    default: return '알 수 없음';
  }
};

export default function NewApplicantPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDuplicateFound, setIsDuplicateFound] = useState(false);
  const [duplicateData, setDuplicateData] = useState<{name: string, phone: string, status: string} | null>(null);

  // 시험 일정 관련 상태
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [formData, setFormData] = useState<NewApplicantFormData>({
    name: "",
    residentNumber: "",
    address: "",
    phone: "",
    email: "",
    bankAccount: "",
    bankName: "",
    finalSchool: "",
    examRegion: "",
    selectedScheduleId: "",
    lifeInsurancePassDate: "",
    lifeEducationDate: "",
    documentsConfirmed: false,
    documentPreparationDate: "",
    recruiterName: "",
  });

  const progress = (currentStep / steps.length) * 100;

  // 시험 일정 로딩
  useEffect(() => {
    loadExamSchedules();
  }, []);

  const loadExamSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const response = await fetch('/api/exam-schedules');
      if (response.ok) {
        const data = await response.json();
        const schedules = data.data || [];
        setExamSchedules(schedules);

        // 사용 가능한 지역 추출
        const regions = [...new Set(schedules.flatMap((schedule: ExamSchedule) => schedule.locations))] as string[];
        setAvailableRegions(regions);
      }
    } catch (error) {
      console.error('시험 일정 로딩 실패:', error);
    } finally {
      setLoadingSchedules(false);
    }
  };

  // 선택된 지역의 시험 일정 필터링
  const getFilteredSchedules = () => {
    if (!formData.examRegion) return [];
    return examSchedules.filter(schedule =>
      schedule.locations.includes(formData.examRegion)
    ).sort((a, b) => a.session_number - b.session_number);
  };

  // 선택된 시험 일정 조회
  const getSelectedSchedule = () => {
    return examSchedules.find(schedule => schedule.id === formData.selectedScheduleId);
  };

  // 날짜 계산 함수
  const addDays = (dateString: string, days: number) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  // 신청 마감일 확인 함수
  const isApplicationClosed = (schedule: ExamSchedule) => {
    if (!schedule.has_internal_deadline || !schedule.internal_deadline_date) {
      return false; // 내부 마감일이 없으면 마감되지 않은 것으로 처리
    }

    const now = new Date();
    const deadlineDate = new Date(schedule.internal_deadline_date);

    // 시간 정보가 있으면 정확한 시간까지 고려
    if (schedule.internal_deadline_time) {
      const [hours, minutes] = schedule.internal_deadline_time.split(':');
      deadlineDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      // 시간 정보가 없으면 해당 날의 23:59:59로 설정
      deadlineDate.setHours(23, 59, 59, 999);
    }

    return now > deadlineDate;
  };

  // 시험 일정 선택 시 자동 입력
  const handleScheduleSelect = (scheduleId: string) => {
    const schedule = examSchedules.find(s => s.id === scheduleId);
    if (schedule && !isApplicationClosed(schedule)) {
      setFormData(prev => ({
        ...prev,
        selectedScheduleId: scheduleId,
        lifeInsurancePassDate: schedule.exam_date, // 시험일로 자동 설정
        lifeEducationDate: addDays(schedule.exam_date, -1) // 시험일 하루 전으로 자동 설정
      }));
    }
  };

  const handleGoToStatus = () => {
    if (duplicateData) {
      const params = new URLSearchParams({
        name: duplicateData.name,
        phone: duplicateData.phone
      });
      router.push(`/applicant/status?${params.toString()}`);
    }
  };

  const handleDuplicateCheck = async () => {
    if (!formData.name || !formData.phone) {
      return false;
    }

    try {
      const result = await checkDuplicateApplicant(formData.name, formData.phone);
      if (result.success) {
        return result;
      } else {
        alert(result.error || '중복 확인 중 오류가 발생했습니다.');
        return false;
      }
    } catch (error) {
      alert('중복 확인 중 오류가 발생했습니다.');
      return false;
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!formData.name) {
          alert("이름을 입력해주세요.");
          return false;
        }
        if (!formData.residentNumber || formData.residentNumber.length < 14) {
          alert("주민등록번호를 정확히 입력해주세요.");
          return false;
        }
        if (!formData.bankName || !formData.bankAccount) {
          alert("은행명과 계좌번호를 입력해주세요.");
          return false;
        }
        break;
      case 2:
        if (!formData.address) {
          alert("주소를 입력해주세요.");
          return false;
        }
        if (!formData.phone || formData.phone.length < 13) {
          alert("휴대폰 번호를 정확히 입력해주세요.");
          return false;
        }
        if (!formData.email || !formData.email.includes("@")) {
          alert("올바른 이메일 주소를 입력해주세요.");
          return false;
        }
        if (!formData.finalSchool) {
          alert("최종학교명을 입력해주세요.");
          return false;
        }
        break;
      case 3:
        if (!formData.examRegion) {
          alert("시험 지역을 선택해주세요.");
          return false;
        }
        if (!formData.selectedScheduleId) {
          alert("시험 일정을 선택해주세요.");
          return false;
        }
        // 선택된 일정이 마감되었는지 확인
        const selectedSchedule = examSchedules.find(s => s.id === formData.selectedScheduleId);
        if (selectedSchedule && isApplicationClosed(selectedSchedule)) {
          alert("선택하신 시험 일정의 신청이 이미 마감되었습니다. 다른 일정을 선택해주세요.");
          return false;
        }
        if (!formData.lifeInsurancePassDate) {
          alert("생명보험 합격 예정일을 선택해주세요.");
          return false;
        }
        if (!formData.lifeEducationDate) {
          alert("생명교육 이수 예정일을 선택해주세요.");
          return false;
        }
        break;
      case 4:
        if (!formData.documentsConfirmed) {
          alert("필수 서류를 확인했는지 체크해주세요.");
          return false;
        }
        if (!formData.documentPreparationDate) {
          alert("서류 준비 완료 예정일을 선택해주세요.");
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = async () => {
    // 2단계에서 중복 체크 수행
    if (currentStep === 2) {
      // 기본 검증 먼저 수행 (중복 체크 제외)
      if (!formData.address) {
        alert("주소를 입력해주세요.");
        return;
      }
      if (!formData.phone || formData.phone.length < 13) {
        alert("휴대폰 번호를 정확히 입력해주세요.");
        return;
      }
      if (!formData.email || !formData.email.includes("@")) {
        alert("올바른 이메일 주소를 입력해주세요.");
        return;
      }
      if (!formData.finalSchool) {
        alert("최종학교명을 입력해주세요.");
        return;
      }

      // 중복 체크 수행
      const duplicateResult = await handleDuplicateCheck();
      if (!duplicateResult) {
        return;
      }

      if (duplicateResult.isDuplicate) {
        const existingApplicant = duplicateResult.applicant;
        setDuplicateData({
          name: formData.name,
          phone: formData.phone,
          status: getStatusText(existingApplicant?.status || '알 수 없음')
        });
        setIsDuplicateFound(true);
        return;
      }
    }

    // 현재 단계 검증
    if (!validateStep(currentStep)) {
      return;
    }

    // 4단계에서 5단계로 넘어갈 때 DB에 저장
    if (currentStep === 4) {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        // 주민번호에서 생년월일 추출 (간단한 방법)
        const residentNumber = formData.residentNumber.replace("-", "");
        const year = parseInt(residentNumber.substring(0, 2));
        const month = residentNumber.substring(2, 4);
        const day = residentNumber.substring(4, 6);

        // 2000년 이전/이후 판단 (간단한 로직)
        const fullYear = year >= 0 && year <= 30 ? 2000 + year : 1900 + year;
        const birthDate = `${fullYear}-${month}-${day}`;

        const applicantData = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          birth_date: birthDate,
          resident_number: encryptResidentNumber(formData.residentNumber),
          recruiter_name: formData.recruiterName,
          bank_name: formData.bankName,
          bank_account: formData.bankAccount,
          final_school: formData.finalSchool,
          life_insurance_pass_date: formData.lifeInsurancePassDate,
          life_education_date: formData.lifeEducationDate,
          documents_confirmed: formData.documentsConfirmed,
          document_preparation_date: formData.documentPreparationDate,
          applicant_type: 'new' as const,
        };

        const result = await createApplicant(applicantData);

        if (!result.success) {
          setSubmitError(result.error || "등록에 실패했습니다.");
          setIsSubmitting(false);
          return;
        }

        console.log("지원자 등록 성공:", result.data);

        // 시험 신청 정보도 함께 저장
        if (formData.selectedScheduleId) {
          try {
            const selectedSchedule = examSchedules.find(s => s.id === formData.selectedScheduleId);
            if (selectedSchedule) {
              const examApplicationData = {
                applicant_id: result.data.id,
                exam_schedule_id: formData.selectedScheduleId,
                exam_type: selectedSchedule.exam_type,
                exam_round: selectedSchedule.session_number,
                exam_date: selectedSchedule.exam_date,
                exam_location: formData.examRegion,
                application_date: new Date().toISOString().split('T')[0],
                status: 'pending' as const,
                notes: null
              };

              const examResult = await createExamApplication(examApplicationData);
              console.log("시험 신청 등록 성공:", examResult);
            }
          } catch (examError) {
            console.error("시험 신청 등록 실패:", examError);
            // 시험 신청 실패해도 지원자 등록은 성공했으므로 계속 진행
          }
        }
      } catch (error) {
        console.error("등록 중 오류:", error);
        setSubmitError("시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
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

  // 중복 신청자 발견 시 UI
  if (isDuplicateFound && duplicateData) {
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
                  onClick={() => setIsDuplicateFound(false)}
                  className="flex-1"
                >
                  돌아가기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              {currentStep === 2 && "주소, 연락처 및 학력 정보를 입력해주세요."}
              {currentStep === 3 && "시험 지역 및 일정을 선택해주세요."}
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
                    <Label htmlFor="name">
                      이름 <span className="text-red-500">*</span>
                    </Label>
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
                    <Label htmlFor="residentNumber">
                      주민등록번호 <span className="text-red-500">*</span>
                    </Label>
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
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RecruiterSelect
                    value={formData.recruiterName}
                    onChange={(value) => handleInputChange("recruiterName", value)}
                    required={false}
                    description="등록된 모집자 중에서 선택해주세요 (선택사항)"
                  />
                  <BankSelect
                    label="은행명"
                    value={formData.bankName}
                    onChange={(value) => handleInputChange("bankName", value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="bankAccount">
                    계좌번호 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bankAccount"
                    value={formData.bankAccount}
                    onChange={(e) => {
                      // 숫자와 하이픈만 허용
                      const value = e.target.value.replace(/[^0-9-]/g, '');
                      handleInputChange("bankAccount", value);
                    }}
                    onInput={(e) => {
                      // 실시간으로 숫자와 하이픈만 허용
                      const target = e.target as HTMLInputElement;
                      target.value = target.value.replace(/[^0-9-]/g, '');
                    }}
                    placeholder="123456-12-123456"
                    inputMode="numeric"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    급여 입금용 계좌를 입력해주세요.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: 주소/연락처 + 학력 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <AddressSearch
                  label="자택주소"
                  value={formData.address}
                  onChange={(address) => handleInputChange("address", address)}
                  required
                  description="주민등록등본상의 주소와 동일하게 입력해주세요."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">
                      휴대폰 번호 <span className="text-red-500">*</span>
                    </Label>
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
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">
                      이메일 <span className="text-red-500">*</span>
                    </Label>
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

                <div>
                  <Label htmlFor="finalSchool">
                    학력 (최종학교명) <span className="text-red-500">*</span>
                  </Label>
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

              </div>
            )}

            {/* Step 3: 시험 지역 및 일정 선택 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* 시험 안내 사항 */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h4 className="font-semibold text-indigo-700 mb-3 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    시험 안내 사항
                  </h4>
                  <div className="space-y-2 text-sm text-indigo-600">
                    <div className="flex items-start">
                      <span className="font-medium mr-2">📍</span>
                      <span>시험 장소 및 시간은 선택한 지역 내에서 랜덤으로 배정됩니다.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium mr-2">📄</span>
                      <span>수험표는 시험일 2일 전에 전달 예정입니다.</span>
                    </div>
                  </div>
                </div>

                {/* 시험 지역 선택 */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-700 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    시험 응시 지역 선택
                  </h4>
                  <div>
                    <Label htmlFor="examRegion">
                      응시 지역 <span className="text-red-500">*</span>
                    </Label>
                    {loadingSchedules ? (
                      <div className="flex items-center p-2 text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        시험 일정 로딩 중...
                      </div>
                    ) : (
                      <select
                        id="examRegion"
                        value={formData.examRegion}
                        onChange={(e) => {
                          handleInputChange("examRegion", e.target.value);
                          // 지역 변경 시 선택된 일정 초기화
                          setFormData(prev => ({
                            ...prev,
                            selectedScheduleId: "",
                            lifeInsurancePassDate: "",
                            lifeEducationDate: ""
                          }));
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                        required
                      >
                        <option value="">지역을 선택해주세요</option>
                        {availableRegions.map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-sm text-blue-600 mt-1">
                      시험을 응시할 지역을 선택해주세요.
                    </p>
                  </div>
                </div>

                {/* 시험 일정 선택 */}
                {formData.examRegion && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      시험 일정 선택
                    </h4>
                    <div>
                      <Label htmlFor="selectedSchedule">
                        시험 일정 <span className="text-red-500">*</span>
                      </Label>
                      <div className="space-y-2 mt-2">
                        {getFilteredSchedules().map((schedule) => {
                          const isClosed = isApplicationClosed(schedule);
                          return (
                            <div
                              key={schedule.id}
                              className={`p-3 border-2 rounded-lg transition-all ${
                                isClosed
                                  ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-75'
                                  : formData.selectedScheduleId === schedule.id
                                  ? 'border-green-500 bg-green-100 cursor-pointer'
                                  : 'border-gray-200 hover:border-green-300 cursor-pointer'
                              }`}
                              onClick={() => !isClosed && handleScheduleSelect(schedule.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center flex-1 min-w-0">
                                  <input
                                    type="radio"
                                    name="examSchedule"
                                    value={schedule.id}
                                    checked={formData.selectedScheduleId === schedule.id}
                                    onChange={() => handleScheduleSelect(schedule.id)}
                                    disabled={isClosed}
                                    className="mr-3 flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-medium flex items-center gap-2 flex-wrap ${
                                      isClosed ? 'text-red-600' : 'text-gray-900'
                                    }`}>
                                      <span>{schedule.session_number}차</span>
                                      <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${
                                        isClosed
                                          ? 'bg-red-500 text-white'
                                          : 'bg-green-500 text-white'
                                      }`}>
                                        {isClosed ? '신청 마감' : '접수 가능'}
                                      </span>
                                    </div>
                                    <div className={`text-sm break-words mt-1 ${
                                      isClosed ? 'text-red-500' : 'text-gray-600'
                                    }`}>
                                      시험일: {new Date(schedule.exam_date).toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        weekday: 'long'
                                      })}
                                    </div>
                                    {isClosed && schedule.internal_deadline_date && (
                                      <div className="text-xs text-red-500 mt-1 break-words">
                                        신청마감: {new Date(schedule.internal_deadline_date).toLocaleDateString('ko-KR', {
                                          month: 'long',
                                          day: 'numeric',
                                          weekday: 'short'
                                        })}
                                        {schedule.internal_deadline_time &&
                                          ` ${schedule.internal_deadline_time.slice(0, 5)}`
                                        }
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-sm text-green-600 mt-2">
                        원하는 시험 일정을 선택해주세요. 선택하면 자격 정보가 자동으로 입력됩니다.
                      </p>
                      {getFilteredSchedules().some(schedule => isApplicationClosed(schedule)) && (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-700">
                            <strong>⚠️ 안내:</strong> 빨간색으로 표시된 일정은 신청 마감된 시험입니다.
                            시험일은 아직 남아있지만 내부 신청 접수가 마감되어 선택할 수 없습니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 보험 자격 정보 (자동 입력) */}
                {formData.selectedScheduleId && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-700 mb-3 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      보험 자격 정보 (자동 입력됨)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lifeInsurancePassDate">
                          생명보험 합격 예정일 <span className="text-red-500">*</span>
                        </Label>
                        {/* DatePicker 캘린더 기능 - 추후 복구 가능하도록 주석 처리
                        <DatePicker
                          id="lifeInsurancePassDate"
                          value={formData.lifeInsurancePassDate}
                          onChange={(date) =>
                            handleInputChange("lifeInsurancePassDate", date)
                          }
                          placeholder="생명보험 합격 예정일 선택"
                        />
                        */}
                        <Input
                          id="lifeInsurancePassDate"
                          value={formData.lifeInsurancePassDate ? new Date(formData.lifeInsurancePassDate).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                          }) : ''}
                          readOnly
                          placeholder="시험 일정 선택 시 자동 입력됩니다"
                          className="bg-gray-50 cursor-not-allowed"
                        />
                        <p className="text-xs text-orange-600 mt-1">
                          선택한 시험일로 자동 설정됩니다.
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="lifeEducationDate">
                          생명교육 이수 예정일 <span className="text-red-500">*</span>
                        </Label>
                        {/* DatePicker 캘린더 기능 - 추후 복구 가능하도록 주석 처리
                        <DatePicker
                          id="lifeEducationDate"
                          value={formData.lifeEducationDate}
                          onChange={(date) =>
                            handleInputChange("lifeEducationDate", date)
                          }
                          placeholder="생명교육 이수 예정일 선택"
                        />
                        */}
                        <Input
                          id="lifeEducationDate"
                          value={formData.lifeEducationDate ? new Date(formData.lifeEducationDate).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                          }) : ''}
                          readOnly
                          placeholder="시험 일정 선택 시 자동 입력됩니다"
                          className="bg-gray-50 cursor-not-allowed"
                        />
                        <p className="text-xs text-orange-600 mt-1">
                          시험일 하루 전으로 자동 설정됩니다.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                      <p className="text-sm text-amber-800 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        일정 조율이 필요할 경우 담당자(모집인)에게 문의해주세요.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: 서류안내 */}
            {currentStep === 4 && (
              <div className="space-y-4">
                {submitError && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      <h4 className="text-red-800 font-semibold">등록 실패</h4>
                    </div>
                    <p className="text-red-600 mt-1">{submitError}</p>
                  </div>
                )}

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
              </div>
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
            <Button onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  등록 중...
                </>
              ) : (
                <>
                  다음
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
