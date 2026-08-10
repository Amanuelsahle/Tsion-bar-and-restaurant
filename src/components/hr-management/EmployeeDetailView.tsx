"use client";

import { type Employee } from "../../lib/types";
import EmployeeProfileCard from "./EmployeeProfileCard";
import SalaryActionPanel from "./SalaryActionPanel";
import SalaryAuditLog from "./SalaryAuditLog";
import { calculateAccruedPayroll, type ActionType } from "./hr-utils";

interface EmployeeDetailViewProps {
  emp: Employee;
  mobileTab: "profile" | "actions" | "audit";
  setMobileTab: (t: "profile" | "actions" | "audit") => void;
  onBack: () => void;
  notesDraft: Record<string, string>;
  setNotesDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  saveNotes: (emp: Employee, value: string) => Promise<void>;
  isSubmitting: boolean;
  onStatusClick: (emp: Employee) => void;
  onDeleteClick: (id: string) => void;
  actionType: ActionType;
  setActionType: (t: ActionType) => void;
  actionAmount: number;
  setActionAmount: (a: number) => void;
  actionNote: string;
  setActionNote: (n: string) => void;
  actionSuccess: string;
  actionError: string;
  setActionError: (e: string) => void;
  handleAction: () => Promise<void>;
}

export default function EmployeeDetailView({
  emp,
  mobileTab,
  setMobileTab,
  onBack,
  notesDraft,
  setNotesDraft,
  saveNotes,
  isSubmitting,
  onStatusClick,
  onDeleteClick,
  actionType,
  setActionType,
  actionAmount,
  setActionAmount,
  actionNote,
  setActionNote,
  actionSuccess,
  actionError,
  setActionError,
  handleAction,
}: EmployeeDetailViewProps) {
  const summary = calculateAccruedPayroll(emp);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm px-4 py-2 rounded-xl transition-all"
          style={{
            backgroundColor: "var(--secondary)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        >
          ← Back to All Employees
        </button>
        <div>
          <h1
            className="text-xl font-bold font-display"
            style={{ color: "var(--foreground)" }}
          >
            {emp.name}
          </h1>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--muted-foreground)" }}
          >
            Employee Profile & Daily Accrued Payroll
          </p>
        </div>
      </div>

      {/* Mobile Navigation Segmented Bar */}
      <div
        className="lg:hidden flex items-center p-1 rounded-2xl gap-1"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={() => setMobileTab("profile")}
          className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5"
          style={{
            backgroundColor:
              mobileTab === "profile"
                ? "rgba(201,168,76,0.15)"
                : "transparent",
            color:
              mobileTab === "profile"
                ? "var(--primary)"
                : "var(--muted-foreground)",
            border:
              mobileTab === "profile"
                ? "1px solid rgba(201,168,76,0.3)"
                : "1px solid transparent",
          }}
        >
          <span>👤</span>
          <span>Profile</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("actions")}
          className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5"
          style={{
            backgroundColor:
              mobileTab === "actions"
                ? "rgba(74,222,128,0.15)"
                : "transparent",
            color:
              mobileTab === "actions"
                ? "#4ade80"
                : "var(--muted-foreground)",
            border:
              mobileTab === "actions"
                ? "1px solid rgba(74,222,128,0.3)"
                : "1px solid transparent",
          }}
        >
          <span>💰</span>
          <span>Actions</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("audit")}
          className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5"
          style={{
            backgroundColor:
              mobileTab === "audit"
                ? "rgba(59,130,246,0.15)"
                : "transparent",
            color:
              mobileTab === "audit"
                ? "#60a5fa"
                : "var(--muted-foreground)",
            border:
              mobileTab === "audit"
                ? "1px solid rgba(59,130,246,0.3)"
                : "1px solid transparent",
          }}
        >
          <span>📜</span>
          <span>Audit Log</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EmployeeProfileCard
          emp={emp}
          summary={summary}
          notesDraft={notesDraft}
          setNotesDraft={setNotesDraft}
          saveNotes={saveNotes}
          isSubmitting={isSubmitting}
          onStatusClick={onStatusClick}
          onDeleteClick={onDeleteClick}
          mobileTab={mobileTab}
        />

        <SalaryActionPanel
          emp={emp}
          summary={summary}
          actionType={actionType}
          setActionType={setActionType}
          actionAmount={actionAmount}
          setActionAmount={setActionAmount}
          actionNote={actionNote}
          setActionNote={setActionNote}
          actionSuccess={actionSuccess}
          actionError={actionError}
          setActionError={setActionError}
          isSubmitting={isSubmitting}
          handleAction={handleAction}
          mobileTab={mobileTab}
        />

        <SalaryAuditLog emp={emp} mobileTab={mobileTab} />
      </div>
    </div>
  );
}
