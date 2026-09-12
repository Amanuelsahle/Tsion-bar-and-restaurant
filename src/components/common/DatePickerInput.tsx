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
  const [isFocused, setIsFocused] = useState(true);


  return (
    <div style={{ position: "relative", inlineSize: "fit-content" }}>
      {/* Overlay text rendered conditionally when value is empty */}
      {!value && (
        <span
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#888",
            pointerEvents: "none", // Ensures taps pass through directly to the input
            fontSize: "14px",
          }}
        >
          Select a date
        </span>
      )}
      <input
        type={isFocused || value ? "date" : "text"}

        placeholder={label || "Select Date"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          if ("showPicker" in e.target) {
            e.preventDefault()
          }
          setIsFocused(true);
          if ("showPicker" in e.target) {
            try {
              (e.target as HTMLInputElement).showPicker();
            } catch {
              // Ignore if restricte
            }
          }
        }}


        className={`w-full min-h-[36px] px-3 py-1.5 rounded-lg border text-base md:text-sm font-medium bg-[var(--card)] text-foreground cursor-pointer transition-all hover:border-[#c9a84c]/50 focus:outline-none focus:border-[#c9a84c] ${className}`}
        style={{
          borderColor: value ? "rgba(201,168,76,0.4)" : "var(--border)",
        }}
      />
    </div>
  );
}

