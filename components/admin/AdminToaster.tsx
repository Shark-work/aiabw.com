"use client";

import { Toaster } from "sonner";

export function AdminToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast: "border border-white/10 bg-slate-900 text-white",
        },
      }}
    />
  );
}
