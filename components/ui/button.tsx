import * as React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" | "destructive"; size?: "default" | "sm" | "lg" };
const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:pointer-events-none disabled:opacity-50";
const variants = { default: "bg-cyan-500 text-slate-950 hover:bg-cyan-400", outline: "border border-white/10 bg-transparent hover:bg-white/5", ghost: "hover:bg-white/5", destructive: "bg-rose-500 text-white hover:bg-rose-400" };
const sizes = { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-11 rounded-md px-8" };
export function Button({ className = "", variant = "default", size = "default", ...props }: ButtonProps) { return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />; }
