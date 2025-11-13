'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Building2, Search, Check } from 'lucide-react'

interface BankSelectProps {
  label?: string
  value: string
  onChange: (bankName: string) => void
  placeholder?: string
  required?: boolean
  description?: string
}

// 주요 은행 목록 (가나다 순)
const koreanBanks = [
  'KB국민은행',
  'KEB하나은행',
  'NH농협은행',
  'SC제일은행',
  'SH수협은행',
  '경남은행',
  '광주은행',
  '기업은행',
  '대구은행',
  '도이치은행',
  '부산은행',
  '산업은행',
  '새마을금고',
  '신한은행',
  '신협',
  '씨티은행',
  '우리은행',
  '우체국',
  '전북은행',
  '제주은행',
  '카카오뱅크',
  '케이뱅크',
  '토스뱅크',
  '한국은행',
  'HSBC은행',
  'JP모간체이스은행',
] as const

export function BankSelect({
  label = "은행명",
  value,
  onChange,
  placeholder = "은행을 검색하거나 선택해주세요",
  required = false,
  description
}: BankSelectProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // 검색어에 따른 필터링
  const filteredBanks = koreanBanks.filter(bank =>
    bank.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (bankName: string) => {
    onChange(bankName)
    setSearchTerm('')
    setIsOpen(false)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="bank-select">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        {/* 선택된 은행 표시 또는 검색 입력창 */}
        <div
          className="flex h-10 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent hover:text-accent-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center flex-1">
            <Building2 className="h-4 w-4 mr-2 text-gray-400" />
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
                  placeholder="은행명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>

            {/* 은행 목록 */}
            <div className="max-h-60 overflow-y-auto">
              {filteredBanks.length > 0 ? (
                filteredBanks.map((bank) => (
                  <div
                    key={bank}
                    className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between ${
                      value === bank ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleSelect(bank)}
                  >
                    <span className={value === bank ? 'font-medium text-blue-600' : ''}>
                      {bank}
                    </span>
                    {value === bank && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {searchTerm ? '검색 결과가 없습니다' : '등록된 은행이 없습니다'}
                </div>
              )}
            </div>
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