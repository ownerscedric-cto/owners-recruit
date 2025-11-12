'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Applicant {
  id: string
  name: string
  email: string
  phone: string
  status: string
  submitted_at: string
}

export default function TestDBPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('applicants')
          .select('id, name, email, phone, status, submitted_at')
          .order('submitted_at', { ascending: false })

        if (error) {
          setError(error.message)
        } else {
          setApplicants(data || [])
        }
      } catch (err) {
        setError('데이터베이스 연결에 실패했습니다.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">대기</Badge>
      case 'reviewing':
        return <Badge className="bg-blue-600">검토중</Badge>
      case 'approved':
        return <Badge className="bg-green-600">승인</Badge>
      case 'rejected':
        return <Badge className="bg-red-600">반려</Badge>
      case 'completed':
        return <Badge className="bg-purple-600">완료</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase 데이터베이스 연결 테스트</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-4">
              <p>데이터베이스 연결 중...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h3 className="text-red-800 font-semibold">연결 실패</h3>
              <p className="text-red-600">{error}</p>
              <div className="mt-2 text-sm text-red-500">
                <p>확인사항:</p>
                <ul className="list-disc list-inside">
                  <li>.env.local 파일의 Supabase URL과 API Key 확인</li>
                  <li>Supabase 프로젝트에서 테이블이 생성되었는지 확인</li>
                  <li>RLS 정책 설정 확인</li>
                </ul>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div>
              <div className="mb-4">
                <h3 className="text-green-600 font-semibold">✅ 연결 성공!</h3>
                <p className="text-gray-600">총 {applicants.length}명의 지원자가 조회되었습니다.</p>
              </div>

              {applicants.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">지원자 목록:</h4>
                  {applicants.map((applicant) => (
                    <div key={applicant.id} className="border p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{applicant.name}</p>
                          <p className="text-sm text-gray-600">{applicant.email}</p>
                          <p className="text-sm text-gray-600">{applicant.phone}</p>
                          <p className="text-xs text-gray-400">
                            신청일: {new Date(applicant.submitted_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        <div>
                          {getStatusBadge(applicant.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}