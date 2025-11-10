'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2 } from 'lucide-react'

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
  placeholder = "은행을 선택해주세요",
  required = false,
  description
}: BankSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="bank-select">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="bank-select" className="w-full">
            <div className="flex items-center">
              <Building2 className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue placeholder={placeholder} />
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {koreanBanks.map((bank) => (
              <SelectItem key={bank} value={bank}>
                {bank}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {description && (
        <p className="text-sm text-gray-500">
          {description}
        </p>
      )}
    </div>
  )
}