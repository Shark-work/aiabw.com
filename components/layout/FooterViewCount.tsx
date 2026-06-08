"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

export function FooterViewCount() {
  const [formatted, setFormatted] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/stats/view", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { formatted?: string; total?: number }) => {
        if (json.formatted) setFormatted(json.formatted);
        else if (typeof json.total === "number") setFormatted(String(json.total));
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
      <Eye className="h-3.5 w-3.5 text-cyan-400/70" />
      {formatted ? <>全站访问 {formatted} 次</> : failed ? <>全站访问统计暂不可用</> : <>全站访问统计加载中…</>}
    </div>
  );
}
