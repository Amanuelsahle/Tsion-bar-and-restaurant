"use client";

import React from "react";

interface DatePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export default function DatePickerInput({
  value,
  onChange,
  placeholder = "mm/dd/yyyy",
  className = "",
  label,
}: DatePickerInputProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-[#7a8090] uppercase tracking-wider block">
          {label}
        </label>
      )}
      <div
        className="relative w-full min-h-[34px] px-2.5 py-1 rounded-lg border flex items-center justify-between text-xs font-medium cursor-pointer transition-all hover:border-[#c9a84c]/50"
        style={{
          backgroundColor: "var(--card)",
          borderColor: value ? "rgba(201,168,76,0.4)" : "var(--border)",
        }}
      >
        <span className={value ? "text-[#f4efe7] font-semibold" : "text-[#7a8090]"}>
          {value || placeholder}
        </span>
        <span className="text-xs shrink-0 ml-1.5 opacity-80">📅</span>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10 text-base"
        />
      </div>
    </div>
  );
}
