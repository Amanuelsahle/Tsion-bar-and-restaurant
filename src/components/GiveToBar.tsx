import { useState } from "react";
import type { Item, Transaction } from "../lib/mockData";
import { BAR_MANAGERS } from "../lib/mockData";

interface GiveToBarProps {
  items: Item[];
  onSave: (transaction: Transaction) => Promise<void> | void;
}

interface RowState {
  itemId: string;
  boxes: number;
}

export default function GiveToBar({ items, onSave }: GiveToBarProps) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [barMan, setBarMan] = useState("");
  const [rows, setRows] = useState<RowState[]>([{ itemId: "", boxes: 0 }]);
  const [saved, setSaved] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addRow() {
    setRows([...rows, { itemId: "", boxes: 0 }]);
  }
  function removeRow(i: number) {
    setRows(rows.filter((_, idx) => idx !== i));
  }
  function updateRow(i: number, field: keyof RowState, value: string | number) {
    const updated = rows.map((r, idx) =>
      idx === i ? { ...r, [field]: value } : r,
    );
    setRows(updated);
  }

  function calcRowTotal(row: RowState) {
    const item = items.find((i) => i.id === row.itemId);
    if (!item || row.boxes <= 0) return 0;
    return row.boxes * item.qtyPerBox * item.pricePerUnit;
  }

  const grandTotal = rows.reduce((s, r) => s + calcRowTotal(r), 0);
  const validRows = rows.filter((r) => r.itemId && r.boxes > 0);

  async function handleSave() {
    if (!barMan || validRows.length === 0) return;

    setError(null);
    setSubmitting(true);

    try {
      const txn: Transaction = {
        id: `T${Date.now()}`,
        date,
        barMan,
        rows: validRows.map((r) => ({ itemId: r.itemId, boxes: r.boxes })),
        grandTotal,
        status: "Completed",
      };
      await onSave(txn);
      setSaved(txn);
      setShowReceipt(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save distribution.");
    } finally {
      setSubmitting(false);
    }
  }

  if (showReceipt && saved) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setShowReceipt(false);
              setSaved(null);
              setRows([{ itemId: "", boxes: 0 }]);
              setBarMan("");
            }}
            className="text-sm px-4 py-2 rounded-xl"
            style={{
              backgroundColor: "var(--secondary)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            ← New Distribution
          </button>
          <h1
            className="text-xl font-bold font-display"
            style={{ color: "var(--foreground)" }}
          >
            Receipt Generated
          </h1>
        </div>
        <div
          className="max-w-2xl rounded-2xl overflow-hidden"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          {/* Receipt header */}
          <div
            className="p-8 text-center"
            style={{
              borderBottom: "1px solid var(--border)",
              background: "linear-gradient(135deg, #1a1200 0%, #181c27 100%)",
            }}
          >
            <p
              className="font-display text-2xl font-bold"
              style={{ color: "var(--primary)" }}
            >
              Tsion Bar & Restaurant
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Bar Distribution Receipt
            </p>
            <div className="flex justify-center gap-8 mt-4 text-xs">
              <div>
                <p style={{ color: "var(--muted-foreground)" }}>Date</p>
                <p
                  className="font-semibold mt-0.5"
                  style={{ color: "var(--foreground)" }}
                >
                  {saved.date}
                </p>
              </div>
              <div>
                <p style={{ color: "var(--muted-foreground)" }}>Receipt No</p>
                <p
                  className="font-semibold mt-0.5"
                  style={{ color: "var(--foreground)" }}
                >
                  {saved.id}
                </p>
              </div>
              <div>
                <p style={{ color: "var(--muted-foreground)" }}>Bar Manager</p>
                <p
                  className="font-semibold mt-0.5"
                  style={{ color: "var(--foreground)" }}
                >
                  {saved.barMan}
                </p>
              </div>
            </div>
          </div>
          {/* Items */}
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
                {saved.rows.map((row, i) => {
                  const item = items.find((it) => it.id === row.itemId);
                  const total = item
                    ? row.boxes * item.qtyPerBox * item.pricePerUnit
                    : 0;
                  return (
                    <tr
                      key={i}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td
                        className="py-3 font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {item?.name}
                      </td>
                      <td
                        className="py-3"
                        style={{ color: "var(--foreground)" }}
                      >
                        {row.boxes}
                      </td>
                      <td
                        className="py-3"
                        style={{ color: "var(--foreground)" }}
                      >
                        {item?.qtyPerBox}
                      </td>
                      <td
                        className="py-3"
                        style={{ color: "var(--foreground)" }}
                      >
                        {item?.pricePerUnit} Birr
                      </td>
                      <td
                        className="py-3 font-semibold"
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
                {saved.grandTotal.toLocaleString()} Birr
              </span>
            </div>
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #c9a84c, #a07828)",
                color: "#0f1117",
              }}
            >
              Print Receipt
            </button>
            <button
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
          Give Items to Bar
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          Record daily bar distribution and auto-deduct from store inventory
        </p>
      </div>

      <div
        className="rounded-2xl p-6 space-y-6"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium"
              style={{ color: "var(--muted-foreground)" }}
            >
              Distribution Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: "var(--secondary)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                colorScheme: "dark",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--primary)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            />
          </div>
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium"
              style={{ color: "var(--muted-foreground)" }}
            >
              Bar Manager
            </label>
            <select
              value={barMan}
              onChange={(e) => setBarMan(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: "var(--secondary)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--primary)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            >
              <option value="">— Select Bar Manager —</option>
              {BAR_MANAGERS.map((bm) => (
                <option key={bm} value={bm}>
                  {bm}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Distribution table */}
        <div
          className="overflow-x-auto rounded-xl"
          style={{ border: "1px solid var(--border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <th
                  className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Item
                </th>
                <th
                  className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Boxes Given
                </th>
                <th
                  className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Qty/Box
                </th>
                <th
                  className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Price/Unit (Birr)
                </th>
                <th
                  className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Total (Birr)
                </th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const item = items.find((it) => it.id === row.itemId);
                const total = calcRowTotal(row);
                return (
                  <tr
                    key={i}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td className="px-4 py-3">
                      <select
                        value={row.itemId}
                        onChange={(e) => updateRow(i, "itemId", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{
                          backgroundColor: "var(--secondary)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                          minWidth: 180,
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "var(--primary)")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "var(--border)")
                        }
                      >
                        <option value="">— Select —</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name} ({it.currentBoxes} boxes)
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={row.boxes || ""}
                        onChange={(e) => updateRow(i, "boxes", +e.target.value)}
                        className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
                        style={{
                          backgroundColor: "var(--secondary)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "var(--primary)")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "var(--border)")
                        }
                      />
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {item?.qtyPerBox ?? "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {item?.pricePerUnit ?? "—"}
                    </td>
                    <td
                      className="px-4 py-3 font-semibold"
                      style={{
                        color:
                          total > 0
                            ? "var(--primary)"
                            : "var(--muted-foreground)",
                      }}
                    >
                      {total > 0 ? `${total.toLocaleString()} Birr` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {rows.length > 1 && (
                        <button
                          onClick={() => removeRow(i)}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{
                            color: "#f87171",
                            backgroundColor: "rgba(239,68,68,0.08)",
                          }}
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={addRow}
            className="text-sm px-4 py-2.5 rounded-xl font-medium transition-all"
            style={{
              backgroundColor: "var(--secondary)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            + Add Row
          </button>
          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Grand Total
            </p>
            <p
              className="text-3xl font-bold font-display"
              style={{ color: "var(--primary)" }}
            >
              {grandTotal.toLocaleString()} Birr
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={!barMan || validRows.length === 0 || submitting}
            className="px-8 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background:
                barMan && validRows.length > 0 && !submitting
                  ? "linear-gradient(135deg, #c9a84c, #a07828)"
                  : "var(--muted)",
              color:
                barMan && validRows.length > 0 && !submitting
                  ? "#0f1117"
                  : "var(--muted-foreground)",
              cursor:
                barMan && validRows.length > 0 && !submitting ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "Saving..." : "Save & Generate Receipt"}
          </button>
        </div>
      </div>
    </div>
  );
}
