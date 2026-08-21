"use client";

import { useMemo, useState } from "react";
import type { Item, Transaction, Employee } from "../lib/types";
import type {
  BarNightSaleRecord,
  BonoRecord,
  CashierReportRecord,
} from "../lib/supabase-data";
import { canAccessHRManagement, canAccessManagerFeatures, type UserRole } from "../lib/roles";

interface SystemOverviewProps {
  items: Item[];
  transactions: Transaction[];
  employees: Employee[];
  cashierReports: CashierReportRecord[];
  bonos: BonoRecord[];
  nightSales: BarNightSaleRecord[];
  role: UserRole;
  onNavigate: (page: string) => void;
}

export default function SystemOverview({
  items,
  transactions,
  employees,
  cashierReports,
  bonos,
  nightSales,
  role,
  onNavigate,
}: SystemOverviewProps) {
  const [activityTab, setActivityTab] = useState<"distributions" | "checkouts" | "lowstock">("distributions");

  // Calculations: Store & Bar
  const totalStoreValue = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.currentBoxes * item.qtyPerBox * item.pricePerUnit,
      0
    );
  }, [items]);

  const lowStockItems = useMemo(() => {
    return items.filter((item) => item.currentBoxes <= item.minThreshold);
  }, [items]);

  const totalDistributionsValue = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (t.grandTotal || 0), 0);
  }, [transactions]);

  // Calculations: Night Bar Sales
  const totalNightSalesValue = useMemo(() => {
    return nightSales.reduce((sum, s) => sum + (s.grand_total || 0), 0);
  }, [nightSales]);

  // Calculations: Cashier
  const activeBonos = useMemo(() => {
    return bonos.filter((b) => b.is_active);
  }, [bonos]);

  const totalCashierRevenue = useMemo(() => {
    return cashierReports.reduce((sum, r) => sum + (r.today_money || 0), 0);
  }, [cashierReports]);

  // Calculations: HR Management
  const activeEmployees = useMemo(() => {
    return employees.filter((e) => (e.status || "active") === "active");
  }, [employees]);

  const totalMonthlyPayroll = useMemo(() => {
    return activeEmployees.reduce((sum, e) => sum + (e.baseSalary || 0), 0);
  }, [activeEmployees]);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isSuperAdmin = role === "super_admin";
  const isManager = canAccessManagerFeatures(role);
  const isHR = canAccessHRManagement(role);

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Command Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{
          background: "linear-gradient(135deg, #181d2a 0%, #11141d 100%)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: "var(--primary)" }}
        />
        
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 px-3 py-1 text-xs font-semibold text-[#c9a84c]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
                Tsion System Overview
              </span>
              <span className="text-xs text-[#7a8090] hidden sm:inline">
                {todayFormatted}
              </span>
            </div>
            
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#f4efe7]">
              Hotel & Restaurant <span className="text-[#c9a84c]">Command Center</span>
            </h1>
            <p className="text-xs md:text-sm text-[#7a8090] max-w-xl">
              Welcome back, <span className="capitalize font-semibold text-[#e8e6e1]">{role.replace("_", " ")}</span>. Here is the operational summary across Store & Bar, Cashier, and HR Management.
            </p>
          </div>

          {/* Quick Action Console */}
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate("give-to-bar")}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #c9a84c, #a07828)",
                color: "#0f1117",
              }}
            >
              <span>↗</span> Give to Bar
            </button>
            <button
              onClick={() => onNavigate("night-bar-sales")}
              className="px-4 py-2.5 rounded-xl text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-[#f4efe7] transition-all"
            >
              <span>🌙</span> Night Sales
            </button>
            <button
              onClick={() => onNavigate("cashier-checkout")}
              className="px-4 py-2.5 rounded-xl text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-[#f4efe7] transition-all"
            >
              <span>🛒</span> Cashier Checkout
            </button>
            {isHR && (
              <button
                onClick={() => onNavigate("hr-management")}
                className="px-4 py-2.5 rounded-xl text-xs font-medium border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#c9a84c] hover:bg-[#c9a84c]/20 transition-all"
              >
                <span>👥</span> HR Management
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top System Executive KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Store Inventory Value */}
        <div
          className="rounded-2xl p-5 space-y-3 relative overflow-hidden group transition-all hover:border-[#c9a84c]/40"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7a8090]">Store Inventory Value</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-sm">📦</span>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-[#c9a84c]">
              {totalStoreValue.toLocaleString()} <span className="text-xs font-normal">Birr</span>
            </div>
            <p className="text-xs text-[#7a8090] mt-1">
              {items.length} Product Types · {items.reduce((s, i) => s + i.currentBoxes, 0)} Total Boxes
            </p>
          </div>
          {lowStockItems.length > 0 && (
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-amber-400">
              <span>⚠️ Low Stock Alert</span>
              <span className="font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                {lowStockItems.length} items
              </span>
            </div>
          )}
        </div>

        {/* Night Bar Sales */}
        <div
          className="rounded-2xl p-5 space-y-3 relative overflow-hidden group transition-all hover:border-[#c9a84c]/40"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7a8090]">Night Bar Sales</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-sm">🌙</span>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-[#f4efe7]">
              {totalNightSalesValue.toLocaleString()} <span className="text-xs font-normal text-[#c9a84c]">Birr</span>
            </div>
            <p className="text-xs text-[#7a8090] mt-1">
              {nightSales.length} Recorded Shifts Total
            </p>
          </div>
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-[#7a8090]">
            <span>Recent shift:</span>
            <span className="text-[#e8e6e1] font-medium">
              {nightSales[0]?.sale_date ?? "No record"}
            </span>
          </div>
        </div>

        {/* Cashier Operations */}
        <div
          className="rounded-2xl p-5 space-y-3 relative overflow-hidden group transition-all hover:border-[#c9a84c]/40"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7a8090]">Cashier Revenue</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm">💳</span>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-emerald-400">
              {totalCashierRevenue.toLocaleString()} <span className="text-xs font-normal">Birr</span>
            </div>
            <p className="text-xs text-[#7a8090] mt-1">
              {cashierReports.length} Checkout Reports
            </p>
          </div>
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-[#7a8090]">
            <span>Active Bonos Menu:</span>
            <span className="text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {activeBonos.length} Items
            </span>
          </div>
        </div>

        {/* HR & Payroll */}
        <div
          className="rounded-2xl p-5 space-y-3 relative overflow-hidden group transition-all hover:border-[#c9a84c]/40"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7a8090]">Staff & Payroll</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 text-sm">👥</span>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-[#f4efe7]">
              {activeEmployees.length} <span className="text-xs font-normal text-[#7a8090]">Active Staff</span>
            </div>
            <p className="text-xs text-[#7a8090] mt-1">
              Monthly Base Payroll: <span className="text-[#c9a84c] font-semibold">{totalMonthlyPayroll.toLocaleString()} Birr</span>
            </p>
          </div>
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-[#7a8090]">
            <span>HR Access:</span>
            <span className={`font-semibold px-2 py-0.5 rounded-full border ${isHR ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-gray-500/10 border-gray-500/20 text-gray-400"}`}>
              {isHR ? "Full Access" : "Restricted"}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Main Category Hub Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-display text-[#f4efe7] flex items-center gap-2">
          <span>🏛 System Management Modules</span>
          <span className="text-xs font-normal text-[#7a8090]">(Select a module to open detailed workspace)</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hub Card 1: Store & Bar Management */}
          <div
            className="rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all hover:shadow-2xl border"
            style={{
              backgroundColor: "#161a26",
              borderColor: "var(--border)",
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 flex items-center justify-center text-lg text-amber-400">
                    📦
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#f4efe7]">Store & Bar</h3>
                    <p className="text-xs text-[#7a8090]">Inventory & Distributions</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Module Active
                </span>
              </div>

              <p className="text-xs text-[#7a8090] leading-relaxed">
                Manage drinks inventory, restock store items, transfer boxes to bar managers, and calculate daily night sales receipts.
              </p>

              {/* Module Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 bg-white/[0.02] p-3 rounded-xl border border-white/5 text-xs">
                <div>
                  <span className="text-[#7a8090] block">Total Products</span>
                  <span className="font-semibold text-[#f4efe7]">{items.length} items</span>
                </div>
                <div>
                  <span className="text-[#7a8090] block">Distributions</span>
                  <span className="font-semibold text-[#c9a84c]">{transactions.length} records</span>
                </div>
              </div>
            </div>

            {/* Hub Quick Action Links */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <button
                onClick={() => onNavigate("store-bar-dashboard")}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/20 transition-all group"
              >
                <span className="flex items-center gap-2">📊 Open Store & Bar Dashboard</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate("items")}
                  disabled={!isManager}
                  className={`px-3 py-2 rounded-xl text-xs text-left border transition-all ${isManager ? "bg-white/5 hover:bg-white/10 border-white/10 text-[#e8e6e1]" : "opacity-40 cursor-not-allowed border-transparent text-[#7a8090]"}`}
                >
                  📦 Item Management
                </button>
                <button
                  onClick={() => onNavigate("store")}
                  disabled={!isManager}
                  className={`px-3 py-2 rounded-xl text-xs text-left border transition-all ${isManager ? "bg-white/5 hover:bg-white/10 border-white/10 text-[#e8e6e1]" : "opacity-40 cursor-not-allowed border-transparent text-[#7a8090]"}`}
                >
                  ▣ Store Stock
                </button>
                <button
                  onClick={() => onNavigate("give-to-bar")}
                  className="px-3 py-2 rounded-xl text-xs text-left border border-white/10 bg-white/5 hover:bg-white/10 text-[#e8e6e1] transition-all"
                >
                  ↗ Give to Bar
                </button>
                <button
                  onClick={() => onNavigate("night-bar-sales")}
                  className="px-3 py-2 rounded-xl text-xs text-left border border-white/10 bg-white/5 hover:bg-white/10 text-[#e8e6e1] transition-all"
                >
                  🌙 Night Bar Sales
                </button>
              </div>
            </div>
          </div>

          {/* Hub Card 2: Cashier Operations */}
          <div
            className="rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all hover:shadow-2xl border"
            style={{
              backgroundColor: "#161a26",
              borderColor: "var(--border)",
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 border border-emerald-500/30 flex items-center justify-center text-lg text-emerald-400">
                    💳
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#f4efe7]">Cashier Operations</h3>
                    <p className="text-xs text-[#7a8090]">Bono & Checkout POS</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  POS Connected
                </span>
              </div>

              <p className="text-xs text-[#7a8090] leading-relaxed">
                Configure food/drink bono menus, process cashier register checkouts, track initial vs final money balances, and generate settlement reports.
              </p>

              {/* Module Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 bg-white/[0.02] p-3 rounded-xl border border-white/5 text-xs">
                <div>
                  <span className="text-[#7a8090] block">Active Bonos</span>
                  <span className="font-semibold text-emerald-400">{activeBonos.length} menu items</span>
                </div>
                <div>
                  <span className="text-[#7a8090] block">Checkouts</span>
                  <span className="font-semibold text-[#f4efe7]">{cashierReports.length} reports</span>
                </div>
              </div>
            </div>

            {/* Hub Quick Action Links */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <button
                onClick={() => onNavigate("cashier-checkout")}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all group"
              >
                <span className="flex items-center gap-2">🛒 Open Cashier POS Checkout</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate("cashier-bonos")}
                  className="px-3 py-2 rounded-xl text-xs text-left border border-white/10 bg-white/5 hover:bg-white/10 text-[#e8e6e1] transition-all"
                >
                  ◈ Bono Setup
                </button>
                <button
                  onClick={() => onNavigate("cashier-reports")}
                  className="px-3 py-2 rounded-xl text-xs text-left border border-white/10 bg-white/5 hover:bg-white/10 text-[#e8e6e1] transition-all"
                >
                  ≡ Checkout History
                </button>
                <button
                  onClick={() => onNavigate("cashier-analytics")}
                  className="col-span-2 px-3 py-2 rounded-xl text-xs text-center border border-white/10 bg-white/5 hover:bg-white/10 text-[#e8e6e1] transition-all"
                >
                  📊 Cashier Analytics & Reports
                </button>
              </div>
            </div>
          </div>

          {/* Hub Card 3: HR Management */}
          <div
            className="rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all hover:shadow-2xl border"
            style={{
              backgroundColor: "#161a26",
              borderColor: "var(--border)",
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/30 flex items-center justify-center text-lg text-blue-400">
                    👥
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#f4efe7]">HR Management</h3>
                    <p className="text-xs text-[#7a8090]">Staff Directory & Payroll</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${isHR ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                  {isHR ? "Super Admin" : "Restricted"}
                </span>
              </div>

              <p className="text-xs text-[#7a8090] leading-relaxed">
                Supervise staff directory, register new employees, process salary advances & payments, and review complete payroll audit logs.
              </p>

              {/* Module Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 bg-white/[0.02] p-3 rounded-xl border border-white/5 text-xs">
                <div>
                  <span className="text-[#7a8090] block">Staff Roster</span>
                  <span className="font-semibold text-blue-400">{activeEmployees.length} employees</span>
                </div>
                <div>
                  <span className="text-[#7a8090] block">Payroll Total</span>
                  <span className="font-semibold text-[#c9a84c]">{totalMonthlyPayroll.toLocaleString()} Birr</span>
                </div>
              </div>
            </div>

            {/* Hub Quick Action Links */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <button
                onClick={() => onNavigate("hr-management")}
                disabled={!isHR}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all group ${isHR ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20" : "opacity-40 cursor-not-allowed border border-transparent text-[#7a8090]"}`}
              >
                <span className="flex items-center gap-2">👥 Open Staff Directory & HR</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => onNavigate("hr-management")}
                  disabled={!isHR}
                  className={`px-3 py-2 rounded-xl text-xs text-center border transition-all ${isHR ? "bg-white/5 hover:bg-white/10 border-white/10 text-[#e8e6e1]" : "opacity-40 cursor-not-allowed border-transparent text-[#7a8090]"}`}
                >
                  💰 Salary & Payroll Processing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Operational Console & Activity Stream */}
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: "#161a26", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border)" }}>
          <div>
            <h3 className="text-base font-bold font-display text-[#f4efe7]">
              ⚡ Real-Time Operational Log
            </h3>
            <p className="text-xs text-[#7a8090] mt-0.5">
              Latest transactions, cashier checkouts, and inventory notifications
            </p>
          </div>

          <div className="flex gap-2 bg-white/[0.03] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActivityTab("distributions")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activityTab === "distributions" ? "bg-[#c9a84c] text-[#0f1117] font-semibold" : "text-[#7a8090] hover:text-white"}`}
            >
              Distributions ({transactions.length})
            </button>
            <button
              onClick={() => setActivityTab("checkouts")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activityTab === "checkouts" ? "bg-[#c9a84c] text-[#0f1117] font-semibold" : "text-[#7a8090] hover:text-white"}`}
            >
              Checkouts ({cashierReports.length})
            </button>
            <button
              onClick={() => setActivityTab("lowstock")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activityTab === "lowstock" ? "bg-[#c9a84c] text-[#0f1117] font-semibold" : "text-[#7a8090] hover:text-[#e8e6e1]"}`}
            >
              Low Stock ({lowStockItems.length})
            </button>
          </div>
        </div>

        {/* Tab Content 1: Distributions */}
        {activityTab === "distributions" && (
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <p className="text-xs text-[#7a8090] py-6 text-center">No distribution records found.</p>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="text-[#7a8090] uppercase border-b border-white/5">
                  <tr>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Bar Manager ID</th>
                    <th className="pb-3">Items Count</th>
                    <th className="pb-3">Grand Total</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#e8e6e1]">
                  {transactions.slice(0, 5).map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-medium text-[#f4efe7]">{t.date}</td>
                      <td className="py-3 text-[#7a8090]">{t.barMan}</td>
                      <td className="py-3">{t.rows.length} item types</td>
                      <td className="py-3 font-semibold text-[#c9a84c]">
                        {t.grandTotal.toLocaleString()} Birr
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab Content 2: Cashier Checkouts */}
        {activityTab === "checkouts" && (
          <div className="overflow-x-auto">
            {cashierReports.length === 0 ? (
              <p className="text-xs text-[#7a8090] py-6 text-center">No cashier checkout reports found.</p>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="text-[#7a8090] uppercase border-b border-white/5">
                  <tr>
                    <th className="pb-3">Date / Time</th>
                    <th className="pb-3">Cashier</th>
                    <th className="pb-3">Initial Balance</th>
                    <th className="pb-3">Bono Net</th>
                    <th className="pb-3">Final Money</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#e8e6e1]">
                  {cashierReports.slice(0, 5).map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 text-[#7a8090]">
                        {new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 font-medium text-[#f4efe7]">{r.cashier_name}</td>
                      <td className="py-3">{r.initial_money?.toLocaleString() ?? 0} Birr</td>
                      <td className="py-3 text-emerald-400 font-semibold">{r.net_bono_value?.toLocaleString() ?? 0} Birr</td>
                      <td className="py-3 font-semibold text-[#c9a84c]">
                        {(r.today_money || 0).toLocaleString()} Birr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab Content 3: Low Stock Alerts */}
        {activityTab === "lowstock" && (
          <div className="overflow-x-auto">
            {lowStockItems.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <p className="text-xs text-emerald-400 font-medium">✓ All store items are above minimum stock threshold.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="text-[#7a8090] uppercase border-b border-white/5">
                  <tr>
                    <th className="pb-3">Item Name</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Current Boxes</th>
                    <th className="pb-3">Min Threshold</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#e8e6e1]">
                  {lowStockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-medium text-[#f4efe7]">{item.name}</td>
                      <td className="py-3 text-[#7a8090]">{item.category}</td>
                      <td className="py-3 font-bold text-red-400">{item.currentBoxes} boxes</td>
                      <td className="py-3 text-[#7a8090]">{item.minThreshold} boxes</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onNavigate("store")}
                          className="text-xs text-[#c9a84c] hover:underline"
                        >
                          Restock In Store →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
