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
  const detailsRef = useRef<HTMLDivElement | null>(null);

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
    if (cashierFilter === "all") return reports;
    return reports.filter((r) => r.cashier_name === cashierFilter);
  }, [reports, cashierFilter]);

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
        className="rounded-3xl border p-4 sm:p-6"
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

          <div className="flex items-center gap-3">
            <label
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              Filter Cashier:
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
