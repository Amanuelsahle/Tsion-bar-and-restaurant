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
} from "../../lib/supabase-data";

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

export default function CashierAnalytics() {
  const [reports, setReports] = useState<CashierReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>("all");
  const [cashierFilter, setCashierFilter] = useState("all");
  const [metric, setMetric] = useState<ChartMetric>("sales");

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

  const uniqueCashiers = useMemo(() => {
    const names = reports.map((r) => r.cashier_name).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [reports]);

  const filteredReports = useMemo(() => {
    let result = reports;

    if (cashierFilter !== "all") {
      result = result.filter((r) => r.cashier_name === cashierFilter);
    }

    if (timeframe !== "all") {
      const now = new Date();
      result = result.filter((r) => {
        const rDate = new Date(r.created_at);
        const diffMs = now.getTime() - rDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (timeframe === "daily") return diffDays <= 1;
        if (timeframe === "weekly") return diffDays <= 7;
        if (timeframe === "monthly") return diffDays <= 30;
        return true;
      });
    }

    return result;
  }, [reports, cashierFilter, timeframe]);

  const summaryStats = useMemo(() => {
    const totalCheckouts = filteredReports.length;
    const totalSales = filteredReports.reduce(
      (sum, r) => sum + r.today_money,
      0,
    );
    const totalExpected = filteredReports.reduce(
      (sum, r) => sum + r.final_balance,
      0,
    );
    const totalDifference = filteredReports.reduce(
      (sum, r) => sum + r.balance_check,
      0,
    );
    const balancedCheckouts = filteredReports.filter(
      (r) => r.balance_check === 0,
    ).length;
    const balancedRate =
      totalCheckouts > 0 ? (balancedCheckouts / totalCheckouts) * 100 : 0;

    return {
      totalCheckouts,
      totalSales,
      totalExpected,
      totalDifference,
      balancedRate,
    };
  }, [filteredReports]);

  const cashierPerformance = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        checkouts: number;
        totalSales: number;
        totalBonoValue: number;
        totalDiff: number;
        balanced: number;
      }
    >();

    for (const r of filteredReports) {
      const current = map.get(r.cashier_name) || {
        name: r.cashier_name,
        checkouts: 0,
        totalSales: 0,
        totalBonoValue: 0,
        totalDiff: 0,
        balanced: 0,
      };

      current.checkouts += 1;
      current.totalSales += r.today_money;
      current.totalBonoValue += r.net_bono_value;
      current.totalDiff += Math.abs(r.balance_check);
      if (r.balance_check === 0) current.balanced += 1;

      map.set(r.cashier_name, current);
    }

    return Array.from(map.values()).sort(
      (a, b) => b.totalSales - a.totalSales,
    );
  }, [filteredReports]);

  const bonoSalesAnalytics = useMemo(() => {
    const itemMap = new Map<
      string,
      { name: string; totalQty: number; totalValue: number }
    >();

    for (const r of filteredReports) {
      if (r.items && Array.isArray(r.items)) {
        for (const item of r.items) {
          const current = itemMap.get(item.name) || {
            name: item.name,
            totalQty: 0,
            totalValue: 0,
          };
          current.totalQty += item.effective_quantity || 0;
          current.totalValue += item.total_amount || 0;
          itemMap.set(item.name, current);
        }
      }
    }

    return Array.from(itemMap.values()).sort(
      (a, b) => b.totalValue - a.totalValue,
    );
  }, [filteredReports]);

  const chartData = useMemo(() => {
    if (cashierPerformance.length === 0) return [];
    return cashierPerformance.map((c) => ({
      name: c.name,
      value:
        metric === "sales"
          ? c.totalSales
          : metric === "checkouts"
            ? c.checkouts
            : metric === "bonoValue"
              ? c.totalBonoValue
              : c.balanced,
    }));
  }, [cashierPerformance, metric]);

  const dayOfWeekDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const sales = [0, 0, 0, 0, 0, 0, 0];

    for (const r of filteredReports) {
      const dayIndex = (new Date(r.created_at).getDay() + 6) % 7;
      counts[dayIndex] += 1;
      sales[dayIndex] += r.today_money;
    }

    return DAYS_OF_WEEK.map((day, idx) => ({
      day,
      checkouts: counts[idx],
      sales: sales[idx],
    }));
  }, [filteredReports]);

  return (
    <div className="space-y-6">
      <div
        className="rounded-3xl border p-4 sm:p-6"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2
              className="text-2xl font-bold font-display"
              style={{ color: "var(--foreground)" }}
            >
              Cashier Analytics & Reports
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Performance breakdown, top-selling bonos, and cashier accuracy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label
                className="text-xs uppercase tracking-wider block mb-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                className="rounded-xl px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <option value="all">All Time</option>
                <option value="daily">Last 24 Hours</option>
                <option value="weekly">Last 7 Days</option>
                <option value="monthly">Last 30 Days</option>
              </select>
            </div>

            <div>
              <label
                className="text-xs uppercase tracking-wider block mb-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                Cashier
              </label>
              <select
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
                className="rounded-xl px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <option value="all">All Cashiers</option>
                {uniqueCashiers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="rounded-3xl border p-5"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7a8090]">
            Total Checkouts
          </p>
          <p className="text-3xl font-bold font-display mt-2 text-[#f4efe7]">
            {summaryStats.totalCheckouts}
          </p>
          <p className="text-xs text-[#7a8090] mt-1">
            Submitted cashier sessions
          </p>
        </div>

        <div
          className="rounded-3xl border p-5"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7a8090]">
            Total Today Cash Collected
          </p>
          <p className="text-3xl font-bold font-display mt-2 text-[#c9a84c]">
            {summaryStats.totalSales.toLocaleString()} Birr
          </p>
          <p className="text-xs text-[#7a8090] mt-1">
            Actual money turned in to manager
          </p>
        </div>

        <div
          className="rounded-3xl border p-5"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7a8090]">
            Balanced Rate
          </p>
          <p className="text-3xl font-bold font-display mt-2 text-emerald-400">
            {summaryStats.balancedRate.toFixed(1)}%
          </p>
          <p className="text-xs text-[#7a8090] mt-1">
            Sessions with zero discrepancy
          </p>
        </div>

        <div
          className="rounded-3xl border p-5"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7a8090]">
            Net Discrepancy
          </p>
          <p
            className={`text-3xl font-bold font-display mt-2 ${
              summaryStats.totalDifference === 0
                ? "text-emerald-400"
                : "text-amber-400"
            }`}
          >
            {summaryStats.totalDifference.toLocaleString()} Birr
          </p>
          <p className="text-xs text-[#7a8090] mt-1">
            Total balance check sum
          </p>
        </div>
      </div>

      <div
        className="rounded-3xl border p-6 space-y-4"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#f4efe7]">
              Cashier Performance Comparison
            </h3>
            <p className="text-xs text-[#7a8090]">
              Compare cashiers by total sales, checkouts, or accuracy.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/[0.03] p-1 rounded-xl border border-white/5">
            {(
              [
                ["sales", "Sales (Birr)"],
                ["checkouts", "Checkouts"],
                ["bonoValue", "Bono Value"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMetric(key as ChartMetric)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  metric === key
                    ? "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30"
                    : "text-[#7a8090] hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-sm text-[#7a8090]">
            Loading chart...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-[#7a8090]">
            No cashier data available for selected filter.
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252b3b" vertical={false} />
                <XAxis dataKey="name" stroke="#7a8090" fontSize={12} tickLine={false} />
                <YAxis stroke="#7a8090" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161a26",
                    borderColor: "#252b3b",
                    borderRadius: "12px",
                    color: "#f4efe7",
                  }}
                  formatter={(value: any) => [
                    metric === "checkouts"
                      ? `${value} checkouts`
                      : `${Number(value).toLocaleString()} Birr`,
                    metric === "sales"
                      ? "Today Cash"
                      : metric === "checkouts"
                        ? "Checkouts"
                        : "Bono Value",
                  ]}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 2 === 0 ? "#c9a84c" : "#a07828"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div
          className="rounded-3xl border p-6 space-y-4"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <h3 className="text-lg font-bold text-[#f4efe7]">
            Top Sold Bono Items
          </h3>
          <p className="text-xs text-[#7a8090]">
            Breakdown of total effective quantities & monetary values sold.
          </p>

          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/[0.03] text-[#7a8090] uppercase">
                <tr>
                  <th className="p-3">Bono Name</th>
                  <th className="p-3">Qty Sold</th>
                  <th className="p-3 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#e8e6e1]">
                {bonoSalesAnalytics.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-[#7a8090]">
                      No item sales recorded.
                    </td>
                  </tr>
                ) : (
                  bonoSalesAnalytics.map((item, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-medium text-[#f4efe7]">
                        {item.name}
                      </td>
                      <td className="p-3 font-semibold">{item.totalQty}</td>
                      <td className="p-3 text-right font-bold text-[#c9a84c]">
                        {item.totalValue.toLocaleString()} Birr
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className="rounded-3xl border p-6 space-y-4"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <h3 className="text-lg font-bold text-[#f4efe7]">
            Day of Week Distribution
          </h3>
          <p className="text-xs text-[#7a8090]">
            Checkout frequency and cash volume by weekday.
          </p>

          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/[0.03] text-[#7a8090] uppercase">
                <tr>
                  <th className="p-3">Day</th>
                  <th className="p-3">Checkouts</th>
                  <th className="p-3 text-right">Total Cash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#e8e6e1]">
                {dayOfWeekDistribution.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-medium text-[#f4efe7]">{row.day}</td>
                    <td className="p-3 font-semibold">{row.checkouts}</td>
                    <td className="p-3 text-right font-bold text-[#c9a84c]">
                      {row.sales.toLocaleString()} Birr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
