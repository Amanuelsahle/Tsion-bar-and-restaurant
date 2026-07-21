import { supabase } from "./supabase";

export type BonoRecord = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CashierSettingRecord = {
  id: string;
  key: string;
  value: number;
  created_at: string;
  updated_at: string;
};

export type CashierReportRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  cashier_name: string;
  initial_money: number;
  net_bono_value: number;
  final_balance: number;
  special_payouts: number;
  today_money: number;
  balance_check: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    additional: number;
    remaining: number;
    effective_quantity: number;
    total_amount: number;
  }>;
};

const BONO_STORAGE_KEY = "tsion-cashier-bonos";
const CASHIER_SETTING_STORAGE_KEY = "tsion-cashier-settings";
const CASHIER_REPORTS_STORAGE_KEY = "tsion-cashier-reports";
const BONO_ORDER_SETTING_KEY = "bono_order";

function getLocalBonos(): BonoRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(BONO_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as BonoRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocalBonos(bonos: BonoRecord[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(BONO_STORAGE_KEY, JSON.stringify(bonos));
}

export async function getBonoOrder(): Promise<string[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("cashier_settings")
      .select("value")
      .eq("key", BONO_ORDER_SETTING_KEY)
      .maybeSingle();

    if (error) {
      if (isRemotePersistenceError(error)) {
        return [];
      }
      throw error;
    }

    const value = data?.value;
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as string[];
      } catch {
        return [];
      }
    }

    return [];
  } catch {
    return [];
  }
}

export async function saveBonoOrder(order: string[]) {
  if (!supabase) return;

  const now = new Date().toISOString();

  try {
    await supabase.from("cashier_settings").upsert(
      {
        key: BONO_ORDER_SETTING_KEY,
        value: JSON.stringify(order),
        created_at: now,
        updated_at: now,
      },
      { onConflict: "key" },
    );
  } catch {
    // Ignore persistence failure and keep UI responsive.
  }
}

function getLocalSettings(): CashierSettingRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(CASHIER_SETTING_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as CashierSettingRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocalSettings(settings: CashierSettingRecord[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    CASHIER_SETTING_STORAGE_KEY,
    JSON.stringify(settings),
  );
}

function getLocalReports(): CashierReportRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(CASHIER_REPORTS_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as CashierReportRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocalReports(reports: CashierReportRecord[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    CASHIER_REPORTS_STORAGE_KEY,
    JSON.stringify(reports),
  );
}

function isRemotePersistenceError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const status =
    typeof error === "object" && error && "status" in error
      ? String((error as { status?: unknown }).status ?? "")
      : "";

  return (
    status === "404" ||
    message.toLowerCase().includes("does not exist") ||
    message.toLowerCase().includes("relation") ||
    message.toLowerCase().includes("not found")
  );
}

export type ProductRecord = {
  id: string;
  name: string;
  category: string;
  quantity_per_box: number;
  unit_price: number;
  current_boxes: number;
  min_threshold: number;
  created_at: string;
  updated_at: string;
};

export type StockMovementRecord = {
  id: string;
  product_id: string;
  movement_type: "in" | "out";
  boxes: number;
  note: string | null;
  created_at: string;
};

export type DistributionRecord = {
  id: string;
  distribution_date: string;
  bar_manager_id: string;
  grand_total: number;
  status: string;
  created_at: string;
  distribution_items?: DistributionItemRecord[];
};

export type DistributionItemRecord = {
  id: string;
  distribution_id: string;
  product_id: string;
  boxes: number;
  quantity_per_box: number;
  unit_price: number;
  total: number;
  created_at: string;
};

export async function getBonos() {
  if (!supabase) return getLocalBonos();

  try {
    const { data, error } = await supabase
      .from("cashier_bonos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (isRemotePersistenceError(error)) {
        return getLocalBonos();
      }
      throw error;
    }

    const bonos = (data ?? []) as BonoRecord[];
    saveLocalBonos(bonos);
    return bonos;
  } catch {
    return getLocalBonos();
  }
}

export async function createBono(
  bono: Omit<BonoRecord, "id" | "created_at" | "updated_at">,
) {
  const now = new Date().toISOString();
  const localBono: BonoRecord = {
    id: `local-${Date.now()}`,
    created_at: now,
    updated_at: now,
    ...bono,
  };

  if (!supabase) {
    const next = [localBono, ...getLocalBonos()];
    saveLocalBonos(next);
    return localBono;
  }

  try {
    const { data, error } = await supabase
      .from("cashier_bonos")
      .insert(bono)
      .select("*")
      .single();

    if (error) {
      if (isRemotePersistenceError(error)) {
        const next = [localBono, ...getLocalBonos()];
        saveLocalBonos(next);
        return localBono;
      }
      throw error;
    }

    const saved = data as BonoRecord;
    const next = [
      saved,
      ...getLocalBonos().filter((item) => item.id !== saved.id),
    ];
    saveLocalBonos(next);
    return saved;
  } catch {
    const next = [localBono, ...getLocalBonos()];
    saveLocalBonos(next);
    return localBono;
  }
}

