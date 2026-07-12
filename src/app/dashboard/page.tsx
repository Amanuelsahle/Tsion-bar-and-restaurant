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
import DistributionHistory from "../../components/DistributionHistory";
import Reports from "../../components/Reports";
import {
  createDistribution,
  createProduct,
  createStockMovement,
  deleteProduct,
  getDistributions,
  getProducts,
  getStockMovements,
  updateProduct,
  type DistributionRecord,
  type ProductRecord,
  type StockMovementRecord,
} from "../../lib/supabase-data";
import { supabase } from "../../lib/supabase";
import type { Item, StockHistory, Transaction } from "../../lib/mockData";

type PageId =
  | "dashboard"
  | "items"
  | "store"
  | "give-to-bar"
  | "history"
  | "inventory"
  | "reports";
type Role = "manager" | "barmanager";

export default function DashboardPage() {
  const router = useRouter();
  const [role] = useState<Role>("manager");
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [products, stockMoves, dists] = await Promise.all([
          getProducts(),
          getStockMovements(),
          getDistributions(),
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

        setItems(mappedItems);
        setStockHistory(mappedStockHistory);
        setTransactions(mappedTransactions);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageId);
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
      case "history":
        return (
          <DistributionHistory transactions={transactions} items={items} />
        );
      case "inventory":
        return <Inventory items={items} />;
      case "reports":
        return <Reports items={items} transactions={transactions} />;
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
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117] text-[#e8e6e1]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
          <p className="text-sm text-[#7a8090]">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e8e6e1]">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        role={role}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div
        className="min-h-screen transition-all duration-300"
        style={{ paddingLeft: sidebarCollapsed ? 64 : 220 }}
      >
        <Navbar
          sidebarWidth={sidebarCollapsed ? 64 : 220}
          role={role}
          onLogout={handleLogout}
        />

        <main className="px-6 py-6 pt-20">{renderPage()}</main>
      </div>
    </div>
  );
}
