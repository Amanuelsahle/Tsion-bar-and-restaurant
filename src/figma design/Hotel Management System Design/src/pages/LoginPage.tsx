import { useState } from "react";

interface LoginPageProps {
  onLogin: (role: "manager" | "barmanager") => void;
}

const USERS = [
  { username: "manager", password: "manager123", role: "manager" as const, label: "Store Manager" },
  { username: "barmanager", password: "bar123", role: "barmanager" as const, label: "Bar Manager" },
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const user = USERS.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user.role);
      } else {
        setError("Invalid username or password.");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--background)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #1a1200 0%, #0f1117 60%, #131a2e 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 30% 70%, #c9a84c 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1e3a5f 0%, transparent 40%)",
          }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ background: "linear-gradient(135deg, #c9a84c, #a07828)", color: "#0f1117" }}>
              T
            </div>
            <div>
              <p className="font-display text-lg font-semibold" style={{ color: "var(--primary)" }}>Tsion</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Bar & Restaurant</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="font-display text-4xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
            Hotel Management<br />
            <span style={{ color: "var(--primary)" }}>System</span>
          </h1>
          <p className="text-base leading-relaxed max-w-sm" style={{ color: "var(--muted-foreground)" }}>
            Phase 1 — Store Management & Bar Inventory Distribution.
            Track every box, every birr.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-xs">
            {[
              { label: "Store Items", value: "11" },
              { label: "Bar Managers", value: "4" },
              { label: "Daily Txns", value: "∞" },
              { label: "Accuracy", value: "100%" },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-4" style={{ backgroundColor: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)" }}>
                <p className="text-2xl font-bold font-display" style={{ color: "var(--primary)" }}>{stat.value}</p>
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>© 2026 Tsion Bar & Restaurant · All rights reserved</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: "var(--background)" }}>
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold"
              style={{ background: "linear-gradient(135deg, #c9a84c, #a07828)", color: "#0f1117" }}>T</div>
            <span className="font-display font-semibold" style={{ color: "var(--primary)" }}>Tsion Bar & Restaurant</span>
          </div>

          <div>
            <h2 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>Welcome back</h2>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: loading ? "var(--muted)" : "linear-gradient(135deg, #c9a84c, #a07828)",
                color: "#0f1117",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Demo Credentials</p>
            <div className="space-y-1">
              <p className="text-xs" style={{ color: "var(--foreground)" }}>Manager: <span style={{ color: "var(--primary)" }}>manager / manager123</span></p>
              <p className="text-xs" style={{ color: "var(--foreground)" }}>Bar Manager: <span style={{ color: "var(--primary)" }}>barmanager / bar123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
