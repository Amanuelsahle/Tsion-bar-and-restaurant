import { WORK_ROLES, type Employee, type WorkRole } from "../../lib/types";

export const ROLE_COLORS: Record<WorkRole, string> = {
  Manager: "#c9a84c",
  "Bar Man": "#3b82f6",
  Cashier: "#8b5cf6",
  Waiter: "#06b6d4",
  Chef: "#f59e0b",
  Sanitary: "#10b981",
  "Kitchen Assistant": "#f97316",
  Security: "#ef4444",
};

export type ActionType = "payment" | "advance" | "increase";

export const ACTION_META: Record<
  ActionType,
  { label: string; color: string; sign: string }
> = {
  payment: { label: "Pay Salary", color: "#4ade80", sign: "−" },
  advance: { label: "Salary Advance", color: "#fb923c", sign: "−" },
  increase: { label: "Increase Salary", color: "#c9a84c", sign: "+" },
};

export interface AccruedPayrollSummary {
  totalDaysWorked: number;
  monthsWorkedFormatted: string;
  dailyRateCurrent: number;
  totalAccruedEarned: number;
  totalAdvances: number;
  totalPaidOut: number;
  netBalanceDue: number;
  salaryHistoryTimeline: Array<{
    period: string;
    monthlyRate: number;
    dailyRate: number;
    daysCount: number;
    subtotal: number;
  }>;
}

export function calculateAccruedPayroll(emp: Employee): AccruedPayrollSummary {
  if (!emp.hireDate) {
    const defaultMonthly = emp.baseSalary || 0;
    return {
      totalDaysWorked: 1,
      monthsWorkedFormatted: "1 day",
      dailyRateCurrent: Math.round((defaultMonthly / 31) * 100) / 100,
      totalAccruedEarned: defaultMonthly,
      totalAdvances: 0,
      totalPaidOut: 0,
      netBalanceDue: defaultMonthly,
      salaryHistoryTimeline: [],
    };
  }

  const [hY, hM, hD] = emp.hireDate.split("-").map(Number);
  const hireDateUtc = new Date(Date.UTC(hY, (hM || 1) - 1, hD || 1));
  const now = new Date();
  const todayUtc = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );

  const startMs = hireDateUtc.getTime();
  const endMs = todayUtc.getTime();

  if (isNaN(startMs) || startMs > endMs) {
    const defaultMonthly = emp.baseSalary || 0;
    return {
      totalDaysWorked: 0,
      monthsWorkedFormatted: "0 days",
      dailyRateCurrent: Math.round((defaultMonthly / 30) * 100) / 100,
      totalAccruedEarned: 0,
      totalAdvances: 0,
      totalPaidOut: 0,
      netBalanceDue: 0,
      salaryHistoryTimeline: [],
    };
  }

  const increases = (emp.history || [])
    .filter((h) => h.type === "increase" && h.amount > 0 && h.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  let totalAccruedEarned = 0;
  let totalDaysWorked = 0;

  const curDate = new Date(hireDateUtc);
  const dailyRecords: Array<{
    dateStr: string;
    monthlyRate: number;
    dailyRate: number;
  }> = [];

  while (curDate.getTime() <= todayUtc.getTime()) {
    const y = curDate.getUTCFullYear();
    const m = curDate.getUTCMonth();
    const d = curDate.getUTCDate();
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

    let activeMonthlySalary = emp.baseSalary || 0;
    for (const inc of increases) {
      if (inc.date > dateStr) {
        activeMonthlySalary -= inc.amount;
      }
    }
    const finalMonthlySalary = Math.max(0, activeMonthlySalary);
    const dailyRate = finalMonthlySalary / daysInMonth;

    totalAccruedEarned += dailyRate;
    totalDaysWorked++;

    dailyRecords.push({
      dateStr,
      monthlyRate: finalMonthlySalary,
      dailyRate,
    });

    curDate.setUTCDate(curDate.getUTCDate() + 1);
  }

  const totalAdvances = (emp.history || [])
    .filter((h) => h.type === "advance")
    .reduce((sum, h) => sum + (h.amount || 0), 0);

  const totalPaidOut = (emp.history || [])
    .filter((h) => h.type === "payment")
    .reduce((sum, h) => sum + (h.amount || 0), 0);

  totalAccruedEarned = Math.round(totalAccruedEarned * 100) / 100;
  const netBalanceDue = Math.max(
    0,
    Math.round((totalAccruedEarned - totalAdvances - totalPaidOut) * 100) / 100,
  );

  const currentMonthDays = new Date(
    Date.UTC(now.getFullYear(), now.getMonth() + 1, 0),
  ).getUTCDate();
  const dailyRateCurrent =
    Math.round(((emp.baseSalary || 0) / currentMonthDays) * 100) / 100;

  const fullMonths = Math.floor(totalDaysWorked / 30);
  const remDays = totalDaysWorked % 30;
  let monthsWorkedFormatted = "";
  if (fullMonths > 0) {
    monthsWorkedFormatted = `${fullMonths} mo${fullMonths > 1 ? "s" : ""}`;
    if (remDays > 0) {
      monthsWorkedFormatted += `, ${remDays} day${remDays > 1 ? "s" : ""}`;
    }
  } else {
    monthsWorkedFormatted = `${totalDaysWorked} day${totalDaysWorked === 1 ? "" : "s"}`;
  }

  const salaryHistoryTimeline: AccruedPayrollSummary["salaryHistoryTimeline"] =
    [];
  if (dailyRecords.length > 0) {
    let curRate = dailyRecords[0].monthlyRate;
    let periodStart = dailyRecords[0].dateStr;
    let periodEnd = dailyRecords[0].dateStr;
    let daysCount = 0;
    let subtotal = 0;

    for (const rec of dailyRecords) {
      if (rec.monthlyRate === curRate) {
        daysCount++;
        subtotal += rec.dailyRate;
        periodEnd = rec.dateStr;
      } else {
        salaryHistoryTimeline.push({
          period: `${periodStart} to ${periodEnd}`,
          monthlyRate: curRate,
          dailyRate: Math.round((curRate / 30) * 100) / 100,
          daysCount,
          subtotal: Math.round(subtotal * 100) / 100,
        });
        curRate = rec.monthlyRate;
        periodStart = rec.dateStr;
        periodEnd = rec.dateStr;
        daysCount = 1;
        subtotal = rec.dailyRate;
      }
    }
    salaryHistoryTimeline.push({
      period: `${periodStart} to ${periodEnd}`,
      monthlyRate: curRate,
      dailyRate: Math.round((curRate / 30) * 100) / 100,
      daysCount,
      subtotal: Math.round(subtotal * 100) / 100,
    });
  }

  return {
    totalDaysWorked,
    monthsWorkedFormatted,
    dailyRateCurrent,
    totalAccruedEarned,
    totalAdvances,
    totalPaidOut,
    netBalanceDue,
    salaryHistoryTimeline,
  };
}

export function yrs(dateStr: string) {
  if (!dateStr) return "< 1 yr";
  const d = new Date(dateStr);
  const now = new Date();
  const diff =
    now.getFullYear() -
    d.getFullYear() -
    (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
  return diff <= 0 ? "< 1 yr" : `${diff} yr${diff > 1 ? "s" : ""}`;
}
