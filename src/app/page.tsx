import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Shield, Clock, FileCheck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image
                src="/owners_logo.png"
                alt="오너스경영연구소 로고"
                width={150}
                height={50}
                className="h-12 w-auto mr-3"
                priority
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  오너스경영연구소
                </h1>
                <span className="text-sm text-gray-500">
                  스마트 리크루팅 시스템
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              효율적이고 안전한
              <span className="block text-indigo-600">입사 프로세스</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              디지털 게이트웨이를 통해 인재와 기업을 연결합니다
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-indigo-700 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-12 sm:px-12 sm:py-16">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white">
                  시스템 접근
                </h2>
                <p className="mt-4 text-xl text-indigo-100">
                  역할에 맞는 메뉴를 선택해주세요
                </p>

                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Link href="/applicant/guide">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="w-full h-16"
                    >
                      <div className="text-center">
                        <div className="font-semibold">입사 지원자</div>
                        <div className="text-sm opacity-75">
                          정보 입력 및 진행상황 확인
                        </div>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/manager/dashboard">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="w-full h-16"
                    >
                      <div className="text-center">
                        <div className="font-semibold">인사팀</div>
                        <div className="text-sm opacity-75">
                          지원자 관리 및 승인
                        </div>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/admin/settings">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="w-full h-16"
                    >
                      <div className="text-center">
                        <div className="font-semibold">시스템 관리자</div>
                        <div className="text-sm opacity-75">
                          시스템 설정 및 관리
                        </div>
                      </div>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="text-center">
                <Users className="mx-auto h-12 w-12 text-indigo-600" />
                <CardTitle className="text-lg">편리한 신청</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  언제 어디서나 웹을 통해 간편하게 입사 신청이 가능합니다
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Shield className="mx-auto h-12 w-12 text-indigo-600" />
                <CardTitle className="text-lg">보안 강화</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  개인정보 암호화와 안전한 전송으로 데이터를 보호합니다
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Clock className="mx-auto h-12 w-12 text-indigo-600" />
                <CardTitle className="text-lg">실시간 추적</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  입사 진행 상황을 실시간으로 확인할 수 있습니다
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <FileCheck className="mx-auto h-12 w-12 text-indigo-600" />
                <CardTitle className="text-lg">자동화 처리</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  서류 검토와 승인 과정이 자동화되어 빠른 처리가 가능합니다
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 오너스경영연구소. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
