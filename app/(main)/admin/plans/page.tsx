import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function AdminPlansPage() {
  const supabase = await createSupabaseServerClient();
  const { data: plans, error } = await supabase
    .from("subscription_plans")
    .select("slug, name, description, interval, price_cents, currency, sort_order")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-8">
      <section className="neon-card rounded-[2rem] p-8 lg:p-10">
        <h1 className="text-4xl font-semibold text-white">套餐管理</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          这里已经开始直接读取 Supabase 的 `subscription_plans`，后续可以继续扩展为新增、编辑、下架。
        </p>
      </section>

      {error ? <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{error.message}</div> : null}

      <section className="grid gap-5 lg:grid-cols-3">
        {(plans ?? []).map((plan) => (
          <Card key={plan.slug} className="border-white/10 bg-white/5">
            <CardHeader>
              <CardDescription>{plan.description ?? "无描述"}</CardDescription>
              <CardTitle className="text-white">{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <div>Slug: {plan.slug}</div>
              <div>Price: {(plan.price_cents ?? 0) / 100} {plan.currency}</div>
              <div>Interval: {plan.interval}</div>
              <div>Sort: {plan.sort_order}</div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
