import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
};

export function AdminPageHeader({ title, description, className, actions }: AdminPageHeaderProps) {
  return (
    <section className={cn("neon-card rounded-[2rem] p-6 lg:p-8", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
            Admin Ops
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-white lg:text-4xl">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm text-slate-300 lg:text-base">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
