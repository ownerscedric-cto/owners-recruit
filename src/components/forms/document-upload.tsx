'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Check } from 'lucide-react'

export interface Document {
  type: string
  file: File | null
  required: boolean
  description: string
}

interface DocumentUploadProps {
  documents: Document[]
  onFileUpload: (docType: string, file: File | null) => void
  title?: string
  description?: string
}

export function DocumentUpload({ documents, onFileUpload, title, description }: DocumentUploadProps) {
  return (
    <div className="space-y-4">
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      )}

      {documents.map((doc, index) => (
        <div key={index} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="font-medium">
              {doc.type}
              {doc.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {doc.file && (
              <span className="text-green-600 text-sm flex items-center">
                <Check className="h-4 w-4 mr-1" />
                업로드 완료
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mb-2">{doc.description}</p>
          <div className="flex items-center space-x-2">
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                onFileUpload(doc.type, file)
              }}
              className="flex-1"
            />
            <Upload className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            PDF, JPG, PNG 형식, 최대 10MB
          </p>
        </div>
      ))}
    </div>
  )
}

// 신입자용 기본 서류 설정
export const newApplicantDocuments: Document[] = [
  {
    type: '주민등록등본',
    file: null,
    required: true,
    description: '발급일 3개월 이내'
  },
  {
    type: '증명사진',
    file: null,
    required: true,
    description: '3×4 컬러사진 (6개월 이내)'
  },
  {
    type: '생명보험 합격증',
    file: null,
    required: true,
    description: '3년 이내 발급'
  },
  {
    type: '보험연수원 수료증',
    file: null,
    required: true,
    description: '3년 이내 발급'
  },
  {
    type: '학력증명서',
    file: null,
    required: false,
    description: '최종학교 졸업증명서 또는 재학증명서'
  },
  {
    type: '통장사본',
    file: null,
    required: true,
    description: '급여 입금용 계좌'
  },
]

// 경력자용 기본 서류 설정
export const experiencedApplicantDocuments: Document[] = [
  {
    type: '주민등록등본',
    file: null,
    required: true,
    description: '발급일 3개월 이내'
  },
  {
    type: '증명사진',
    file: null,
    required: true,
    description: '3×4 컬러사진 (6개월 이내)'
  },
  {
    type: '생명보험 합격증',
    file: null,
    required: true,
    description: '3년 이내 발급'
  },
  {
    type: '보험연수원 수료증',
    file: null,
    required: true,
    description: '3년 이내 발급'
  },
  {
    type: '경력증명서',
    file: null,
    required: true,
    description: '이전 보험회사 재직증명서'
  },
  {
    type: '말소확인증',
    file: null,
    required: true,
    description: '생명/손해보험협회 말소 확인서'
  },
  {
    type: '학력증명서',
    file: null,
    required: false,
    description: '최종학교 졸업증명서 또는 재학증명서'
  },
  {
    type: '통장사본',
    file: null,
    required: true,
    description: '급여 입금용 계좌'
  },
]