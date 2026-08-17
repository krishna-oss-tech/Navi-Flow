import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasEnvVars } from "./check-env-vars";

export const createClient = async () => {
  if (!hasEnvVars) {
    // Return a safe mock client for demo / offline operation without throwing
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({
          data: [],
          error: null,
          eq: () => ({ data: [], error: null }),
          single: () => ({ data: null, error: null }),
        }),
      }),
      isDemoMode: true,
    } as any;
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
};
