import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function AdminTransactionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("transactions")
    .select("order_id, plan_slug, payment_status, price_amount, price_currency, provider_payment_id, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <h1 className="text-4xl font-semibold text-white">交易管理</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          这里直接查看最新 20 条交易，后续可扩展筛选、搜索、导出和联动订阅记录。
        </p>
      </section>

      {error ? <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{error.message}</div> : null}

      <section className="space-y-4">
        {(rows ?? []).map((row) => (
          <Card key={row.order_id} className="border-white/10 bg-white/5">
            <CardHeader>
              <CardDescription>{row.payment_status}</CardDescription>
              <CardTitle className="text-white">{row.order_id}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6 text-sm text-slate-300">
              <div>Plan: {row.plan_slug}</div>
              <div>Amount: {row.price_amount} {row.price_currency}</div>
              <div>Provider Payment ID: {row.provider_payment_id ?? "-"}</div>
              <div>Created: {row.created_at}</div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
