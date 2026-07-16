"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createBono,
  deleteBono,
  getBonos,
  getCashierSetting,
  updateBono,
  updateCashierSetting,
  type BonoRecord,
} from "../lib/supabase-data";

interface BonoFormState {
  name: string;
  quantity: string;
  price: string;
  isActive: boolean;
}

const emptyForm: BonoFormState = {
  name: "",
  quantity: "",
  price: "",
  isActive: true,
};

export default function BonoManagement() {
  const [bonos, setBonos] = useState<BonoRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BonoFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [initialMoney, setInitialMoney] = useState(5000);
  const [editingInitialMoney, setEditingInitialMoney] = useState(false);
  const [initialMoneyInput, setInitialMoneyInput] = useState("5000");

  const loadBonos = async () => {
    try {
      setLoading(true);
      const data = await getBonos();
      setBonos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bonos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBonos();
  }, []);

  useEffect(() => {
    const loadInitialMoney = async () => {
      try {
        const value = await getCashierSetting("initial_money");
        setInitialMoney(value || 5000);
        setInitialMoneyInput(String(value || 5000));
      } catch {
        setInitialMoney(5000);
        setInitialMoneyInput("5000");
      }
    };

    void loadInitialMoney();
  }, []);

  const totalValue = useMemo(
    () => bonos.reduce((sum, bono) => sum + bono.quantity * bono.price, 0),
    [bonos],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleToggleForm = () => {
    if (showForm) {
      resetForm();
      setShowForm(false);
      setError(null);
    } else {
      setShowForm(true);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const quantity = Number(form.quantity);
    const price = Number(form.price);

    if (!form.name.trim() || Number.isNaN(quantity) || Number.isNaN(price)) {
      setError("Please fill every field with valid values.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingId) {
        const updated = await updateBono(editingId, {
          name: form.name.trim(),
          quantity,
          price,
          is_active: form.isActive,
        });
        setBonos((prev) =>
          prev.map((bono) => (bono.id === editingId ? updated : bono)),
        );
      } else {
        const created = await createBono({
          name: form.name.trim(),
          quantity,
          price,
          is_active: form.isActive,
        });
        setBonos((prev) => [created, ...prev]);
      }

      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save bono.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (bono: BonoRecord) => {
    setEditingId(bono.id);
    setShowForm(true);
    setForm({
      name: bono.name,
      quantity: String(bono.quantity),
      price: String(bono.price),
      isActive: bono.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this bono?")) return;

    try {
      await deleteBono(id);
      setBonos((prev) => prev.filter((bono) => bono.id !== id));
      if (editingId === id) {
        resetForm();
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete bono.");
    }
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-3xl border p-4 sm:p-6"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              className="text-2xl font-bold font-display"
              style={{ color: "var(--foreground)" }}
            >
              Bono Management
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Create, edit, and manage cashier bonos with active or inactive
              status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="w-full rounded-2xl px-4 py-3 sm:w-auto"
              style={{ backgroundColor: "rgba(201,168,76,0.12)" }}
            >
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                Total Value
              </p>
              <p
                className="text-xl font-semibold"
                style={{ color: "var(--primary)" }}
              >
                {totalValue.toLocaleString()} Birr
              </p>
            </div>
            <div
              className="w-full rounded-2xl px-4 py-3 sm:w-auto"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            >
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                Initial Money
              </p>
              <div className="flex items-center gap-2">
                {!editingInitialMoney ? (
                  <p
                    className="text-xl font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {initialMoney.toLocaleString()} Birr
                  </p>
                ) : (
                  <input
                    type="number"
                    min="0"
                    value={initialMoneyInput}
                    onChange={(event) =>
                      setInitialMoneyInput(event.target.value)
                    }
                    className="w-28 rounded-lg px-2 py-1.5 text-sm outline-none"
                    style={{
                      backgroundColor: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (editingInitialMoney) {
                      const parsed = Number(initialMoneyInput);
                      if (!Number.isNaN(parsed)) {
                        const saved = await updateCashierSetting(
                          "initial_money",
                          parsed,
                        );
                        setInitialMoney(saved.value);
                        setInitialMoneyInput(String(saved.value));
                      }
                    }
                    setEditingInitialMoney((prev) => !prev);
                  }}
                  className="rounded-lg px-3 py-1.5 text-sm"
                  style={{
                    backgroundColor: "var(--secondary)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {editingInitialMoney ? "Save" : "Edit"}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleForm}
              className="rounded-xl px-4 py-2.5 text-sm font-medium"
              style={{
                background: "linear-gradient(135deg, #c9a84c, #a07828)",
                color: "#0f1117",
              }}
            >
              {showForm ? "Hide Add Bono" : "Add Bono"}
            </button>
          </div>
        </div>
      </div>

      {showForm ? (
        <div
          className="rounded-3xl border p-6 relative"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          <button
            type="button"
            onClick={handleToggleForm}
            className="absolute right-4 top-4 rounded-lg px-2 py-1 text-lg leading-none"
            style={{
              backgroundColor: "rgba(239,68,68,0.08)",
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
            aria-label="Cancel add bono"
          >
            ×
          </button>

          <div className="flex items-center justify-between gap-3 pr-10">
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {editingId ? "Edit Bono" : "Add New Bono"}
            </h3>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]"
          >
            <div>
              <label
                className="mb-1 block text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                Bono Name
              </label>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="e.g. Beer Bono"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                Quantity
              </label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, quantity: event.target.value }))
                }
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                Price
              </label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, price: event.target.value }))
                }
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                Status
              </label>
              <select
                value={form.isActive ? "active" : "inactive"}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: event.target.value === "active",
                  }))
                }
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-1">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl px-4 py-2.5 text-sm font-medium"
                style={{
                  background: "linear-gradient(135deg, #c9a84c, #a07828)",
                  color: "#0f1117",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Bono"}
              </button>
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="rounded-xl px-3 py-2.5 text-sm"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                Clear
              </button>
            </div>
          </form>

          {error ? (
            <p className="mt-4 text-sm" style={{ color: "#f87171" }}>
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        className="rounded-3xl border overflow-hidden"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        {loading ? (
          <div
            className="p-8 text-center text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            Loading bonos...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                  }}
                >
                  <th
                    className="px-4 py-3 text-left text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Bono Name
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Quantity
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Price
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Status
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Value
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {bonos.map((bono) => (
                  <tr
                    key={bono.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td
                      className="px-4 py-3 font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      {bono.name}
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--foreground)" }}
                    >
                      {bono.quantity}
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--foreground)" }}
                    >
                      {bono.price.toLocaleString()} Birr
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: bono.is_active
                            ? "rgba(34,197,94,0.12)"
                            : "rgba(239,68,68,0.12)",
                          color: bono.is_active ? "#4ade80" : "#f87171",
                        }}
                      >
                        {bono.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 font-semibold"
                      style={{ color: "var(--primary)" }}
                    >
                      {(bono.quantity * bono.price).toLocaleString()} Birr
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEdit(bono)}
                          className="rounded-lg px-3 py-1.5 text-sm"
                          style={{
                            backgroundColor: "var(--secondary)",
                            color: "var(--foreground)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(bono.id)}
                          className="rounded-lg px-3 py-1.5 text-sm"
                          style={{
                            backgroundColor: "rgba(239,68,68,0.08)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.2)",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
