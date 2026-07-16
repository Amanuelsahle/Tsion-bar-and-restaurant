interface NavbarProps {
  sidebarWidth: number;
  role: "manager" | "barmanager";
  onLogout: () => void;
  onOpenMenu?: () => void;
}

export default function Navbar({
  sidebarWidth,
  role,
  onLogout,
  onOpenMenu,
}: NavbarProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header
      className="fixed top-0 right-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"
      style={{
        left: sidebarWidth,
        borderBottom: "1px solid var(--border)",
        backgroundColor: "rgba(15,17,23,0.85)",
        backdropFilter: "blur(12px)",
        transition: "left 0.25s ease",
      }}
    >
      <div className="flex items-center gap-3">
        {onOpenMenu ? (
          <button
            type="button"
            onClick={onOpenMenu}
            className="rounded-lg border px-2.5 py-2 text-sm lg:hidden"
            style={{
              borderColor: "var(--border)",
              color: "var(--muted-foreground)",
            }}
          >
            ☰
          </button>
        ) : null}
        <div className="min-w-0">
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {today}
          </p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#22c55e" }}
          />
          <span
            className="text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            {role === "manager" ? "Store Manager" : "Bar Manager"}
          </span>
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
          style={{
            background: "linear-gradient(135deg, #c9a84c, #a07828)",
            color: "#0f1117",
          }}
          title={role === "manager" ? "Store Manager" : "Bar Manager"}
        >
          {role === "manager" ? "SM" : "BM"}
        </div>
        <button
          onClick={onLogout}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{
            color: "var(--muted-foreground)",
            border: "1px solid var(--border)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--primary)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--border)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--muted-foreground)";
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
