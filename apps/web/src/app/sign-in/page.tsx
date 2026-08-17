"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <div className="min-h-screen w-screen bg-background text-on-surface flex flex-col justify-between p-6 select-none relative overflow-hidden font-body-lg">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[250px] bg-status-success/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between z-10">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span
              className="material-symbols-outlined text-on-primary-container text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              radar
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-headline-md text-headline-md font-bold text-primary tracking-tighter uppercase">
                NAVI-FLOW
              </span>
              <span className="font-data-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                NAGPUR
              </span>
            </div>
            <p className="font-body-sm text-[11px] text-on-surface-variant">
              Traffic Intelligence &amp; Decision Support
            </p>
          </div>
        </Link>
        <Link
          href="/"
          className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
        >
          Skip to Command Center &rarr;
        </Link>
      </header>

      {/* Center Auth Card */}
      <main className="flex items-center justify-center my-auto z-10">
        <div className="w-full max-w-md bg-surface-elevated rounded-xl p-8 border border-grid-line shadow-2xl space-y-6 animate-scale-in">
          {/* Badge & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-label-caps text-label-caps uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">shield</span>
              <span>Operations Access Control</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
              Operator Sign In
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {hasEnvVars
                ? "Authenticate with your municipal traffic control credentials."
                : "Evaluation environment active. Full functionality available without login."}
            </p>
          </div>

          {/* Quick Demo Operator Button (Always Available) */}
          <button
            onClick={handleDemoLogin}
            type="button"
            className="w-full py-3.5 px-4 rounded-lg bg-primary hover:bg-primary-fixed text-on-primary font-bold font-body-sm text-body-sm shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span>Continue as Demo Operator</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px bg-grid-line flex-1" />
            <span className="font-data-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
              {hasEnvVars ? "Or Sign In with Supabase" : "Operator Mode"}
            </span>
            <div className="h-px bg-grid-line flex-1" />
          </div>

          {hasEnvVars ? (
            <form onSubmit={handleSignIn} className="space-y-4 font-body-sm text-body-sm">
              {errorMsg && (
                <div className="p-3 rounded bg-status-critical/10 border border-status-critical/30 text-status-critical flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded bg-status-success/10 border border-status-success/30 text-status-success flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Operator Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="operator@nagpur-traffic.gov.in"
                  className="w-full bg-surface border border-outline-variant rounded px-3.5 py-2.5 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-surface border border-outline-variant rounded px-3.5 py-2.5 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded bg-surface-container-high hover:bg-surface-variant text-on-surface font-bold border border-grid-line transition-colors flex items-center justify-center gap-2"
              >
                {loading ? "Authenticating..." : "Sign In to Operations Console"}
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-lg bg-surface border border-grid-line text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-status-success/10 text-status-success flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </div>
              <p className="font-body-sm text-body-sm font-bold text-on-surface">
                Zero-Configuration Demo Environment
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                All algorithms (BPR congestion, OR-Tools police dispatch, BPR route scoring, and What-If simulation) run deterministically without requiring external database accounts.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="flex items-center justify-between font-data-mono text-data-mono text-on-surface-variant z-10">
        <span>Vikasit Nagpur 2026 • Manthan4Yuva</span>
        <span>Deterministic Traffic Optimization &bull; Zero PII</span>
      </footer>
    </div>
  );
}
