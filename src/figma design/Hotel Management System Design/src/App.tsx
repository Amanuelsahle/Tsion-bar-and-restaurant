import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import ItemManagement from "./pages/ItemManagement";
import StoreManagement from "./pages/StoreManagement";
import GiveToBar from "./pages/GiveToBar";
import DistributionHistory from "./pages/DistributionHistory";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import {
  initialItems,
  initialTransactions,
  initialStockHistory,
  type Item,
  type Transaction,
  type StockHistory,
} from "./data/mockData";

export default function App() {
  const [role, setRole] = useState<"manager" | "barmanager" | null>(null);
  const [page, setPage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>(initialStockHistory);

  const sidebarWidth = sidebarCollapsed ? 64 : 220;

  if (!role) {
    return <LoginPage onLogin={r => { setRole(r); setPage("dashboard"); }} />;
  }

  function handleAddItem(item: Item) {
    setItems(prev => [...prev, item]);
  }
  function handleEditItem(updated: Item) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  }
  function handleDeleteItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }
  function handleAddStock(itemId: string, boxes: number, note: string) {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, currentBoxes: i.currentBoxes + boxes } : i));
    setStockHistory(prev => [...prev, {
      id: `SH${Date.now()}`,
      itemId,
      date: new Date().toISOString().split("T")[0],
      type: "in",
      boxes,
      note,
    }]);
  }
  function handleSaveTransaction(txn: Transaction) {
    setTransactions(prev => [txn, ...prev]);
    // Deduct from store
    setItems(prev => prev.map(item => {
      const row = txn.rows.find(r => r.itemId === item.id);
      if (!row) return item;
      return { ...item, currentBoxes: Math.max(0, item.currentBoxes - row.boxes) };
    }));
    // Record stock-out history
    txn.rows.forEach(row => {
      setStockHistory(prev => [...prev, {
        id: `SH${Date.now()}-${row.itemId}`,
        itemId: row.itemId,
        date: txn.date,
        type: "out",
        boxes: row.boxes,
        note: `Distributed to ${txn.barMan}`,
      }]);
    });
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard items={items} transactions={transactions} onNavigate={setPage} role={role} />;
      case "items": return role === "manager" ? <ItemManagement items={items} onAdd={handleAddItem} onEdit={handleEditItem} onDelete={handleDeleteItem} /> : null;
      case "store": return role === "manager" ? <StoreManagement items={items} stockHistory={stockHistory} onAddStock={handleAddStock} /> : null;
      case "give-to-bar": return <GiveToBar items={items} onSave={handleSaveTransaction} />;
      case "history": return <DistributionHistory transactions={transactions} items={items} />;
      case "inventory": return <Inventory items={items} />;
      case "reports": return role === "manager" ? <Reports items={items} transactions={transactions} /> : null;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <Sidebar
        currentPage={page}
        onNavigate={setPage}
        role={role}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />
      <Navbar
        sidebarWidth={sidebarWidth}
        role={role}
        onLogout={() => setRole(null)}
      />
      <main
        className="pt-14 min-h-screen transition-all duration-200 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="p-6 lg:p-8 max-w-screen-2xl">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
