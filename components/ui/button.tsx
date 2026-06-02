import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost" | "outline";
type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(0,245,255,0.25)] hover:bg-cyan-200",
  secondary:
    "border border-white/10 bg-white/5 text-white hover:border-cyan-300/30 hover:bg-cyan-400/10",
  ghost: "text-slate-200 hover:bg-white/5 hover:text-white",
  outline:
    "border border-cyan-300/20 bg-transparent text-cyan-100 hover:bg-cyan-400/10 hover:border-cyan-300/40",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-11 px-5 py-2",
  sm: "h-9 rounded-full px-4",
  lg: "h-12 rounded-full px-7 text-base",
  icon: "h-11 w-11",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild = false, variant = "default", size = "default", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
