interface NavbarProps {
  sidebarWidth: number;
  role: "manager" | "barmanager";
  onLogout: () => void;
}

export default function Navbar({ sidebarWidth, role, onLogout }: NavbarProps) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-6 py-3"
      style={{
        left: sidebarWidth,
        borderBottom: "1px solid var(--border)",
        backgroundColor: "rgba(15,17,23,0.85)",
        backdropFilter: "blur(12px)",
        transition: "left 0.25s ease",
      }}
    >
      <div>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{today}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {role === "manager" ? "Store Manager" : "Bar Manager"}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{ background: "linear-gradient(135deg, #c9a84c, #a07828)", color: "#0f1117" }}>
          {role === "manager" ? "SM" : "BM"}
        </div>
        <button
          onClick={onLogout}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--primary)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
