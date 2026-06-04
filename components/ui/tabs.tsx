import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-4", className)} {...props} />;
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("inline-flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-1", className)}
      {...props}
    />
  );
}

type TabProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean };

export function TabsTrigger({ className, active, ...props }: TabProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-xl px-4 py-2 text-sm transition",
        active
          ? "bg-gradient-to-r from-cyan-400/20 to-violet-400/20 text-white shadow-[0_0_20px_rgba(0,245,255,0.1)]"
          : "text-slate-400 hover:bg-white/5 hover:text-white",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-2", className)} {...props} />;
}
