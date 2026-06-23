"use client";
import * as React from "react";
type Toast = { id: string; title: string; description?: string };
const ToastContext = React.createContext<{ toast: (title: string, description?: string) => void } | null>(null);
export function ToastProvider({ children }: { children: React.ReactNode }) { const [items, setItems] = React.useState<Toast[]>([]); const toast = React.useCallback((title: string, description?: string) => { const id = crypto.randomUUID(); setItems((c) => [...c, { id, title, description }]); setTimeout(() => setItems((c) => c.filter((i) => i.id !== id)), 2800); }, []); return <ToastContext.Provider value={{ toast }}>{children}<div className="fixed right-4 top-4 z-[100] space-y-3">{items.map((item) => <div key={item.id} className="w-80 rounded-xl border border-white/10 bg-slate-900 p-4 shadow-xl"><div className="font-medium text-white">{item.title}</div>{item.description ? <div className="mt-1 text-sm text-white/70">{item.description}</div> : null}</div>)}</div></ToastContext.Provider>; }
export function useToast() { const ctx = React.useContext(ToastContext); if (!ctx) throw new Error("useToast must be used within ToastProvider"); return ctx; }
