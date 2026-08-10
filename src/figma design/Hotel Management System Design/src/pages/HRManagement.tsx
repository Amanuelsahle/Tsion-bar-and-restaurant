import { useState } from "react";
import type { Employee, WorkRole, SalaryTransaction } from "../data/mockData";
import { WORK_ROLES } from "../data/mockData";

interface HRManagementProps {
  employees: Employee[];
  onAdd: (emp: Employee) => void;
  onUpdate: (emp: Employee) => void;
  onDelete: (id: string) => void;
}

const ROLE_COLORS: Record<WorkRole, string> = {
  Manager:           "#c9a84c",
  "Bar Man":         "#3b82f6",
  Cashier:           "#8b5cf6",
  Waiter:            "#06b6d4",
  Chef:              "#f59e0b",
  Sanitary:          "#10b981",
  "Kitchen Assistant": "#f97316",
  Security:          "#ef4444",
};

type ActionType = "payment" | "advance" | "deduction" | "increase";

const ACTION_META: Record<ActionType, { label: string; color: string; sign: string }> = {
  payment:   { label: "Pay Salary",        color: "#4ade80", sign: "−" },
  advance:   { label: "Salary Advance",    color: "#fb923c", sign: "−" },
  deduction: { label: "Deduct Amount",     color: "#f87171", sign: "−" },
  increase:  { label: "Increase Salary",   color: "#c9a84c", sign: "+" },
};

function yrs(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
  return diff === 0 ? "< 1 yr" : `${diff} yr${diff > 1 ? "s" : ""}`;
}

function totalAdvancesThisMonth(emp: Employee) {
  const m = new Date().toISOString().slice(0, 7);
  return emp.history
    .filter(h => h.date.startsWith(m) && (h.type === "advance" || h.type === "deduction"))
    .reduce((s, h) => s + h.amount, 0);
}

