import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#070a0f] text-slate-100 p-4 select-none">
      <div className="p-8 rounded-2xl glass-raised border border-border-subtle text-center space-y-4 max-w-md">
        <h2 className="text-xl font-black text-white">404 — Corridor Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested route or corridor state does not exist in the active Nagpur spatial graph.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-xl bg-accent-blue text-slate-950 font-bold text-xs shadow-glow-blue transition-all"
        >
          Return to Command Center
        </Link>
      </div>
    </div>
  );
}
