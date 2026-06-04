import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AgentNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 py-20 text-center">
      <h1 className="text-3xl font-semibold text-white">Agent 不存在</h1>
      <p className="text-slate-400">该 Agent 可能已下架或链接有误。</p>
      <Button asChild>
        <Link href="/explore">返回探索广场</Link>
      </Button>
    </div>
  );
}
