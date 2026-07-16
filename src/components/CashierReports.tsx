"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCashierReports,
  type CashierReportRecord,
} from "../lib/supabase-data";

export default function CashierReports() {
  const [reports, setReports] = useState<CashierReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] =
    useState<CashierReportRecord | null>(null);
  const [cashierFilter, setCashierFilter] = useState("all");

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

  const filteredReports = useMemo(() => {
    if (cashierFilter === "all") return reports;
    return reports.filter((report) => report.cashier_name === cashierFilter);
  }, [cashierFilter, reports]);

  const summary = useMemo(() => {
    const total = filteredReports.reduce(
      (sum, report) => sum + report.final_balance,
      0,
    );
    return {
      totalReports: filteredReports.length,
      totalBalance: total,
    };
  }, [filteredReports]);

  const handlePrint = (report: CashierReportRecord) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const rowsHtml = report.items
      .map(
        (item) =>
          `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${item.price}</td><td>${item.additional}</td><td>${item.remaining}</td><td>${item.effective_quantity}</td><td>${item.total_amount}</td></tr>`,
      )
      .join("");

    printWindow.document.write(`<!DOCTYPE html>
      <html>
        <head>
          <title>Cashier Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            .title { font-size: 22px; font-weight: bold; margin-bottom: 12px; }
            .meta { margin-bottom: 12px; color: #444; }
          </style>
        </head>
        <body>
          <div class="title">Cashier Daily Report</div>
          <div class="meta">Date: ${new Date(report.created_at).toLocaleString()}</div>
          <div class="meta">Initial Money: ${report.initial_money.toLocaleString()} Birr</div>
          <div class="meta">Net Bono Value: ${report.net_bono_value.toLocaleString()} Birr</div>
          <div class="meta">Final Balance: ${report.final_balance.toLocaleString()} Birr</div>
          <div class="meta">Special Payouts: ${report.special_payouts.toLocaleString()} Birr</div>
          <div class="meta">Today&apos;s Money: ${report.today_money.toLocaleString()} Birr</div>
          <div class="meta">Balance Check: ${report.balance_check.toLocaleString()} Birr</div>
          <table>
            <thead><tr><th>Bono</th><th>Qty</th><th>Price</th><th>Additional</th><th>Remaining</th><th>Net Qty</th><th>Total</th></tr></thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-3xl border p-6"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              className="text-2xl font-bold font-display"
              style={{ color: "var(--foreground)" }}
            >
              Cashier Reports
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Review saved daily cashier checkout reports and print or export
              them.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="rounded-2xl px-4 py-3"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            >
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                Filter by Cashier
              </p>
              <select
                value={cashierFilter}
                onChange={(event) => setCashierFilter(event.target.value)}
                className="mt-2 rounded-lg px-2 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <option value="all">All Cashiers</option>
                <option value="Almaz">Almaz</option>
                <option value="Beza">Beza</option>
              </select>
            </div>
            <div
              className="rounded-2xl px-4 py-3"
              style={{ backgroundColor: "rgba(201,168,76,0.12)" }}
            >
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                Reports Count
              </p>
              <p
                className="text-xl font-semibold"
                style={{ color: "var(--primary)" }}
              >
                {summary.totalReports}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div
          className="rounded-3xl border overflow-hidden"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <tr>
                  <th
                    className="px-4 py-3 text-left font-medium"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Date
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Loading reports...
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      No reports saved yet.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <td className="px-4 py-3">
                        <div
                          className="font-medium"
                          style={{ color: "var(--foreground)" }}
                        >
                          {new Date(report.created_at).toLocaleString()}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {report.cashier_name}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ color: "var(--primary)" }}
                      >
                        {report.final_balance.toLocaleString()} Birr
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedReport(report)}
                            className="rounded-lg px-3 py-2 text-sm"
                            style={{
                              backgroundColor: "var(--secondary)",
                              color: "var(--foreground)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrint(report)}
                            className="rounded-lg px-3 py-2 text-sm"
                            style={{
                              backgroundColor: "rgba(201,168,76,0.12)",
                              color: "var(--primary)",
                              border: "1px solid rgba(201,168,76,0.24)",
                            }}
                          >
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className="rounded-3xl border p-6"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          {selectedReport ? (
            <div className="space-y-4">
              <div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  Report Details
                </h3>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {new Date(selectedReport.created_at).toLocaleString()}
                </p>
              </div>
              <div className="grid gap-3">
                <div
                  className="rounded-2xl border px-4 py-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Cashier
                  </p>
                  <p
                    className="mt-1 font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {selectedReport.cashier_name}
                  </p>
                </div>
                <div
                  className="rounded-2xl border px-4 py-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Initial Money
                  </p>
                  <p
                    className="mt-1 font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {selectedReport.initial_money.toLocaleString()} Birr
                  </p>
                </div>
                <div
                  className="rounded-2xl border px-4 py-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Net Bono Value
                  </p>
                  <p
                    className="mt-1 font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {selectedReport.net_bono_value.toLocaleString()} Birr
                  </p>
                </div>
                <div
                  className="rounded-2xl border px-4 py-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Special Payouts
                  </p>
                  <p
                    className="mt-1 font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {selectedReport.special_payouts.toLocaleString()} Birr
                  </p>
                </div>
                <div
                  className="rounded-2xl border px-4 py-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Today&apos;s Money
                  </p>
                  <p
                    className="mt-1 font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {selectedReport.today_money.toLocaleString()} Birr
                  </p>
                </div>
                <div
                  className="rounded-2xl border px-4 py-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Balance Check
                  </p>
                  <p
                    className="mt-1 font-semibold"
                    style={{
                      color:
                        selectedReport.balance_check === 0
                          ? "#22c55e"
                          : "var(--primary)",
                    }}
                  >
                    {selectedReport.balance_check.toLocaleString()} Birr
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePrint(selectedReport)}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium"
                style={{
                  background: "linear-gradient(135deg, #c9a84c, #a07828)",
                  color: "#0f1117",
                }}
              >
                Print / Save as PDF
              </button>
            </div>
          ) : (
            <div
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Select a report to view its details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
