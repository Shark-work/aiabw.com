import type { ReactNode } from "react";

type PolicyShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function PolicyShell({ title, subtitle, children, footer }: PolicyShellProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <h1 className="text-4xl font-semibold text-white">{title}</h1>
        {subtitle ? <p className="mt-4 text-sm text-slate-400">{subtitle}</p> : null}
      </section>
      {children}
      {footer ? <div className="text-center text-sm text-slate-500">{footer}</div> : null}
    </div>
  );
}
