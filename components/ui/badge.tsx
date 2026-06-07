import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "danger" | "violet";
};

const variants = {
  default: "border-white/15 bg-white/10 text-slate-200",
  success: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  warning: "border-amber-300/30 bg-amber-400/10 text-amber-100",
  danger: "border-red-300/30 bg-red-400/10 text-red-100",
  violet: "border-violet-300/30 bg-violet-400/10 text-violet-100",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
