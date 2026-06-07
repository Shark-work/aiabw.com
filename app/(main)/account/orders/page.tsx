import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, ExternalLink, Receipt, ShoppingBag } from "lucide-react";
import { ListPagination } from "@/components/ui/list-pagination";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ORDERS_PAGE_SIZE, pageOffset, parsePageParam, totalPages } from "@/lib/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  pending: "待支付",
  confirming: "确认中",
  confirmed: "已确认",
  finished: "已完成",
  failed: "失败",
  refunded: "已退款",
  expired: "已过期",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-200",
  confirming: "text-cyan-200",
  confirmed: "text-emerald-200",
  finished: "text-emerald-200",
  failed: "text-red-200",
  refunded: "text-slate-400",
  expired: "text-slate-400",
};

type PageProps = {
  searchParams: Promise<{ page?: string; tab?: string }>;
};

export default async function OrdersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const tab = sp.tab === "transactions" ? "transactions" : "owned";

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    redirect("/auth/login");
  }

  const { from, to } = pageOffset(page, ORDERS_PAGE_SIZE);

  if (tab === "owned") {
    const { count } = await supabase
      .from("user_agents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const total = count ?? 0;
    const pages = totalPages(total, ORDERS_PAGE_SIZE);

    const { data: ownedRows, error } = await supabase
      .from("user_agents")
      .select("id, agent_id, purchased_at")
      .eq("user_id", user.id)
      .order("purchased_at", { ascending: false })
      .range(from, to);

    const ownedAgentIds = (ownedRows ?? []).map((r) => r.agent_id);
    let ownedAgentMap: Record<string, { slug: string; name: string; description: string }> = {};

    if (ownedAgentIds.length > 0) {
      const { data: agents } = await supabase
        .from("agents")
        .select("id, slug, name, description")
        .in("id", ownedAgentIds);
      ownedAgentMap = Object.fromEntries((agents ?? []).map((a) => [a.id, a]));
    }

    return (
      <OrdersLayout tab={tab} page={page} pages={pages}>
        {error ? (
          <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{error.message}</div>
        ) : null}

        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-medium text-white">
            <ShoppingBag className="h-5 w-5 text-cyan-300" />
            已购买的 Agent
          </h2>
          {(ownedRows ?? []).length === 0 ? (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="py-12 text-center text-slate-400">
                还没有购买任何 Agent。
                <Link href="/explore" className="ml-2 text-cyan-300 underline">
                  去探索广场
                </Link>
              </CardContent>
            </Card>
          ) : (
            (ownedRows ?? []).map((row) => {
              const agent = ownedAgentMap[row.agent_id];
              if (!agent) return null;

              return (
                <Card key={row.id} className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      永久解锁
                    </CardDescription>
                    <CardTitle className="text-white">{agent.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-300 line-clamp-2">{agent.description}</p>
                    <div className="text-xs text-slate-500">
                      购买于 {new Date(row.purchased_at).toLocaleString("zh-CN")}
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/agents/${agent.slug}`}>进入 Agent</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </section>

        <ListPagination basePath="/account/orders" page={page} totalPages={pages} query={{ tab: "owned" }} />
      </OrdersLayout>
    );
  }

  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const total = count ?? 0;
  const pages = totalPages(total, ORDERS_PAGE_SIZE);

  const { data: orders, error } = await supabase
    .from("transactions")
    .select(
      "id, order_id, order_type, plan_slug, payment_status, price_amount, price_currency, invoice_url, order_description, created_at, agent_id"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const agentIds = (orders ?? []).map((o) => o.agent_id).filter(Boolean) as string[];
  let agentNames: Record<string, string> = {};

  if (agentIds.length > 0) {
    const { data: agents } = await supabase.from("agents").select("id, name").in("id", agentIds);
    agentNames = Object.fromEntries((agents ?? []).map((a) => [a.id, a.name]));
  }

  return (
    <OrdersLayout tab={tab} page={page} pages={pages}>
      {error ? (
        <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{error.message}</div>
      ) : null}

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-medium text-white">
          <Receipt className="h-5 w-5 text-cyan-300" />
          支付订单
        </h2>
        {(orders ?? []).length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="py-12 text-center text-slate-400">
              暂无订单。
              <Link href="/pro" className="ml-2 text-cyan-300 underline">
                去看看 Pro 订阅
              </Link>
            </CardContent>
          </Card>
        ) : (
          (orders ?? []).map((order) => {
            const typeLabel = order.order_type === "agent" ? "Agent 购买" : "Pro 订阅";
            const productLabel =
              order.order_type === "agent" && order.agent_id
                ? agentNames[order.agent_id] ?? order.plan_slug
                : order.plan_slug;

            return (
              <Card key={order.id} className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardDescription>{typeLabel}</CardDescription>
                  <CardTitle className="text-white">{order.order_description ?? productLabel}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                    <div>
                      状态：
                      <span className={STATUS_COLORS[order.payment_status] ?? "text-white"}>
                        {STATUS_LABELS[order.payment_status] ?? order.payment_status}
                      </span>
                    </div>
                    <div>
                      金额：{order.price_amount} {order.price_currency}
                    </div>
                    <div className="text-slate-500">{new Date(order.created_at).toLocaleString("zh-CN")}</div>
                  </div>
                  <div className="text-xs text-slate-500">订单号：{order.order_id}</div>
                  {order.invoice_url && order.payment_status === "pending" ? (
                    <Button size="sm" asChild>
                      <a href={order.invoice_url} target="_blank" rel="noopener noreferrer">
                        继续支付 <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  ) : null}
                  {order.order_type === "agent" && isTerminalOrderSuccess(order.payment_status) ? (
                    <Button size="sm" variant="secondary" asChild>
                      <Link href={`/agents/${order.plan_slug}`}>进入 Agent</Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      <ListPagination basePath="/account/orders" page={page} totalPages={pages} query={{ tab: "transactions" }} />
    </OrdersLayout>
  );
}

function isTerminalOrderSuccess(status: string) {
  return status === "finished" || status === "confirmed";
}

function OrdersLayout({
  tab,
  page,
  pages,
  children,
}: {
  tab: string;
  page: number;
  pages: number;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
          <Receipt className="h-4 w-4" />
          我的订单
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-white">订单与资产</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          已购买的 Agent 永久绑定账户；支付记录由 NOWPayments 实时同步。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant={tab === "owned" ? "default" : "secondary"} asChild>
            <Link href="/account/orders?tab=owned">已购 Agent</Link>
          </Button>
          <Button variant={tab === "transactions" ? "default" : "secondary"} asChild>
            <Link href="/account/orders?tab=transactions">支付记录</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/account">返回个人中心</Link>
          </Button>
        </div>
      </section>

      {children}
    </div>
  );
}
