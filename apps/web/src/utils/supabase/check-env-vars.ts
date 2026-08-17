export const hasEnvVars = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.trim().length > 0 &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim().length > 0 &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project")
);
