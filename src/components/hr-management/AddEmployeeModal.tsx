"use client";

import { useState } from "react";
import { WORK_ROLES, type Employee, type WorkRole } from "../../lib/types";

interface AddEmployeeModalProps {
  show: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onAdd: (
    emp: Omit<Employee, "id" | "paidThisMonth" | "history" | "notes">,
  ) => Promise<void>;
}

export default function AddEmployeeModal({
  show,
  isSubmitting,
  onClose,
  onAdd,
}: AddEmployeeModalProps) {
  const [addForm, setAddForm] = useState({
    name: "",
    hireDate: new Date().toISOString().split("T")[0],
    role: "Waiter" as WorkRole,
    baseSalary: 5000,
  });

  if (!show) return null;

  async function handleSubmit() {
    if (!addForm.name || addForm.baseSalary <= 0 || isSubmitting) return;
    await onAdd({
      name: addForm.name,
      hireDate: addForm.hireDate,
      role: addForm.role,
      baseSalary: addForm.baseSalary,
    });
    setAddForm({
      name: "",
      hireDate: new Date().toISOString().split("T")[0],
      role: "Waiter",
      baseSalary: 5000,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-lg font-bold font-display"
            style={{ color: "var(--foreground)" }}
          >
            Add New Employee
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl"
            style={{ color: "var(--muted-foreground)" }}
          >
            ×
          </button>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium"
              style={{ color: "var(--muted-foreground)" }}
            >
              Full Name
            </label>
            <input
              value={addForm.name}
              onChange={(e) =>
                setAddForm({ ...addForm, name: e.target.value })
              }
              placeholder="e.g. Abebe Girma"
              className="w-full px-4 py-2.5 rounded-xl text-base md:text-sm outline-none"
              style={{
                backgroundColor: "var(--secondary)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--muted-foreground)" }}
              >
                Hire Date
              </label>
              <input
                type="date"
                value={addForm.hireDate}
                onChange={(e) =>
                  setAddForm({ ...addForm, hireDate: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl text-base md:text-sm outline-none"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  colorScheme: "dark",
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--muted-foreground)" }}
              >
                Work Role
              </label>
              <select
                value={addForm.role}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    role: e.target.value as WorkRole,
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                {WORK_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium"
              style={{ color: "var(--muted-foreground)" }}
            >
              Monthly Base Salary (Birr)
            </label>
            <input
              type="number"
              min={1}
              value={addForm.baseSalary}
              onChange={(e) =>
                setAddForm({ ...addForm, baseSalary: +e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl text-base md:text-sm outline-none"
              style={{
                backgroundColor: "var(--secondary)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm"
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
            onClick={handleSubmit}
            disabled={!addForm.name || addForm.baseSalary <= 0 || isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: "linear-gradient(135deg, #c9a84c, #a07828)",
              color: "#0f1117",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Adding..." : "Add Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}
