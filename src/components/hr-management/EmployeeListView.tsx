"use client";

import { WORK_ROLES, type Employee, type WorkRole } from "../../lib/types";
import { ROLE_COLORS, calculateAccruedPayroll } from "./hr-utils";

interface EmployeeListViewProps {
  employees: Employee[];
  activeEmployees: Employee[];
  inactiveEmployees: Employee[];
  filtered: Employee[];
  totalBasePayroll: number;
  totalNetBalanceDueAll: number;
  roleCounts: Array<{ role: WorkRole; count: number }>;
  statusFilter: "active" | "inactive" | "all";
  setStatusFilter: (f: "active" | "inactive" | "all") => void;
  searchName: string;
  setSearchName: (s: string) => void;
  filterRole: WorkRole | "All";
  setFilterRole: (r: WorkRole | "All") => void;
  onShowAddForm: () => void;
  onSelectEmployee: (emp: Employee) => void;
}

export default function EmployeeListView({
  employees,
  activeEmployees,
  inactiveEmployees,
  filtered,
  totalBasePayroll,
  totalNetBalanceDueAll,
  roleCounts,
  statusFilter,
  setStatusFilter,
  searchName,
  setSearchName,
  filterRole,
  setFilterRole,
  onShowAddForm,
  onSelectEmployee,
}: EmployeeListViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-2xl font-bold font-display"
            style={{ color: "var(--foreground)" }}
          >
            HR Management
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Employee records, daily-precision accrued payroll, salary increases & payout history
          </p>
        </div>
        <button
          type="button"
          onClick={onShowAddForm}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, #c9a84c, #a07828)",
            color: "#0f1117",
          }}
        >
          + Add Employee
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Active Staff",
            value: activeEmployees.length,
            unit: `active employee${activeEmployees.length !== 1 ? "s" : ""}`,
          },
          {
            label: "Inactive Staff",
            value: inactiveEmployees.length,
            unit: `former / inactive`,
            amber: inactiveEmployees.length > 0,
          },
          {
            label: "Active Base Payroll",
            value: `${(totalBasePayroll / 1000).toFixed(1)}k`,
            unit: "Birr/month",
          },
          {
            label: "Total Net Balance Due",
            value: `${(totalNetBalanceDueAll / 1000).toFixed(1)}k`,
            unit: "Birr daily unpaid balance",
            alert: totalNetBalanceDueAll > 0,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-5"
            style={{
              backgroundColor: card.alert
                ? "rgba(74,222,128,0.06)"
                : card.amber
                  ? "rgba(245,158,11,0.06)"
                  : "var(--card)",
              border: card.alert
                ? "1px solid rgba(74,222,128,0.2)"
                : card.amber
                  ? "1px solid rgba(245,158,11,0.2)"
                  : "1px solid var(--border)",
            }}
          >
            <p
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)" }}
            >
              {card.label}
            </p>
            <p
              className="text-3xl font-bold font-display mt-3"
              style={{
                color: card.alert
                  ? "#4ade80"
                  : card.amber
                    ? "#f59e0b"
                    : "var(--primary)",
              }}
            >
              {card.value}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              {card.unit}
            </p>
          </div>
        ))}
      </div>

      {/* Role distribution chips */}
      <div className="flex flex-wrap gap-2">
        {roleCounts.map((rc) => (
          <div
            key={rc.role}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
            style={{
              backgroundColor: `${ROLE_COLORS[rc.role]}10`,
              border: `1px solid ${ROLE_COLORS[rc.role]}25`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: ROLE_COLORS[rc.role] }}
            />
            <span style={{ color: ROLE_COLORS[rc.role] }}>{rc.role}</span>
            <span
              className="font-semibold"
              style={{ color: "var(--muted-foreground)" }}
            >
              {rc.count}
            </span>
          </div>
        ))}
      </div>

      {/* Status Filter Tabs & Search Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
            style={{
              backgroundColor:
                statusFilter === "active"
                  ? "rgba(74, 222, 128, 0.15)"
                  : "var(--secondary)",
              color:
                statusFilter === "active" ? "#4ade80" : "var(--foreground)",
              border:
                statusFilter === "active"
                  ? "1px solid rgba(74, 222, 128, 0.3)"
                  : "1px solid var(--border)",
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#4ade80" }} />
            Active Staff ({activeEmployees.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
            style={{
              backgroundColor:
                statusFilter === "inactive"
                  ? "rgba(245, 158, 11, 0.15)"
                  : "var(--secondary)",
              color:
                statusFilter === "inactive" ? "#f59e0b" : "var(--foreground)",
              border:
                statusFilter === "inactive"
                  ? "1px solid rgba(245, 158, 11, 0.3)"
                  : "1px solid var(--border)",
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
            Inactive / Former Staff ({inactiveEmployees.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
            style={{
              backgroundColor:
                statusFilter === "all"
                  ? "rgba(59, 130, 246, 0.15)"
                  : "var(--secondary)",
              color:
                statusFilter === "all" ? "#60a5fa" : "var(--foreground)",
              border:
                statusFilter === "all"
                  ? "1px solid rgba(59, 130, 246, 0.3)"
                  : "1px solid var(--border)",
            }}
          >
            All Staff ({employees.length})
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Search by name..."
            className="px-4 py-2.5 rounded-xl text-base md:text-sm outline-none flex-1 min-w-48"
            style={{
              backgroundColor: "var(--secondary)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as WorkRole | "All")}
            className="px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              backgroundColor: "var(--secondary)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            <option value="All">All Work Roles</option>
            {WORK_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {(searchName || filterRole !== "All" || statusFilter !== "active") && (
            <button
              type="button"
              onClick={() => {
                setSearchName("");
                setFilterRole("All");
                setStatusFilter("active");
              }}
              className="px-4 py-2.5 rounded-xl text-sm"
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                color: "#f87171",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Employee table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {[
                  "Employee",
                  "Role",
                  "Hire Date",
                  "Tenure & Days",
                  "Base Salary Rate",
                  "Total Advances",
                  "Total Paid",
                  "Net Accumulated Due",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => {
                const summary = calculateAccruedPayroll(emp);
                const isEmpActive = (emp.status || "active") === "active";
                return (
                  <tr
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp)}
                    className="cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                    title="Click to view employee profile and salary details"
                    style={{
                      borderBottom:
                        i < filtered.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                      backgroundColor: "var(--card)",
                      opacity: isEmpActive ? 1 : 0.82,
                    }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: `${ROLE_COLORS[emp.role] || "#c9a84c"}15`,
                              color: ROLE_COLORS[emp.role] || "#c9a84c",
                            }}
                          >
                            {emp.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--card)] ${
                              isEmpActive ? "bg-emerald-400" : "bg-amber-400"
                            }`}
                            title={isEmpActive ? "Active Staff" : "Inactive / Former Staff"}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-medium hover:underline"
                            style={{ color: "var(--foreground)" }}
                          >
                            {emp.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${ROLE_COLORS[emp.role] || "#c9a84c"}15`,
                          color: ROLE_COLORS[emp.role] || "#c9a84c",
                          border: `1px solid ${ROLE_COLORS[emp.role] || "#c9a84c"}25`,
                        }}
                      >
                        {emp.role}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-xs"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {emp.hireDate}
                    </td>
                    <td
                      className="px-5 py-4 text-xs"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {summary.monthsWorkedFormatted} ({summary.totalDaysWorked} days)
                    </td>
                    <td
                      className="px-5 py-4 font-semibold"
                      style={{ color: "var(--primary)" }}
                    >
                      {emp.baseSalary.toLocaleString()} Birr/mo
                      <span className="block text-[11px] font-normal opacity-70">
                        ~{summary.dailyRateCurrent.toLocaleString()} Birr/day
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {summary.totalAdvances > 0 ? (
                        <span
                          className="font-medium"
                          style={{ color: "#fb923c" }}
                        >
                          −{summary.totalAdvances.toLocaleString()} Birr
                        </span>
                      ) : (
                        <span style={{ color: "var(--muted-foreground)" }}>
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {summary.totalPaidOut > 0 ? (
                        <span
                          className="font-medium"
                          style={{ color: "#4ade80" }}
                        >
                          {summary.totalPaidOut.toLocaleString()} Birr
                        </span>
                      ) : (
                        <span style={{ color: "var(--muted-foreground)" }}>
                          —
                        </span>
                      )}
                    </td>
                    <td
                      className="px-5 py-4 font-semibold text-base"
                      style={{ color: "#4ade80" }}
                    >
                      {summary.netBalanceDue.toLocaleString()} Birr
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div
            className="py-16 text-center text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            No employees match your search criteria.
          </div>
        )}
      </div>
    </div>
  );
}
