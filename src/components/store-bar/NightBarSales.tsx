"use client";

import { useEffect, useState } from "react";
import {
  createBarItem,
  createBarNightSale,
  deleteBarItem,
  deleteBarNightSale,
  getBarItems,
  getBarNightSales,
  updateBarItem,
  type BarItemRecord,
  type BarNightSaleRecord,
} from "../../lib/supabase-data";
import { openReceiptWindow } from "../../lib/receipt";

interface CalculationRow {
  id: string;
  itemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
}

export default function NightBarSales() {
  const [activeTab, setActiveTab] = useState<"calculator" | "history">("calculator");
  const [barItems, setBarItems] = useState<BarItemRecord[]>([]);
  const [salesHistory, setSalesHistory] = useState<BarNightSaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for Sales Calculator
  const todayStr = new Date().toISOString().split("T")[0];
  const [saleDate, setSaleDate] = useState(todayStr);
  const [shiftName, setShiftName] = useState("Night Shift");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<CalculationRow[]>([
    { id: `row-${Date.now()}-1`, itemId: "", itemName: "", unitPrice: 0, quantity: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Modal State for Catalog Items
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [editingItem, setEditingItem] = useState<BarItemRecord | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogSubmitting, setCatalogSubmitting] = useState(false);

  // History Detail Modal
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<BarNightSaleRecord | null>(null);
  const [historySearch, setHistorySearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, historyData] = await Promise.all([
        getBarItems(),
        getBarNightSales(),
      ]);
      setBarItems(itemsData);
      setSalesHistory(historyData);
    } catch (err) {
      console.error("Error loading night bar sales data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Catalog Item Handlers
  const handleSaveCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice || Number(newItemPrice) < 0) {
      setCatalogError("Please enter a valid item name and unit price.");
      return;
    }

    setCatalogError(null);
    setCatalogSubmitting(true);

    try {
      if (editingItem) {
        const updated = await updateBarItem(editingItem.id, {
          name: newItemName.trim(),
          unit_price: Number(newItemPrice),
        });
        setBarItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        setEditingItem(null);
      } else {
        const created = await createBarItem({
          name: newItemName.trim(),
          unit_price: Number(newItemPrice),
          category: "bar",
        });
        setBarItems((prev) => [...prev, created]);
      }
      setNewItemName("");
      setNewItemPrice("");
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : "Failed to save item.");
    } finally {
      setCatalogSubmitting(false);
    }
  };

  const handleEditClick = (item: BarItemRecord) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemPrice(String(item.unit_price));
  };

  const handleDeleteCatalogItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item from the catalog?")) return;
    try {
      await deleteBarItem(id);
      setBarItems((prev) => prev.filter((i) => i.id !== id));
      if (editingItem?.id === id) {
        setEditingItem(null);
        setNewItemName("");
        setNewItemPrice("");
      }
    } catch (err) {
      alert("Failed to delete catalog item.");
    }
  };

  // Calculation Row Handlers
  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${prev.length + 1}`,
        itemId: "",
        itemName: "",
        unitPrice: 0,
        quantity: 0,
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleItemSelect = (rowId: string, itemId: string) => {
    const selectedItem = barItems.find((i) => i.id === itemId);
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          itemId,
          itemName: selectedItem ? selectedItem.name : "",
          unitPrice: selectedItem ? selectedItem.unit_price : 0,
        };
      })
    );
  };

  const handleQuantityChange = (rowId: string, qty: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, quantity: Math.max(0, qty) } : r))
    );
  };

  const handleUnitPriceChange = (rowId: string, price: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, unitPrice: Math.max(0, price) } : r))
    );
  };

  const grandTotal = rows.reduce((sum, row) => sum + row.quantity * row.unitPrice, 0);

  // Save Night Sales
  const handleSaveNightSales = async () => {
    const validRows = rows.filter((r) => (r.itemName || r.itemId) && r.quantity > 0);
    if (validRows.length === 0) {
      setSaveError("Please add at least one item with a valid quantity.");
      return;
    }

    setSaveError(null);
    setSaveSuccess(null);
    setSaving(true);

    try {
      const salePayload = {
        sale_date: saleDate,
        shift_name: shiftName || "Night Shift",
        grand_total: grandTotal,
        notes,
      };

      const lineItemsPayload = validRows.map((r) => ({
        item_id: r.itemId || undefined,
        item_name: r.itemName || "Item",
        unit_price: r.unitPrice,
        quantity: r.quantity,
        total_price: r.quantity * r.unitPrice,
      }));

      const created = await createBarNightSale(salePayload, lineItemsPayload);
      setSalesHistory((prev) => [created, ...prev]);

      setSaveSuccess(`Daily Night Sale recorded successfully! Total: ${grandTotal.toLocaleString()} Birr`);
      // Reset form
      setRows([
        { id: `row-${Date.now()}-1`, itemId: "", itemName: "", unitPrice: 0, quantity: 0 },
      ]);
      setNotes("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save night sales record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHistoryRecord = async (id: string) => {
    if (!confirm("Delete this night sales history record?")) return;
    try {
      await deleteBarNightSale(id);
      setSalesHistory((prev) => prev.filter((s) => s.id !== id));
      if (selectedSaleDetail?.id === id) {
        setSelectedSaleDetail(null);
      }
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  // Receipt Printing
  const handlePrintRecord = (record: BarNightSaleRecord) => {
    const itemsTableHtml = (record.items ?? [])
      .map(
        (item) => `
        <tr>
          <td>${item.item_name}</td>
          <td>${item.quantity}</td>
          <td>${item.unit_price.toLocaleString()} Birr</td>
          <td>${item.total_price.toLocaleString()} Birr</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <div class="container">
        <div class="header">
          <p class="title">Tsion Bar & Restaurant</p>
          <p class="subtitle">Daily Night Time Bar Sales Report</p>
          <div class="meta">
            <div><strong>Date:</strong> ${record.sale_date}</div>
            <div><strong>Shift:</strong> ${record.shift_name ?? "Night Shift"}</div>
            <div><strong>Record ID:</strong> ${record.id}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Qty Sold</th>
              <th>Price/Unit</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTableHtml}
          </tbody>
        </table>
        <div class="grand-total">
          <span>Grand Total Sales</span>
          <span>${record.grand_total.toLocaleString()} Birr</span>
        </div>
      </div>
    `;

    openReceiptWindow("Night Sales Report", htmlContent);
  };

  const filteredHistory = salesHistory.filter((s) => {
    if (!historySearch) return true;
    const query = historySearch.toLowerCase();
    return (
      s.sale_date.includes(query) ||
      (s.shift_name && s.shift_name.toLowerCase().includes(query)) ||
      (s.items && s.items.some((i) => i.item_name.toLowerCase().includes(query)))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--foreground)" }}>
            🌙 Night Time Bar Sales
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Calculate daily night bar sales, manage items & price per unit, and store sales history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingItem(null);
              setNewItemName("");
              setNewItemPrice("");
              setShowCatalogModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #c9a84c, #a07828)",
              color: "#0f1117",
            }}
          >
            <span>⚙️</span> Manage Bar Items
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        className="flex items-center gap-2 border-b p-1 rounded-xl"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <button
          onClick={() => setActiveTab("calculator")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "calculator"
              ? "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30"
              : "text-[#7a8090] hover:text-white"
            }`}
        >
          🧮 Daily Sales Calculator
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "history"
              ? "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30"
              : "text-[#7a8090] hover:text-white"
            }`}
        >
          📜 Night Sales History ({salesHistory.length})
        </button>
      </div>

      {/* Tab 1: Daily Sales Calculator */}
      {activeTab === "calculator" && (
        <div
          className="rounded-2xl p-6 space-y-6 overflow-hidden"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Form Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                Sales Date
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-base md:text-sm outline-none"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  colorScheme: "dark",
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                Shift / Shift Name
              </label>
              <input
                type="text"
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                placeholder="e.g. Night Shift"
                className="w-full px-4 py-2.5 rounded-xl text-base md:text-sm outline-none"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
          </div>

          {/* Calculator Table */}
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
                  <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-[#7a8090]">
                    Item Name
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-[#7a8090]">
                    Quantity
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-[#7a8090]">
                    Price Per Unit (Birr)
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-[#7a8090]">
                    Total (Birr)
                  </th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const rowTotal = row.quantity * row.unitPrice;
                  return (
                    <tr
                      key={row.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      className="hover:bg-white/[0.01] transition-colors"
                    >
                      {/* Item Select */}
                      <td className="px-4 py-3">
                        <select
                          value={row.itemId}
                          onChange={(e) => handleItemSelect(row.id, e.target.value)}
                          className="w-full min-w-[160px] px-3 py-2 rounded-xl text-sm outline-none"
                          style={{
                            backgroundColor: "var(--secondary)",
                            border: "1px solid var(--border)",
                            color: "var(--foreground)",
                          }}
                        >
                          <option value="">— Select Item —</option>
                          {barItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.unit_price} Birr)
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Quantity Input */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          value={row.quantity || ""}
                          onChange={(e) => handleQuantityChange(row.id, +e.target.value)}
                          placeholder="0"
                          className="w-28 px-3 py-2 rounded-xl text-base md:text-sm outline-none font-semibold"
                          style={{
                            backgroundColor: "var(--secondary)",
                            border: "1px solid var(--border)",
                            color: "var(--foreground)",
                          }}
                        />
                      </td>

                      {/* Price Per Unit (Display Only) */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-sm text-[#e8e6e1]">
                          {row.unitPrice > 0 ? `${row.unitPrice.toLocaleString()} Birr` : "—"}
                        </span>
                      </td>

                      {/* Line Item Total */}
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold text-base ${rowTotal > 0 ? "text-[#c9a84c]" : "text-[#7a8090]"
                            }`}
                        >
                          {rowTotal > 0 ? `${rowTotal.toLocaleString()} Birr` : "0 Birr"}
                        </span>
                      </td>

                      {/* Remove Row */}
                      <td className="px-4 py-3 text-right">
                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg transition-colors hover:bg-red-500/20 text-red-400 border border-red-500/30"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Row Button & Total Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={addRow}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: "var(--secondary)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            >
              + Add Another Item
            </button>

            {/* Grand Total Card */}
            <div
              className="w-full sm:w-auto px-6 py-4 rounded-2xl flex items-center justify-between sm:justify-end gap-6"
              style={{
                background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.02) 100%)",
                border: "1px solid rgba(201,168,76,0.25)",
              }}
            >
              <div className="text-left sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7a8090]">
                  Grand Total Night Sales
                </p>
                <p className="text-3xl font-bold font-display text-[#c9a84c]">
                  {grandTotal.toLocaleString()} <span className="text-sm font-normal">Birr</span>
                </p>
              </div>
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
              Shift Notes / Remarks (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any shift observations, cash notes, or comments..."
              className="w-full px-4 py-2.5 rounded-xl text-base md:text-sm outline-none"
              style={{
                backgroundColor: "var(--secondary)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          {/* Error & Success Feedback */}
          {saveError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 flex items-center justify-between">
              <span>{saveSuccess}</span>
              <button
                onClick={() => setActiveTab("history")}
                className="underline text-xs font-semibold text-emerald-200"
              >
                View History →
              </button>
            </div>
          )}

          {/* Save Action */}
          <div className="flex justify-end pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={handleSaveNightSales}
              disabled={saving}
              className="px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #c9a84c, #a07828)",
                color: "#0f1117",
              }}
            >
              {saving ? "Saving Record..." : "💾 Save Daily Night Sales Record"}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Sales History */}
      {activeTab === "history" && (
        <div
          className="rounded-2xl p-6 space-y-6 overflow-hidden"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {/* History Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-[#f4efe7]">Night Sales Records</h2>
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search date or item..."
                className="w-full px-4 py-2 rounded-xl text-base md:text-sm outline-none"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-[#7a8090]">
              <p className="text-base font-medium">No night sales history found.</p>
              <p className="text-xs mt-1">
                Record your first daily night sales calculation in the Daily Sales Calculator tab.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      backgroundColor: "rgba(255,255,255,0.02)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-[#7a8090]">
                      Date
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-[#7a8090]">
                      Items Count
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-[#7a8090]">
                      Grand Total
                    </th>
                    <th className="px-4 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-[#7a8090]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((record) => (
                    <tr
                      key={record.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3.5 font-medium text-[#f4efe7]">
                        {record.sale_date}
                      </td>
                      <td className="px-4 py-3.5 text-[#e8e6e1]">
                        {record.items?.length ?? 0} item(s)
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#c9a84c]">
                        {record.grand_total.toLocaleString()} Birr
                      </td>
                      <td className="px-2 py-3.5 sm:px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5 sm:gap-2">
                          <button
                            onClick={() => setSelectedSaleDetail(record)}
                            title="View Details"
                            className="px-2.5 py-1.5 sm:px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                            style={{
                              backgroundColor: "var(--secondary)",
                              border: "1px solid var(--border)",
                              color: "var(--foreground)",
                            }}
                          >
                            <span>👁</span>
                            <span className="hidden sm:inline">View Details</span>
                          </button>
                          <button
                            onClick={() => handlePrintRecord(record)}
                            title="Print Report"
                            className="px-2.5 py-1.5 sm:px-3 rounded-lg text-xs font-medium transition-all bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30 hover:bg-[#c9a84c]/30 flex items-center gap-1"
                          >
                            <span>🖨</span>
                            <span className="hidden sm:inline">Print Report</span>
                          </button>
                          <button
                            onClick={() => handleDeleteHistoryRecord(record.id)}
                            title="Delete Record"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-red-400 hover:bg-red-500/10 border border-red-500/20"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Catalog Management Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="w-full max-w-xl rounded-2xl p-6 space-y-6 overflow-hidden shadow-2xl"
            style={{
              backgroundColor: "#161a26",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border)" }}>
              <div>
                <h3 className="text-xl font-bold font-display text-[#f4efe7]">
                  📦 Bar Items Catalog
                </h3>
                <p className="text-xs text-[#7a8090] mt-0.5">
                  Add item names and price per unit to use in daily night calculations.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCatalogModal(false);
                  setEditingItem(null);
                  setNewItemName("");
                  setNewItemPrice("");
                }}
                className="text-lg text-[#7a8090] hover:text-white px-2"
              >
                ✕
              </button>
            </div>

            {/* Add / Edit Form */}
            <form onSubmit={handleSaveCatalogItem} className="space-y-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#c9a84c]">
                {editingItem ? "Edit Bar Item" : "+ Add New Item to Catalog"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-[#7a8090]">Item Name</label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Beer, Soft Drink"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl text-base md:text-sm outline-none"
                    style={{
                      backgroundColor: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#7a8090]">Price Per Unit (Birr)</label>
                  <input
                    type="number"
                    min={0}
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="e.g. 100"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl text-base md:text-sm outline-none"
                    style={{
                      backgroundColor: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>
              </div>

              {catalogError && (
                <div className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                  {catalogError}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                {editingItem && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setNewItemName("");
                      setNewItemPrice("");
                    }}
                    className="px-4 py-2 rounded-xl text-xs text-[#7a8090] hover:text-white"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={catalogSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: "linear-gradient(135deg, #c9a84c, #a07828)",
                    color: "#0f1117",
                  }}
                >
                  {catalogSubmitting
                    ? "Saving..."
                    : editingItem
                      ? "Update Item"
                      : "Add Item"}
                </button>
              </div>
            </form>

            {/* Catalog Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7a8090]">
                Current Catalog Items ({barItems.length})
              </h4>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-white/5">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white/[0.03] text-[#7a8090]">
                    <tr>
                      <th className="p-3">Item Name</th>
                      <th className="p-3">Price / Unit</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {barItems.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-medium text-[#f4efe7]">{item.name}</td>
                        <td className="p-3 text-[#c9a84c] font-semibold">
                          {item.unit_price.toLocaleString()} Birr
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="text-xs text-[#c9a84c] hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCatalogItem(item.id)}
                            className="text-xs text-red-400 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowCatalogModal(false)}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Record Details Modal */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl rounded-2xl p-6 space-y-6 overflow-hidden shadow-2xl"
            style={{
              backgroundColor: "#161a26",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border)" }}>
              <div>
                <h3 className="text-xl font-bold font-display text-[#f4efe7]">
                  📊 Night Sale Details
                </h3>
                <p className="text-xs text-[#7a8090] mt-0.5">
                  Date: {selectedSaleDetail.sale_date} · {selectedSaleDetail.shift_name ?? "Night Shift"}
                </p>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="text-lg text-[#7a8090] hover:text-white px-2"
              >
                ✕
              </button>
            </div>

            {/* Line Items Breakdown Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/[0.03] text-[#7a8090] uppercase text-xs">
                  <tr>
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#e8e6e1]">
                  {(selectedSaleDetail.items ?? []).map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="p-3 font-medium text-[#f4efe7]">{item.item_name}</td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">{item.unit_price.toLocaleString()} Birr</td>
                      <td className="p-3 font-semibold text-[#c9a84c]">
                        {item.total_price.toLocaleString()} Birr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedSaleDetail.notes && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-[#7a8090]">
                <span className="font-semibold text-[#e8e6e1]">Notes:</span> {selectedSaleDetail.notes}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <div>
                <span className="text-xs text-[#7a8090]">Grand Total:</span>
                <p className="text-2xl font-bold font-display text-[#c9a84c]">
                  {selectedSaleDetail.grand_total.toLocaleString()} Birr
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handlePrintRecord(selectedSaleDetail)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md"
                  style={{
                    background: "linear-gradient(135deg, #c9a84c, #a07828)",
                    color: "#0f1117",
                  }}
                >
                  🖨 Print / Export Receipt
                </button>
                <button
                  onClick={() => setSelectedSaleDetail(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-medium"
                  style={{
                    backgroundColor: "var(--secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
