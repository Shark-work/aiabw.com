import * as React from "react";

export function Switch({ checked, onCheckedChange, ...props }: { checked?: boolean; onCheckedChange?: (checked: boolean) => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onCheckedChange?.(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-cyan-500" : "bg-white/20"}`} {...props}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-1"}`} />
    </button>
  );
}
