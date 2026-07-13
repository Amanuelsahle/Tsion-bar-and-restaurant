import { useState } from "react";
import type { Item, Transaction } from "../lib/mockData";
import { BAR_MANAGERS } from "../lib/mockData";
import { openReceiptWindow } from "../lib/receipt";

interface DistributionHistoryProps {
  transactions: Transaction[];
  items: Item[];
}

export default function DistributionHistory({
  transactions,
  items,
}: DistributionHistoryProps) {
  const [search, setSearch] = useState("");
  const [filterBarMan, setFilterBarMan] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [detail, setDetail] = useState<Transaction | null>(null);

  const filtered = transactions
    .filter((t) => {
      const matchBarMan = !filterBarMan || t.barMan === filterBarMan;
      const matchDate = !filterDate || t.date === filterDate;
      const matchSearch =
        !search ||
        t.barMan.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase());
      return matchBarMan && matchDate && matchSearch;
    })
    .sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return bTime - aTime;
    });

  if (detail) {
    const handlePrintReceipt = () => {
      const receiptHtml = `
        <div class="container">
          <div class="header">
            <p class="title">Tsion Bar & Restaurant</p>
            <p class="subtitle">Bar Distribution Receipt</p>
            <div class="meta">
              <div><strong>Date:</strong> ${detail.date}</div>
              <div><strong>Receipt No:</strong> ${detail.id}</div>
              <div><strong>Bar Manager:</strong> ${detail.barMan}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Boxes</th>
                <th>Qty/Box</th>
                <th>Price/Unit</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${detail.rows
                .map((row) => {
                  const item = items.find((it) => it.id === row.itemId);
                  const qtyPerBox = row.qtyPerBox ?? item?.qtyPerBox ?? 0;
                  const unitPrice = row.unitPrice ?? item?.pricePerUnit ?? 0;
                  const total = row.total ?? qtyPerBox * unitPrice * row.boxes;
                  return `
                  <tr>
                    <td>${item?.name ?? row.itemId}</td>
                    <td>${row.boxes}</td>
                    <td>${qtyPerBox}</td>
                    <td>${unitPrice.toLocaleString()} Birr</td>
                    <td>${total.toLocaleString()} Birr</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
          <div class="grand-total">
            <span>Grand Total</span>
            <span>${detail.grandTotal.toLocaleString()} Birr</span>
          </div>
        </div>
      `;
      openReceiptWindow("Transaction Receipt", receiptHtml);
    };

    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDetail(null)}
            className="text-sm px-4 py-2 rounded-xl"
            style={{
              backgroundColor: "var(--secondary)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            ← Back
          </button>
          <h1
            className="text-xl font-bold font-display"
            style={{ color: "var(--foreground)" }}
          >
            Transaction Details
          </h1>
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="p-6"
            style={{
              borderBottom: "1px solid var(--border)",
              background:
                "linear-gradient(135deg, rgba(201,168,76,0.06), transparent)",
            }}
          >
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Receipt No
                </p>
                <p
                  className="font-semibold mt-1"
                  style={{ color: "var(--primary)" }}
                >
                  {detail.id}
                </p>
              </div>
              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Date
                </p>
                <p
                  className="font-semibold mt-1"
                  style={{ color: "var(--foreground)" }}
                >
                  {detail.date}
                </p>
              </div>
              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Bar Manager
                </p>
                <p
                  className="font-semibold mt-1"
                  style={{ color: "var(--foreground)" }}
                >
                  {detail.barMan}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Item", "Boxes", "Qty/Box", "Price/Unit", "Total"].map(
                    (h) => (
                      <th
                        key={h}
                        className="pb-3 text-left text-xs font-medium uppercase"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {detail.rows.map((row, i) => {
                  const item = items.find((it) => it.id === row.itemId);
                  const qtyPerBox = row.qtyPerBox ?? item?.qtyPerBox ?? 0;
                  const unitPrice = row.unitPrice ?? item?.pricePerUnit ?? 0;
                  const total = row.total ?? qtyPerBox * unitPrice * row.boxes;
                  return (
                    <tr
                      key={i}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td
                        className="py-3.5 font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {item?.name ?? row.itemId}
                      </td>
                      <td
                        className="py-3.5"
                        style={{ color: "var(--foreground)" }}
                      >
                        {row.boxes}
                      </td>
                      <td
                        className="py-3.5"
                        style={{ color: "var(--foreground)" }}
                      >
                        {qtyPerBox}
                      </td>
                      <td
                        className="py-3.5"
                        style={{ color: "var(--foreground)" }}
                      >
                        {unitPrice.toLocaleString()} Birr
                      </td>
                      <td
                        className="py-3.5 font-semibold"
                        style={{ color: "var(--primary)" }}
                      >
                        {total.toLocaleString()} Birr
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div
              className="flex justify-between items-center mt-6 pt-4"
              style={{ borderTop: "2px solid var(--primary)" }}
            >
              <span
                className="text-base font-bold"
                style={{ color: "var(--foreground)" }}
              >
                Grand Total
              </span>
              <span
                className="text-2xl font-bold font-display"
                style={{ color: "var(--primary)" }}
              >
                {detail.grandTotal.toLocaleString()} Birr
              </span>
            </div>
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={handlePrintReceipt}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #c9a84c, #a07828)",
                color: "#0f1117",
              }}
            >
              Print
            </button>
            <button
              onClick={handlePrintReceipt}
              className="px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{
                backgroundColor: "var(--secondary)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold font-display"
          style={{ color: "var(--foreground)" }}
        >
          Distribution History
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          All bar distribution transactions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by bar manager or ID..."
          className="px-4 py-2.5 rounded-xl text-sm outline-none flex-1 min-w-48"
          style={{
            backgroundColor: "var(--secondary)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--primary)")
          }
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
        <select
          value={filterBarMan}
          onChange={(e) => setFilterBarMan(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: "var(--secondary)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        >
          <option value="">All Bar Managers</option>
          {BAR_MANAGERS.map((bm) => (
            <option key={bm} value={bm}>
              {bm}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: "var(--secondary)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            colorScheme: "dark",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--primary)")
          }
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
        {(search || filterBarMan || filterDate) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterBarMan("");
              setFilterDate("");
            }}
            className="px-4 py-2.5 rounded-xl text-sm"
            style={{
              backgroundColor: "rgba(239,68,68,0.08)",
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            Clear
          </button>
        )}
      </div>

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
                  "Date",
                  "Receipt No",
                  "Bar Manager",
                  "Items",
                  "Grand Total",
                  "Status",
                  "",
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
              {filtered.map((txn, i) => (
                <tr
                  key={txn.id}
                  style={{
                    borderBottom:
                      i < filtered.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    backgroundColor: "var(--card)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--card)")
                  }
                >
                  <td
                    className="px-5 py-4 text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {txn.date}
                  </td>
                  <td
                    className="px-5 py-4 font-mono text-xs"
                    style={{ color: "var(--primary)" }}
                  >
                    {txn.id}
                  </td>
                  <td
                    className="px-5 py-4 font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    {txn.barMan}
                  </td>
                  <td
                    className="px-5 py-4"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {txn.rows
                      .map((r) => items.find((it) => it.id === r.itemId)?.name)
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                  <td
                    className="px-5 py-4 font-semibold font-display"
                    style={{ color: "var(--primary)" }}
                  >
                    {txn.grandTotal.toLocaleString()} Birr
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: "rgba(34,197,94,0.1)",
                        color: "#4ade80",
                        border: "1px solid rgba(34,197,94,0.2)",
                      }}
                    >
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setDetail(txn)}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        backgroundColor: "var(--secondary)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor = "var(--primary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = "var(--border)")
                      }
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div
            className="py-16 text-center"
            style={{ color: "var(--muted-foreground)" }}
          >
            <p className="text-sm">No transactions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
