"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createCashierReport,
  getBonos,
  getCashierSetting,
  type BonoRecord,
} from "../lib/supabase-data";

interface CheckoutInputs {
  [bonoId: string]: {
    additional: string;
    remaining: string;
  };
}

export default function CashierCheckout() {
  const [bonos, setBonos] = useState<BonoRecord[]>([]);
  const [initialMoney, setInitialMoney] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [inputs, setInputs] = useState<CheckoutInputs>({});
  const [specialPayouts, setSpecialPayouts] = useState("0");
  const [todayMoney, setTodayMoney] = useState("0");
  const [cashierName, setCashierName] = useState("Almaz");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bonoData, savedInitialMoney] = await Promise.all([
          getBonos(),
          getCashierSetting("initial_money"),
        ]);

        const activeBonos = bonoData.filter((bono) => bono.is_active);
        setBonos(activeBonos);
        setInitialMoney(savedInitialMoney || 0);
        setInputs(
          Object.fromEntries(
            activeBonos.map((bono) => [
              bono.id,
              { additional: "0", remaining: "0" },
            ]),
          ),
        );
      } catch {
        setBonos([]);
        setInitialMoney(0);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const rows = useMemo(
    () =>
      bonos.map((bono) => {
        const current = inputs[bono.id] ?? { additional: "0", remaining: "0" };
        const additional = Number(current.additional || 0);
        const remaining = Number(current.remaining || 0);
        const effectiveQuantity = Math.max(
          0,
          bono.quantity + additional - remaining,
        );
        const totalAmount = effectiveQuantity * bono.price;

        return {
          ...bono,
          effectiveQuantity,
          totalAmount,
        };
      }),
    [bonos, inputs],
  );

  const netBonoValue = useMemo(
    () => rows.reduce((sum, row) => sum + row.totalAmount, 0),
    [rows],
  );

  const finalBalance = initialMoney + netBonoValue;
  const balanceCheck =
    Number(specialPayouts || 0) + Number(todayMoney || 0) - finalBalance;

  const updateInput = (
    bonoId: string,
    field: "additional" | "remaining",
    value: string,
  ) => {
    setInputs((prev) => ({
      ...prev,
      [bonoId]: {
        additional: prev[bonoId]?.additional ?? "0",
        remaining: prev[bonoId]?.remaining ?? "0",
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to submit this cashier checkout?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      const report = {
        cashier_name: cashierName,
        initial_money: initialMoney,
        net_bono_value: netBonoValue,
        final_balance: finalBalance,
        special_payouts: Number(specialPayouts || 0),
        today_money: Number(todayMoney || 0),
        balance_check: balanceCheck,
        items: rows.map((row) => ({
          id: row.id,
          name: row.name,
          quantity: row.quantity,
          price: row.price,
          additional: Number(inputs[row.id]?.additional ?? 0),
          remaining: Number(inputs[row.id]?.remaining ?? 0),
          effective_quantity: row.effectiveQuantity,
          total_amount: row.totalAmount,
        })),
      };

      await createCashierReport(report);
      setMessage("Checkout saved successfully.");
      setSpecialPayouts("0");
      setTodayMoney("0");
      setInputs(
        Object.fromEntries(
          bonos.map((bono) => [bono.id, { additional: "0", remaining: "0" }]),
        ),
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save checkout.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="rounded-3xl border p-4 sm:p-6"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-bold font-display"
            style={{ color: "var(--foreground)" }}
          >
            Cashier Checkout
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            Review each bono, add temporary extra units, subtract remaining
            units, and calculate the final cashier balance.
          </p>
        </div>
        <div
          className="rounded-2xl px-4 py-3"
          style={{ backgroundColor: "rgba(201,168,76,0.12)" }}
        >
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Final Balance
          </p>
          <p
            className="text-xl font-semibold"
            style={{ color: "var(--primary)" }}
          >
            {finalBalance.toLocaleString()} Birr
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div
          className="rounded-2xl border px-4 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Cashier
          </p>
          <select
            value={cashierName}
            onChange={(event) => setCashierName(event.target.value)}
            className="mt-2 w-full rounded-lg px-2 py-2 text-sm outline-none"
            style={{
              backgroundColor: "var(--secondary)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            <option value="Almaz">Almaz</option>
            <option value="Beza">Beza</option>
          </select>
        </div>
        <div
          className="rounded-2xl border px-4 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Initial Money
          </p>
          <p
            className="mt-1 text-lg font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {initialMoney.toLocaleString()} Birr
          </p>
        </div>
        <div
          className="rounded-2xl border px-4 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Net Bono Value
          </p>
          <p
            className="mt-1 text-lg font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {netBonoValue.toLocaleString()} Birr
          </p>
        </div>
        <div
          className="rounded-2xl border px-4 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Expected Cashier Balance
          </p>
          <p
            className="mt-1 text-lg font-semibold"
            style={{ color: "var(--primary)" }}
          >
            {finalBalance.toLocaleString()} Birr
          </p>
        </div>
      </div>

      <div
        className="mt-6 overflow-hidden rounded-2xl border"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
              <tr>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Available Bono
                </th>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Additional Bono
                </th>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Remaining Bono
                </th>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Loading bonos...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    No active bonos found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <td className="px-4 py-3">
                      <div
                        className="font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {row.name}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Available: {row.quantity} • Price:{" "}
                        {row.price.toLocaleString()} Birr
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        value={inputs[row.id]?.additional ?? "0"}
                        onChange={(event) =>
                          updateInput(row.id, "additional", event.target.value)
                        }
                        className="w-full min-w-[90px] rounded-lg px-2 py-2 text-sm outline-none sm:w-24"
                        style={{
                          backgroundColor: "var(--secondary)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        value={inputs[row.id]?.remaining ?? "0"}
                        onChange={(event) =>
                          updateInput(row.id, "remaining", event.target.value)
                        }
                        className="w-full min-w-[90px] rounded-lg px-2 py-2 text-sm outline-none sm:w-24"
                        style={{
                          backgroundColor: "var(--secondary)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="font-semibold"
                        style={{ color: "var(--primary)" }}
                      >
                        {row.totalAmount.toLocaleString()} Birr
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Net units: {row.effectiveQuantity}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className="mt-6 overflow-hidden rounded-2xl border"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
              <tr>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Item
                </th>
                <th
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: "1px solid var(--border)" }}>
                <td className="px-4 py-3">
                  <div
                    className="font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Special Payouts
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Money paid on behalf of the manager.
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    value={specialPayouts}
                    onChange={(event) => setSpecialPayouts(event.target.value)}
                    className="w-full min-w-[120px] rounded-lg px-2 py-2 text-sm outline-none sm:w-32"
                    style={{
                      backgroundColor: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </td>
              </tr>
              <tr style={{ borderTop: "1px solid var(--border)" }}>
                <td className="px-4 py-3">
                  <div
                    className="font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Total Today&apos;s Money
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Money the cashier gives to the manager at the end of the
                    day.
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    value={todayMoney}
                    onChange={(event) => setTodayMoney(event.target.value)}
                    className="w-full min-w-[120px] rounded-lg px-2 py-2 text-sm outline-none sm:w-32"
                    style={{
                      backgroundColor: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </td>
              </tr>
              <tr style={{ borderTop: "1px solid var(--border)" }}>
                <td className="px-4 py-3">
                  <div
                    className="font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Balance Check
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Target: 0
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div
                    className="font-semibold"
                    style={{
                      color: balanceCheck === 0 ? "#22c55e" : "var(--primary)",
                    }}
                  >
                    {balanceCheck.toLocaleString()} Birr
                  </div>
                  <div
                    className="text-xs"
                    style={{
                      color:
                        balanceCheck === 0
                          ? "#22c55e"
                          : "var(--muted-foreground)",
                    }}
                  >
                    {balanceCheck === 0 ? "Balanced" : "Needs adjustment"}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Additional bono values are temporary and will not change the saved
          bono database entries.
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-xl px-4 py-2.5 text-sm font-medium"
          style={{
            background: "linear-gradient(135deg, #c9a84c, #a07828)",
            color: "#0f1117",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Saving..." : "Final Submit"}
        </button>
      </div>

      {message ? (
        <p
          className="mt-3 text-sm"
          style={{ color: message.includes("success") ? "#22c55e" : "#f87171" }}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
