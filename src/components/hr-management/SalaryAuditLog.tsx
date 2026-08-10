"use client";

import { type Employee } from "../../lib/types";
import { ACTION_META } from "./hr-utils";

interface SalaryAuditLogProps {
  emp: Employee;
  mobileTab: "profile" | "actions" | "audit";
}

export default function SalaryAuditLog({
  emp,
  mobileTab,
}: SalaryAuditLogProps) {
  return (
    <div
      className={`rounded-2xl overflow-hidden flex flex-col ${
        mobileTab === "audit" ? "flex" : "hidden lg:flex"
      }`}
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="px-5 py-4"
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: "rgba(255,255,255,0.02)",
        }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          Full Transaction & Salary Audit Log
        </h2>
      </div>
      <div className="overflow-y-auto flex-1 max-h-[440px]">
        {!emp.history || emp.history.length === 0 ? (
          <div
            className="py-12 text-center text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            No salary history recorded yet.
          </div>
        ) : (
          emp.history.map((tx, i) => (
            <div
              key={tx.id || i}
              className="flex items-start gap-3 px-5 py-3.5"
              style={{
                borderBottom:
                  i < emp.history.length - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <div
                className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: `${ACTION_META[tx.type]?.color || "#c9a84c"}15`,
                  color: ACTION_META[tx.type]?.color || "#c9a84c",
                }}
              >
                {tx.type === "increase"
                  ? "↑"
                  : tx.type === "payment"
                  ? "✓"
                  : "↓"}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium truncate"
                  style={{ color: "var(--foreground)" }}
                >
                  {tx.note || ACTION_META[tx.type]?.label}
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {tx.date} · {tx.type.toUpperCase()}
                </p>
              </div>
              <span
                className="text-xs font-semibold flex-shrink-0"
                style={{ color: ACTION_META[tx.type]?.color || "#c9a84c" }}
              >
                {tx.type === "increase" ? "+" : "−"}
                {tx.amount.toLocaleString()} Birr
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
