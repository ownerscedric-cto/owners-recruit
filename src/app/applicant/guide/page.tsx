import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/shared/header";
import {
  CheckCircle,
  FileText,
  Users,
  ArrowRight,
  Download,
  BookOpen,
  AlertCircle,
} from "lucide-react";

export default function ApplicantGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="입사 가이드" showBackButton backUrl="/" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 프로세스 개요 */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-6 w-6 text-blue-600" />
                입사 프로세스 안내
              </CardTitle>
              <CardDescription>
                오너스경영연구소 보험설계사 입사 과정을 단계별로 안내해드립니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h3 className="font-medium text-sm">정보 입력</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    개인정보 및 경력 입력
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <h3 className="font-medium text-sm">서류 제출</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    본사 링크로 서류 제출
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-yellow-600 font-bold">3</span>
                  </div>
                  <h3 className="font-medium text-sm">서류 검토</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    인사팀 검토 및 승인
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 font-bold">4</span>
                  </div>
                  <h3 className="font-medium text-sm">위촉 완료</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    교육 및 업무 시작
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 위촉/해촉 안내서 다운로드 */}
        <div className="mb-8">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <BookOpen className="mr-2 h-6 w-6" />
                위촉/해촉 안내서
              </CardTitle>
              <CardDescription>
                보험설계사 위촉 및 해촉 절차에 대한 상세 안내서를 다운로드하실
                수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      안내서에는 위촉 절차, 필요 서류, 해촉 시 주의사항 등 모든
                      정보가 포함되어 있습니다.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <Button
                  className="w-full sm:w-auto"
                  variant="outline"
                  size="lg"
                >
                  <Download className="h-5 w-5 mr-2" />
                  위촉/해촉 안내서 다운로드
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 위촉 필수 서류 */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-6 w-6 text-blue-600" />
                위촉 필수 서류
              </CardTitle>
              <CardDescription>
                입사 신청 시 준비해야 할 필수 서류 목록입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 공통 필수 서류 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  공통 필수 서류
                </h4>
                <div className="space-y-2 pl-6">
                  {[
                    {
                      name: "주민등록 등/초본",
                      description: "발급용, 주민번호 전체 표시",
                    },
                    {
                      name: "신분증 사본",
                      description: "앞면만 제출",
                    },
                    {
                      name: "독후감",
                      description: "영업 관련 서적, A4 한 장 정도",
                    },
                    {
                      name: "통장사본",
                      description: "급여 입금용 계좌",
                    },
                    {
                      name: "생명보험시험 합격증",
                      description: "생명보험협회에서 확인 가능",
                    },
                  ].map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 border rounded-lg bg-gray-50"
                    >
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{doc.name}</h5>
                        <p className="text-xs text-gray-600 mt-1">
                          {doc.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 신입/경력 구분 서류 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 신입 */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-700 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    신입 전용 서류
                  </h4>
                  <div className="space-y-2">
                    <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                      <h5 className="font-medium text-sm">졸업증명서</h5>
                      <p className="text-xs text-gray-600 mt-1">
                        최종 학력 증명
                      </p>
                    </div>
                    <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                      <h5 className="font-medium text-sm">보험연수원 교육수료증 (신규)</h5>
                      <p className="text-xs text-gray-600 mt-1">
                        생명보험 코드만 신청: 생명 + 제3보험 (30H)<br />
                        생명보험/손해보험 코드 신청: 생명 + 손해 + 제3보험 (40H)
                      </p>
                    </div>
                  </div>
                </div>

                {/* 경력 */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-purple-700 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    경력 전용 서류
                  </h4>
                  <div className="space-y-2">
                    <div className="p-3 border border-purple-200 rounded-lg bg-purple-50">
                      <h5 className="font-medium text-sm">경력증명서</h5>
                      <p className="text-xs text-gray-600 mt-1">
                        이전 보험회사 재직 증명
                      </p>
                    </div>
                    <div className="p-3 border border-purple-200 rounded-lg bg-purple-50">
                      <h5 className="font-medium text-sm">말소증명서</h5>
                      <p className="text-xs text-gray-600 mt-1">
                        기존 생명보험협회, 손해보험협회에 등록한 보험사 말소신청
                      </p>
                    </div>
                    <div className="p-3 border border-purple-200 rounded-lg bg-purple-50">
                      <h5 className="font-medium text-sm">보험연수원 교육수료증 (경력)</h5>
                      <p className="text-xs text-gray-600 mt-1">
                        생명보험 코드만 신청: 생명 + 제3보험 (25H)<br />
                        생명보험/손해보험 코드 신청: 생명 + 손해 + 제3보험 (30H)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 참고사항 */}
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-700">
                      서류 제출 안내
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      모든 서류는 정보 입력 완료 후 본사에서 발송하는 별도
                      링크를 통해 제출하시면 됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/applicant/apply" className="flex-1">
            <Button className="w-full" size="lg">
              입사 신청하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/applicant/status" className="flex-1">
            <Button variant="outline" className="w-full" size="lg">
              진행 상황 확인
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