export default function HRManagement({ employees, onAdd, onUpdate, onDelete }: HRManagementProps) {
  const [searchName, setSearchName] = useState("");
  const [filterRole, setFilterRole] = useState<WorkRole | "All">("All");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<ActionType>("payment");
  const [actionAmount, setActionAmount] = useState(0);
  const [actionNote, setActionNote] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Add form state
  const [addForm, setAddForm] = useState({ name: "", hireDate: new Date().toISOString().split("T")[0], role: "Waiter" as WorkRole, baseSalary: 5000 });

  const filtered = employees.filter(e => {
    const matchRole = filterRole === "All" || e.role === filterRole;
    const matchName = !searchName || e.name.toLowerCase().includes(searchName.toLowerCase());
    return matchRole && matchName;
  });

  // Summary stats
  const totalPayroll = employees.reduce((s, e) => s + e.baseSalary, 0);
  const totalAdvanced = employees.reduce((s, e) => s + totalAdvancesThisMonth(e), 0);
  const roleCounts = WORK_ROLES.map(r => ({ role: r, count: employees.filter(e => e.role === r).length })).filter(r => r.count > 0);

  function handleAction() {
    if (!selectedEmp || actionAmount <= 0) return;
    const txn: SalaryTransaction = {
      id: `ST${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: actionType,
      amount: actionAmount,
      note: actionNote || ACTION_META[actionType].label,
    };
    const updated: Employee = {
      ...selectedEmp,
      baseSalary: actionType === "increase" ? selectedEmp.baseSalary + actionAmount : selectedEmp.baseSalary,
      paidThisMonth: actionType === "payment" ? selectedEmp.paidThisMonth + actionAmount : selectedEmp.paidThisMonth,
      history: [txn, ...selectedEmp.history],
    };
    onUpdate(updated);
    setSelectedEmp(updated);
    setActionSuccess(`${ACTION_META[actionType].label} of ${actionAmount.toLocaleString()} Birr recorded.`);
    setActionAmount(0);
    setActionNote("");
    setTimeout(() => setActionSuccess(""), 3500);
  }

  function handleAdd() {
    if (!addForm.name || addForm.baseSalary <= 0) return;
    const emp: Employee = { id: `E${Date.now()}`, ...addForm, paidThisMonth: 0, history: [], notes: "" };
    onAdd(emp);
    setShowAddForm(false);
    setAddForm({ name: "", hireDate: new Date().toISOString().split("T")[0], role: "Waiter", baseSalary: 5000 });
  }

  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  function getNoteDraft(empId: string, fallback: string) {
    return empId in notesDraft ? notesDraft[empId] : fallback;
  }

  function saveNotes(emp: Employee, value: string) {
    onUpdate({ ...emp, notes: value });
    setNotesDraft(prev => { const n = { ...prev }; delete n[emp.id]; return n; });
  }

  // Detail panel
  if (selectedEmp) {
    const emp = employees.find(e => e.id === selectedEmp.id) ?? selectedEmp;
    const advanced = totalAdvancesThisMonth(emp);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedEmp(null)}
            className="text-sm px-4 py-2 rounded-xl"
            style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold font-display" style={{ color: "var(--foreground)" }}>{emp.name}</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Employee Profile</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile card */}
          <div className="rounded-2xl p-6 space-y-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
                style={{ backgroundColor: `${ROLE_COLORS[emp.role]}18`, color: ROLE_COLORS[emp.role], border: `1px solid ${ROLE_COLORS[emp.role]}30` }}>
                {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold" style={{ color: "var(--foreground)" }}>{emp.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                  style={{ backgroundColor: `${ROLE_COLORS[emp.role]}18`, color: ROLE_COLORS[emp.role], border: `1px solid ${ROLE_COLORS[emp.role]}30` }}>
                  {emp.role}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Employee ID", value: emp.id },
                { label: "Hire Date", value: emp.hireDate },
                { label: "Tenure", value: yrs(emp.hireDate) },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center text-sm">
                  <span style={{ color: "var(--muted-foreground)" }}>{row.label}</span>
                  <span style={{ color: "var(--foreground)" }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Base Salary</span>
                <span className="text-lg font-bold font-display" style={{ color: "var(--primary)" }}>{emp.baseSalary.toLocaleString()} Birr</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>Advances (this month)</span>
                <span style={{ color: advanced > 0 ? "#fb923c" : "var(--muted-foreground)" }}>{advanced.toLocaleString()} Birr</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>Net this month</span>
                <span className="font-semibold" style={{ color: "#4ade80" }}>{Math.max(0, emp.baseSalary - advanced).toLocaleString()} Birr</span>
              </div>
            </div>
            <div className="space-y-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Notes</label>
                {getNoteDraft(emp.id, emp.notes) !== emp.notes && (
                  <span className="text-xs" style={{ color: "var(--primary)" }}>unsaved</span>
                )}
              </div>
              <textarea
                value={getNoteDraft(emp.id, emp.notes)}
                onChange={e => setNotesDraft(prev => ({ ...prev, [emp.id]: e.target.value }))}
                onBlur={e => saveNotes(emp, e.target.value)}
                placeholder="Add notes about this employee — performance, attendance, agreements, etc."
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none leading-relaxed"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
              />
              <button
                onClick={() => saveNotes(emp, getNoteDraft(emp.id, emp.notes))}
                disabled={getNoteDraft(emp.id, emp.notes) === emp.notes}
                className="w-full py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  backgroundColor: getNoteDraft(emp.id, emp.notes) !== emp.notes ? "rgba(201,168,76,0.12)" : "var(--secondary)",
                  color: getNoteDraft(emp.id, emp.notes) !== emp.notes ? "var(--primary)" : "var(--muted-foreground)",
                  border: getNoteDraft(emp.id, emp.notes) !== emp.notes ? "1px solid rgba(201,168,76,0.25)" : "1px solid var(--border)",
                  cursor: getNoteDraft(emp.id, emp.notes) !== emp.notes ? "pointer" : "default",
                }}>
                Save Notes
              </button>
            </div>
          </div>

          {/* Action panel */}
          <div className="rounded-2xl p-6 space-y-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Salary Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(ACTION_META) as [ActionType, typeof ACTION_META[ActionType]][]).map(([key, meta]) => (
                <button key={key} onClick={() => setActionType(key)}
                  className="px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left"
                  style={{
                    backgroundColor: actionType === key ? `${meta.color}18` : "var(--secondary)",
                    color: actionType === key ? meta.color : "var(--muted-foreground)",
                    border: actionType === key ? `1px solid ${meta.color}30` : "1px solid var(--border)",
                  }}>
                  {meta.label}
                </button>
              ))}
            </div>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Amount (Birr)</label>
                <input type="number" min={1} value={actionAmount || ""} onChange={e => setActionAmount(+e.target.value)}
                  placeholder={actionType === "increase" ? "e.g. 500" : `e.g. ${Math.round(emp.baseSalary / 4)}`}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => (e.currentTarget.style.borderColor = ACTION_META[actionType].color)}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
              </div>
              {actionType === "payment" && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", color: "#4ade80" }}>
                  Full salary: {emp.baseSalary.toLocaleString()} Birr
                  {advanced > 0 && ` · Advances deducted: ${advanced.toLocaleString()} Birr`}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Note (optional)</label>
                <input value={actionNote} onChange={e => setActionNote(e.target.value)} placeholder="Reason..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
              </div>
              {actionSuccess && (
                <div className="px-4 py-3 rounded-xl text-xs" style={{ backgroundColor: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}>
                  ✓ {actionSuccess}
                </div>
              )}
              <button onClick={handleAction} disabled={actionAmount <= 0}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: actionAmount > 0 ? `linear-gradient(135deg, ${ACTION_META[actionType].color}, ${ACTION_META[actionType].color}bb)` : "var(--muted)",
                  color: actionAmount > 0 ? "#0f1117" : "var(--muted-foreground)",
                  cursor: actionAmount > 0 ? "pointer" : "not-allowed",
                }}>
                Confirm {ACTION_META[actionType].label}
              </button>
            </div>
          </div>

          {/* History */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Transaction History</h2>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
              {emp.history.length === 0 ? (
                <div className="py-10 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>No transactions yet.</div>
              ) : emp.history.map((tx, i) => (
                <div key={tx.id} className="flex items-start gap-3 px-5 py-3.5" style={{ borderBottom: i < emp.history.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: `${ACTION_META[tx.type].color}15`, color: ACTION_META[tx.type].color }}>
                    {tx.type === "increase" ? "↑" : tx.type === "payment" ? "✓" : "↓"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{tx.note}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{tx.date}</p>
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0" style={{ color: ACTION_META[tx.type].color }}>
                    {tx.type === "increase" ? "+" : "−"}{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--foreground)" }}>HR Management</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Employee records, salaries, and payroll actions</p>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #c9a84c, #a07828)", color: "#0f1117" }}>
          + Add Employee
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Employees", value: employees.length, unit: "staff" },
          { label: "Monthly Payroll", value: `${(totalPayroll / 1000).toFixed(1)}k`, unit: "Birr" },
          { label: "Advances This Month", value: `${totalAdvanced.toLocaleString()}`, unit: "Birr", alert: totalAdvanced > 0 },
          { label: "Net Payroll", value: `${((totalPayroll - totalAdvanced) / 1000).toFixed(1)}k`, unit: "Birr" },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-5"
            style={{ backgroundColor: card.alert ? "rgba(251,146,60,0.06)" : "var(--card)", border: card.alert ? "1px solid rgba(251,146,60,0.2)" : "1px solid var(--border)" }}>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>{card.label}</p>
            <p className="text-3xl font-bold font-display mt-3" style={{ color: card.alert ? "#fb923c" : "var(--primary)" }}>{card.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{card.unit}</p>
          </div>
        ))}
      </div>

      {/* Role distribution chips */}
      <div className="flex flex-wrap gap-2">
        {roleCounts.map(rc => (
          <div key={rc.role} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
            style={{ backgroundColor: `${ROLE_COLORS[rc.role as WorkRole]}10`, border: `1px solid ${ROLE_COLORS[rc.role as WorkRole]}25` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ROLE_COLORS[rc.role as WorkRole] }} />
            <span style={{ color: ROLE_COLORS[rc.role as WorkRole] }}>{rc.role}</span>
            <span className="font-semibold" style={{ color: "var(--muted-foreground)" }}>{rc.count}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="Search by name..."
          className="px-4 py-2.5 rounded-xl text-sm outline-none flex-1 min-w-48"
          style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
          onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
          <option value="All">All Roles</option>
          {WORK_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {(searchName || filterRole !== "All") && (
          <button onClick={() => { setSearchName(""); setFilterRole("All"); }}
            className="px-4 py-2.5 rounded-xl text-sm"
            style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
            Clear
          </button>
        )}
      </div>

      {/* Employee table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)" }}>
                {["Employee", "Role", "Hire Date", "Tenure", "Base Salary", "Advances (Month)", "Net Due", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => {
                const advanced = totalAdvancesThisMonth(emp);
                const net = Math.max(0, emp.baseSalary - advanced);
                return (
                  <tr key={emp.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", backgroundColor: "var(--card)" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--card)")}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: `${ROLE_COLORS[emp.role]}15`, color: ROLE_COLORS[emp.role] }}>
                          {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-medium" style={{ color: "var(--foreground)" }}>{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${ROLE_COLORS[emp.role]}15`, color: ROLE_COLORS[emp.role], border: `1px solid ${ROLE_COLORS[emp.role]}25` }}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: "var(--muted-foreground)" }}>{emp.hireDate}</td>
                    <td className="px-5 py-4 text-xs" style={{ color: "var(--muted-foreground)" }}>{yrs(emp.hireDate)}</td>
                    <td className="px-5 py-4 font-semibold" style={{ color: "var(--primary)" }}>{emp.baseSalary.toLocaleString()} Birr</td>
                    <td className="px-5 py-4">
                      {advanced > 0
                        ? <span className="font-medium" style={{ color: "#fb923c" }}>−{advanced.toLocaleString()} Birr</span>
                        : <span style={{ color: "var(--muted-foreground)" }}>—</span>}
                    </td>
                    <td className="px-5 py-4 font-semibold" style={{ color: "#4ade80" }}>{net.toLocaleString()} Birr</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedEmp(emp)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                          Manage
                        </button>
                        <button onClick={() => setDeleteId(emp.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.15)" }}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No employees match your filters.</div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display" style={{ color: "var(--foreground)" }}>Add New Employee</h2>
              <button onClick={() => setShowAddForm(false)} className="text-xl" style={{ color: "var(--muted-foreground)" }}>×</button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Full Name</label>
                <input value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="e.g. Abebe Girma"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Hire Date</label>
                  <input type="date" value={addForm.hireDate} onChange={e => setAddForm({ ...addForm, hireDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)", colorScheme: "dark" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Role</label>
                  <select value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value as WorkRole })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                    {WORK_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Monthly Base Salary (Birr)</label>
                <input type="number" min={1} value={addForm.baseSalary} onChange={e => setAddForm({ ...addForm, baseSalary: +e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm"
                style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={!addForm.name || addForm.baseSalary <= 0}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #c9a84c, #a07828)", color: "#0f1117" }}>
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>Remove Employee?</h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              This will permanently remove <strong style={{ color: "var(--foreground)" }}>{employees.find(e => e.id === deleteId)?.name}</strong> from the system.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>Cancel</button>
              <button onClick={() => { onDelete(deleteId); setDeleteId(null); }} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
