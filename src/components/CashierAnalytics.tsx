"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  getCashierReports,
  type CashierReportRecord,
} from "../lib/supabase-data";

type Timeframe = "daily" | "weekly" | "monthly" | "all";
type ChartMetric = "sales" | "quantity" | "checkouts" | "bonoValue";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function getMondayBasedDayIndex(date: Date): number {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return day === 0 ? 6 : day - 1;
}

function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-2xl px-4 py-3 text-xs shadow-2xl backdrop-blur-md"
      style={{
        backgroundColor: "#191d28",
        border: "1px solid var(--border)",
        color: "var(--foreground)",
      }}
    >
      <p className="font-bold text-sm mb-2 text-[#c9a84c]">{label}</p>
      {payload.map((item: any) => {
        const isMoney =
          item.dataKey === "sales" ||
          item.dataKey === "bonoValue" ||
          item.dataKey === "balanceCheck";

        return (
          <div
            key={item.dataKey}
            className="flex items-center justify-between gap-4 py-0.5"
          >
            <span className="text-[#a0a8c0]">{item.name}:</span>
            <span className="font-semibold text-white">
              {typeof item.value === "number"
                ? isMoney
                  ? `${item.value.toLocaleString()} Birr`
                  : item.dataKey === "quantity"
                  ? `${item.value.toLocaleString()} Units`
                  : item.value.toLocaleString()
                : item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function CashierAnalytics() {
  const [reports, setReports] = useState<CashierReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");
  const [cashierFilter, setCashierFilter] = useState<string>("all");
  const [chartBonoFilter, setChartBonoFilter] = useState<string>("all");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("sales");

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await getCashierReports();
        setReports(data);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    void loadReports();
  }, []);

  // Filter reports by timeframe & cashier selection
  const filteredReports = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return reports.filter((report) => {
      // Filter by cashier
      if (cashierFilter !== "all" && report.cashier_name !== cashierFilter) {
        return false;
      }

      const reportDate = new Date(report.created_at);
      const reportDateStr = reportDate.toISOString().slice(0, 10);

      if (timeframe === "daily") {
        return reportDateStr === todayStr;
      }

      if (timeframe === "weekly") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return reportDate >= sevenDaysAgo;
      }

      if (timeframe === "monthly") {
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );
        return reportDate >= thirtyDaysAgo;
      }

      return true; // "all"
    });
  }, [reports, timeframe, cashierFilter]);

  // Extract unique cashier names for filter options
  const uniqueCashiers = useMemo(() => {
    const set = new Set<string>();
    for (const report of reports) {
      if (report.cashier_name) {
        set.add(report.cashier_name);
      }
    }
    return Array.from(set);
  }, [reports]);

  // Extract unique Bono / Item names across all reports for item filter dropdown
  const uniqueBonoNames = useMemo(() => {
    const set = new Set<string>();
    for (const report of reports) {
      if (Array.isArray(report.items)) {
        for (const item of report.items) {
          if (item.name) {
            set.add(item.name);
          }
        }
      }
    }
    return Array.from(set);
  }, [reports]);

  // Overall metrics calculation
  const summaryMetrics = useMemo(() => {
    const totalCheckouts = filteredReports.length;
    const totalRevenue = filteredReports.reduce(
      (sum, r) => sum + (r.final_balance || 0),
      0,
    );
    const totalTodayMoney = filteredReports.reduce(
      (sum, r) => sum + (r.today_money || 0),
      0,
    );
    const totalBonoValue = filteredReports.reduce(
      (sum, r) => sum + (r.net_bono_value || 0),
      0,
    );
    const avgCheckout = totalCheckouts > 0 ? totalRevenue / totalCheckouts : 0;

    return {
      totalCheckouts,
      totalRevenue,
      totalTodayMoney,
      totalBonoValue,
      avgCheckout,
    };
  }, [filteredReports]);

  // Comparison Chart Data (Supports filtering by specific Bono / Item)
  const comparisonChartData = useMemo(() => {
    // Helper to calculate metrics for a single report given the chartBonoFilter
    const getReportMetrics = (report: CashierReportRecord) => {
      if (chartBonoFilter === "all") {
        return {
          sales: report.final_balance || 0,
          bonoValue: report.net_bono_value || 0,
          quantity: Array.isArray(report.items)
            ? report.items.reduce(
                (sum, i) =>
                  sum + (i.effective_quantity ?? i.quantity ?? 0),
                0,
              )
            : 0,
          checkouts: 1,
          balanceCheck: report.balance_check || 0,
        };
      }

      // Filter for specific bono / item
      const item = Array.isArray(report.items)
        ? report.items.find((i) => i.name === chartBonoFilter)
        : null;

      if (!item) {
        return { sales: 0, bonoValue: 0, quantity: 0, checkouts: 0, balanceCheck: 0 };
      }

      const qty = item.effective_quantity ?? item.quantity ?? 0;
      const rev = item.total_amount ?? qty * (item.price || 0);

      return {
        sales: rev,
        bonoValue: rev,
        quantity: qty,
        checkouts: qty > 0 ? 1 : 0,
        balanceCheck: 0,
      };
    };

    if (timeframe === "weekly") {
      // Comparison across days of the week: Mon, Tue, Wed, Thu, Fri, Sat, Sun
      const daysMap = DAYS_OF_WEEK.map((dayName) => ({
        name: dayName,
        shortName: dayName.slice(0, 3),
        sales: 0,
        quantity: 0,
        bonoValue: 0,
        checkouts: 0,
        balanceCheck: 0,
      }));

      for (const report of filteredReports) {
        const d = new Date(report.created_at);
        const idx = getMondayBasedDayIndex(d);
        if (idx >= 0 && idx < 7) {
          const metrics = getReportMetrics(report);
          daysMap[idx].sales += metrics.sales;
          daysMap[idx].quantity += metrics.quantity;
          daysMap[idx].bonoValue += metrics.bonoValue;
          daysMap[idx].checkouts += metrics.checkouts;
          daysMap[idx].balanceCheck += metrics.balanceCheck;
        }
      }

      return daysMap;
    }

    if (timeframe === "monthly") {
      // Comparison across weeks of the month: Week 1, Week 2, Week 3, Week 4, Week 5
      const weeksMap = [
        { name: "Week 1 (1-7)", shortName: "Week 1", sales: 0, quantity: 0, bonoValue: 0, checkouts: 0, balanceCheck: 0 },
        { name: "Week 2 (8-14)", shortName: "Week 2", sales: 0, quantity: 0, bonoValue: 0, checkouts: 0, balanceCheck: 0 },
        { name: "Week 3 (15-21)", shortName: "Week 3", sales: 0, quantity: 0, bonoValue: 0, checkouts: 0, balanceCheck: 0 },
        { name: "Week 4 (22-28)", shortName: "Week 4", sales: 0, quantity: 0, bonoValue: 0, checkouts: 0, balanceCheck: 0 },
        { name: "Week 5 (29+)", shortName: "Week 5", sales: 0, quantity: 0, bonoValue: 0, checkouts: 0, balanceCheck: 0 },
      ];

      for (const report of filteredReports) {
        const d = new Date(report.created_at);
        const dayOfMonth = d.getDate();
        let weekIdx = 0;
        if (dayOfMonth <= 7) weekIdx = 0;
        else if (dayOfMonth <= 14) weekIdx = 1;
        else if (dayOfMonth <= 21) weekIdx = 2;
        else if (dayOfMonth <= 28) weekIdx = 3;
        else weekIdx = 4;

        const metrics = getReportMetrics(report);
        weeksMap[weekIdx].sales += metrics.sales;
        weeksMap[weekIdx].quantity += metrics.quantity;
        weeksMap[weekIdx].bonoValue += metrics.bonoValue;
        weeksMap[weekIdx].checkouts += metrics.checkouts;
        weeksMap[weekIdx].balanceCheck += metrics.balanceCheck;
      }

      return weeksMap;
    }

    if (timeframe === "daily") {
      const cashierMap = new Map<
        string,
        { name: string; shortName: string; sales: number; quantity: number; bonoValue: number; checkouts: number; balanceCheck: number }
      >();

      for (const report of filteredReports) {
        const name = report.cashier_name || "Unknown";
        const existing = cashierMap.get(name) ?? {
          name,
          shortName: name,
          sales: 0,
          quantity: 0,
          bonoValue: 0,
          checkouts: 0,
          balanceCheck: 0,
        };

        const metrics = getReportMetrics(report);
        existing.sales += metrics.sales;
        existing.quantity += metrics.quantity;
        existing.bonoValue += metrics.bonoValue;
        existing.checkouts += metrics.checkouts;
        existing.balanceCheck += metrics.balanceCheck;
        cashierMap.set(name, existing);
      }

      const list = Array.from(cashierMap.values());
      return list.length > 0
        ? list
        : [{ name: "Today", shortName: "Today", sales: 0, quantity: 0, bonoValue: 0, checkouts: 0, balanceCheck: 0 }];
    }

    // All Time: Months of the Year
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthsMap = monthNames.map((name) => ({
      name,
      shortName: name,
      sales: 0,
      quantity: 0,
      bonoValue: 0,
      checkouts: 0,
      balanceCheck: 0,
    }));

    for (const report of filteredReports) {
      const d = new Date(report.created_at);
      const monthIdx = d.getMonth();
      if (monthIdx >= 0 && monthIdx < 12) {
        const metrics = getReportMetrics(report);
        monthsMap[monthIdx].sales += metrics.sales;
        monthsMap[monthIdx].quantity += metrics.quantity;
        monthsMap[monthIdx].bonoValue += metrics.bonoValue;
        monthsMap[monthIdx].checkouts += metrics.checkouts;
        monthsMap[monthIdx].balanceCheck += metrics.balanceCheck;
      }
    }

    return monthsMap;
  }, [filteredReports, timeframe, chartBonoFilter]);

  // Rank Cashiers BY BALANCE CHECK in current period
  // (Highest balance_check first: e.g. +50 > 0 > -100 > -1000)
  const topCashiers = useMemo(() => {
    const map = new Map<
      string,
      {
        cashier_name: string;
        totalSales: number;
        checkoutsCount: number;
        bonoValue: number;
        totalBalanceCheck: number;
        avgBalanceCheck: number;
      }
    >();

    for (const report of filteredReports) {
      const name = report.cashier_name || "Unknown";
      const existing = map.get(name) ?? {
        cashier_name: name,
        totalSales: 0,
        checkoutsCount: 0,
        bonoValue: 0,
        totalBalanceCheck: 0,
        avgBalanceCheck: 0,
      };

      existing.totalSales += report.final_balance || 0;
      existing.checkoutsCount += 1;
      existing.bonoValue += report.net_bono_value || 0;
      existing.totalBalanceCheck += report.balance_check || 0;
      map.set(name, existing);
    }

    const list = Array.from(map.values()).map((item) => ({
      ...item,
      avgBalanceCheck:
        item.checkoutsCount > 0
          ? item.totalBalanceCheck / item.checkoutsCount
          : 0,
    }));

    // Sort descending by totalBalanceCheck (least deficit / best balance first)
    const sorted = list.sort((a, b) => {
      if (b.totalBalanceCheck !== a.totalBalanceCheck) {
        return b.totalBalanceCheck - a.totalBalanceCheck;
      }
      return b.totalSales - a.totalSales;
    });

    const topBalance = sorted[0]?.totalBalanceCheck ?? 0;
    const minBalance = Math.min(...sorted.map((s) => s.totalBalanceCheck), 0);
    const range = Math.max(1, topBalance - minBalance);

    return sorted.map((item) => {
      const percentage =
        range > 0
          ? Math.max(
              20,
              Math.min(
                100,
                Math.round(
                  ((item.totalBalanceCheck - minBalance) / range) * 100,
                ),
              ),
            )
          : 100;

      return {
        ...item,
        percentage,
      };
    });
  }, [filteredReports]);

  // Top Cashier Object
  const topCashier = topCashiers[0];

  // Rank Items / Bonos sold across checkouts in current period
  const topSellingBonos = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        price: number;
        totalQuantity: number;
        totalRevenue: number;
      }
    >();

    for (const report of filteredReports) {
      if (!Array.isArray(report.items)) continue;
      for (const item of report.items) {
        const key = item.name || item.id;
        const existing = map.get(key) ?? {
          id: item.id || key,
          name: item.name || "Unknown Item",
          price: item.price || 0,
          totalQuantity: 0,
          totalRevenue: 0,
        };

        const qty = item.effective_quantity ?? item.quantity ?? 0;
        const rev = item.total_amount ?? qty * (item.price || 0);

        existing.totalQuantity += qty;
        existing.totalRevenue += rev;
        map.set(key, existing);
      }
    }

    const sorted = Array.from(map.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    );
    const maxRevenue = sorted[0]?.totalRevenue || 1;

    return sorted.map((item) => ({
      ...item,
      percentage: Math.min(
        100,
        Math.round((item.totalRevenue / maxRevenue) * 100),
      ),
    }));
  }, [filteredReports]);

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div
        className="rounded-3xl border p-4 sm:p-6"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <h2
                className="text-2xl font-bold font-display"
                style={{ color: "var(--foreground)" }}
              >
                Cashier Reports & Analytics
              </h2>
            </div>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Compare cashier sales and individual bono/item variation across days of the week & weeks of the month.
            </p>
          </div>

          {/* Timeframe & Filter controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe buttons */}
            <div
              className="flex items-center rounded-2xl p-1 border"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderColor: "var(--border)",
              }}
            >
              {(
                [
                  { id: "daily", label: "Daily" },
                  { id: "weekly", label: "Weekly" },
                  { id: "monthly", label: "Monthly" },
                  { id: "all", label: "All Time" },
                ] as const
              ).map((tab) => {
                const active = timeframe === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTimeframe(tab.id)}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: active
                        ? "var(--primary)"
                        : "transparent",
                      color: active ? "#0f1117" : "var(--muted-foreground)",
                      boxShadow: active
                        ? "0 2px 8px rgba(201,168,76,0.3)"
                        : "none",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Cashier filter dropdown */}
            <div
              className="rounded-2xl px-3 py-1.5 border"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderColor: "var(--border)",
              }}
            >
              <select
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
                className="bg-transparent text-xs outline-none font-medium cursor-pointer"
                style={{ color: "var(--foreground)" }}
              >
                <option value="all" className="bg-[#191d28] text-white">
                  All Cashiers
                </option>
                {uniqueCashiers.map((c) => (
                  <option
                    key={c}
                    value={c}
                    className="bg-[#191d28] text-white"
                  >
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div
          className="rounded-3xl border p-5 transition-all hover:border-[#c9a84c]/40"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-xs uppercase tracking-wider font-medium"
              style={{ color: "var(--muted-foreground)" }}
            >
              Total Sales Revenue
            </p>
            <span className="rounded-xl bg-[#c9a84c]/15 px-2 py-1 text-xs font-semibold text-[#c9a84c]">
              {timeframe.toUpperCase()}
            </span>
          </div>
          <p
            className="mt-3 text-2xl font-bold font-display"
            style={{ color: "var(--foreground)" }}
          >
            {summaryMetrics.totalRevenue.toLocaleString()}{" "}
            <span className="text-sm font-normal text-[#c9a84c]">Birr</span>
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            Net Bono Total: {summaryMetrics.totalBonoValue.toLocaleString()} Birr
          </p>
        </div>

        {/* KPI 2: Top Performing Cashier BY BALANCE */}
        <div
          className="rounded-3xl border p-5 transition-all hover:border-[#c9a84c]/40"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-xs uppercase tracking-wider font-medium"
              style={{ color: "var(--muted-foreground)" }}
            >
              Top Cashier (by Balance)
            </p>
            <span className="text-sm">🏆</span>
          </div>
          <p
            className="mt-3 text-lg font-bold font-display truncate"
            style={{ color: "var(--primary)" }}
          >
            {topCashier ? topCashier.cashier_name : "N/A"}
          </p>
          <p
            className="mt-1 text-xs font-semibold"
            style={{
              color: !topCashier
                ? "var(--muted-foreground)"
                : topCashier.totalBalanceCheck >= 0
                ? "#22c55e"
                : "#f59e0b",
            }}
          >
            {topCashier
              ? `${topCashier.totalBalanceCheck >= 0 ? "+" : ""}${topCashier.totalBalanceCheck.toLocaleString()} Birr Balance Check`
              : "No checkout data"}
          </p>
        </div>

        {/* KPI 3 */}
        <div
          className="rounded-3xl border p-5 transition-all hover:border-[#c9a84c]/40"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-xs uppercase tracking-wider font-medium"
              style={{ color: "var(--muted-foreground)" }}
            >
              Completed Checkouts
            </p>
            <span className="text-sm">📝</span>
          </div>
          <p
            className="mt-3 text-2xl font-bold font-display"
            style={{ color: "var(--foreground)" }}
          >
            {summaryMetrics.totalCheckouts}
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            Total checkout sessions recorded
          </p>
        </div>

        {/* KPI 4 */}
        <div
          className="rounded-3xl border p-5 transition-all hover:border-[#c9a84c]/40"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-xs uppercase tracking-wider font-medium"
              style={{ color: "var(--muted-foreground)" }}
            >
              Avg Checkout Value
            </p>
            <span className="text-sm">📈</span>
          </div>
          <p
            className="mt-3 text-2xl font-bold font-display"
            style={{ color: "var(--foreground)" }}
          >
            {Math.round(summaryMetrics.avgCheckout).toLocaleString()}{" "}
            <span className="text-sm font-normal text-[#c9a84c]">Birr</span>
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            Average net revenue per checkout
          </p>
        </div>
      </div>

      {/* COMPARISON GRAPH SECTION WITH BONO / ITEM FILTER */}
      <div
        className="rounded-3xl border p-5 sm:p-6 space-y-4"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--card)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border)" }}>
          <div>
            <h3
              className="text-lg font-bold font-display flex items-center gap-2"
              style={{ color: "var(--foreground)" }}
            >
              <span>📊</span>
              <span>
                {timeframe === "weekly"
                  ? "Weekly Sales Comparison (Monday – Sunday)"
                  : timeframe === "monthly"
                  ? "Monthly Sales Comparison (Week 1 – Week 5)"
                  : timeframe === "daily"
                  ? "Daily Sales Breakdown"
                  : "All-Time Monthly Comparison"}
              </span>
            </h3>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              {chartBonoFilter !== "all"
                ? `Showing sales variation specifically for item: "${chartBonoFilter}"`
                : timeframe === "weekly"
                ? "Compare sales variation across days of the week (Monday through Sunday)."
                : "Compare sales variation across weeks of the month (Week 1 to Week 5)."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Specific Item / Bono */}
            <div
              className="rounded-2xl px-3 py-1.5 border flex items-center gap-2"
              style={{
                backgroundColor: "rgba(201,168,76,0.08)",
                borderColor: "rgba(201,168,76,0.3)",
              }}
            >
              <span className="text-xs font-semibold text-[#c9a84c]">Item:</span>
              <select
                value={chartBonoFilter}
                onChange={(e) => {
                  setChartBonoFilter(e.target.value);
                  if (e.target.value !== "all" && chartMetric === "checkouts") {
                    setChartMetric("quantity");
                  }
                }}
                className="bg-transparent text-xs outline-none font-semibold cursor-pointer"
                style={{ color: "var(--primary)" }}
              >
                <option value="all" className="bg-[#191d28] text-white">
                  All Items / Bonos
                </option>
                {uniqueBonoNames.map((bonoName) => (
                  <option
                    key={bonoName}
                    value={bonoName}
                    className="bg-[#191d28] text-white"
                  >
                    {bonoName}
                  </option>
                ))}
              </select>
            </div>

            {/* Metric Selector Buttons */}
            <div
              className="flex items-center rounded-2xl p-1 border"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderColor: "var(--border)",
              }}
            >
              {(
                [
                  { id: "sales", label: "Sales (Birr)" },
                  { id: "quantity", label: "Units Sold" },
                  { id: "checkouts", label: "Checkouts" },
                ] as const
              ).map((m) => {
                const active = chartMetric === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setChartMetric(m.id)}
                    className="rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
                    style={{
                      backgroundColor: active
                        ? "rgba(201,168,76,0.15)"
                        : "transparent",
                      color: active ? "var(--primary)" : "var(--muted-foreground)",
                      border: active
                        ? "1px solid rgba(201,168,76,0.3)"
                        : "1px solid transparent",
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Filter Banner */}
        {chartBonoFilter !== "all" && (
          <div className="flex items-center justify-between rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/30 px-4 py-2 text-xs">
            <span className="text-[#f3e1a9]">
              Currently displaying variation for:{" "}
              <strong className="text-[#c9a84c]">{chartBonoFilter}</strong>
            </span>
            <button
              type="button"
              onClick={() => setChartBonoFilter("all")}
              className="rounded-lg bg-[#c9a84c]/20 px-2 py-1 text-[11px] font-semibold text-[#c9a84c] hover:bg-[#c9a84c]/30"
            >
              Reset to All Items
            </button>
          </div>
        )}

        {/* Chart Container */}
        <div className="h-72 w-full pt-2">
          {loading ? (
            <div
              className="h-full flex items-center justify-center text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Loading chart data…
            </div>
          ) : comparisonChartData.length === 0 ? (
            <div
              className="h-full flex items-center justify-center text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              No data available for this selection.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonChartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#252b3b"
                  vertical={false}
                />
                <XAxis
                  dataKey="shortName"
                  stroke="#7a8090"
                  tick={{ fill: "#7a8090", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#252b3b" }}
                />
                <YAxis
                  stroke="#7a8090"
                  tick={{ fill: "#7a8090", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    chartMetric === "checkouts" || chartMetric === "quantity"
                      ? String(val)
                      : `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                  }
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar
                  dataKey={chartMetric}
                  name={
                    chartMetric === "sales"
                      ? "Sales Revenue"
                      : chartMetric === "quantity"
                      ? "Units Sold"
                      : "Checkouts Count"
                  }
                  radius={[8, 8, 0, 0]}
                  barSize={36}
                >
                  {comparisonChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        chartMetric === "sales"
                          ? "#c9a84c"
                          : chartMetric === "quantity"
                          ? "#10b981"
                          : "#3b82f6"
                      }
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Main Leaderboard & Performance Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cashier Performance by Balance Check Leaderboard */}
        <div
          className="rounded-3xl border p-5 sm:p-6 space-y-4"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <div>
              <h3
                className="text-lg font-bold font-display"
                style={{ color: "var(--foreground)" }}
              >
                🥇 Top Cashiers by Balance Check ({timeframe})
              </h3>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                Ranked by balance check accuracy (least deficit / surplus)
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#c9a84c]/10 text-[#c9a84c]">
              {topCashiers.length} Cashiers
            </span>
          </div>

          {loading ? (
            <div
              className="py-12 text-center text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Loading sales statistics…
            </div>
          ) : topCashiers.length === 0 ? (
            <div
              className="py-12 text-center text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              No cashier checkout data found for this {timeframe} timeframe.
            </div>
          ) : (
            <div className="space-y-4">
              {topCashiers.map((cashier, index) => {
                const rankBadgeClass =
                  index === 0
                    ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                    : index === 1
                    ? "bg-slate-300/20 text-slate-200 border-slate-300/40"
                    : index === 2
                    ? "bg-amber-700/20 text-amber-500 border-amber-700/40"
                    : "bg-white/5 text-gray-400 border-white/10";

                const isPositiveOrZero = cashier.totalBalanceCheck >= 0;

                return (
                  <div
                    key={cashier.cashier_name}
                    className="rounded-2xl p-4 border transition-all hover:bg-white/[0.02]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold ${rankBadgeClass}`}
                        >
                          #{index + 1}
                        </span>
                        <div>
                          <p
                            className="font-semibold text-sm"
                            style={{ color: "var(--foreground)" }}
                          >
                            {cashier.cashier_name}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Sales: {cashier.totalSales.toLocaleString()} Birr ·{" "}
                            {cashier.checkoutsCount} checkout
                            {cashier.checkoutsCount > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className="font-bold text-sm font-display"
                          style={{
                            color: isPositiveOrZero ? "#22c55e" : "#f59e0b",
                          }}
                        >
                          {isPositiveOrZero ? "+" : ""}
                          {cashier.totalBalanceCheck.toLocaleString()} Birr Balance
                        </p>
                        <p
                          className="text-[11px]"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Avg: {Math.round(cashier.avgBalanceCheck).toLocaleString()} Birr/checkout
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cashier.percentage}%`,
                          background: isPositiveOrZero
                            ? "linear-gradient(90deg, #22c55e, #4ade80)"
                            : "linear-gradient(90deg, #f59e0b, #fbbf24)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Most Sold Bonos / Items Leaderboard */}
        <div
          className="rounded-3xl border p-5 sm:p-6 space-y-4"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <div>
              <h3
                className="text-lg font-bold font-display"
                style={{ color: "var(--foreground)" }}
              >
                🔥 Most Sold Bonos / Items ({timeframe})
              </h3>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                Top items sold by quantity and generated revenue
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#c9a84c]/10 text-[#c9a84c]">
              {topSellingBonos.length} Items
            </span>
          </div>

          {loading ? (
            <div
              className="py-12 text-center text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Loading item statistics…
            </div>
          ) : topSellingBonos.length === 0 ? (
            <div
              className="py-12 text-center text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              No bono sales records found for this {timeframe} timeframe.
            </div>
          ) : (
            <div className="space-y-4">
              {topSellingBonos.slice(0, 7).map((bono, index) => (
                <div
                  key={bono.id}
                  className="rounded-2xl p-4 border transition-all hover:bg-white/[0.02]"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c9a84c]/10 text-xs font-bold text-[#c9a84c]">
                        #{index + 1}
                      </span>
                      <div>
                        <p
                          className="font-semibold text-sm"
                          style={{ color: "var(--foreground)" }}
                        >
                          {bono.name}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Price: {bono.price} Birr · Total Qty:{" "}
                          <span className="font-semibold text-white">
                            {bono.totalQuantity}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="font-bold text-sm font-display"
                        style={{ color: "var(--foreground)" }}
                      >
                        {bono.totalRevenue.toLocaleString()} Birr
                      </p>
                      <p
                        className="text-[11px]"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {bono.percentage}% volume
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${bono.percentage}%`,
                        background:
                          "linear-gradient(90deg, #10b981, #34d399)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Checkouts Breakdown Table */}
      <div
        className="rounded-3xl border overflow-hidden"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--card)",
        }}
      >
        <div className="p-4 sm:p-6 border-b" style={{ borderColor: "var(--border)" }}>
          <h3
            className="text-lg font-bold font-display"
            style={{ color: "var(--foreground)" }}
          >
            📋 Checkout Records Breakdown ({timeframe})
          </h3>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Showing {filteredReports.length} recorded cashier checkouts for{" "}
            {timeframe} period.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
              <tr>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Date & Time
                </th>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Cashier
                </th>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Initial Money
                </th>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Net Bono Value
                </th>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Final Balance
                </th>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Balance Check
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Loading report entries...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    No checkout records in this timeframe.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const check = report.balance_check ?? 0;
                  const isMatch = check === 0;
                  const isPositive = check > 0;

                  return (
                    <tr
                      key={report.id}
                      style={{ borderTop: "1px solid var(--border)" }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--foreground)" }}>
                        {new Date(report.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white">
                          {report.cashier_name}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                        {(report.initial_money || 0).toLocaleString()} Birr
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                        {(report.net_bono_value || 0).toLocaleString()} Birr
                      </td>
                      <td
                        className="px-4 py-3 font-bold font-display"
                        style={{ color: "var(--primary)" }}
                      >
                        {(report.final_balance || 0).toLocaleString()} Birr
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <span
                          className={`inline-block rounded-lg px-2.5 py-1 text-xs ${
                            isMatch
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : isPositive
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {check.toLocaleString()} Birr
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
