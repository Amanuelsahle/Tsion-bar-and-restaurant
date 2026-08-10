"use client";

import { useState, useEffect } from "react";
import {
  WORK_ROLES,
  type Employee,
  type SalaryTransaction,
  type WorkRole,
} from "../../lib/types";

import AddEmployeeModal from "./AddEmployeeModal";
import DeleteModal from "./DeleteModal";
import EmployeeDetailView from "./EmployeeDetailView";
import EmployeeListView from "./EmployeeListView";
import StatusConfirmModal from "./StatusConfirmModal";
import {
  ACTION_META,
  calculateAccruedPayroll,
  type ActionType,
} from "./hr-utils";

export { calculateAccruedPayroll, type AccruedPayrollSummary } from "./hr-utils";

interface HRManagementProps {
  employees: Employee[];
  onAdd: (
    emp: Omit<Employee, "id" | "paidThisMonth" | "history" | "notes">,
  ) => Promise<void>;
  onUpdate: (emp: Employee) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSalaryAction: (
    empId: string,
    action: {
      type: "payment" | "advance" | "increase";
      amount: number;
      note: string;
      date: string;
    },
  ) => Promise<void>;
}

export default function HRManagement({
  employees,
  onAdd,
  onUpdate,
  onDelete,
  onSalaryAction,
}: HRManagementProps) {
  const [searchName, setSearchName] = useState("");
  const [filterRole, setFilterRole] = useState<WorkRole | "All">("All");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [mobileTab, setMobileTab] = useState<"profile" | "actions" | "audit">("profile");
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusConfirmEmp, setStatusConfirmEmp] = useState<Employee | null>(null);
  const [actionType, setActionType] = useState<ActionType>("payment");
  const [actionAmount, setActionAmount] = useState<number>(0);
  const [actionNote, setActionNote] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [selectedEmp, mobileTab]);

  const activeEmployees = employees.filter(
    (e) => (e.status || "active") === "active",
  );
  const inactiveEmployees = employees.filter(
    (e) => e.status === "inactive",
  );

  const filtered = employees.filter((e) => {
    const empStatus = e.status || "active";
    const matchStatus =
      statusFilter === "all" || empStatus === statusFilter;
    const matchRole = filterRole === "All" || e.role === filterRole;
    const matchName =
      !searchName || e.name.toLowerCase().includes(searchName.toLowerCase());
    return matchStatus && matchRole && matchName;
  });

  const totalBasePayroll = activeEmployees.reduce(
    (s, e) => s + (e.baseSalary || 0),
    0,
  );
  const totalNetBalanceDueAll = employees.reduce(
    (s, e) => s + calculateAccruedPayroll(e).netBalanceDue,
    0,
  );

  const roleCounts = WORK_ROLES.map((r) => ({
    role: r,
    count: activeEmployees.filter((e) => e.role === r).length,
  })).filter((r) => r.count > 0);

  async function handleAction() {
    if (!selectedEmp || actionAmount <= 0 || isSubmitting) return;

    const emp =
      employees.find(
        (e) =>
          e.id === selectedEmp.id ||
          (e.name && e.name === selectedEmp.name),
      ) ?? selectedEmp;

    const summary = calculateAccruedPayroll(emp);
    const maxPaymentAllowed = Math.max(0, summary.netBalanceDue);

    if (actionType === "payment" && actionAmount > maxPaymentAllowed) {
      setActionError(
        `Payout amount (${actionAmount.toLocaleString()} Birr) cannot exceed employee's remaining balance due (${maxPaymentAllowed.toLocaleString()} Birr).`,
      );
      return;
    }

    setActionError("");
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await onSalaryAction(emp.id, {
        type: actionType,
        amount: actionAmount,
        note: actionNote || ACTION_META[actionType].label,
        date: today,
      });

      const updatedHistoryItem: SalaryTransaction = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `a0000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`,
        date: today,
        type: actionType,
        amount: actionAmount,
        note: actionNote || ACTION_META[actionType].label,
      };

      const updatedEmp: Employee = {
        ...selectedEmp,
        baseSalary:
          actionType === "increase"
            ? selectedEmp.baseSalary + actionAmount
            : selectedEmp.baseSalary,
        paidThisMonth:
          actionType === "payment"
            ? selectedEmp.paidThisMonth + actionAmount
            : selectedEmp.paidThisMonth,
        history: [updatedHistoryItem, ...(selectedEmp.history || [])],
      };

      setSelectedEmp(updatedEmp);
      setActionSuccess(
        `${ACTION_META[actionType].label} of ${actionAmount.toLocaleString()} Birr recorded.`,
      );
      setActionAmount(0);
      setActionNote("");
      setTimeout(() => setActionSuccess(""), 3500);
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAdd(
    empData: Omit<Employee, "id" | "paidThisMonth" | "history" | "notes">,
  ) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAdd(empData);
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to add employee:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveNotes(emp: Employee, value: string) {
    try {
      await onUpdate({ ...emp, notes: value });
      setNotesDraft((prev) => {
        const n = { ...prev };
        delete n[emp.id];
        return n;
      });
    } catch (err) {
      console.error("Failed to save notes:", err);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onDelete(deleteId);
      if (selectedEmp?.id === deleteId) {
        setSelectedEmp(null);
      }
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete employee:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(targetEmp: Employee) {
    if (isSubmitting) return;
    const newStatus = (targetEmp.status || "active") === "active" ? "inactive" : "active";
    const updated = { ...targetEmp, status: newStatus as "active" | "inactive" };
    setIsSubmitting(true);
    try {
      await onUpdate(updated);
      if (selectedEmp && (selectedEmp.id === targetEmp.id || selectedEmp.name === targetEmp.name)) {
        setSelectedEmp(updated);
      }
      setActionSuccess(
        `${targetEmp.name} is now marked as ${newStatus === "active" ? "Active" : "Inactive (Former Employee)"}.`,
      );
      setTimeout(() => setActionSuccess(""), 3500);
    } catch (err) {
      console.error("Failed to toggle status:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeEmpForDetail = selectedEmp
    ? employees.find(
        (e) => e.id === selectedEmp.id || (e.name && e.name === selectedEmp.name),
      ) ?? selectedEmp
    : null;

  return (
    <>
      {activeEmpForDetail ? (
        <EmployeeDetailView
          emp={activeEmpForDetail}
          mobileTab={mobileTab}
          setMobileTab={setMobileTab}
          onBack={() => setSelectedEmp(null)}
          notesDraft={notesDraft}
          setNotesDraft={setNotesDraft}
          saveNotes={saveNotes}
          isSubmitting={isSubmitting}
          onStatusClick={(emp) => setStatusConfirmEmp(emp)}
          onDeleteClick={(id) => setDeleteId(id)}
          actionType={actionType}
          setActionType={setActionType}
          actionAmount={actionAmount}
          setActionAmount={setActionAmount}
          actionNote={actionNote}
          setActionNote={setActionNote}
          actionSuccess={actionSuccess}
          actionError={actionError}
          setActionError={setActionError}
          handleAction={handleAction}
        />
      ) : (
        <EmployeeListView
          employees={employees}
          activeEmployees={activeEmployees}
          inactiveEmployees={inactiveEmployees}
          filtered={filtered}
          totalBasePayroll={totalBasePayroll}
          totalNetBalanceDueAll={totalNetBalanceDueAll}
          roleCounts={roleCounts}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchName={searchName}
          setSearchName={setSearchName}
          filterRole={filterRole}
          setFilterRole={setFilterRole}
          onShowAddForm={() => setShowAddForm(true)}
          onSelectEmployee={(emp) => {
            setSelectedEmp(emp);
            setMobileTab("profile");
          }}
        />
      )}

      <AddEmployeeModal
        show={showAddForm}
        isSubmitting={isSubmitting}
        onClose={() => setShowAddForm(false)}
        onAdd={handleAdd}
      />

      <DeleteModal
        deleteId={deleteId}
        employeeName={
          employees.find((e) => e.id === deleteId)?.name || selectedEmp?.name || ""
        }
        isSubmitting={isSubmitting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
      />

      <StatusConfirmModal
        statusConfirmEmp={statusConfirmEmp}
        isSubmitting={isSubmitting}
        onCancel={() => setStatusConfirmEmp(null)}
        onConfirm={async (target) => {
          setStatusConfirmEmp(null);
          await handleToggleStatus(target);
        }}
      />
    </>
  );
}
