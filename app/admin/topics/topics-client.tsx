"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

type Topic = { id: string; name: string; slug: string; description: string | null; prompt_template: string; icon: string; sort_order: number; is_active: boolean };
type FormState = { name: string; slug: string; description: string; prompt_template: string; icon: string; sort_order: number; is_active: boolean };
const emptyForm: FormState = { name: "", slug: "", description: "", prompt_template: "", icon: "🧩", sort_order: 0, is_active: true };

export function AdminTopicsClient({ email }: { email: string }) {
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => { void loadTopics(); }, []);

  async function loadTopics() {
    setLoading(true);
    const res = await fetch("/api/admin/topics", { headers: { "x-admin-email": email } });
    const data = await res.json();
    setTopics(data.topics ?? []);
    setLoading(false);
  }

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(topic: Topic) { setEditing(topic); setForm({ name: topic.name, slug: topic.slug, description: topic.description ?? "", prompt_template: topic.prompt_template, icon: topic.icon, sort_order: topic.sort_order, is_active: topic.is_active }); setOpen(true); }

  async function submit() {
    const payload = { ...form, description: form.description || null };
    const url = editing ? `/api/admin/topics/${editing.id}` : "/api/admin/topics";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json", "x-admin-email": email }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) { toast("保存失败", data.error ?? "请重试"); return; }
    toast("保存成功", editing ? "题材已更新" : "题材已新增");
    setOpen(false);
    await loadTopics();
  }

  async function toggleActive(topic: Topic, next: boolean) {
    const res = await fetch(`/api/admin/topics/${topic.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-email": email }, body: JSON.stringify({ isActive: next }) });
    const data = await res.json();
    if (!res.ok) { toast("更新失败", data.error ?? "请重试"); return; }
    toast("已更新", next ? "已启用" : "已停用");
    await loadTopics();
  }

  const content = useMemo(() => loading ? <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">加载中...</div> : (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <Table>
        <TableHeader><TableRow><TableHead>名称</TableHead><TableHead>slug</TableHead><TableHead>描述</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
        <TableBody>{topics.map((topic) => <TableRow key={topic.id}><TableCell><div className="font-medium">{topic.icon} {topic.name}</div></TableCell><TableCell>{topic.slug}</TableCell><TableCell className="max-w-lg text-white/70">{topic.description || "-"}</TableCell><TableCell><div className="flex items-center gap-3"><Switch checked={topic.is_active} onCheckedChange={(checked) => toggleActive(topic, checked)} /><span>{topic.is_active ? "启用" : "停用"}</span></div></TableCell><TableCell><Button variant="outline" size="sm" onClick={() => openEdit(topic)}>编辑</Button></TableCell></TableRow>)}</TableBody>
      </Table>
    </div>
  ), [loading, topics]);

  return (
    <AdminShell email={email} active="topics">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div><h2 className="text-2xl font-semibold">题材管理</h2><p className="mt-1 text-sm text-white/60">管理题材、prompt_template、状态开关。</p></div>
        <Button onClick={openCreate}>新增题材</Button>
      </div>
      {content}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "编辑题材" : "新增题材"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>name</Label><Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} /></div>
            <div><Label>slug</Label><Input value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} /></div>
            <div><Label>description</Label><Input value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} /></div>
            <div><Label>prompt_template</Label><Textarea value={form.prompt_template} onChange={(e) => setForm((s) => ({ ...s, prompt_template: e.target.value }))} /></div>
            <div><Label>icon</Label><Input value={form.icon} onChange={(e) => setForm((s) => ({ ...s, icon: e.target.value }))} /></div>
            <div><Label>sort_order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm((s) => ({ ...s, sort_order: Number(e.target.value) }))} /></div>
            <div className="flex items-center justify-between"><span className="text-sm text-white/80">是否启用</span><Switch checked={form.is_active} onCheckedChange={(checked) => setForm((s) => ({ ...s, is_active: checked }))} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={submit}>保存</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
