import * as React from "react";
export function Table({ children }: { children: React.ReactNode }) { return <table className="w-full border-collapse text-left text-sm">{children}</table>; }
export const TableHeader = ({ children }: { children: React.ReactNode }) => <thead className="border-b border-white/10 text-white/60">{children}</thead>;
export const TableBody = ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>;
export const TableRow = ({ children }: { children: React.ReactNode }) => <tr className="border-b border-white/10 last:border-0">{children}</tr>;
export const TableHead = ({ children }: { children: React.ReactNode }) => <th className="px-4 py-3 font-medium">{children}</th>;
export const TableCell = ({ children }: { children: React.ReactNode }) => <td className="px-4 py-3 align-top">{children}</td>;
