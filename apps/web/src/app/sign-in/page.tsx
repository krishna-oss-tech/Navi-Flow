"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { createClient } from "@/utils/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDemoLogin = () => {
    router.push("/");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEnvVars) {
      router.push("/");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("Authentication successful! Loading Command Center...");
        setTimeout(() => router.push("/"), 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#070a0f] text-slate-100 flex flex-col justify-between p-6 select-none relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-accent-blue/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[250px] bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center text-accent-blue font-black shadow-glow-blue">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wider text-white">NAVI-FLOW</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">NAGPUR</span>
            </div>
            <p className="text-[10px] text-slate-500">Traffic Intelligence &amp; Decision Support</p>
          </div>
        </Link>
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
        >
          Skip to Command Center &rarr;
        </Link>
      </header>

      {/* Center Auth Card */}
      <main className="flex items-center justify-center my-auto z-10">
        <div className="w-full max-w-md glass-accent rounded-3xl p-8 border border-border-subtle shadow-2xl space-y-6 animate-scale-in">
          {/* Badge & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-blue/15 border border-accent-blue/30 text-accent-blue text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Operations Access Control</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Operator Sign In</h1>
            <p className="text-xs text-slate-400">
              {hasEnvVars
                ? "Authenticate with your municipal traffic control credentials."
                : "Evaluation environment active. Full functionality available without login."}
            </p>
          </div>

          {/* Quick Demo Operator Button (Always Available) */}
          <button
            onClick={handleDemoLogin}
            type="button"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-accent-blue to-sky-400 hover:from-sky-400 hover:to-accent-blue text-slate-950 font-bold text-xs shadow-glow-blue flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Continue as Demo Operator</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
              {hasEnvVars ? "Or Sign In with Supabase" : "Operator Mode"}
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {hasEnvVars ? (
            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] font-medium">Operator Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="operator@nagpur-traffic.gov.in"
                    className="w-full bg-surface-overlay border border-border rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-accent-blue transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] font-medium">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-surface-overlay border border-border rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-accent-blue transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-surface-raised hover:bg-slate-700 text-white font-semibold border border-white/10 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? "Authenticating..." : "Sign In to Operations Console"}
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-surface/60 border border-border-subtle text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-200">Zero-Configuration Demo Environment</p>
              <p className="text-[11px] text-slate-400">
                All algorithms (BPR congestion, OR-Tools police dispatch, BPR route scoring, and What-If simulation) run deterministically without requiring external database accounts.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="flex items-center justify-between text-[11px] text-slate-500 z-10">
        <span>Vikasit Nagpur 2026 • Manthan4Yuva</span>
        <span>Deterministic Traffic Optimization &bull; Zero PII</span>
      </footer>
    </div>
  );
}
