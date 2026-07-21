import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { order } = await request.json();
    const normalizedOrder = Array.isArray(order)
      ? order.filter(
          (value): value is string =>
            typeof value === "string" && Boolean(value),
        )
      : [];

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
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from("cashier_settings").upsert(
      {
        key: "bono_order",
        value: normalizedOrder.length,
        order_payload: normalizedOrder,
        created_at: now,
        updated_at: now,
      },
      { onConflict: "key" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("cashier_settings")
      .update({ value: normalizedOrder.length })
      .eq("key", "bono_order");

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: normalizedOrder });
  } catch {
    return NextResponse.json(
      { error: "Failed to save bono order" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
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
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("cashier_settings")
      .select("value, order_payload")
      .eq("key", "bono_order")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const storedOrder = Array.isArray(
      (data as { order_payload?: unknown } | null)?.order_payload,
    )
      ? ((data as { order_payload?: unknown } | null)
          ?.order_payload as string[])
      : [];

    return NextResponse.json({ order: storedOrder });
  } catch {
    return NextResponse.json(
      { error: "Failed to load bono order" },
      { status: 500 },
    );
  }
}