export async function updateBono(
  id: string,
  updates: Partial<Omit<BonoRecord, "id" | "created_at" | "updated_at">>,
) {
  const now = new Date().toISOString();
  const existing = getLocalBonos().find((item) => item.id === id);
  const localBono: BonoRecord = {
    id,
    name: updates.name ?? existing?.name ?? "",
    quantity: updates.quantity ?? existing?.quantity ?? 0,
    price: updates.price ?? existing?.price ?? 0,
    is_active: updates.is_active ?? existing?.is_active ?? true,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  if (!supabase) {
    const next = [
      localBono,
      ...getLocalBonos().filter((item) => item.id !== id),
    ];
    saveLocalBonos(next);
    return localBono;
  }

  try {
    const { data, error } = await supabase
      .from("cashier_bonos")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (isRemotePersistenceError(error)) {
        const next = [
          localBono,
          ...getLocalBonos().filter((item) => item.id !== id),
        ];
        saveLocalBonos(next);
        return localBono;
      }
      throw error;
    }

    const saved = data as BonoRecord;
    const next = [
      saved,
      ...getLocalBonos().filter((item) => item.id !== saved.id),
    ];
    saveLocalBonos(next);
    return saved;
  } catch {
    const next = [
      localBono,
      ...getLocalBonos().filter((item) => item.id !== id),
    ];
    saveLocalBonos(next);
    return localBono;
  }
}

export async function deleteBono(id: string) {
  const current = getLocalBonos().filter((item) => item.id !== id);
  saveLocalBonos(current);

  if (!supabase) return;

  try {
    const { error } = await supabase
      .from("cashier_bonos")
      .delete()
      .eq("id", id);
    if (error && !isRemotePersistenceError(error)) {
      throw error;
    }
  } catch {
    saveLocalBonos(current);
  }
}

export async function getCashierSetting(key: string) {
  if (!supabase) {
    const setting = getLocalSettings().find((item) => item.key === key);
    return setting?.value ?? 0;
  }

  try {
    const { data, error } = await supabase
      .from("cashier_settings")
      .select("*")
      .eq("key", key)
      .order("updated_at", { ascending: false })
      .maybeSingle();

    if (error) {
      if (isRemotePersistenceError(error)) {
        const setting = getLocalSettings().find((item) => item.key === key);
        return setting?.value ?? 0;
      }
      throw error;
    }

    const value = data?.value ?? 0;
    const current = getLocalSettings();
    const next = current.filter((item) => item.key !== key);
    next.push({
      id: data?.id ?? `local-${key}`,
      key,
      value,
      created_at: data?.created_at ?? new Date().toISOString(),
      updated_at: data?.updated_at ?? new Date().toISOString(),
    });
    saveLocalSettings(next);
    return value;
  } catch {
    const setting = getLocalSettings().find((item) => item.key === key);
    return setting?.value ?? 0;
  }
}

export async function updateCashierSetting(key: string, value: number) {
  const now = new Date().toISOString();
  const localSetting: CashierSettingRecord = {
    id: `local-${key}`,
    key,
    value,
    created_at: now,
    updated_at: now,
  };

  const current = getLocalSettings().filter((item) => item.key !== key);
  current.push(localSetting);
  saveLocalSettings(current);

  if (!supabase) return localSetting;

  try {
    const { data, error } = await supabase
      .from("cashier_settings")
      .upsert(
        { key, value, created_at: now, updated_at: now },
        { onConflict: "key" },
      )
      .select("*")
      .single();

    if (error) {
      if (isRemotePersistenceError(error)) {
        return localSetting;
      }
      throw error;
    }

    const saved = data as CashierSettingRecord;
    const next = current.filter((item) => item.key !== key);
    next.push(saved);
    saveLocalSettings(next);
    return saved;
  } catch {
    return localSetting;
  }
}

export async function getCashierReports() {
  if (!supabase) return getLocalReports();

  try {
    const { data, error } = await supabase
      .from("cashier_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (isRemotePersistenceError(error)) {
        return getLocalReports();
      }
      throw error;
    }

    const reports = (data ?? []) as CashierReportRecord[];
    saveLocalReports(reports);
    return reports;
  } catch {
    return getLocalReports();
  }
}

