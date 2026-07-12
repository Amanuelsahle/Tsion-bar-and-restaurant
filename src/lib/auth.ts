import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function getUserSession() {
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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method is called during response handling; ignore if not available.
          }
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}
