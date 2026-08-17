import { createBrowserClient } from "@supabase/ssr";
import { hasEnvVars } from "./check-env-vars";

export const createClient = () => {
  if (!hasEnvVars) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: new Error("Auth unavailable in demo mode") }),
        signUp: async () => ({ error: new Error("Auth unavailable in demo mode") }),
        signOut: async () => ({ error: null }),
      },
      isDemoMode: true,
    } as any;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
