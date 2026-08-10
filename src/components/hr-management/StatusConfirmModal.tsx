"use client";

import { type Employee } from "../../lib/types";

interface StatusConfirmModalProps {
  statusConfirmEmp: Employee | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (emp: Employee) => Promise<void>;
}

export default function StatusConfirmModal({
  statusConfirmEmp,
  isSubmitting,
  onCancel,
  onConfirm,
}: StatusConfirmModalProps) {
  if (!statusConfirmEmp) return null;

  const isActive = (statusConfirmEmp.status || "active") === "active";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          className="text-base font-bold"
          style={{ color: "var(--foreground)" }}
        >
          {isActive ? "Deactivate Employee?" : "Reactivate Employee?"}
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
        >
          {isActive ? (
            <>
              Are you sure you want to deactivate{" "}
              <strong style={{ color: "var(--foreground)" }}>
                {statusConfirmEmp.name}
              </strong>
              ? They will be marked as inactive (no longer working here), but historical records remain saved.
            </>
          ) : (
            <>
              Are you sure you want to reactivate{" "}
              <strong style={{ color: "var(--foreground)" }}>
                {statusConfirmEmp.name}
              </strong>
              ? They will be restored as an active staff member.
            </>
          )}
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm"
            style={{
              backgroundColor: "var(--secondary)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(statusConfirmEmp)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
            style={{
              backgroundColor: isActive
                ? "rgba(245, 158, 11, 0.15)"
                : "rgba(74, 222, 128, 0.15)",
              color: isActive ? "#f59e0b" : "#4ade80",
              border: isActive
                ? "1px solid rgba(245, 158, 11, 0.3)"
                : "1px solid rgba(74, 222, 128, 0.3)",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting
              ? "Updating..."
              : isActive
              ? "Deactivate"
              : "Reactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}
