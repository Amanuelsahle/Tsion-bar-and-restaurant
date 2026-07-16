import { useState } from "react";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  role: "manager" | "barmanager";
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

type NavItem = {
  id: string;
  label: string;
  icon: string;
  managerOnly?: boolean;
};

type NavGroup = {
  key: string;
  label: string;
  icon: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    key: "store-bar",
    label: "Store & Bar",
    icon: "▣",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "⊞" },
      { id: "items", label: "Item Management", icon: "◈", managerOnly: true },
      { id: "store", label: "Store Management", icon: "▣", managerOnly: true },
      { id: "give-to-bar", label: "Give to Bar", icon: "↗" },
      { id: "history", label: "Distribution History", icon: "≡" },
      { id: "inventory", label: "Inventory", icon: "◉" },
      { id: "reports", label: "Reports", icon: "▦", managerOnly: true },
    ],
  },
  {
    key: "cashier",
    label: "Cashier",
    icon: "◌",
    items: [
      { id: "cashier-bonos", label: "Bono Management", icon: "◈" },
      { id: "cashier-checkout", label: "Cashier Checkout", icon: "◌" },
      { id: "cashier-reports", label: "Cashier Reports", icon: "▦" },
    ],
  },
];

export default function Sidebar({
  currentPage,
  onNavigate,
  role,
  collapsed,
  onToggle,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const [expandedGroup, setExpandedGroup] = useState("store-bar");

  const filteredGroups = navGroups.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.managerOnly || role === "manager",
    ),
  }));

  const toggleGroup = (groupKey: string) => {
    setExpandedGroup((prev) => (prev === groupKey ? "" : groupKey));
  };

  return (
    <>
      {mobileOpen && onCloseMobile ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      ) : null}
      <aside
        style={{ width: collapsed ? 64 : 220, transition: "width 0.25s ease" }}
        className={`fixed left-0 top-0 h-screen flex flex-col z-40 overflow-hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        aria-label="Sidebar navigation"
      >
        <div
          className="flex flex-col h-full"
          style={{
            background: "linear-gradient(180deg, #13172050 0%, #0d101800 100%)",
            backdropFilter: "blur(0px)",
            borderRight: "1px solid var(--border)",
            backgroundColor: "#12151e",
          }}
        >
          {/* Logo */}
          <div
            className="flex items-center justify-between gap-3 px-4 py-5 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #c9a84c, #a07828)",
                color: "#0f1117",
              }}
            >
              T
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p
                  className="font-display text-sm font-semibold leading-tight"
                  style={{ color: "var(--primary)" }}
                >
                  Tsion
                </p>
                <p
                  className="text-xs leading-tight"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Bar & Restaurant
                </p>
              </div>
            )}
            {mobileOpen && onCloseMobile ? (
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-lg px-2 py-1 text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
            <ul className="space-y-1.5 px-2">
              {filteredGroups.map((group) => {
                const activeGroup = group.items.some(
                  (item) => currentPage === item.id,
                );
                const isExpanded = expandedGroup === group.key;
                const hasChildren = group.items.length > 1;

                return (
                  <li key={group.key}>
                    <button
                      onClick={() => {
                        if (hasChildren) {
                          toggleGroup(group.key);
                        } else if (group.items[0]) {
                          onNavigate(group.items[0].id);
                        }
                      }}
                      title={collapsed ? group.label : undefined}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left"
                      style={{
                        backgroundColor: activeGroup
                          ? "rgba(201,168,76,0.15)"
                          : "transparent",
                        color: activeGroup
                          ? "var(--primary)"
                          : "var(--muted-foreground)",
                        borderLeft: activeGroup
                          ? "2px solid var(--primary)"
                          : "2px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!activeGroup) {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "rgba(255,255,255,0.04)";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "var(--foreground)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!activeGroup) {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "var(--muted-foreground)";
                        }
                      }}
                    >
                      <span className="text-base shrink-0">{group.icon}</span>
                      {!collapsed && (
                        <>
                          <span className="truncate">{group.label}</span>
                          {hasChildren && (
                            <span className="ml-auto text-[10px]">
                              {isExpanded ? "▾" : "▸"}
                            </span>
                          )}
                        </>
                      )}
                    </button>

                    {!collapsed && isExpanded && hasChildren && (
                      <ul className="mt-1 ml-4 space-y-1">
                        {group.items.map((item) => {
                          const active = currentPage === item.id;
                          return (
                            <li key={item.id}>
                              <button
                                onClick={() => onNavigate(item.id)}
                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm transition-all duration-150 text-left"
                                style={{
                                  backgroundColor: active
                                    ? "rgba(201,168,76,0.12)"
                                    : "transparent",
                                  color: active
                                    ? "var(--primary)"
                                    : "var(--muted-foreground)",
                                }}
                              >
                                <span className="text-sm shrink-0">
                                  {item.icon}
                                </span>
                                <span className="truncate">{item.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Collapse toggle */}
          <div
            className="p-3 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center p-2 rounded-lg text-xs transition-colors"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              {collapsed ? "→" : "←"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
