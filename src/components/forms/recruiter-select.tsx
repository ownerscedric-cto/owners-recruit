'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getActiveRecruiters, type Recruiter } from '@/lib/recruiters'
import { Users, Loader2, AlertCircle, Search, Check } from 'lucide-react'

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
  placeholder = "모집자를 검색하거나 선택해주세요",
  required = false,
  description
}: RecruiterSelectProps) {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

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

  // 검색어에 따른 필터링
  const filteredRecruiters = recruiters.filter(recruiter =>
    recruiter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recruiter.position.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (recruiterName: string) => {
    onChange(recruiterName)
    setSearchTerm('')
    setIsOpen(false)
  }

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
          <div className="relative">
            {/* 선택된 모집자 표시 또는 검색 입력창 */}
            <div
              className="flex h-10 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              <div className="flex items-center flex-1">
                <Users className="h-4 w-4 mr-2 text-gray-400" />
                {value ? (
                  <span className="font-medium">{value}</span>
                ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
              </div>
              <Search className="h-4 w-4 text-gray-400" />
            </div>

            {/* 드롭다운 메뉴 */}
            {isOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                {/* 검색 입력창 */}
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="이름 또는 직급으로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                {/* 모집자 목록 */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredRecruiters.length > 0 ? (
                    filteredRecruiters.map((recruiter) => (
                      <div
                        key={recruiter.id}
                        className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between ${
                          value === recruiter.name ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleSelect(recruiter.name)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{recruiter.name}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {recruiter.position}
                          </span>
                        </div>
                        {value === recruiter.name && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {searchTerm ? '검색 결과가 없습니다' : '등록된 모집자가 없습니다'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-500">
          {description}
        </p>
      )}

      {/* 클릭 외부 영역 감지를 위한 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}