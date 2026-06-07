import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ListPaginationProps = {
  basePath: string;
  page: number;
  totalPages: number;
  query?: Record<string, string | undefined>;
  className?: string;
};

function buildHref(basePath: string, page: number, query?: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function ListPagination({ basePath, page, totalPages, query, className }: ListPaginationProps) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav
      className={cn("flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3", className)}
      aria-label="分页"
    >
      <div className="text-sm text-slate-400">
        第 {page} / {totalPages} 页
      </div>
      <div className="flex gap-2">
        {prev ? (
          <Button variant="secondary" size="sm" asChild>
            <Link href={buildHref(basePath, prev, query)}>
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Link>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
        )}
        {next ? (
          <Button variant="secondary" size="sm" asChild>
            <Link href={buildHref(basePath, next, query)}>
              下一页
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </nav>
  );
}
