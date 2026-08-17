"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { createClient } from "@/utils/supabase/client";
import { Shield, User, LogOut } from "lucide-react";

export default function AuthButton() {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    if (!hasEnvVars) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: any) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  if (!hasEnvVars) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-white/10 text-xs font-mono select-none" title="Supabase authentication is optional. Running in demo mode.">
        <Shield className="w-3.5 h-3.5 text-sky-400" />
        <span>Demo Operator</span>
      </div>
    );
  }

  return user ? (
    <div className="flex items-center gap-2.5 text-xs select-none">
      <span className="text-slate-300 flex items-center gap-1 font-medium">
        <User className="w-3.5 h-3.5 text-sky-400" />
        {user.email}
      </span>
      <button
        onClick={async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          setUser(null);
        }}
        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 transition"
      >
        <LogOut className="w-3 h-3" />
        Sign Out
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-1.5 text-xs select-none">
      <Link
        href="/sign-in"
        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition"
      >
        Sign In
      </Link>
    </div>
  );
}
