"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  canManageUsers,
  getRoleLabel,
  resolveEffectiveRole,
  serializeRoleForProfile,
  type UserRole,
} from "../lib/roles";

interface AdminPanelProps {
  role: UserRole;
  onClose: () => void;
}

type NewUserForm = {
  email: string;
  password: string;
  role: UserRole;
};

type ListedUser = {
  id: string;
  email: string;
  role: UserRole;
};

const defaultForm: NewUserForm = {
  email: "",
  password: "",
  role: "manager",
};

export default function AdminPanel({ role, onClose }: AdminPanelProps) {
  const [form, setForm] = useState<NewUserForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [users, setUsers] = useState<ListedUser[]>([]);

  useEffect(() => {
    setIsSuperAdmin(canManageUsers(role));
  }, [role]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!supabase) {
        return;
      }

      setUsersLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, role")
          .order("updated_at", { ascending: false })
          .limit(20);

        if (error) {
          return;
        }

        const nextUsers = (data ?? [])
          .filter((item): item is { id: string; email: string; role: string } =>
            Boolean(item?.email),
          )
          .map((item) => ({
            id: item.id,
            email: item.email,
            role: resolveEffectiveRole(item.email, item.role),
          }));

        setUsers(nextUsers);
      } finally {
        setUsersLoading(false);
      }
    };

    void loadUsers();
  }, []);

  const roleOptions = useMemo(() => {
    const options: Array<{ value: UserRole; label: string }> = [
      { value: "manager", label: "Manager" },
      { value: "barmanager", label: "Bar Manager" },
      { value: "admin", label: "Admin" },
    ];

    if (isSuperAdmin) {
      options.unshift({ value: "super_admin", label: "Super Admin" });
    }

    return options;
  }, [isSuperAdmin]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      if (!isSuperAdmin) {
        throw new Error("Only a super admin can add users.");
      }

      const { data: userData, error: signUpError } = await supabase.auth.signUp(
        {
          email: form.email.trim(),
          password: form.password,
          options: {
            data: { role: form.role },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        },
      );

      if (signUpError) {
        throw signUpError;
      }

      if (!userData.user) {
        throw new Error("User creation did not return a valid account.");
      }

      await supabase.from("profiles").upsert(
        {
          id: userData.user.id,
          email: form.email.trim(),
          role: serializeRoleForProfile(form.role),
        },
        { onConflict: "id" },
      );

      const createdUserId = userData.user.id;

      setUsers((prev) => [
        {
          id: createdUserId,
          email: form.email.trim(),
          role: form.role,
        },
        ...prev.filter((item) => item.id !== createdUserId),
      ]);

      setMessage(
        `Invitation sent to ${form.email.trim()}. The new user must verify their email before they can sign in.`,
      );
      setForm(defaultForm);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to create user.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#2b3246] bg-[#121723] p-6 shadow-2xl shadow-black/20">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#c9a84c]">
            Admin panel
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#f5efe7]">
            Add a new staff member
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#8c94a8]">
            Super admins can create new accounts and assign their role. New
            users must verify their email before they can sign in.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[#2b3246] px-3 py-2 text-sm text-[#c9a84c]"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-[#cfd4df]">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            className="w-full rounded-xl border border-[#2b3246] bg-[#0f1420] px-4 py-3 text-sm text-[#f5efe7] outline-none focus:border-[#c9a84c]"
            placeholder="staff@tsion.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[#cfd4df]">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            className="w-full rounded-xl border border-[#2b3246] bg-[#0f1420] px-4 py-3 text-sm text-[#f5efe7] outline-none focus:border-[#c9a84c]"
            placeholder="Create a temporary password"
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm text-[#cfd4df]">Assign role</label>
          <select
            value={form.role}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                role: event.target.value as UserRole,
              }))
            }
            className="w-full rounded-xl border border-[#2b3246] bg-[#0f1420] px-4 py-3 text-sm text-[#f5efe7] outline-none focus:border-[#c9a84c]"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#c9a84c] px-5 py-2.5 text-sm font-semibold text-[#0f1117] transition-opacity disabled:opacity-70"
          >
            {loading ? "Creating user..." : "Create user"}
          </button>
          <span className="text-sm text-[#8c94a8]">
            Role preview:{" "}
            <span className="font-semibold text-[#f5efe7]">
              {getRoleLabel(form.role)}
            </span>
          </span>
        </div>
      </form>

      <div className="mt-6 rounded-2xl border border-[#2b3246] bg-[#0f1420] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[#f5efe7]">
            Available staff
          </h3>
          <span className="text-xs text-[#8c94a8]">
            {usersLoading
              ? "Loading…"
              : `${users.length} user${users.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {users.length > 0 ? (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2b3246] bg-[#121723] px-3 py-2"
              >
                <div>
                  <p className="text-sm text-[#f5efe7]">{user.email}</p>
                  <p className="text-xs text-[#8c94a8]">
                    {getRoleLabel(user.role)}
                  </p>
                </div>
                <span className="rounded-full border border-[#2b3246] px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-[#c9a84c]">
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#8c94a8]">
            No staff accounts have been added yet.
          </p>
        )}
      </div>

      {message ? (
        <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}
    </div>
  );
}
