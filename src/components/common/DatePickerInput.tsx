"use client";

import React, { useState } from "react";

interface DatePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
}

export default function DatePickerInput({
  value,
  onChange,
  className = "",
  label,
}: DatePickerInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <input
      type={isFocused || value ? "date" : "text"}
      placeholder={label || "Select Date"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => {
        setIsFocused(true);
        if ("showPicker" in e.target) {
          try {
            (e.target as HTMLInputElement).showPicker();
          } catch {
            // Ignore if restricted
          }
        }
      }}
      onBlur={() => setIsFocused(false)}
      className={`w-full min-h-[36px] px-3 py-1.5 rounded-lg border text-xs font-medium bg-[var(--card)] text-foreground cursor-pointer transition-all hover:border-[#c9a84c]/50 focus:outline-none focus:border-[#c9a84c] ${className}`}
      style={{
        borderColor: value ? "rgba(201,168,76,0.4)" : "var(--border)",
      }}
    />
  );
}

