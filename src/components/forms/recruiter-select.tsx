'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getActiveRecruiters, type Recruiter } from '@/lib/recruiters'
import { Users, Loader2, AlertCircle } from 'lucide-react'

interface RecruiterSelectProps {
  label?: string
  value: string
  onChange: (recruiterName: string) => void
  placeholder?: string
  required?: boolean
  description?: string
}

export function RecruiterSelect({
  label = "도입자(모집자)명",
  value,
  onChange,
  placeholder = "모집자를 선택해주세요",
  required = false,
  description
}: RecruiterSelectProps) {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecruiters = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getActiveRecruiters()

        if (result.success && result.data) {
          // 활성화된 모집자만 표시
          setRecruiters(result.data)
        } else {
          setError(result.error || '모집자 목록을 불러올 수 없습니다')
        }
      } catch (error) {
        console.error('Error loading recruiters:', error)
        setError('모집자 목록을 불러오는 중 오류가 발생했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchRecruiters()
  }, [])

  return (
    <div className="space-y-2">
      <Label htmlFor="recruiter-select">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        {loading ? (
          <div className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin text-gray-400" />
              <span className="text-muted-foreground">모집자 목록 불러오는 중...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm shadow-sm">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
              <span className="text-red-600">{error}</span>
            </div>
          </div>
        ) : (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger id="recruiter-select" className="w-full">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder={placeholder} />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {recruiters.length > 0 ? (
                recruiters.map((recruiter) => (
                  <SelectItem key={recruiter.id} value={recruiter.name}>
                    <div className="flex flex-col">
                      <span className="font-medium">{recruiter.name}</span>
                      {recruiter.team && (
                        <span className="text-xs text-gray-500">{recruiter.team}</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-recruiters" disabled>
                  등록된 모집자가 없습니다
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-500">
          {description}
        </p>
      )}
    </div>
  )
}