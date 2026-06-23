import * as React from "react";

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white placeholder:text-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${className}`} {...props} />;
}
