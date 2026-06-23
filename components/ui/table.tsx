import * as React from "react";

export function Table({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <table className={`w-full border-collapse text-left text-sm ${className}`}>{children}</table>;
}
export const TableHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <thead className={`border-b border-white/10 text-white/60 ${className}`}>{children}</thead>;
export const TableBody = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <tbody className={className}>{children}</tbody>;
export const TableRow = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <tr className={`border-b border-white/10 last:border-0 ${className}`}>{children}</tr>;
export const TableHead = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>;
export const TableCell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
