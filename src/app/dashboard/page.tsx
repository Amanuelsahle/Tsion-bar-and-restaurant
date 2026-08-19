"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import Dashboard from "../../components/Dashhboard";
import Inventory from "../../components/Inventory";
import ItemManagement from "../../components/ItemManagement";
import StoreManagement from "../../components/StoreManagement";
import GiveToBar from "../../components/GiveToBar";
import NightBarSales from "../../components/NightBarSales";
import DistributionHistory from "../../components/DistributionHistory";
import Reports from "../../components/Reports";
import BonoManagement from "../../components/BonoManagement";
import CashierCheckout from "../../components/CashierCheckout";
import CashierReports from "../../components/CashierReports";
import CashierAnalytics from "../../components/CashierAnalytics";
import HRManagement from "../../components/hr-management/HRManagement";
import {
  createDistribution,
  createEmployee,
  createProduct,
  createSalaryTransaction,
  createStockMovement,
  deleteEmployee,
  deleteProduct,
  getDistributions,
  getEmployees,
  getProducts,
  getStockMovements,
  updateEmployee,
  updateProduct,
  type DistributionRecord,
  type ProductRecord,
  type StockMovementRecord,
} from "../../lib/supabase-data";
import { supabase } from "../../lib/supabase";
import AdminPanel from "../../components/AdminPanel";
import {
  type Employee,
  type Item,
  type SalaryTransaction,
  type StockHistory,
  type Transaction,
  type WorkRole,
} from "../../lib/types";
import {
  canAccessAdminPanel,
  canAccessHRManagement,
  canAccessManagerFeatures,
  resolveEffectiveRole,
  serializeRoleForProfile,
  type UserRole,
} from "../../lib/roles";

