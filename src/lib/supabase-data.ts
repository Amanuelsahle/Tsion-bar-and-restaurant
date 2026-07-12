import { supabase } from "./supabase";

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
