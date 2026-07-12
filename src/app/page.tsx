"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  const syncManagerProfile = async () => {
    if (!supabase) {
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ role: "manager" })
        .eq("id", user.id);
    }
  };

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          void syncManagerProfile();
          router.replace("/dashboard");
        }
      },
    );

    return () => authListener.subscription.unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!supabase) {
        throw new Error(
          "Supabase environment variables are not configured yet.",
        );
      }

      if (mode === "sign-up") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: "manager" },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
        await syncManagerProfile();
        setError("Check your email for the confirmation link.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        await syncManagerProfile();
        router.replace("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0f1117] text-[#e8e6e1]">
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden bg-[linear-gradient(145deg,#1a1200_0%,#0f1117_60%,#131a2e_100%)]">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 70%, #c9a84c 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1e3a5f 0%, transparent 40%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#a07828] text-lg font-bold text-[#0f1117]">
              T
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-[#c9a84c]">
                Tsion
              </p>
              <p className="text-xs text-[#7a8090]">Bar & Restaurant</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="font-display text-4xl font-bold leading-tight text-[#f4efe7]">
            Hotel Management
            <br />
            <span className="text-[#c9a84c]">System</span>
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-[#7a8090]">
            Phase 1 — Store Management & Bar Inventory Distribution. Track every
            box, every birr.
          </p>
          <div className="grid max-w-xs grid-cols-2 gap-4">
            {[
              { label: "Store Items", value: "11" },
              { label: "Bar Managers", value: "4" },
              { label: "Daily Txns", value: "∞" },
              { label: "Accuracy", value: "100%" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[#c9a84c]/15 bg-[#c9a84c]/10 p-4"
              >
                <p className="font-display text-2xl font-bold text-[#c9a84c]">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-[#7a8090]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-[#7a8090]">
            © 2026 Tsion Bar & Restaurant · All rights reserved
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[#0f1117] p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#a07828] font-bold text-[#0f1117]">
              T
            </div>
            <span className="font-display font-semibold text-[#c9a84c]">
              Tsion Bar & Restaurant
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#f4efe7]">
              {mode === "sign-in" ? "Welcome back" : "Create account"}
            </h2>
            <p className="mt-1 text-sm text-[#7a8090]">
              {mode === "sign-in"
                ? "Sign in to your account to continue"
                : "Create a Supabase-backed account for the hotel system"}
            </p>
          </div>

          <div className="flex rounded-xl border border-[#252b3b] bg-[#1e2435] p-1">
            {(["sign-in", "sign-up"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                style={{
                  backgroundColor:
                    mode === value ? "rgba(201,168,76,0.15)" : "transparent",
                  color: mode === value ? "#c9a84c" : "#7a8090",
                }}
              >
                {value === "sign-in" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#7a8090]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                required
                className="w-full rounded-xl border border-[#252b3b] bg-[#1e2435] px-4 py-3 text-sm text-[#e8e6e1] outline-none transition-all focus:border-[#c9a84c]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#7a8090]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full rounded-xl border border-[#252b3b] bg-[#1e2435] px-4 py-3 text-sm text-[#e8e6e1] outline-none transition-all focus:border-[#c9a84c]"
              />
            </div>
            {error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-70"
              style={{
                background: loading
                  ? "#1e2435"
                  : "linear-gradient(135deg, #c9a84c, #a07828)",
                color: "#0f1117",
              }}
            >
              {loading
                ? mode === "sign-in"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "sign-in"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <div className="rounded-xl border border-[#252b3b] bg-[#1e2435] p-4 space-y-2">
            <p className="text-xs font-medium text-[#7a8090]">
              Demo Credentials
            </p>
            <div className="space-y-1 text-xs text-[#e8e6e1]">
              <p>
                Supabase auth is now enabled for this app. Use any email and
                password to sign up or sign in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
