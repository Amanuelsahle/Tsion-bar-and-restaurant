import { useState } from "react";
import type { Item, Category } from "../lib/mockData";

interface ItemManagementProps {
  items: Item[];
  onAdd: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES: Category[] = [
  "Beer",
  "Soft Drink",
  "Water",
  "Wine",
  "Liqueurs",
];
const CAT_COLORS: Record<Category, string> = {
  Beer: "#f59e0b",
  "Soft Drink": "#3b82f6",
  Water: "#06b6d4",
  Wine: "#8b5cf6",
  Liqueurs: "#ec4899",
};

const emptyForm = {
  name: "",
  category: "Beer" as Category,
  qtyPerBox: 24,
  pricePerUnit: 0,
  currentBoxes: 0,
  minThreshold: 10,
};

export default function ItemManagement({
  items,
  onAdd,
  onEdit,
  onDelete,
}: ItemManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<Category | "All">("All");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered =
    filter === "All" ? items : items.filter((i) => i.category === filter);
  const showBottleMetrics = filter === "Liqueurs";

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }
  function openEdit(item: Item) {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      qtyPerBox: item.qtyPerBox,
      pricePerUnit: item.pricePerUnit,
      currentBoxes: item.currentBoxes,
      minThreshold: item.minThreshold,
    });
    setShowForm(true);
  }
  function handleSave() {
    if (!form.name) return;
    if (editing) {
      onEdit({ ...editing, ...form });
    } else {
      onAdd({ id: Date.now().toString(), ...form });
    }
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold font-display"
            style={{ color: "var(--foreground)" }}
          >
            Item Management
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Create and manage store inventory items
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "linear-gradient(135deg, #c9a84c, #a07828)",
            color: "#0f1117",
          }}
        >
          + Add New Item
        </button>
      </div>

      {/* Category filter */}
      <div className="overflow-x-auto pb-1 no-scrollbar">
        <div className="flex w-max min-w-full gap-2">
          {(["All", ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat as any)}
              className="shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-medium transition-all"
              style={{
                backgroundColor:
                  filter === cat ? "rgba(201,168,76,0.15)" : "var(--secondary)",
                color:
                  filter === cat ? "var(--primary)" : "var(--muted-foreground)",
                border:
                  filter === cat
                    ? "1px solid rgba(201,168,76,0.3)"
                    : "1px solid var(--border)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                }}
              >
                {[
                  "Item Name",
                  "Category",
                  showBottleMetrics ? "Ounces/Bottle" : "Qty/Box",
                  "Price/Unit (Birr)",
                  showBottleMetrics ? "Current Bottles" : "Boxes in Store",
                  showBottleMetrics ? "Ounces Total" : "Units Total",
                  "Min Threshold",
                  "Actions",
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
              {filtered.map((item, i) => (
                <tr
                  key={item.id}
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
                    className="px-5 py-4 font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    {item.name}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${CAT_COLORS[item.category]}18`,
                        color: CAT_COLORS[item.category],
                        border: `1px solid ${CAT_COLORS[item.category]}30`,
                      }}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td
                    className="px-5 py-4"
                    style={{ color: "var(--foreground)" }}
                  >
                    {item.qtyPerBox}
                  </td>
                  <td
                    className="px-5 py-4 font-medium"
                    style={{ color: "var(--primary)" }}
                  >
                    {item.pricePerUnit} Birr
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="font-semibold"
                      style={{
                        color:
                          item.currentBoxes < item.minThreshold
                            ? "#f87171"
                            : "var(--foreground)",
                      }}
                    >
                      {item.currentBoxes}
                    </span>
                    {item.currentBoxes < item.minThreshold && (
                      <span
                        className="ml-2 text-xs px-1.5 py-0.5 rounded-md"
                        style={{
                          backgroundColor: "rgba(239,68,68,0.1)",
                          color: "#f87171",
                        }}
                      >
                        Low
                      </span>
                    )}
                  </td>
                  <td
                    className="px-5 py-4"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {(item.currentBoxes * item.qtyPerBox).toLocaleString()}
                  </td>
                  <td
                    className="px-5 py-4"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {item.minThreshold}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
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
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          backgroundColor: "rgba(239,68,68,0.1)",
                          color: "#f87171",
                          border: "1px solid rgba(239,68,68,0.2)",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 space-y-5"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-lg font-bold font-display"
                style={{ color: "var(--foreground)" }}
              >
                {editing ? "Edit Item" : "Add New Item"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-xl"
                style={{ color: "var(--muted-foreground)" }}
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Item Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. St. George Beer"
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
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as Category })
                  }
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: "var(--secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {form.category === "Liqueurs"
                    ? "Ounces per Bottle"
                    : "Qty Per Box"}
                </label>
                <input
                  type="number"
                  value={form.qtyPerBox}
                  onChange={(e) =>
                    setForm({ ...form, qtyPerBox: +e.target.value })
                  }
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
                  Price Per Unit (Birr)
                </label>
                <input
                  type="number"
                  value={form.pricePerUnit}
                  onChange={(e) =>
                    setForm({ ...form, pricePerUnit: +e.target.value })
                  }
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
                  {form.category === "Liqueurs"
                    ? "Current Bottles"
                    : "Current Boxes"}
                </label>
                <input
                  type="number"
                  value={form.currentBoxes}
                  onChange={(e) =>
                    setForm({ ...form, currentBoxes: +e.target.value })
                  }
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
                  Min Threshold
                </label>
                <input
                  type="number"
                  value={form.minThreshold}
                  onChange={(e) =>
                    setForm({ ...form, minThreshold: +e.target.value })
                  }
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
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: "linear-gradient(135deg, #c9a84c, #a07828)",
                  color: "#0f1117",
                }}
              >
                {editing ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="text-base font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Delete Item?
            </h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl text-sm"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(deleteId);
                  setDeleteId(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: "rgba(239,68,68,0.15)",
                  color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
