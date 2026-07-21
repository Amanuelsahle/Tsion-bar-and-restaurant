"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function saveBonoOrderServer(order: string[]) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
      "https://vcmwsytirwrncumosbkl.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Authentication required to save bono order.");
  }

  const now = new Date().toISOString();
  const normalizedOrder = order.filter(Boolean);

  const { error } = await supabase.from("cashier_settings").upsert(
    {
      key: "bono_order",
      value: 0,
      created_at: now,
      updated_at: now,
    },
    { onConflict: "key" },
  );

  const { error: updateError } = await supabase
    .from("cashier_settings")
    .update({ value: 0 })
    .eq("key", "bono_order");

  if (updateError) {
    throw updateError;
  }

  if (error) {
    throw error;
  }

  return normalizedOrder;
}