export async function createCashierReport(
  report: Omit<CashierReportRecord, "id" | "created_at" | "updated_at">,
) {
  const now = new Date().toISOString();
  const localReport: CashierReportRecord = {
    id: `local-${Date.now()}`,
    created_at: now,
    updated_at: now,
    ...report,
  };

  if (!supabase) {
    const next = [localReport, ...getLocalReports()];
    saveLocalReports(next);
    return localReport;
  }

  try {
    const { data, error } = await supabase
      .from("cashier_reports")
      .insert(report)
      .select("*")
      .single();

    if (error) {
      if (isRemotePersistenceError(error)) {
        const next = [localReport, ...getLocalReports()];
        saveLocalReports(next);
        return localReport;
      }
      throw error;
    }

    const saved = data as CashierReportRecord;
    const next = [
      saved,
      ...getLocalReports().filter((item) => item.id !== saved.id),
    ];
    saveLocalReports(next);
    return saved;
  } catch {
    const next = [localReport, ...getLocalReports()];
    saveLocalReports(next);
    return localReport;
  }
}

export async function getProducts() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProductRecord[];
}

export async function createProduct(
  product: Omit<ProductRecord, "id" | "created_at" | "updated_at">,
) {
  if (!supabase) throw new Error("Supabase client is not configured");
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select("*")
    .single();
  if (error) throw error;
  return data as ProductRecord;
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<ProductRecord, "id" | "created_at" | "updated_at">>,
) {
  if (!supabase) throw new Error("Supabase client is not configured");
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as ProductRecord;
}

export async function deleteProduct(id: string) {
  if (!supabase) throw new Error("Supabase client is not configured");
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function createStockMovement(
  movement: Omit<StockMovementRecord, "id" | "created_at">,
) {
  if (!supabase) throw new Error("Supabase client is not configured");

  const { data: productData, error: productFetchError } = await supabase
    .from("products")
    .select("current_boxes")
    .eq("id", movement.product_id)
    .single();

  if (productFetchError) throw productFetchError;

  const currentBoxes = productData?.current_boxes ?? 0;
  const nextBoxes =
    movement.movement_type === "out"
      ? currentBoxes - movement.boxes
      : currentBoxes + movement.boxes;

  if (nextBoxes < 0) {
    throw new Error("Not enough stock available for this movement.");
  }

  const { error: productUpdateError } = await supabase
    .from("products")
    .update({
      current_boxes: nextBoxes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", movement.product_id);

  if (productUpdateError) throw productUpdateError;

  const { data, error } = await supabase
    .from("stock_movements")
    .insert(movement)
    .select("*")
    .single();
  if (error) throw error;
  return data as StockMovementRecord;
}

export async function getStockMovements() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StockMovementRecord[];
}

export async function getDistributions() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("distributions")
    .select("*, distribution_items(*)")
    .order("distribution_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DistributionRecord[];
}

export async function createDistribution(
  distribution: Omit<DistributionRecord, "id" | "created_at">,
  items: Array<
    Omit<DistributionItemRecord, "id" | "created_at" | "distribution_id">
  >,
) {
  if (!supabase) throw new Error("Supabase client is not configured");

  const { data: distData, error: distError } = await supabase
    .from("distributions")
    .insert(distribution)
    .select("*")
    .single();
  if (distError) throw distError;

  try {
    const rows = items.map((item) => ({
      ...item,
      distribution_id: distData.id,
    }));

    if (rows.length > 0) {
      const { error: itemsError } = await supabase
        .from("distribution_items")
        .insert(rows);
      if (itemsError) throw itemsError;

      for (const row of rows) {
        const { data: productData, error: productFetchError } = await supabase
          .from("products")
          .select("current_boxes")
          .eq("id", row.product_id)
          .single();

        if (productFetchError) throw productFetchError;

        const currentBoxes = productData?.current_boxes ?? 0;
        if (currentBoxes < row.boxes) {
          throw new Error("Not enough stock available for this distribution.");
        }

        const { error: productUpdateError } = await supabase
          .from("products")
          .update({
            current_boxes: currentBoxes - row.boxes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.product_id);

        if (productUpdateError) throw productUpdateError;

        const { error: movementError } = await supabase
          .from("stock_movements")
          .insert({
            product_id: row.product_id,
            movement_type: "out",
            boxes: row.boxes,
            note: `Distribution ${distData.id}`,
          });

        if (movementError) throw movementError;
      }
    }
  } catch (error) {
    await supabase.from("distributions").delete().eq("id", distData.id);
    throw error;
  }

  return distData as DistributionRecord;
}
