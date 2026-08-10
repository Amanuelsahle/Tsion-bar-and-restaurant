"use client";

import { type Employee } from "../../lib/types";
import { ACTION_META, type ActionType, type AccruedPayrollSummary } from "./hr-utils";

interface SalaryActionPanelProps {
  emp: Employee;
  summary: AccruedPayrollSummary;
  actionType: ActionType;
  setActionType: (t: ActionType) => void;
  actionAmount: number;
  setActionAmount: (a: number) => void;
  actionNote: string;
  setActionNote: (n: string) => void;
  actionSuccess: string;
  actionError: string;
  setActionError: (e: string) => void;
  isSubmitting: boolean;
  handleAction: () => Promise<void>;
  mobileTab: "profile" | "actions" | "audit";
}

export default function SalaryActionPanel({
  emp,
  summary,
  actionType,
  setActionType,
  actionAmount,
  setActionAmount,
  actionNote,
  setActionNote,
  actionSuccess,
  actionError,
  setActionError,
  isSubmitting,
  handleAction,
  mobileTab,
}: SalaryActionPanelProps) {
  const maxPaymentAllowed = Math.max(0, summary.netBalanceDue);

  return (
    <div
      className={`rounded-2xl p-6 space-y-5 ${
        mobileTab === "actions" ? "block" : "hidden lg:block"
      }`}
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <h2
        className="text-sm font-semibold"
        style={{ color: "var(--foreground)" }}
      >
        Salary Actions & Payouts
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {(
          Object.entries(ACTION_META) as [
            ActionType,
            (typeof ACTION_META)[ActionType],
          ][]
        ).map(([key, meta]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setActionType(key);
              setActionError("");
              if (key === "payment") {
                setActionAmount(maxPaymentAllowed);
              }
            }}
            className="px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left"
            style={{
              backgroundColor:
                actionType === key
                  ? `${meta.color}18`
                  : "var(--secondary)",
              color:
                actionType === key ? meta.color : "var(--muted-foreground)",
              border:
                actionType === key
                  ? `1px solid ${meta.color}30`
                  : "1px solid var(--border)",
            }}
          >
            {meta.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 pt-2">
        {actionType === "payment" && (
          <div className="flex flex-wrap gap-2 pb-1">
            <button
              type="button"
              onClick={() => {
                setActionAmount(maxPaymentAllowed);
                setActionError("");
              }}
              disabled={summary.netBalanceDue <= 0}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: "rgba(74,222,128,0.12)",
                color: summary.netBalanceDue > 0 ? "#4ade80" : "var(--muted-foreground)",
                border: "1px solid rgba(74,222,128,0.25)",
                opacity: summary.netBalanceDue > 0 ? 1 : 0.5,
                cursor: summary.netBalanceDue > 0 ? "pointer" : "not-allowed",
              }}
            >
              Pay Full Balance ({maxPaymentAllowed.toLocaleString()} Birr)
            </button>
            <button
              type="button"
              onClick={() => {
                setActionAmount(Math.min(emp.baseSalary, maxPaymentAllowed));
                setActionError("");
              }}
              disabled={summary.netBalanceDue <= 0}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: "var(--secondary)",
                color: summary.netBalanceDue > 0 ? "var(--foreground)" : "var(--muted-foreground)",
                border: "1px solid var(--border)",
                opacity: summary.netBalanceDue > 0 ? 1 : 0.5,
                cursor: summary.netBalanceDue > 0 ? "pointer" : "not-allowed",
              }}
            >
              Pay 1 Month ({Math.min(emp.baseSalary, maxPaymentAllowed).toLocaleString()} Birr)
            </button>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label
              className="font-medium"
              style={{ color: "var(--muted-foreground)" }}
            >
              Amount (Birr)
            </label>
            {actionType === "payment" && (
              <span style={{ color: "var(--muted-foreground)" }}>
                Max Payable: <strong style={{ color: "#4ade80" }}>{maxPaymentAllowed.toLocaleString()} Birr</strong>
              </span>
            )}
          </div>
          <input
            type="number"
            min={1}
            max={actionType === "payment" ? maxPaymentAllowed : undefined}
            value={actionAmount || ""}
            onChange={(e) => {
              const val = +e.target.value;
              setActionAmount(val);
              if (actionType === "payment" && val > maxPaymentAllowed) {
                setActionError(
                  `Payout amount (${val.toLocaleString()} Birr) cannot exceed remaining balance due of ${maxPaymentAllowed.toLocaleString()} Birr.`,
                );
              } else {
                setActionError("");
              }
            }}
            placeholder={
              actionType === "increase"
                ? "e.g. 2000"
                : `Max: ${maxPaymentAllowed.toLocaleString()} Birr`
            }
            className="w-full px-4 py-2.5 rounded-xl text-base md:text-sm outline-none"
            style={{
              backgroundColor: "var(--secondary)",
              border: actionType === "payment" && actionAmount > maxPaymentAllowed
                ? "1px solid rgba(239, 68, 68, 0.6)"
                : "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {actionType === "payment" && (
          <div
            className="text-xs px-3 py-2 rounded-lg leading-relaxed"
            style={{
              backgroundColor:
                summary.netBalanceDue <= 0 || actionAmount > summary.netBalanceDue
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(74,222,128,0.06)",
              border:
                summary.netBalanceDue <= 0 || actionAmount > summary.netBalanceDue
                  ? "1px solid rgba(239,68,68,0.2)"
                  : "1px solid rgba(74,222,128,0.15)",
              color:
                summary.netBalanceDue <= 0 || actionAmount > summary.netBalanceDue
                  ? "#f87171"
                  : "#4ade80",
            }}
          >
            {summary.netBalanceDue <= 0 ? (
              <span>ℹ️ Employee has <strong>0 Birr</strong> remaining balance due. No salary payout is available.</span>
            ) : actionAmount > summary.netBalanceDue ? (
              <span>⚠️ Payout amount ({actionAmount.toLocaleString()} Birr) exceeds the maximum remaining balance due of <strong>{summary.netBalanceDue.toLocaleString()} Birr</strong>.</span>
            ) : (
              <span>
                Total Unpaid Accumulated Balance ({summary.totalDaysWorked} days):{" "}
                <strong>{summary.netBalanceDue.toLocaleString()} Birr</strong>.
                {actionAmount > 0 && actionAmount < summary.netBalanceDue && (
                  <span>
                    {" "}
                    Remaining after payout:{" "}
                    <strong>
                      {(summary.netBalanceDue - actionAmount).toLocaleString()}{" "}
                      Birr
                    </strong>.
                  </span>
                )}
              </span>
            )}
          </div>
        )}

        {actionType === "increase" && (
          <div
            className="text-xs px-3 py-2 rounded-lg leading-relaxed"
            style={{
              backgroundColor: "rgba(201,168,76,0.06)",
              border: "1px solid rgba(201,168,76,0.15)",
              color: "#c9a84c",
            }}
          >
            Current rate: {emp.baseSalary.toLocaleString()} Birr/mo → New
            rate:{" "}
            <strong>
              {(emp.baseSalary + (actionAmount || 0)).toLocaleString()}{" "}
              Birr/mo
            </strong>.
            <br />
            Past days will keep their pre-raise daily rate, and the new
            daily rate applies from today onwards.
          </div>
        )}

        {actionType === "advance" && (
          <div
            className="text-xs px-3 py-2 rounded-lg leading-relaxed"
            style={{
              backgroundColor: "rgba(251,146,60,0.06)",
              border: "1px solid rgba(251,146,60,0.15)",
              color: "#fb923c",
            }}
          >
            This salary advance will be deducted from future accrued earnings.
          </div>
        )}

        <div className="space-y-1.5">
          <label
            className="text-xs font-medium"
            style={{ color: "var(--muted-foreground)" }}
          >
            Reason / Note (optional)
          </label>
          <input
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            placeholder="Reason for advance, payout, or raise..."
            className="w-full px-4 py-2.5 rounded-xl text-base md:text-sm outline-none"
            style={{
              backgroundColor: "var(--secondary)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {actionError && (
          <div
            className="px-4 py-3 rounded-xl text-xs"
            style={{
              backgroundColor: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#f87171",
            }}
          >
            ⚠️ {actionError}
          </div>
        )}

        {actionSuccess && (
          <div
            className="px-4 py-3 rounded-xl text-xs"
            style={{
              backgroundColor: "rgba(74,222,128,0.08)",
              border: "1px solid rgba(74,222,128,0.2)",
              color: "#4ade80",
            }}
          >
            ✓ {actionSuccess}
          </div>
        )}

        <button
          type="button"
          onClick={handleAction}
          disabled={
            actionAmount <= 0 ||
            isSubmitting ||
            (actionType === "payment" &&
              (summary.netBalanceDue <= 0 ||
                actionAmount > maxPaymentAllowed))
          }
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background:
              actionAmount > 0 &&
              !(
                actionType === "payment" &&
                (summary.netBalanceDue <= 0 || actionAmount > maxPaymentAllowed)
              )
                ? `linear-gradient(135deg, ${ACTION_META[actionType].color}, ${ACTION_META[actionType].color}bb)`
                : "var(--muted)",
            color:
              actionAmount > 0 &&
              !(
                actionType === "payment" &&
                (summary.netBalanceDue <= 0 || actionAmount > maxPaymentAllowed)
              )
                ? "#0f1117"
                : "var(--muted-foreground)",
            cursor:
              actionAmount > 0 &&
              !isSubmitting &&
              !(
                actionType === "payment" &&
                (summary.netBalanceDue <= 0 || actionAmount > maxPaymentAllowed)
              )
                ? "pointer"
                : "not-allowed",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting
            ? "Processing..."
            : `Confirm ${ACTION_META[actionType].label}`}
        </button>
      </div>
    </div>
  );
}
