"use client";

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
    <div className={cn("relative block", className)}>
      {/* 시각적 표시 - pointer-events: none으로 클릭이 input으로 전달되도록 함 */}
      <div
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background pointer-events-none",
          !value && "text-muted-foreground"
        )}
      >
        <span className="flex-1 text-left">
          {formatDisplayDate(value)}
        </span>
        <Calendar className="h-4 w-4 opacity-50 ml-2" />
      </div>

      {/* 투명한 date input - 전체 영역을 덮음 (맨 위에 위치) */}
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        required={required}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ fontSize: "16px" }} // iOS 줌 방지
      />
    </div>
  );
}