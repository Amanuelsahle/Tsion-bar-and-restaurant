"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCashierReports,
  type CashierReportRecord,
} from "../../lib/supabase-data";

export default function CashierReports() {
  const [reports, setReports] = useState<CashierReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] =
    useState<CashierReportRecord | null>(null);
  const [cashierFilter, setCashierFilter] = useState("all");
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  const setDatePreset = (preset: "today" | "thisWeek" | "thisMonth" | "clear") => {
    const today = new Date();
    const todayIso = today.toISOString().split("T")[0];

    if (preset === "clear") {
      setSingleDate("");
      setStartDate("");
      setEndDate("");
      return;
    }

    if (preset === "today") {
      setSingleDate(todayIso);
      setStartDate("");
      setEndDate("");
      return;
    }

    if (preset === "thisWeek") {
      setSingleDate("");
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      setStartDate(monday.toISOString().split("T")[0]);
      setEndDate(todayIso);
      return;
    }

    if (preset === "thisMonth") {
      setSingleDate("");
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(todayIso);
      return;
    }
  };

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
    return reports.filter((r) => {
      if (cashierFilter !== "all" && r.cashier_name !== cashierFilter) {
        return false;
      }
      if (r.created_at) {
        const reportDate = r.created_at.split("T")[0];
        if (singleDate) {
          if (reportDate !== singleDate) return false;
        } else {
          if (startDate && reportDate < startDate) return false;
          if (endDate && reportDate > endDate) return false;
        }
      }
      return true;
    });
  }, [reports, cashierFilter, singleDate, startDate, endDate]);

  const handlePrint = (report: CashierReportRecord) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cashier Checkout Report - ${report.cashier_name}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 24px;
              color: #111;
              background: #fff;
            }
            .header {
              border-bottom: 2px solid #111;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 20px;
              font-weight: bold;
              margin: 0;
            }
            .subtitle {
              font-size: 13px;
              color: #666;
              margin-top: 4px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 20px;
              font-size: 13px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px 10px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: 600;
            }
            .totals {
              margin-top: 20px;
              border-top: 2px solid #111;
              padding-top: 12px;
              font-size: 13px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
            }
            .total-row.grand {
              font-weight: bold;
              font-size: 15px;
              border-top: 1px solid #ddd;
              padding-top: 8px;
              margin-top: 8px;
            }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Tsion Bar & Restaurant</h1>
            <p class="subtitle">Cashier Checkout Report</p>
          </div>
          <div class="grid">
            <div><strong>Cashier:</strong> ${report.cashier_name}</div>
            <div><strong>Date:</strong> ${new Date(report.created_at).toLocaleString()}</div>
            <div><strong>Initial Money:</strong> ${report.initial_money.toLocaleString()} Birr</div>
            <div><strong>Net Bono Value:</strong> ${report.net_bono_value.toLocaleString()} Birr</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Bono Name</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Add.</th>
                <th>Rem.</th>
                <th>Add. Rem.</th>
                <th>Eff. Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${(report.items || [])
        .map(
          (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toLocaleString()} Birr</td>
                  <td>${item.additional || 0}</td>
                  <td>${item.remaining || 0}</td>
                  <td>${item.additional_remaining || 0}</td>
                  <td>${item.effective_quantity}</td>
                  <td>${item.total_amount.toLocaleString()} Birr</td>
                </tr>
              `,
        )
        .join("")}
            </tbody>
          </table>
          <div class="totals">
            <div class="total-row"><span>Special Payouts:</span><span>${report.special_payouts.toLocaleString()} Birr</span></div>
            <div class="total-row"><span>Other Money 1:</span><span>${report.other_money_1.toLocaleString()} Birr</span></div>
            <div class="total-row"><span>Other Money 2:</span><span>${report.other_money_2.toLocaleString()} Birr</span></div>
            <div class="total-row"><span>Today Money:</span><span>${report.today_money.toLocaleString()} Birr</span></div>
            <div class="total-row grand"><span>Expected Balance:</span><span>${report.final_balance.toLocaleString()} Birr</span></div>
            <div class="total-row grand"><span>Balance Check:</span><span>${report.balance_check.toLocaleString()} Birr</span></div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-3xl border p-4 sm:p-6 space-y-4"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2
              className="text-2xl font-bold font-display"
              style={{ color: "var(--foreground)" }}
            >
              Checkout History
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              View past submitted cashier checkouts, details, and balance
              reports.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setShowDateFilter((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 shrink-0 ${showDateFilter
                ? "bg-[#c9a84c] text-[#0f1117] hover:bg-[#b8973b]"
                : (singleDate || startDate || endDate)
                  ? "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40 hover:bg-[#c9a84c]/30"
                  : "bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-white/5"
                }`}
            >
              <span>📅</span>
              <span>{showDateFilter ? "Hide Date Filter" : "Filter by Date"}</span>
              {(singleDate || startDate || endDate) && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <label
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                Cashier:
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
                <option value="all">All Cashiers ({reports.length})</option>
                {uniqueCashiers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Summary Bar when Date Filter box is closed */}
        {!showDateFilter && (singleDate || startDate || endDate) && (
          <div className="px-4 py-2.5 rounded-xl flex items-center justify-between text-xs bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#e8e6e1]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#c9a84c] font-bold">📅 Date Filter Active:</span>
              <span className="font-semibold">
                {singleDate
                  ? `Date: ${singleDate}`
                  : startDate && endDate
                    ? `${startDate} to ${endDate}`
                    : startDate
                      ? `From ${startDate}`
                      : `Up to ${endDate}`}
              </span>
              <span className="text-[#7a8090]">
                ({filteredReports.length} report{filteredReports.length === 1 ? "" : "s"} found)
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowDateFilter(true)}
                className="text-[#c9a84c] hover:underline text-xs font-semibold"
              >
                Edit Filter
              </button>
              <button
                type="button"
                onClick={() => setDatePreset("clear")}
                className="text-red-400 hover:underline text-xs font-semibold"
              >
                Clear Filter
              </button>
            </div>
          </div>
        )}

        {/* Expandable Date Filter Controls Box */}
        {showDateFilter && (
          <div
            className="p-4 rounded-2xl space-y-3 transition-all"
            style={{
              backgroundColor: "var(--secondary)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#7a8090] uppercase tracking-wider block">
                    Select Date
                  </label>
                  <input
                    type="date"
                    placeholder="mm/dd/yyyy"
                    value={singleDate}
                    onChange={(e) => {
                      setSingleDate(e.target.value);
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="w-full min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-medium outline-none"
                    style={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      colorScheme: "dark",
                    }}
                  />
                </div>

                <div className="flex items-center gap-1.5 self-end pb-0.5">
                  <button
                    type="button"
                    onClick={() => setDatePreset("today")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${singleDate === new Date().toISOString().split("T")[0]
                      ? "bg-[#c9a84c] text-[#0f1117] border-[#c9a84c] font-bold"
                      : "text-[#e8e6e1] hover:bg-white/5 border-white/10"
                      }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePreset("thisWeek")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${startDate && !singleDate
                      ? "bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/40 font-semibold"
                      : "text-[#e8e6e1] hover:bg-white/5 border-white/10"
                      }`}
                  >
                    This Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePreset("thisMonth")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${startDate && !singleDate
                      ? "bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/40 font-semibold"
                      : "text-[#e8e6e1] hover:bg-white/5 border-white/10"
                      }`}
                  >
                    This Month
                  </button>
                  {(singleDate || startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => setDatePreset("clear")}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="text-xs text-[#7a8090]">
                Showing <strong className="text-[#c9a84c]">{filteredReports.length}</strong> of {reports.length} reports
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className="rounded-3xl border overflow-hidden"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        {loading ? (
          <div
            className="p-8 text-center text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            Loading reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div
            className="p-8 text-center text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            No cashier reports found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                  }}
                >
                  <th
                    className="px-4 py-3 text-left text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Date
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Cashier Name
                  </th>
                  <th
                    className="hidden md:table-cell px-4 py-3 text-left text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Initial Money
                  </th>
                  <th
                    className="hidden md:table-cell px-4 py-3 text-left text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Net Bono Value
                  </th>
                  <th
                    className="hidden md:table-cell px-4 py-3 text-left text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Final Balance
                  </th>
                  <th
                    className="hidden md:table-cell px-4 py-3 text-left text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Balance Check
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const isBalanced = report.balance_check === 0;
                  const dateStr = new Date(report.created_at).toLocaleDateString();

                  return (
                    <tr
                      key={report.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td
                        className="px-4 py-3 font-medium whitespace-nowrap"
                        style={{ color: "var(--foreground)" }}
                      >
                        {dateStr}
                      </td>
                      <td
                        className="px-4 py-3 font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {report.cashier_name}
                      </td>
                      <td
                        className="hidden md:table-cell px-4 py-3"
                        style={{ color: "var(--foreground)" }}
                      >
                        {report.initial_money.toLocaleString()} Birr
                      </td>
                      <td
                        className="hidden md:table-cell px-4 py-3"
                        style={{ color: "var(--foreground)" }}
                      >
                        {report.net_bono_value.toLocaleString()} Birr
                      </td>
                      <td
                        className="hidden md:table-cell px-4 py-3 font-semibold"
                        style={{ color: "var(--primary)" }}
                      >
                        {report.final_balance.toLocaleString()} Birr
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: isBalanced
                              ? "rgba(34,197,94,0.12)"
                              : "rgba(239,68,68,0.12)",
                            color: isBalanced ? "#4ade80" : "#f87171",
                          }}
                        >
                          {report.balance_check.toLocaleString()} Birr (
                          {isBalanced ? "OK" : "Diff"})
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReport(report);
                              setTimeout(() => {
                                detailsRef.current?.scrollIntoView({
                                  behavior: "smooth",
                                });
                              }, 50);
                            }}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium"
                            style={{
                              backgroundColor: "var(--secondary)",
                              color: "var(--foreground)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrint(report)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium"
                            style={{
                              backgroundColor: "rgba(201,168,76,0.15)",
                              color: "var(--primary)",
                              border: "1px solid rgba(201,168,76,0.3)",
                            }}
                          >
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReport ? (
        <div
          ref={detailsRef}
          className="rounded-3xl border p-6 space-y-6"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border)" }}>
            <div>
              <h3 className="text-xl font-bold font-display" style={{ color: "var(--foreground)" }}>
                Report Details: {selectedReport.cashier_name}
              </h3>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                Submitted on {new Date(selectedReport.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handlePrint(selectedReport)}
                className="rounded-xl px-4 py-2 text-sm font-medium"
                style={{
                  background: "linear-gradient(135deg, #c9a84c, #a07828)",
                  color: "#0f1117",
                }}
              >
                Print Report
              </button>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-xl px-4 py-2 text-sm"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                Close Details
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
              <p className="text-xs text-[#7a8090] uppercase tracking-wider">Initial Money</p>
              <p className="text-lg font-bold mt-1 text-[#f4efe7]">{selectedReport.initial_money.toLocaleString()} Birr</p>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
              <p className="text-xs text-[#7a8090] uppercase tracking-wider">Net Bono Value</p>
              <p className="text-lg font-bold mt-1 text-[#f4efe7]">{selectedReport.net_bono_value.toLocaleString()} Birr</p>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
              <p className="text-xs text-[#7a8090] uppercase tracking-wider">Final Expected Balance</p>
              <p className="text-lg font-bold mt-1 text-[#c9a84c]">{selectedReport.final_balance.toLocaleString()} Birr</p>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
              <p className="text-xs text-[#7a8090] uppercase tracking-wider">Balance Check</p>
              <p className={`text-lg font-bold mt-1 ${selectedReport.balance_check === 0 ? "text-emerald-400" : "text-red-400"}`}>
                {selectedReport.balance_check.toLocaleString()} Birr
              </p>
            </div>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-[#7a8090]">Bono Item</th>
                    <th className="px-4 py-3 text-left font-medium text-[#7a8090]">Unit Price</th>
                    <th className="px-4 py-3 text-left font-medium text-[#7a8090]">Base Qty</th>
                    <th className="px-4 py-3 text-left font-medium text-[#7a8090]">Add (+)</th>
                    <th className="px-4 py-3 text-left font-medium text-[#7a8090]">Rem (-)</th>
                    <th className="px-4 py-3 text-left font-medium text-[#7a8090]">Add Rem (-)</th>
                    <th className="px-4 py-3 text-left font-medium text-[#7a8090]">Eff. Qty</th>
                    <th className="px-4 py-3 text-left font-medium text-[#7a8090]">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(selectedReport.items || []).map((item, i) => (
                    <tr key={item.id || i}>
                      <td className="px-4 py-3 font-medium text-[#f4efe7]">{item.name}</td>
                      <td className="px-4 py-3 text-[#e8e6e1]">{item.price.toLocaleString()} Birr</td>
                      <td className="px-4 py-3 text-[#e8e6e1]">{item.quantity}</td>
                      <td className="px-4 py-3 text-emerald-400">+{item.additional || 0}</td>
                      <td className="px-4 py-3 text-red-400">-{item.remaining || 0}</td>
                      <td className="px-4 py-3 text-red-400">-{item.additional_remaining || 0}</td>
                      <td className="px-4 py-3 font-semibold text-[#f4efe7]">{item.effective_quantity}</td>
                      <td className="px-4 py-3 font-bold text-[#c9a84c]">{item.total_amount.toLocaleString()} Birr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 rounded-2xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "rgba(255,255,255,0.01)" }}>
            <div>
              <p className="text-xs text-[#7a8090]">Special Payouts</p>
              <p className="text-sm font-semibold text-[#f4efe7]">{selectedReport.special_payouts.toLocaleString()} Birr</p>
            </div>
            <div>
              <p className="text-xs text-[#7a8090]">Other Money 1</p>
              <p className="text-sm font-semibold text-[#f4efe7]">{selectedReport.other_money_1.toLocaleString()} Birr</p>
            </div>
            <div>
              <p className="text-xs text-[#7a8090]">Other Money 2</p>
              <p className="text-sm font-semibold text-[#f4efe7]">{selectedReport.other_money_2.toLocaleString()} Birr</p>
            </div>
            <div>
              <p className="text-xs text-[#7a8090]">Total Today Money</p>
              <p className="text-sm font-semibold text-[#c9a84c]">{selectedReport.today_money.toLocaleString()} Birr</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
