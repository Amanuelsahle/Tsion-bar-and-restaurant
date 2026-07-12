interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  role: "manager" | "barmanager";
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "items", label: "Item Management", icon: "◈", managerOnly: true },
  { id: "store", label: "Store Management", icon: "▣", managerOnly: true },
  { id: "give-to-bar", label: "Give to Bar", icon: "↗" },
  { id: "history", label: "Distribution History", icon: "≡" },
  { id: "inventory", label: "Inventory", icon: "◉" },
  { id: "reports", label: "Reports", icon: "▦", managerOnly: true },
];

export default function Sidebar({ currentPage, onNavigate, role, collapsed, onToggle }: SidebarProps) {
  const filtered = navItems.filter(item => !item.managerOnly || role === "manager");

  return (
    <aside
      style={{ width: collapsed ? 64 : 220, transition: "width 0.25s ease" }}
      className="fixed left-0 top-0 h-screen flex flex-col z-40 overflow-hidden"
      aria-label="Sidebar navigation"
    >
      <div className="flex flex-col h-full"
        style={{ background: "linear-gradient(180deg, #13172050 0%, #0d101800 100%)", backdropFilter: "blur(0px)", borderRight: "1px solid var(--border)", backgroundColor: "#12151e" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #c9a84c, #a07828)", color: "#0f1117" }}>
            T
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-display text-sm font-semibold leading-tight" style={{ color: "var(--primary)" }}>Tsion</p>
              <p className="text-xs leading-tight" style={{ color: "var(--muted-foreground)" }}>Bar & Restaurant</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
          <ul className="space-y-0.5 px-2">
            {filtered.map(item => {
              const active = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left"
                    style={{
                      backgroundColor: active ? "rgba(201,168,76,0.15)" : "transparent",
                      color: active ? "var(--primary)" : "var(--muted-foreground)",
                      borderLeft: active ? "2px solid var(--primary)" : "2px solid transparent",
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.04)";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
                      }
                    }}
                  >
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded-lg text-xs transition-colors"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>
      </div>
    </aside>
  );
}
