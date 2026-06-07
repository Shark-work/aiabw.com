import { cn } from "@/lib/utils";

type AdminStatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "cyan" | "violet" | "emerald" | "amber";
};

const accents = {
  cyan: "from-cyan-400/15 to-cyan-500/5 border-cyan-300/20 text-cyan-100",
  violet: "from-violet-400/15 to-violet-500/5 border-violet-300/20 text-violet-100",
  emerald: "from-emerald-400/15 to-emerald-500/5 border-emerald-300/20 text-emerald-100",
  amber: "from-amber-400/15 to-amber-500/5 border-amber-300/20 text-amber-100",
};

export function AdminStatCard({ label, value, hint, accent = "cyan" }: AdminStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br p-5 shadow-lg",
        accents[accent]
      )}
    >
      <div className="text-xs uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs opacity-60">{hint}</div> : null}
    </div>
  );
}
