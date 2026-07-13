import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
  CartesianGrid,
} from "recharts";
import type { Item, Transaction } from "../lib/mockData";

interface ReportsProps {
  items: Item[];
  transactions: Transaction[];
}

const COLORS = [
  "#c9a84c",
  "#3b82f6",
  "#06b6d4",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

function customTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 text-xs shadow-xl"
      style={{ backgroundColor: "#1e2435", border: "1px solid var(--border)" }}
    >
      <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}:{" "}
          {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

type ReportPeriod = "daily" | "weekly" | "monthly";

type ChartDatum = {
  label: string;
  boxes: number;
  value: number;
  sortKey: string;
};

function getPeriodKey(date: string, period: ReportPeriod) {
  const parsed = new Date(`${date}T00:00:00`);

  if (period === "daily") {
    return parsed.toISOString().slice(0, 10);
  }

  if (period === "weekly") {
    const weekStart = new Date(parsed);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
  }

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
}

function getPeriodLabel(date: string, period: ReportPeriod) {
  const parsed = new Date(`${date}T00:00:00`);

  if (period === "daily") {
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  if (period === "weekly") {
    const weekStart = new Date(parsed);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    return `Week of ${weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function buildChartData(transactions: Transaction[], period: ReportPeriod) {
  const buckets = new Map<string, ChartDatum>();

  transactions.forEach((transaction) => {
    const key = getPeriodKey(transaction.date, period);
    const label = getPeriodLabel(transaction.date, period);
    const existing = buckets.get(key) ?? {
      label,
      boxes: 0,
      value: 0,
      sortKey: key,
    };

    existing.boxes += transaction.rows.reduce((sum, row) => sum + row.boxes, 0);
    existing.value += transaction.grandTotal;
    buckets.set(key, existing);
  });

  return Array.from(buckets.values()).sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey),
  );
}

export default function Reports({ items, transactions }: ReportsProps) {
  const [period, setPeriod] = useState<ReportPeriod>("daily");

  const chartData = buildChartData(transactions, period);
  const xKey = "label";

  // Most distributed items from transactions
  const itemBoxes: Record<string, number> = {};
  transactions.forEach((t) =>
    t.rows.forEach((r) => {
      itemBoxes[r.itemId] = (itemBoxes[r.itemId] || 0) + r.boxes;
    }),
  );
  const topItems = Object.entries(itemBoxes)
    .map(([id, boxes]) => ({
      name: items.find((i) => i.id === id)?.name ?? id,
      boxes,
    }))
    .sort((a, b) => b.boxes - a.boxes)
    .slice(0, 6);

  const totalBoxesInPeriod = chartData.reduce((s, d) => s + d.boxes, 0);
  const totalValueInPeriod = chartData.reduce((s, d) => s + d.value, 0);
  const totalBoxesStore = items.reduce((s, i) => s + i.currentBoxes, 0);
  const totalInventoryValue = items.reduce(
    (s, i) => s + i.currentBoxes * i.qtyPerBox * i.pricePerUnit,
    0,
  );

  const categoryInventory = [
    {
      name: "Beer",
      value: items
        .filter((i) => i.category === "Beer")
        .reduce((s, i) => s + i.currentBoxes, 0),
    },
    {
      name: "Soft Drink",
      value: items
        .filter((i) => i.category === "Soft Drink")
        .reduce((s, i) => s + i.currentBoxes, 0),
    },
    {
      name: "Water",
      value: items
        .filter((i) => i.category === "Water")
        .reduce((s, i) => s + i.currentBoxes, 0),
    },
    {
      name: "Wine",
      value: items
        .filter((i) => i.category === "Wine")
        .reduce((s, i) => s + i.currentBoxes, 0),
    },
    {
      name: "Liqueurs",
      value: items
        .filter((i) => i.category === "Liqueurs")
        .reduce((s, i) => s + i.currentBoxes, 0),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-2xl font-bold font-display"
            style={{ color: "var(--foreground)" }}
          >
            Reports
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Distribution and inventory analytics
          </p>
        </div>
        <div className="flex gap-2">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all"
              style={{
                backgroundColor:
                  period === p ? "rgba(201,168,76,0.15)" : "var(--secondary)",
                color:
                  period === p ? "var(--primary)" : "var(--muted-foreground)",
                border:
                  period === p
                    ? "1px solid rgba(201,168,76,0.3)"
                    : "1px solid var(--border)",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: `Boxes Distributed (${period})`,
            value: totalBoxesInPeriod,
            unit: "boxes",
          },
          {
            label: `Revenue Value (${period})`,
            value: `${totalValueInPeriod.toLocaleString()} Birr`,
            unit: "",
          },
          { label: "Boxes In Store", value: totalBoxesStore, unit: "boxes" },
          {
            label: "Inventory Value",
            value: `${(totalInventoryValue / 1000).toFixed(0)}k Birr`,
            unit: "",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)" }}
            >
              {card.label}
            </p>
            <p
              className="text-2xl font-bold font-display mt-3"
              style={{ color: "var(--primary)" }}
            >
              {card.value}
            </p>
            {card.unit && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                {card.unit}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution chart */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <h3
            className="text-sm font-semibold mb-1"
            style={{ color: "var(--foreground)" }}
          >
            Distribution & Revenue Trend
          </h3>
          <p
            className="text-xs mb-5"
            style={{ color: "var(--muted-foreground)" }}
          >
            Live distribution and revenue by{" "}
            {period === "daily"
              ? "day"
              : period === "weekly"
                ? "week"
                : "month"}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={customTooltip}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar
                yAxisId="left"
                dataKey="boxes"
                name="Boxes"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="value"
                name="Revenue (Birr)"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <h3
            className="text-sm font-semibold mb-1"
            style={{ color: "var(--foreground)" }}
          >
            Inventory by Category
          </h3>
          <p
            className="text-xs mb-4"
            style={{ color: "var(--muted-foreground)" }}
          >
            Current stock distribution
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={categoryInventory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={40}
              >
                {categoryInventory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
              <Legend
                formatter={(v) => (
                  <span
                    style={{ color: "var(--muted-foreground)", fontSize: 11 }}
                  >
                    {v}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Most distributed items */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <h3
          className="text-sm font-semibold mb-4"
          style={{ color: "var(--foreground)" }}
        >
          Most Distributed Items
        </h3>
        <div className="space-y-3">
          {topItems.map((item, i) => {
            const maxBoxes = topItems[0]?.boxes || 1;
            const pct = (item.boxes / maxBoxes) * 100;
            return (
              <div key={item.name} className="flex items-center gap-4">
                <span
                  className="text-xs font-mono w-4"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {i + 1}
                </span>
                <span
                  className="text-sm w-40 truncate"
                  style={{ color: "var(--foreground)" }}
                >
                  {item.name}
                </span>
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--secondary)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
                <span
                  className="text-sm font-semibold w-16 text-right"
                  style={{ color: "var(--primary)" }}
                >
                  {item.boxes} boxes
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue chart */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <h3
          className="text-sm font-semibold mb-1"
          style={{ color: "var(--foreground)" }}
        >
          Revenue Value
        </h3>
        <p
          className="text-xs mb-5"
          style={{ color: "var(--muted-foreground)" }}
        >
          Value of goods distributed (Birr)
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={32}>
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={customTooltip}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar
              dataKey="value"
              name="Birr"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
