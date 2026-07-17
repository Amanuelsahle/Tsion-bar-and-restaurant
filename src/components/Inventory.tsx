import { useState } from "react";
import type { Item, Category } from "../lib/mockData";

interface InventoryProps {
  items: Item[];
}

const CAT_COLORS: Record<Category, string> = {
  Beer: "#f59e0b",
  "Soft Drink": "#3b82f6",
  Water: "#06b6d4",
  Wine: "#8b5cf6",
  Liqueurs: "#ec4899",
};

export default function Inventory({ items }: InventoryProps) {
  const [filter, setFilter] = useState<Category | "All">("All");
  const [showLowOnly, setShowLowOnly] = useState(false);

  const filtered = items
    .filter((i) => filter === "All" || i.category === filter)
    .filter((i) => !showLowOnly || i.currentBoxes < i.minThreshold);
  const sortedItems = [...filtered].sort((a, b) => {
    const aLow = a.currentBoxes < a.minThreshold;
    const bLow = b.currentBoxes < b.minThreshold;

    if (aLow === bLow) return 0;
    return aLow ? 1 : -1;
  });
  const showBottleMetrics = filter === "Liqueurs";

  const totalBoxes = items.reduce((s, i) => s + i.currentBoxes, 0);
  const totalUnits = items.reduce(
    (s, i) => s + i.currentBoxes * i.qtyPerBox,
    0,
  );
  const lowCount = items.filter((i) => i.currentBoxes < i.minThreshold).length;
  const totalValue = items.reduce(
    (s, i) => s + i.currentBoxes * i.qtyPerBox * i.pricePerUnit,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold font-display"
          style={{ color: "var(--foreground)" }}
        >
          Inventory
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          Current stock levels across all categories
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: showBottleMetrics ? "Total Bottles" : "Total Boxes",
            value: totalBoxes.toLocaleString(),
            unit: showBottleMetrics ? "bottles" : "boxes",
          },
          {
            label: showBottleMetrics ? "Total Ounces" : "Total Units",
            value: totalUnits.toLocaleString(),
            unit: showBottleMetrics ? "ounces" : "units",
          },
          {
            label: "Low Stock Items",
            value: lowCount,
            unit: "items",
            alert: lowCount > 0,
          },
          {
            label: "Inventory Value",
            value: `${(totalValue / 1000).toFixed(0)}k`,
            unit: "Birr",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-5"
            style={{
              backgroundColor: card.alert
                ? "rgba(239,68,68,0.06)"
                : "var(--card)",
              border: card.alert
                ? "1px solid rgba(239,68,68,0.2)"
                : "1px solid var(--border)",
            }}
          >
            <p
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)" }}
            >
              {card.label}
            </p>
            <p
              className="text-3xl font-bold font-display mt-3"
              style={{ color: card.alert ? "#f87171" : "var(--primary)" }}
            >
              {card.value}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              {card.unit}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="overflow-x-auto pb-1 no-scrollbar">
          <div className="flex w-max min-w-full gap-2">
            {(
              [
                "All",
                "Beer",
                "Soft Drink",
                "Water",
                "Wine",
                "Liqueurs",
              ] as const
            ).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat as any)}
                className="shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-medium transition-all"
                style={{
                  backgroundColor:
                    filter === cat
                      ? "rgba(201,168,76,0.15)"
                      : "var(--secondary)",
                  color:
                    filter === cat
                      ? "var(--primary)"
                      : "var(--muted-foreground)",
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
        <button
          onClick={() => setShowLowOnly(!showLowOnly)}
          className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
          style={{
            backgroundColor: showLowOnly
              ? "rgba(239,68,68,0.12)"
              : "var(--secondary)",
            color: showLowOnly ? "#f87171" : "var(--muted-foreground)",
            border: showLowOnly
              ? "1px solid rgba(239,68,68,0.3)"
              : "1px solid var(--border)",
          }}
        >
          Low Stock Only
        </button>
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
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {[
                  "Item",
                  "Category",
                  showBottleMetrics ? "Current Bottles" : "Boxes Remaining",
                  showBottleMetrics ? "Ounces Remaining" : "Units Remaining",
                  "Price/Unit",
                  "Value",
                  "Status",
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
              {sortedItems.map((item, i) => {
                const isLow = item.currentBoxes < item.minThreshold;
                const value =
                  item.currentBoxes * item.qtyPerBox * item.pricePerUnit;
                return (
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
                        className="px-2.5 py-1 rounded-full text-xs"
                        style={{
                          backgroundColor: `${CAT_COLORS[item.category]}18`,
                          color: CAT_COLORS[item.category],
                          border: `1px solid ${CAT_COLORS[item.category]}30`,
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-semibold"
                          style={{
                            color: isLow ? "#f87171" : "var(--foreground)",
                          }}
                        >
                          {item.currentBoxes}
                        </span>
                        <div
                          className="flex-1 max-w-16 h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: "var(--secondary)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (item.currentBoxes / Math.max(item.minThreshold * 5, item.currentBoxes)) * 100)}%`,
                              backgroundColor: isLow
                                ? "#f87171"
                                : "var(--primary)",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-5 py-4"
                      style={{ color: "var(--foreground)" }}
                    >
                      {(item.currentBoxes * item.qtyPerBox).toLocaleString()}
                    </td>
                    <td
                      className="px-5 py-4"
                      style={{ color: "var(--foreground)" }}
                    >
                      {item.pricePerUnit} Birr
                    </td>
                    <td
                      className="px-5 py-4 font-medium"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {value.toLocaleString()} Birr
                    </td>
                    <td className="px-5 py-4">
                      {isLow ? (
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: "rgba(239,68,68,0.12)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.25)",
                          }}
                        >
                          Low Stock
                        </span>
                      ) : (
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: "rgba(34,197,94,0.1)",
                            color: "#4ade80",
                            border: "1px solid rgba(34,197,94,0.2)",
                          }}
                        >
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div
            className="py-16 text-center"
            style={{ color: "var(--muted-foreground)" }}
          >
            <p className="text-sm">No items match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
