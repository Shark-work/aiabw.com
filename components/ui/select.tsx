import * as React from "react";
export function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select className={`h-10 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${className}`} {...props} />; }
export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) { return <option value={value}>{children}</option>; }
