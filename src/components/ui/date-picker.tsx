"use client";

import { useRef } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (date: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  placeholder,
  required,
  className,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (inputRef.current) {
      // showPicker()가 지원되면 사용, 아니면 focus + click으로 fallback
      try {
        inputRef.current.showPicker();
      } catch {
        // showPicker()가 실패하면 click 이벤트 발생
        inputRef.current.click();
      }
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return placeholder || "날짜를 선택해주세요";

    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <div className={cn("relative", className)}>
      {/* 숨겨진 date input */}
      <input
        ref={inputRef}
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        required={required}
        className="sr-only"
      />

      {/* 클릭 가능한 버튼 */}
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer",
          !value && "text-muted-foreground"
        )}
      >
        <span className="flex-1 text-left">
          {formatDisplayDate(value)}
        </span>
        <Calendar className="h-4 w-4 opacity-50 ml-2" />
      </button>
    </div>
  );
}