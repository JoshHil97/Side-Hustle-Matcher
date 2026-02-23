"use client";

import { useEffect, useMemo, useState } from "react";
import { APP_STATUSES } from "@/lib/constants";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useSupabase } from "@/hooks/use-supabase";
import { useUserContext } from "@/hooks/use-user-context";
import { daysBetween, statusLabel } from "@/lib/utils";
import type { Database } from "@/types/database";

type Application = Database["public"]["Tables"]["applications"]["Row"];
type StatusHistory = Database["public"]["Tables"]["status_history"]["Row"];

function BarChart({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-stone-600">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded bg-stone-200">
        <div className="h-full rounded bg-stone-600" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const supabase = useSupabase();
  const { userId, loading } = useUserContext();

  const [applications, setApplications] = useState<Application[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !userId) return;

    async function loadData() {
      setIsLoading(true);
      setError("");

      const [appsRes, historyRes] = await Promise.all([
        supabase.from("applications").select("*").order("date_applied", { ascending: false }),
        supabase.from("status_history").select("*").order("occurred_at", { ascending: true }),
      ]);

      if (appsRes.error || historyRes.error) {
        setError(appsRes.error?.message ?? historyRes.error?.message ?? "Failed to load analytics.");
      } else {
        setApplications(appsRes.data ?? []);
        setStatusHistory(historyRes.data ?? []);
      }

      setIsLoading(false);
    }

    loadData();
  }, [loading, userId, supabase]);

  const applicationsPerWeek = useMemo(() => {
    const weeks: { key: string; label: string; count: number }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i -= 1) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      const key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
      const label = weekStart.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      weeks.push({ key, label, count: 0 });
    }

    applications.forEach((application) => {
      const applied = new Date(application.date_applied).getTime();
      weeks.forEach((week, idx) => {
        const start = new Date(now);
        start.setDate(now.getDate() - (11 - idx) * 7);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 7);

        if (applied >= start.getTime() && applied < end.getTime()) {
          week.count += 1;
        }
      });
    });

    return weeks;
  }, [applications]);

  const funnelCounts = useMemo(() => {
    const counts = new Map<string, number>();
    APP_STATUSES.forEach((status) => counts.set(status, 0));

    applications.forEach((application) => {
      counts.set(application.status, (counts.get(application.status) ?? 0) + 1);
    });

    return counts;
  }, [applications]);

  const averageDaysInStage = useMemo(() => {
    const grouped = new Map<string, StatusHistory[]>();
    statusHistory.forEach((entry) => {
      const list = grouped.get(entry.application_id) ?? [];
      list.push(entry);
      grouped.set(entry.application_id, list);
    });

    const stageTotals = new Map<string, { totalDays: number; count: number }>();

    grouped.forEach((entries, applicationId) => {
      entries.sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
      const app = applications.find((item) => item.id === applicationId);

      entries.forEach((entry, idx) => {
        const next = entries[idx + 1];
        const end = next?.occurred_at ?? app?.updated_at ?? new Date().toISOString();
        const days = daysBetween(entry.occurred_at, end);

        const aggregate = stageTotals.get(entry.to_status) ?? { totalDays: 0, count: 0 };
        aggregate.totalDays += days;
        aggregate.count += 1;
        stageTotals.set(entry.to_status, aggregate);
      });
    });

    return Array.from(stageTotals.entries()).map(([status, aggregate]) => ({
      status,
      avgDays: aggregate.count ? Number((aggregate.totalDays / aggregate.count).toFixed(1)) : 0,
    }));
  }, [statusHistory, applications]);

  const responseRate = useMemo(() => {
    const applied = applications.filter((application) => application.status !== "draft").length;
    const interview = applications.filter((application) =>
      ["interview_1", "interview_2", "interview_3", "task", "offer", "accepted"].includes(application.status),
    ).length;

    return {
      applied,
      interview,
      rate: applied > 0 ? Math.round((interview / applied) * 100) : 0,
    };
  }, [applications]);

  const sourceEffectiveness = useMemo(() => {
    const sourceMap = new Map<string, { total: number; interview: number }>();

    applications.forEach((application) => {
      const source = application.source?.trim() || "Unknown";
      const current = sourceMap.get(source) ?? { total: 0, interview: 0 };
      current.total += 1;
      if (["interview_1", "interview_2", "interview_3", "task", "offer", "accepted"].includes(application.status)) {
        current.interview += 1;
      }
      sourceMap.set(source, current);
    });

    return Array.from(sourceMap.entries())
      .map(([source, metrics]) => ({
        source,
        total: metrics.total,
        interview: metrics.interview,
        rate: metrics.total > 0 ? Math.round((metrics.interview / metrics.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [applications]);

  const priorityDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    applications.forEach((application) => {
      counts.set(application.priority, (counts.get(application.priority) ?? 0) + 1);
    });

    return Array.from(counts.entries()).map(([priority, count]) => ({ priority, count }));
  }, [applications]);

  const maxWeekly = Math.max(...applicationsPerWeek.map((item) => item.count), 0);
  const maxFunnel = Math.max(...Array.from(funnelCounts.values()), 0);
  const maxSource = Math.max(...sourceEffectiveness.map((item) => item.total), 0);
  const maxPriority = Math.max(...priorityDistribution.map((item) => item.count), 0);

  if (isLoading) return <p className="text-sm text-stone-600">Loading analytics...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">Analytics dashboard</h1>

      {applications.length === 0 ? (
        <EmptyState title="No analytics yet" description="Add applications first to unlock weekly and funnel metrics." />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardTitle>Applications tracked</CardTitle>
              <p className="mt-2 text-3xl font-semibold text-stone-900">{applications.length}</p>
            </Card>
            <Card>
              <CardTitle>Interview responses</CardTitle>
              <p className="mt-2 text-3xl font-semibold text-stone-900">{responseRate.interview}</p>
            </Card>
            <Card>
              <CardTitle>Response rate</CardTitle>
              <p className="mt-2 text-3xl font-semibold text-stone-900">{responseRate.rate}%</p>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardTitle>Applications per week (last 12 weeks)</CardTitle>
              <div className="mt-4 space-y-2">
                {applicationsPerWeek.map((item) => (
                  <BarChart key={item.key} label={item.label} value={item.count} max={maxWeekly} />
                ))}
              </div>
            </Card>

            <Card>
              <CardTitle>Funnel conversion by status</CardTitle>
              <div className="mt-4 space-y-2">
                {Array.from(funnelCounts.entries()).map(([status, count]) => (
                  <BarChart key={status} label={statusLabel(status as never)} value={count} max={maxFunnel} />
                ))}
              </div>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardTitle>Average days in stage</CardTitle>
              <div className="mt-4 space-y-2">
                {averageDaysInStage.length === 0 ? (
                  <p className="text-sm text-stone-600">Not enough stage transitions to calculate yet.</p>
                ) : (
                  averageDaysInStage.map((item) => (
                    <div key={item.status} className="flex items-center justify-between rounded border border-stone-200 p-2 text-sm">
                      <span>{statusLabel(item.status as never)}</span>
                      <span className="font-medium">{item.avgDays} days</span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <CardTitle>Source effectiveness</CardTitle>
              <div className="mt-4 space-y-2">
                {sourceEffectiveness.map((item) => (
                  <div key={item.source}>
                    <BarChart label={`${item.source} (${item.rate}% response)`} value={item.total} max={maxSource} />
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <Card>
            <CardTitle>Priority distribution</CardTitle>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {priorityDistribution.map((item) => (
                <BarChart key={item.priority} label={item.priority} value={item.count} max={maxPriority} />
              ))}
            </div>
          </Card>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
