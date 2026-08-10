"use client";

import { type Employee } from "../../lib/types";
import { ROLE_COLORS, type AccruedPayrollSummary } from "./hr-utils";

interface EmployeeProfileCardProps {
  emp: Employee;
  summary: AccruedPayrollSummary;
  notesDraft: Record<string, string>;
  setNotesDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  saveNotes: (emp: Employee, value: string) => Promise<void>;
  isSubmitting: boolean;
  onStatusClick: (emp: Employee) => void;
  onDeleteClick: (id: string) => void;
  mobileTab: "profile" | "actions" | "audit";
}

export default function EmployeeProfileCard({
  emp,
  summary,
  notesDraft,
  setNotesDraft,
  saveNotes,
  isSubmitting,
  onStatusClick,
  onDeleteClick,
  mobileTab,
}: EmployeeProfileCardProps) {
  function getNoteDraft(empId: string, fallback: string) {
    return empId in notesDraft ? notesDraft[empId] : fallback;
  }

  const isActive = (emp.status || "active") === "active";

  return (
    <div
      className={`rounded-2xl p-6 space-y-5 ${
        mobileTab === "profile" ? "block" : "hidden lg:block"
      }`}
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
          style={{
            backgroundColor: `${ROLE_COLORS[emp.role] || "#c9a84c"}18`,
            color: ROLE_COLORS[emp.role] || "#c9a84c",
            border: `1px solid ${ROLE_COLORS[emp.role] || "#c9a84c"}30`,
          }}
        >
          {emp.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="font-semibold text-lg"
              style={{ color: "var(--foreground)" }}
            >
              {emp.name}
            </p>
            {isActive ? (
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: "rgba(74, 222, 128, 0.12)",
                  color: "#4ade80",
                  border: "1px solid rgba(74, 222, 128, 0.25)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            ) : (
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${ROLE_COLORS[emp.role] || "#c9a84c"}18`,
                color: ROLE_COLORS[emp.role] || "#c9a84c",
                border: `1px solid ${ROLE_COLORS[emp.role] || "#c9a84c"}30`,
              }}
            >
              {emp.role}
            </span>
          </div>
        </div>
      </div>

      {emp.status === "inactive" && (
        <div
          className="p-3 rounded-xl text-xs flex items-center justify-between gap-3"
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            color: "#f59e0b",
          }}
        >
          <span>
            ⚠️ This employee is currently inactive (no longer working here). Historical records and accrued metrics remain saved.
          </span>
        </div>
      )}

      <div className="space-y-2.5">
        {[
          { label: "Hire Date", value: emp.hireDate },
          {
            label: "Days & Tenure",
            value: `${summary.monthsWorkedFormatted} (${summary.totalDaysWorked} days)`,
          },
          {
            label: "Current Base Rate",
            value: `${emp.baseSalary.toLocaleString()} Birr/mo (~${summary.dailyRateCurrent.toLocaleString()} Birr/day)`,
          },
        ].map((row) => (
          <div
            key={row.label}
            className="flex justify-between items-center text-sm"
          >
            <span style={{ color: "var(--muted-foreground)" }}>
              {row.label}
            </span>
            <span
              className="font-medium"
              style={{ color: "var(--foreground)" }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Daily Salary Accrual Breakdown */}
      <div
        className="space-y-3 pt-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex justify-between items-center text-sm">
          <span style={{ color: "var(--muted-foreground)" }}>
            Total Accrued Earned ({summary.totalDaysWorked} days)
          </span>
          <span
            className="font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {summary.totalAccruedEarned.toLocaleString()} Birr
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span style={{ color: "var(--muted-foreground)" }}>
            Total Advances
          </span>
          <span
            className="font-medium"
            style={{
              color:
                summary.totalAdvances > 0
                  ? "#fb923c"
                  : "var(--muted-foreground)",
            }}
          >
            {summary.totalAdvances > 0
              ? `−${summary.totalAdvances.toLocaleString()}`
              : "0"}{" "}
            Birr
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span style={{ color: "var(--muted-foreground)" }}>
            Total Paid Out
          </span>
          <span
            className="font-medium"
            style={{
              color:
                summary.totalPaidOut > 0
                  ? "#4ade80"
                  : "var(--muted-foreground)",
            }}
          >
            {summary.totalPaidOut > 0
              ? `−${summary.totalPaidOut.toLocaleString()}`
              : "0"}{" "}
            Birr
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--muted-foreground)" }}
          >
            Accumulated Balance Due
          </span>
          <span
            className="text-lg font-bold font-display"
            style={{ color: "#4ade80" }}
          >
            {summary.netBalanceDue.toLocaleString()} Birr
          </span>
        </div>
      </div>

      {/* Daily Rate Timeline Breakdown */}
      {summary.salaryHistoryTimeline.length > 0 && (
        <div
          className="space-y-2 pt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Daily Accrual Timeline
          </p>
          <div className="space-y-1.5">
            {summary.salaryHistoryTimeline.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center text-xs p-2 rounded-lg"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <div>
                  <p
                    className="font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    {item.period}
                  </p>
                  <p style={{ color: "var(--muted-foreground)" }}>
                    {item.monthlyRate.toLocaleString()} Birr/mo ({item.daysCount} days)
                  </p>
                </div>
                <span
                  className="font-semibold"
                  style={{ color: "var(--primary)" }}
                >
                  {item.subtotal.toLocaleString()} Birr
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes editor */}
      <div
        className="space-y-2 pt-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <label
            className="text-xs font-medium"
            style={{ color: "var(--muted-foreground)" }}
          >
            Employee Notes
          </label>
          {getNoteDraft(emp.id, emp.notes) !== emp.notes && (
            <span className="text-xs" style={{ color: "var(--primary)" }}>
              unsaved
            </span>
          )}
        </div>
        <textarea
          value={getNoteDraft(emp.id, emp.notes)}
          onChange={(e) =>
            setNotesDraft((prev) => ({
              ...prev,
              [emp.id]: e.target.value,
            }))
          }
          onBlur={(e) => saveNotes(emp, e.target.value)}
          placeholder="Add notes about performance, agreements, attendance..."
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl text-base md:text-sm outline-none resize-none leading-relaxed"
          style={{
            backgroundColor: "var(--secondary)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        />
        <button
          type="button"
          onClick={() => saveNotes(emp, getNoteDraft(emp.id, emp.notes))}
          disabled={getNoteDraft(emp.id, emp.notes) === emp.notes}
          className="w-full py-2 rounded-xl text-xs font-medium transition-all"
          style={{
            backgroundColor:
              getNoteDraft(emp.id, emp.notes) !== emp.notes
                ? "rgba(201,168,76,0.12)"
                : "var(--secondary)",
            color:
              getNoteDraft(emp.id, emp.notes) !== emp.notes
                ? "var(--primary)"
                : "var(--muted-foreground)",
            border:
              getNoteDraft(emp.id, emp.notes) !== emp.notes
                ? "1px solid rgba(201,168,76,0.25)"
                : "1px solid var(--border)",
            cursor:
              getNoteDraft(emp.id, emp.notes) !== emp.notes
                ? "pointer"
                : "default",
          }}
        >
          Save Notes
        </button>
      </div>

      {/* Employee Status & Delete Actions */}
      <div
        className="space-y-2.5 pt-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <p
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--muted-foreground)" }}
        >
          Employee Actions
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onStatusClick(emp)}
            disabled={isSubmitting}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all hover:brightness-110 flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: isActive
                ? "rgba(245, 158, 11, 0.12)"
                : "rgba(74, 222, 128, 0.12)",
              color: isActive ? "#f59e0b" : "#4ade80",
              border: isActive
                ? "1px solid rgba(245, 158, 11, 0.25)"
                : "1px solid rgba(74, 222, 128, 0.25)",
            }}
          >
            {isActive ? "Deactivate Employee" : "Reactivate Employee"}
          </button>
          <button
            type="button"
            onClick={() => onDeleteClick(emp.id)}
            disabled={isSubmitting}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all hover:brightness-110 flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            Delete Employee
          </button>
        </div>
      </div>
    </div>
  );
}
