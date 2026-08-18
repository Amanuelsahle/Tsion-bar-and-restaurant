"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createCashierReport,
  getBonoOrder,
  getBonos,
  getCashierSetting,
  getEmployees,
  updateCashierSetting,
  type BonoRecord,
  type EmployeeRecord,
} from "../lib/supabase-data";

interface CheckoutInputs {
  [bonoId: string]: {
    additional: string;
    remaining: string;
    additionalRemaining: string;
  };
}

export default function CashierCheckout() {
  const [bonos, setBonos] = useState<BonoRecord[]>([]);
  const [initialMoney, setInitialMoney] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingInitialMoney, setSavingInitialMoney] = useState(false);
  const [editingInitialMoney, setEditingInitialMoney] = useState(false);
  const [initialMoneyInput, setInitialMoneyInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [inputs, setInputs] = useState<CheckoutInputs>({});
  const [specialPayouts, setSpecialPayouts] = useState("");
  const [otherMoney1, setOtherMoney1] = useState("");
  const [otherMoney2, setOtherMoney2] = useState("");
  const [todayMoney, setTodayMoney] = useState("");
  const [todayTickets, setTodayTickets] = useState("");
  const [cashierName, setCashierName] = useState("");
  const [cashiers, setCashiers] = useState<EmployeeRecord[]>([]);
  const [isFastingDay, setIsFastingDay] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bonoData, savedInitialMoney, employeeData] = await Promise.all([
          getBonos(),
          getCashierSetting("initial_money"),
          getEmployees(),
        ]);

        const cashierEmps = employeeData.filter(
          (emp) =>
            emp.role?.toLowerCase() === "cashier" && emp.status !== "inactive",
        );
        const availableCashiers =
          cashierEmps.length > 0
            ? cashierEmps
            : employeeData.filter((emp) => emp.role?.toLowerCase() === "cashier");
        const finalCashiers =
          availableCashiers.length > 0
            ? availableCashiers
            : employeeData.filter((emp) => emp.status !== "inactive");

        setCashiers(finalCashiers.length > 0 ? finalCashiers : employeeData);

        const activeBonos = bonoData.filter((bono) => bono.is_active);
        const orderedIds = await getBonoOrder();
        const categoryFiltered = activeBonos.filter((bono) => {
          if (isFastingDay) {
            return bono.category === "fasting" || bono.category === "regular";
          }

          return bono.category === "non-fasting" || bono.category === "regular";
        });
        const orderedBonos = (() => {
          if (!orderedIds.length) {
            return categoryFiltered;
          }

          const byId = new Map(categoryFiltered.map((bono) => [bono.id, bono]));
          const ordered = orderedIds
            .map((id) => byId.get(id))
            .filter((bono): bono is BonoRecord => Boolean(bono));
          const remaining = categoryFiltered.filter(
            (bono) => !orderedIds.includes(bono.id),
          );
          return [...ordered, ...remaining];
        })();

        setBonos(orderedBonos);
        const parsedInitialMoney = Number(savedInitialMoney ?? 0);
        setInitialMoney(parsedInitialMoney);
        setInitialMoneyInput(String(parsedInitialMoney));
        setInputs(
          Object.fromEntries(
            orderedBonos.map((bono) => [
              bono.id,
              { additional: "", remaining: "", additionalRemaining: "" },
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
  }, [isFastingDay]);

  const rows = useMemo(
    () =>
      bonos.map((bono) => {
        const current = inputs[bono.id] ?? {
          additional: "",
          remaining: "",
          additionalRemaining: "",
        };
        const additional = Number(current.additional || 0);
        const remaining = Number(current.remaining || 0);
        const additionalRemaining = Number(current.additionalRemaining || 0);
        const effectiveQuantity = Math.max(
          0,
          bono.quantity + additional - remaining - additionalRemaining,
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
    () =>
      rows.reduce((sum, row) => sum + row.totalAmount, 0) +
      Number(todayTickets || 0),
    [rows, todayTickets],
  );

  const finalBalance = initialMoney + netBonoValue;
  const balanceCheck =
    Number(specialPayouts || 0) +
    Number(otherMoney1 || 0) +
    Number(otherMoney2 || 0) +
    Number(todayMoney || 0) -
    finalBalance;

  const handleSaveInitialMoney = async () => {
    const parsed = Number(initialMoneyInput);

    if (Number.isNaN(parsed) || parsed < 0) {
      setMessage("Please enter a valid initial money amount.");
      return;
    }

    try {
      setSavingInitialMoney(true);
      setMessage(null);
      const saved = await updateCashierSetting("initial_money", parsed);
      setInitialMoney(saved.value);
      setInitialMoneyInput(String(saved.value));
      setEditingInitialMoney(false);
      setMessage("Initial money saved successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save initial money.",
      );
    } finally {
      setSavingInitialMoney(false);
    }
  };

  const updateInput = (
    bonoId: string,
    field: "additional" | "remaining" | "additionalRemaining",
    value: string,
  ) => {
    const normalized = value === "" ? "" : value;
    setInputs((prev) => ({
      ...prev,
      [bonoId]: {
        additional: prev[bonoId]?.additional ?? "",
        remaining: prev[bonoId]?.remaining ?? "",
        additionalRemaining: prev[bonoId]?.additionalRemaining ?? "",
        [field]: normalized,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!cashierName || cashierName.trim() === "") {
      setMessage("Please select a cashier before submitting.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to submit this cashier checkout for ${cashierName}?`,
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
        other_money_1: Number(otherMoney1 || 0),
        other_money_2: Number(otherMoney2 || 0),
        today_money: Number(todayMoney || 0),
        balance_check: balanceCheck,
        items: rows.map((row) => ({
          id: row.id,
          name: row.name,
          quantity: row.quantity,
          price: row.price,
          additional: Number(inputs[row.id]?.additional ?? 0),
          remaining: Number(inputs[row.id]?.remaining ?? 0),
          additional_remaining: Number(
            inputs[row.id]?.additionalRemaining ?? 0,
          ),
          effective_quantity: row.effectiveQuantity,
          total_amount: row.totalAmount,
        })),
      };

      await createCashierReport(report);
      setMessage("Checkout saved successfully.");
      setCashierName("");
      setSpecialPayouts("");
      setOtherMoney1("");
      setOtherMoney2("");
      setTodayMoney("");
      setTodayTickets("");
      setInputs(
        Object.fromEntries(
          bonos.map((bono) => [
            bono.id,
            { additional: "", remaining: "", additionalRemaining: "" },
          ]),
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
            <option value="">-- Select Cashier --</option>
            {cashiers.map((cashier) => (
              <option key={cashier.id} value={cashier.name}>
                {cashier.name}
              </option>
            ))}
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
            Day Mode
          </p>
          <button
            type="button"
            onClick={() => setIsFastingDay((prev) => !prev)}
            className="mt-2 w-full rounded-lg px-3 py-2 text-sm font-medium"
            style={{
              backgroundColor: isFastingDay
                ? "rgba(34,197,94,0.16)"
                : "rgba(201,168,76,0.14)",
              color: isFastingDay ? "#4ade80" : "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            {isFastingDay ? "Fasting Day" : "Regular Day"}
          </button>
        </div>
        <div
          className="rounded-2xl border px-4 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              Initial Money
            </p>
            <button
              type="button"
              onClick={() => {
                if (editingInitialMoney) {
                  void handleSaveInitialMoney();
                } else {
                  setEditingInitialMoney(true);
                  setInitialMoneyInput(String(initialMoney));
                }
              }}
              disabled={savingInitialMoney}
              className="rounded-lg px-2.5 py-1 text-xs"
              style={{
                backgroundColor: "var(--secondary)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            >
              {savingInitialMoney
                ? "Saving..."
                : editingInitialMoney
                  ? "Save"
                  : "Edit"}
            </button>
          </div>
          {editingInitialMoney ? (
            <input
              type="number"
              min="0"
              value={initialMoneyInput}
              onChange={(event) => setInitialMoneyInput(event.target.value)}
              className="mt-2 w-full rounded-lg px-2 py-2 text-base md:text-sm outline-none"
              style={{
                backgroundColor: "var(--secondary)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          ) : (
            <p
              className="mt-1 text-lg font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {initialMoney.toLocaleString()} Birr
            </p>
          )}
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
                  Another Remaining Bono
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
                    colSpan={5}
                    className="px-4 py-6 text-center"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Loading bonos...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
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
                        value={inputs[row.id]?.additional ?? ""}
                        onChange={(event) =>
                          updateInput(row.id, "additional", event.target.value)
                        }
                        className="w-full min-w-22.5 rounded-lg px-2 py-2 text-base md:text-sm outline-none sm:w-24"
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
                        value={inputs[row.id]?.remaining ?? ""}
                        onChange={(event) =>
                          updateInput(row.id, "remaining", event.target.value)
                        }
                        className="w-full min-w-22.5 rounded-lg px-2 py-2 text-base md:text-sm outline-none sm:w-24"
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
                        value={inputs[row.id]?.additionalRemaining ?? ""}
                        onChange={(event) =>
                          updateInput(
                            row.id,
                            "additionalRemaining",
                            event.target.value,
                          )
                        }
                        className="w-full min-w-22.5 rounded-lg px-2 py-2 text-base md:text-sm outline-none sm:w-24"
                        style={{
                          backgroundColor: "var(--secondary)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
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
                        </div>
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
        className="mt-6 rounded-2xl border p-4"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "rgba(255,255,255,0.03)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium" style={{ color: "var(--foreground)" }}>
              Today&apos;s Tickets
            </p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Enter today&apos;s ticket money and add it to the net bono value.
            </p>
          </div>
          <input
            type="number"
            min="0"
            value={todayTickets}
            onChange={(event) => setTodayTickets(event.target.value)}
            className="w-full min-w-35 rounded-lg px-3 py-2 text-base md:text-sm outline-none sm:w-40"
            style={{
              backgroundColor: "var(--secondary)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          />
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
                    className="w-full min-w-30 rounded-lg px-2 py-2 text-base md:text-sm outline-none sm:w-32"
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
                    Other Money 1
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Additional cash or payout item 1.
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    value={otherMoney1}
                    onChange={(event) => setOtherMoney1(event.target.value)}
                    className="w-full min-w-30 rounded-lg px-2 py-2 text-base md:text-sm outline-none sm:w-32"
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
                    Other Money 2
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Additional cash or payout item 2.
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    value={otherMoney2}
                    onChange={(event) => setOtherMoney2(event.target.value)}
                    className="w-full min-w-30 rounded-lg px-2 py-2 text-base md:text-sm outline-none sm:w-32"
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
                    className="w-full min-w-30 rounded-lg px-2 py-2 text-base md:text-sm outline-none sm:w-32"
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
