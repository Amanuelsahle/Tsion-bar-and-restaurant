import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import type { Item, Transaction } from "../lib/mockData";

interface DashboardProps {
  items: Item[];
  transactions: Transaction[];
  onNavigate: (page: string) => void;
  role: "manager" | "barmanager";
}

const weeklyData = [
  { day: "Mon", boxes: 18, value: 14200 },
  { day: "Tue", boxes: 22, value: 17800 },
  { day: "Wed", boxes: 15, value: 12100 },
  { day: "Thu", boxes: 28, value: 23500 },
  { day: "Fri", boxes: 35, value: 29800 },
  { day: "Sat", boxes: 42, value: 36200 },
  { day: "Today", boxes: 20, value: 19320 },
];

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        backgroundColor: accent ? "rgba(201,168,76,0.08)" : "var(--card)",
        border: accent
          ? "1px solid rgba(201,168,76,0.25)"
          : "1px solid var(--border)",
      }}
    >
      <p
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </p>
      <p
        className="text-3xl font-bold font-display"
        style={{ color: accent ? "var(--primary)" : "var(--foreground)" }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

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
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function Dashboard({
  items,
  transactions,
  onNavigate,
  role,
}: DashboardProps) {
  const totalBoxes = items.reduce((s, i) => s + i.currentBoxes, 0);
  const beerTypes = items.filter((i) => i.category === "Beer").length;
  const softTypes = items.filter((i) => i.category === "Soft Drink").length;
  const waterTypes = items.filter((i) => i.category === "Water").length;
  const wineTypes = items.filter((i) => i.category === "Wine").length;
  const liqueurTypes = items.filter((i) => i.category === "Liqueurs").length;
  const lowStock = items.filter((i) => i.currentBoxes < i.minThreshold);
  const todayTxns = transactions.filter((t) => t.date === "2026-07-08");
  const boxesToday = todayTxns.reduce(
    (s, t) => s + t.rows.reduce((rs, r) => rs + r.boxes, 0),
    0,
  );

  const recentActivities = [
    {
      time: "09:14 AM",
      text: "Selam Tesfaye received 10 items — 19,320 Birr",
      type: "distribution",
    },
    {
      time: "08:50 AM",
      text: "Added 20 boxes of St. George Beer to store",
      type: "stock",
    },
    {
      time: "Yesterday",
      text: "Biniam Haile received 8 items — 14,460 Birr",
      type: "distribution",
    },
    {
      time: "Yesterday",
      text: "Low stock alert: Ambo Water (5 boxes remaining)",
      type: "alert",
    },
    {
      time: "2 days ago",
      text: "Monthly restock: 50 boxes St. George, 30 boxes Dashen",
      type: "stock",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold font-display"
            style={{ color: "var(--foreground)" }}
          >
            Dashboard
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Overview of store inventory and distribution
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard
          label="Total Items"
          value={items.length}
          sub="Product types"
        />
        <StatCard label="Beer Types" value={beerTypes} />
        <StatCard label="Soft Drinks" value={softTypes} />
        <StatCard label="Water Types" value={waterTypes} />
        <StatCard label="Wine Types" value={wineTypes} />
        <StatCard label="Liqueurs Types" value={liqueurTypes} />
        <StatCard
          label="Total Boxes"
          value={totalBoxes}
          sub="In store"
          accent
        />
        <StatCard label="Boxes Today" value={boxesToday} sub="Distributed" />
        <div
          className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:translate-y-[-2px]"
          style={{
            backgroundColor:
              lowStock.length > 0 ? "rgba(239,68,68,0.08)" : "var(--card)",
            border:
              lowStock.length > 0
                ? "1px solid rgba(239,68,68,0.25)"
                : "1px solid var(--border)",
          }}
        >
          <p
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            Low Stock
          </p>
          <p
            className="text-3xl font-bold font-display"
            style={{
              color: lowStock.length > 0 ? "#f87171" : "var(--foreground)",
            }}
          >
            {lowStock.length}
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Items below threshold
          </p>
        </div>
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{
            backgroundColor: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: "#f87171" }}
          >
            ⚠ Low Stock Alerts
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((item) => (
              <span
                key={item.id}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "rgba(239,68,68,0.12)",
                  color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                {item.name} — {item.currentBoxes} boxes left
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly chart */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Weekly Distribution
              </h3>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                Boxes distributed per day
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barSize={28}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={customTooltip}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar
                dataKey="boxes"
                name="Boxes"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent activities */}
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
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivities.map((act, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1"
                    style={{
                      backgroundColor:
                        act.type === "alert"
                          ? "#f87171"
                          : act.type === "distribution"
                            ? "var(--primary)"
                            : "#60a5fa",
                    }}
                  />
                </div>
                <div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--foreground)" }}
                  >
                    {act.text}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {act.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      {role === "manager" && (
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
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Add New Item", page: "items", primary: true },
              { label: "Add Stock", page: "store", primary: false },
              {
                label: "Give Items to Bar",
                page: "give-to-bar",
                primary: false,
              },
              { label: "View Reports", page: "reports", primary: false },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => onNavigate(action.page)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: action.primary
                    ? "linear-gradient(135deg, #c9a84c, #a07828)"
                    : "var(--secondary)",
                  color: action.primary ? "#0f1117" : "var(--foreground)",
                  border: action.primary ? "none" : "1px solid var(--border)",
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Revenue trend */}
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
          Revenue Value Trend
        </h3>
        <p
          className="text-xs mb-6"
          style={{ color: "var(--muted-foreground)" }}
        >
          Value of goods distributed (Birr)
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={weeklyData}>
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="day"
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
            <Tooltip content={customTooltip} />
            <Line
              dataKey="value"
              name="Birr"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ fill: "var(--primary)", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
