'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Search } from 'lucide-react'

interface AddressData {
  address: string
  zonecode: string
  detailAddress?: string
}

interface AddressSearchProps {
  label?: string
  value: string
  onChange: (address: string) => void
  placeholder?: string
  required?: boolean
  description?: string
}

declare global {
  interface Window {
    daum: any
  }
}

export function AddressSearch({
  label = "주소",
  value,
  onChange,
  placeholder = "주소를 검색해주세요",
  required = false,
  description
}: AddressSearchProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [detailAddress, setDetailAddress] = useState('')
  const [baseAddress, setBaseAddress] = useState('')
  const [zonecode, setZonecode] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // 외부에서 value가 변경될 때만 분리 로직 실행
    if (value && !isInitialized) {
      setIsInitialized(true)

      // 기본적으로 전체를 기본주소로 설정
      setBaseAddress(value)
      setDetailAddress('')
    } else if (!value) {
      // value가 비어있으면 모두 초기화
      setBaseAddress('')
      setDetailAddress('')
      setZonecode('')
      setIsInitialized(false)
    }
  }, [value, isInitialized])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    script.onload = () => setIsScriptLoaded(true)
    document.head.appendChild(script)

    return () => {
      // 컴포넌트가 언마운트될 때 스크립트 제거
      const existingScript = document.querySelector('script[src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"]')
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  const openAddressSearch = () => {
    if (!isScriptLoaded || !window.daum) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    new window.daum.Postcode({
      oncomplete: function(data: any) {
        // 도로명 주소와 지번 주소 중 선택
        let fullAddress = data.addressType === 'R' ? data.roadAddress : data.jibunAddress

        // 참고항목 추가 (건물명, 동/로 정보)
        let extraAddress = ''
        if (data.addressType === 'R') {
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraAddress += data.bname
          }
          if (data.buildingName !== '') {
            extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName)
          }
          if (extraAddress !== '') {
            fullAddress += ' (' + extraAddress + ')'
          }
        }

        setBaseAddress(fullAddress)
        setZonecode(data.zonecode)
        setDetailAddress('')
        setIsInitialized(true)

        // 기본 주소만 먼저 onChange로 전달
        onChange(fullAddress)
      },
      theme: {
        bgColor: "#FFFFFF",
        searchBgColor: "#0B65C8",
        contentBgColor: "#FFFFFF",
        pageBgColor: "#FAFAFA",
        textColor: "#333333",
        queryTextColor: "#FFFFFF"
      }
    }).open()
  }

  const handleDetailAddressChange = (detail: string) => {
    setDetailAddress(detail)
    // 기본 주소 + 상세 주소 조합해서 onChange로 전달
    const fullAddress = baseAddress + (detail ? ', ' + detail : '')
    onChange(fullAddress)
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="address-search">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="address-search"
            value={baseAddress}
            readOnly
            placeholder={placeholder}
            className="flex-1 bg-gray-50"
          />
          <Button
            type="button"
            variant="outline"
            onClick={openAddressSearch}
            disabled={!isScriptLoaded}
          >
            <Search className="h-4 w-4 mr-1" />
            검색
          </Button>
        </div>
        {zonecode && (
          <p className="text-xs text-gray-500 mt-1">
            <MapPin className="h-3 w-3 inline mr-1" />
            우편번호: {zonecode}
          </p>
        )}
      </div>

      {baseAddress && (
        <div>
          <Label htmlFor="detail-address">상세 주소</Label>
          <Input
            id="detail-address"
            value={detailAddress}
            onChange={(e) => handleDetailAddressChange(e.target.value)}
            placeholder="동, 호수 등 상세 주소를 입력해주세요"
            className="mt-1"
          />
        </div>
      )}

      {description && (
        <p className="text-sm text-gray-500">
          {description}
        </p>
      )}
    </div>
  )
}