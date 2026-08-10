"use client";

interface DeleteModalProps {
  deleteId: string | null;
  employeeName: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteModal({
  deleteId,
  employeeName,
  isSubmitting,
  onCancel,
  onConfirm,
}: DeleteModalProps) {
  if (!deleteId) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          className="text-base font-bold"
          style={{ color: "var(--foreground)" }}
        >
          Remove Employee?
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
        >
          Are you sure you want to remove{" "}
          <strong style={{ color: "var(--foreground)" }}>
            {employeeName}
          </strong>{" "}
          from the system?
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm"
            style={{
              backgroundColor: "var(--secondary)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-sm font-medium hover:brightness-110"
            style={{
              backgroundColor: "rgba(239,68,68,0.12)",
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.25)",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
