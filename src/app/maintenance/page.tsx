import { AlertTriangle, Settings, Clock } from 'lucide-react'
import Link from 'next/link'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* 아이콘 */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Settings className="h-8 w-8 text-orange-600 animate-spin" />
          </div>
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          시스템 유지보수 중
        </h1>

        {/* 설명 */}
        <div className="text-gray-600 mb-6 space-y-3">
          <p>
            현재 시스템 업데이트 및 유지보수 작업이 진행 중입니다.
          </p>
          <p>
            잠시 후 다시 접속해 주시기 바랍니다.
          </p>
        </div>

        {/* 상태 정보 */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center text-orange-800 mb-2">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span className="font-medium">유지보수 진행 중</span>
          </div>
          <div className="flex items-center justify-center text-orange-700 text-sm">
            <Clock className="h-4 w-4 mr-1" />
            <span>예상 완료 시간: 30분 이내</span>
          </div>
        </div>

        {/* 관리자 링크 */}
        <div className="text-sm text-gray-500">
          시스템 관리자이신가요?{' '}
          <Link
            href="/admin/settings"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            관리자 페이지로 이동
          </Link>
        </div>

        {/* 회사 정보 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            오너스경영연구소 채용관리시스템
          </p>
          <p className="text-xs text-gray-400 mt-1">
            문의사항이 있으시면 담당자에게 연락하시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  )
}