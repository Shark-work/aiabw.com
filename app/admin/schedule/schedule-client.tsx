"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

type Topic = { id: string; name: string; slug: string; icon: string; is_active: boolean };
type ScheduleRow = { day_of_week: number; topic_id: string | null };
const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export function AdminScheduleClient({ email }: { email: string }) {
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    const [topicsRes, scheduleRes] = await Promise.all([
      fetch("/api/admin/topics?active=true", { headers: { "x-admin-email": email } }),
      fetch("/api/admin/schedule", { headers: { "x-admin-email": email } }),
    ]);
    const topicsData = await topicsRes.json();
    const scheduleData = await scheduleRes.json();
    setTopics(topicsData.topics ?? []);
    setSchedule(scheduleData.schedule ?? []);
  }

  async function save(dayOfWeek: number, topicId: string | null) {
    const res = await fetch("/api/admin/schedule", { method: "PUT", headers: { "Content-Type": "application/json", "x-admin-email": email }, body: JSON.stringify({ dayOfWeek, topicId }) });
    const data = await res.json();
    if (!res.ok) { toast("保存失败", data.error ?? "请重试"); return; }
    toast("已保存");
    setSchedule((current) => current.map((row) => row.day_of_week === dayOfWeek ? { ...row, topic_id: topicId } : row));
  }

  async function publishTodayDraft() {
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/quests/publish", { method: "PUT", headers: { "x-admin-email": email } });
      const data = await res.json();
      if (!res.ok) {
        toast("发布失败", data.error ?? data.message ?? "请重试");
        return;
      }
      toast("发布结果", data.published ? "今日草稿已发布" : data.message ?? "已处理");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <AdminShell email={email} active="schedule">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">排期管理</h2>
          <p className="mt-1 text-sm text-white/60">周一至周日从活跃题材中选择对应题材并自动保存。</p>
        </div>
        <Button onClick={publishTodayDraft} disabled={publishing}>
          {publishing ? "发布中..." : "发布今日草稿"}
        </Button>
      </div>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        {days.map((day, index) => {
          const dayOfWeek = index + 1;
          const current = schedule.find((row) => row.day_of_week === dayOfWeek)?.topic_id ?? "";
          return (
            <div key={day} className="grid gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 md:grid-cols-[120px_1fr] md:items-center">
              <div className="font-medium">{day}</div>
              <Select value={current} onChange={(e) => void save(dayOfWeek, e.target.value || null)}>
                <option value="">未设置</option>
                {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.icon} {topic.name}</option>)}
              </Select>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
