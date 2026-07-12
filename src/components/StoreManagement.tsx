import { useState } from "react";
import type { Item, StockHistory } from "../lib/mockData";

interface StoreManagementProps {
  items: Item[];
  stockHistory: StockHistory[];
  onAddStock: (itemId: string, boxes: number, note: string) => void;
}

export default function StoreManagement({
  items,
  stockHistory,
  onAddStock,
}: StoreManagementProps) {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [addBoxes, setAddBoxes] = useState(0);
  const [note, setNote] = useState("");
  const [success, setSuccess] = useState("");

  const selectedItem = items.find((i) => i.id === selectedItemId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItemId || addBoxes <= 0) return;
    onAddStock(selectedItemId, addBoxes, note || "Manual restock");
    setSuccess(
      `Added ${addBoxes} boxes of ${selectedItem?.name}. New total: ${(selectedItem?.currentBoxes ?? 0) + addBoxes} boxes.`,
    );
    setAddBoxes(0);
    setNote("");
    setTimeout(() => setSuccess(""), 4000);
  }

  const sortedHistory = [...stockHistory].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold font-display"
          style={{ color: "var(--foreground)" }}
        >
          Store Management
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          Increase stock and track inventory movements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Add stock form */}
        <div
          className="lg:col-span-2 rounded-2xl p-6 space-y-5 h-fit"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Add Stock
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--muted-foreground)" }}
              >
                Select Item
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
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
                <option value="">— Select an item —</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Current: {item.currentBoxes} boxes)
                  </option>
                ))}
              </select>
            </div>

            {selectedItem && (
              <div
                className="rounded-xl p-4 space-y-2"
                style={{
                  backgroundColor: "rgba(201,168,76,0.06)",
                  border: "1px solid rgba(201,168,76,0.15)",
                }}
              >
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--muted-foreground)" }}>
                    Current Boxes
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: "var(--primary)" }}
                  >
                    {selectedItem.currentBoxes}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--muted-foreground)" }}>
                    Category
                  </span>
                  <span style={{ color: "var(--foreground)" }}>
                    {selectedItem.category}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--muted-foreground)" }}>
                    Price/Unit
                  </span>
                  <span style={{ color: "var(--foreground)" }}>
                    {selectedItem.pricePerUnit} Birr
                  </span>
                </div>
                {addBoxes > 0 && (
                  <div
                    className="flex justify-between text-xs border-t pt-2 mt-2"
                    style={{ borderColor: "rgba(201,168,76,0.2)" }}
                  >
                    <span style={{ color: "var(--muted-foreground)" }}>
                      New Total
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: "var(--primary)" }}
                    >
                      {selectedItem.currentBoxes + addBoxes} boxes
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--muted-foreground)" }}
              >
                Boxes to Add
              </label>
              <input
                type="number"
                min={1}
                value={addBoxes || ""}
                onChange={(e) => setAddBoxes(+e.target.value)}
                placeholder="e.g. 20"
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
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--muted-foreground)" }}
              >
                Note (optional)
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Monthly restock"
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
              />
            </div>

            {success && (
              <div
                className="px-4 py-3 rounded-xl text-xs"
                style={{
                  backgroundColor: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  color: "#4ade80",
                }}
              >
                ✓ {success}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "linear-gradient(135deg, #c9a84c, #a07828)",
                color: "#0f1117",
              }}
            >
              Add to Store
            </button>
          </form>
        </div>

        {/* Stock history */}
        <div
          className="lg:col-span-3 rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
          >
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Stock Movement History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border)",
                    backgroundColor: "rgba(255,255,255,0.01)",
                  }}
                >
                  {["Date", "Item", "Type", "Boxes", "Note"].map((h) => (
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
                {sortedHistory.map((sh, i) => {
                  const item = items.find((it) => it.id === sh.itemId);
                  return (
                    <tr
                      key={sh.id}
                      style={{
                        borderBottom:
                          i < sortedHistory.length - 1
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
                        className="px-5 py-3.5 text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {sh.date}
                      </td>
                      <td
                        className="px-5 py-3.5 text-sm font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {item?.name ?? sh.itemId}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            backgroundColor:
                              sh.type === "in"
                                ? "rgba(34,197,94,0.1)"
                                : "rgba(239,68,68,0.1)",
                            color: sh.type === "in" ? "#4ade80" : "#f87171",
                            border: `1px solid ${sh.type === "in" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                          }}
                        >
                          {sh.type === "in" ? "Stock In" : "Distributed"}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3.5 font-semibold"
                        style={{
                          color: sh.type === "in" ? "#4ade80" : "#f87171",
                        }}
                      >
                        {sh.type === "in" ? "+" : "-"}
                        {sh.boxes}
                      </td>
                      <td
                        className="px-5 py-3.5 text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {sh.note}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
