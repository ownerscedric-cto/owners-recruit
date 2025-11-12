"use client";

import React from "react";
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
  const handleClick = () => {
    // 숨겨진 date input을 클릭하여 캘린더 열기
    const dateInput = document.getElementById(`${id}-hidden`) as HTMLInputElement;
    if (dateInput) {
      if (dateInput.showPicker) {
        dateInput.showPicker();
      } else {
        dateInput.focus();
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
    <div className="relative">
      {/* 숨겨진 실제 date input */}
      <input
        id={`${id}-hidden`}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        required={required}
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
      />

      {/* 클릭 가능한 버튼 형태 display */}
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground",
          className
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