type PageId =
  | "dashboard"
  | "items"
  | "store"
  | "give-to-bar"
  | "night-bar-sales"
  | "history"
  | "inventory"
  | "reports"
  | "cashier"
  | "cashier-bonos"
  | "cashier-checkout"
  | "cashier-reports"
  | "cashier-analytics"
  | "hr-management"
  | "admin-panel";

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("manager");
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const nextRole = resolveEffectiveRole(
        user.email,
        profile?.role ?? user.user_metadata?.role,
      );

      if (supabase) {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email ?? "",
            role: serializeRoleForProfile(nextRole),
          },
          { onConflict: "id" },
        );
      }

      setRole(nextRole);
    };

    const loadData = async () => {
      try {
        const [products, stockMoves, dists, empRecords] = await Promise.all([
          getProducts(),
          getStockMovements(),
          getDistributions(),
          getEmployees(),
        ]);

        const mappedItems: Item[] = products.map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category as Item["category"],
          qtyPerBox: product.quantity_per_box,
          pricePerUnit: product.unit_price,
          currentBoxes: product.current_boxes,
          minThreshold: product.min_threshold,
        }));

        const mappedStockHistory: StockHistory[] = stockMoves.map(
          (movement) => ({
            id: movement.id,
            itemId: movement.product_id,
            date: movement.created_at.slice(0, 10),
            type: movement.movement_type as "in" | "out",
            boxes: movement.boxes,
            note: movement.note ?? "",
          }),
        );

        const mappedTransactions: Transaction[] = dists.map((distribution) => ({
          id: distribution.id,
          date: distribution.distribution_date,
          barMan: distribution.bar_manager_id,
          rows:
            (distribution.distribution_items ?? []).map((item) => ({
              itemId: item.product_id,
              boxes: item.boxes,
              qtyPerBox: item.quantity_per_box,
              unitPrice: item.unit_price,
              total: item.total,
            })) ?? [],
          grandTotal: distribution.grand_total,
          status: distribution.status === "completed" ? "Completed" : "Pending",
        }));

        const mappedEmployees: Employee[] = (empRecords ?? []).map((emp) => ({
          id: emp.id,
          name: emp.name,
          hireDate: emp.hire_date,
          role: emp.role as WorkRole,
          baseSalary: Number(emp.base_salary),
          paidThisMonth: 0,
          status: (emp.status as "active" | "inactive") ?? "active",
          notes: emp.notes ?? "",
          history: (emp.salary_transactions ?? []).map((st) => ({
            id: st.id,
            date: st.date,
            type: st.type as SalaryTransaction["type"],
            amount: Number(st.amount),
            note: st.note ?? "",
          })),
        }));
        setEmployees(mappedEmployees);

        setItems(mappedItems);
        setStockHistory(mappedStockHistory);
        setTransactions(mappedTransactions);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const init = async () => {
      await loadProfile();
      await loadData();
    };
    void init();
  }, [router]);

  const handleNavigate = (page: string) => {
    const nextPage = page as PageId;

    if (nextPage === "admin-panel" && !canAccessAdminPanel(role)) {
      return;
    }

    if (nextPage === "hr-management" && !canAccessHRManagement(role)) {
      return;
    }

    if (
      (nextPage === "items" ||
        nextPage === "store" ||
        nextPage === "reports") &&
      !canAccessManagerFeatures(role)
    ) {
      return;
    }

    setCurrentPage(nextPage);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/");
  };

  const handleAddItem = async (item: Item) => {
    const created = await createProduct({
      name: item.name,
      category: item.category,
      quantity_per_box: item.qtyPerBox,
      unit_price: item.pricePerUnit,
      current_boxes: item.currentBoxes,
      min_threshold: item.minThreshold,
    });
    setItems((prev) => [
      {
        id: created.id,
        name: created.name,
        category: created.category as Item["category"],
        qtyPerBox: created.quantity_per_box,
        pricePerUnit: created.unit_price,
        currentBoxes: created.current_boxes,
        minThreshold: created.min_threshold,
      },
      ...prev,
    ]);
  };

  const handleEditItem = async (item: Item) => {
    const updated = await updateProduct(item.id, {
      name: item.name,
      category: item.category,
      quantity_per_box: item.qtyPerBox,
      unit_price: item.pricePerUnit,
      current_boxes: item.currentBoxes,
      min_threshold: item.minThreshold,
    });
    setItems((prev) =>
      prev.map((existing) =>
        existing.id === item.id
          ? {
              id: updated.id,
              name: updated.name,
              category: updated.category as Item["category"],
              qtyPerBox: updated.quantity_per_box,
              pricePerUnit: updated.unit_price,
              currentBoxes: updated.current_boxes,
              minThreshold: updated.min_threshold,
            }
          : existing,
      ),
    );
  };

  const handleDeleteItem = async (id: string) => {
    await deleteProduct(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddStock = async (
    itemId: string,
    boxes: number,
    note: string,
  ) => {
    await createStockMovement({
      product_id: itemId,
      movement_type: "in",
      boxes,
      note: note || "Manual restock",
    });
    const current = items.find((item) => item.id === itemId);
    if (current) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, currentBoxes: item.currentBoxes + boxes }
            : item,
        ),
      );
    }
    setStockHistory((prev) => [
      {
        id: `SH${Date.now()}`,
        itemId,
        date: new Date().toISOString().split("T")[0],
        type: "in",
        boxes,
        note: note || "Manual restock",
      },
      ...prev,
    ]);
  };

  const handleAddTransaction = async (transaction: Transaction) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Please sign in again to save a distribution.");
    }

    const created = await createDistribution(
      {
        distribution_date: transaction.date,
        bar_manager_id: user.id,
        grand_total: transaction.grandTotal,
        status: "completed",
      },
      transaction.rows.map((row) => {
        const item = items.find((entry) => entry.id === row.itemId);
        const qtyPerBox = row.qtyPerBox ?? item?.qtyPerBox ?? 0;
        const unitPrice = row.unitPrice ?? item?.pricePerUnit ?? 0;
        return {
          product_id: row.itemId,
          boxes: row.boxes,
          quantity_per_box: qtyPerBox,
          unit_price: unitPrice,
          total: unitPrice * qtyPerBox * row.boxes,
        };
      }),
    );
    setTransactions((prev) => [
      {
        id: created.id,
        date: created.distribution_date,
        barMan: transaction.barMan,
        rows: transaction.rows,
        grandTotal: created.grand_total,
        status: "Completed",
      },
      ...prev,
    ]);
    setItems((prev) =>
      prev.map((item) => {
        const matchingRow = transaction.rows.find(
          (row) => row.itemId === item.id,
        );
        return matchingRow
          ? {
              ...item,
              currentBoxes: Math.max(0, item.currentBoxes - matchingRow.boxes),
            }
          : item;
      }),
    );
    setStockHistory((prev) => [
      ...transaction.rows.map((row) => ({
        id: `SH${Date.now()}-${row.itemId}`,
        itemId: row.itemId,
        date: transaction.date,
        type: "out" as const,
        boxes: row.boxes,
        note: `Distribution to ${transaction.barMan}`,
      })),
      ...prev,
    ]);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "items":
        return (
          <ItemManagement
            items={items}
            onAdd={handleAddItem}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
          />
        );
      case "store":
        return (
          <StoreManagement
            items={items}
            stockHistory={stockHistory}
            onAddStock={handleAddStock}
          />
        );
      case "give-to-bar":
        return <GiveToBar items={items} onSave={handleAddTransaction} />;
      case "night-bar-sales":
        return <NightBarSales />;
      case "history":
        return (
          <DistributionHistory transactions={transactions} items={items} />
        );
      case "inventory":
        return <Inventory items={items} />;
      case "reports":
        return <Reports items={items} transactions={transactions} />;
      case "cashier-bonos":
        return <BonoManagement />;
      case "cashier-checkout":
        return <CashierCheckout />;
      case "cashier-reports":
        return <CashierReports />;
      case "cashier-analytics":
        return <CashierAnalytics />;
      case "hr-management":
        return (
          <HRManagement
            employees={employees}
            onAdd={async (empData) => {
              try {
                const created = await createEmployee({
                  name: empData.name,
                  hire_date: empData.hireDate,
                  role: empData.role,
                  base_salary: empData.baseSalary,
                  notes: "",
                  status: empData.status ?? "active",
                });
                const newEmp: Employee = {
                  id: created.id,
                  name: created.name,
                  hireDate: created.hire_date,
                  role: created.role as WorkRole,
                  baseSalary: Number(created.base_salary),
                  paidThisMonth: 0,
                  status: (created.status as "active" | "inactive") ?? "active",
                  notes: created.notes ?? "",
                  history: [],
                };
                setEmployees((prev) => [newEmp, ...prev]);
              } catch (err) {
                console.error("Database add employee fallback to local state:", err);
                const fallbackEmp: Employee = {
                  id:
                    typeof crypto !== "undefined" && crypto.randomUUID
                      ? crypto.randomUUID()
                      : `e0000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`,
                  name: empData.name,
                  hireDate: empData.hireDate,
                  role: empData.role,
                  baseSalary: empData.baseSalary,
                  paidThisMonth: 0,
                  status: empData.status ?? "active",
                  notes: "",
                  history: [],
                };
                setEmployees((prev) => [fallbackEmp, ...prev]);
              }
            }}
            onUpdate={async (updatedEmp) => {
              try {
                await updateEmployee(updatedEmp.id, {
                  name: updatedEmp.name,
                  hire_date: updatedEmp.hireDate,
                  role: updatedEmp.role,
                  base_salary: updatedEmp.baseSalary,
                  notes: updatedEmp.notes,
                  status: updatedEmp.status,
                });
              } catch (err) {
                console.error("Database update employee error:", err);
              }
              setEmployees((prev) =>
                prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)),
              );
            }}
            onDelete={async (id) => {
              try {
                await deleteEmployee(id);
              } catch (err) {
                console.error("Database delete employee error:", err);
              }
              setEmployees((prev) => prev.filter((e) => e.id !== id));
            }}
            onSalaryAction={async (empId, action) => {
              const isUUID = (str: string) =>
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                  str,
                );

              let targetEmpId = empId;
              let emp = employees.find((e) => e.id === empId);

              if (!isUUID(targetEmpId)) {
                const dbMatch = employees.find(
                  (e) =>
                    isUUID(e.id) &&
                    (e.id === empId || (emp && e.name === emp.name)),
                );
                if (dbMatch) {
                  targetEmpId = dbMatch.id;
                  emp = dbMatch;
                } else if (emp) {
                  try {
                    const created = await createEmployee({
                      name: emp.name,
                      hire_date: emp.hireDate,
                      role: emp.role,
                      base_salary: emp.baseSalary,
                      notes: emp.notes ?? "",
                    });
                    targetEmpId = created.id;
                  } catch (err) {
                    console.error(
                      "Failed to auto-sync employee before salary transaction:",
                      err,
                    );
                  }
                }
              }

              try {
                if (!isUUID(targetEmpId)) {
                  throw new Error(`Invalid employee UUID: ${targetEmpId}`);
                }

                const createdTxn = await createSalaryTransaction({
                  employee_id: targetEmpId,
                  date: action.date,
                  type: action.type,
                  amount: action.amount,
                  note: action.note,
                });

                const emp = employees.find(
                  (e) => e.id === empId || e.id === targetEmpId,
                );
                if (emp && action.type === "increase") {
                  await updateEmployee(targetEmpId, {
                    base_salary: emp.baseSalary + action.amount,
                  });
                }

                setEmployees((prev) =>
                  prev.map((e) => {
                    if (e.id !== empId && e.id !== targetEmpId) return e;
                    const newHistory: SalaryTransaction = {
                      id: createdTxn.id,
                      date: createdTxn.date,
                      type: createdTxn.type,
                      amount: Number(createdTxn.amount),
                      note: createdTxn.note ?? "",
                    };
                    return {
                      ...e,
                      id: targetEmpId,
                      baseSalary:
                        action.type === "increase"
                          ? e.baseSalary + action.amount
                          : e.baseSalary,
                      paidThisMonth:
                        action.type === "payment"
                          ? e.paidThisMonth + action.amount
                          : e.paidThisMonth,
                      history: [newHistory, ...(e.history || [])],
                    };
                  }),
                );
              } catch (err) {
                console.error("Database salary transaction error:", err);
                setEmployees((prev) =>
                  prev.map((e) => {
                    if (e.id !== empId && e.id !== targetEmpId) return e;
                    const fallbackHistory: SalaryTransaction = {
                      id:
                        typeof crypto !== "undefined" && crypto.randomUUID
                          ? crypto.randomUUID()
                          : `a0000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`,
                      date: action.date,
                      type: action.type,
                      amount: action.amount,
                      note: action.note,
                    };
                    return {
                      ...e,
                      baseSalary:
                        action.type === "increase"
                          ? e.baseSalary + action.amount
                          : e.baseSalary,
                      paidThisMonth:
                        action.type === "payment"
                          ? e.paidThisMonth + action.amount
                          : e.paidThisMonth,
                      history: [fallbackHistory, ...(e.history || [])],
                    };
                  }),
                );
              }
            }}
          />
        );
      case "admin-panel":
        return (
          <AdminPanel role={role} onClose={() => setCurrentPage("dashboard")} />
        );
      case "cashier":
        return <BonoManagement />;
      default:
        return (
          <Dashboard
            items={items}
            transactions={transactions}
            onNavigate={handleNavigate}
            role={role}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0f1117] text-[#e8e6e1]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
          <p className="text-sm text-[#7a8090]">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0f1117] text-[#e8e6e1]">
      <div className="lg:hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          role={role}
          collapsed={false}
          onToggle={() => setMobileMenuOpen((prev) => !prev)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
      </div>

      <div className="hidden lg:block">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          role={role}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />
      </div>

      <div
        className="min-h-dvh transition-all duration-300"
        style={{
          paddingLeft:
            typeof window !== "undefined" && window.innerWidth >= 1024
              ? sidebarCollapsed
                ? 64
                : 220
              : 0,
        }}
      >
        <Navbar
          sidebarWidth={
            typeof window !== "undefined" && window.innerWidth >= 1024
              ? sidebarCollapsed
                ? 64
                : 220
              : 0
          }
          role={role}
          onLogout={handleLogout}
          onOpenMenu={() => setMobileMenuOpen(true)}
        />

        <main className="px-3 py-4 pt-28 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-4 sm:pt-32 lg:px-6 lg:py-6 lg:pt-28">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
