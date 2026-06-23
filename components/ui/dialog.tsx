"use client";
import * as React from "react";
export function Dialog({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }) { if (!open) return null; return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => onOpenChange?.(false)}><div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>{children}</div></div>; }
export const DialogContent = ({ children }: { children: React.ReactNode }) => <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">{children}</div>;
export const DialogHeader = ({ children }: { children: React.ReactNode }) => <div className="mb-4">{children}</div>;
export const DialogTitle = ({ children }: { children: React.ReactNode }) => <h2 className="text-xl font-semibold text-white">{children}</h2>;
