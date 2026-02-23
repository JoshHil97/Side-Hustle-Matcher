"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TokenField } from "@/components/auth/token-field";
import { formatDate, formatDateTime, statusClass, statusLabel } from "@/lib/utils";
import { useSupabase } from "@/hooks/use-supabase";
import { useUserContext } from "@/hooks/use-user-context";
import type { Database } from "@/types/database";
import { updateReminderStatusFormAction } from "@/server/actions";


type Application = Database["public"]["Tables"]["applications"]["Row"];
type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
type Activity = Database["public"]["Tables"]["activity_log"]["Row"];

function ReminderActionForm({ reminderId, applicationId, status, label }: { reminderId: string; applicationId: string; status: "done" | "dismissed"; label: string }) {
  return (
    <form action={updateReminderStatusFormAction}>
      <TokenField />
      <input type="hidden" name="reminder_id" value={reminderId} />
      <input type="hidden" name="application_id" value={applicationId} />
      <input type="hidden" name="status" value={status} />
      <Button size="sm" variant="secondary" type="submit">
        {label}
      </Button>
    </form>
  );
}

export default function DashboardOverviewPage() {
  const supabase = useSupabase();
  const { userId, loading } = useUserContext();

  const [applications, setApplications] = useState<Application[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [fetchError, setFetchError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading || !userId) return;

    async function loadOverview() {
      setIsLoading(true);
      setFetchError("");

      const [applicationsRes, remindersRes, activityRes] = await Promise.all([
        supabase
          .from("applications")
          .select("*")
          .order("date_applied", { ascending: false })
          .limit(150),
        supabase
          .from("reminders")
          .select("*")
          .eq("status", "open")
          .order("due_at", { ascending: true })
          .limit(8),
        supabase
          .from("activity_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

      if (applicationsRes.error || remindersRes.error || activityRes.error) {
        setFetchError(
          applicationsRes.error?.message ?? remindersRes.error?.message ?? activityRes.error?.message ?? "Could not load dashboard.",
        );
      } else {
        setApplications(applicationsRes.data ?? []);
        setReminders(remindersRes.data ?? []);
        setActivity(activityRes.data ?? []);
      }

      setIsLoading(false);
    }

    loadOverview();
  }, [loading, userId, supabase]);

  const pipelineCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const app of applications) {
      counts.set(app.status, (counts.get(app.status) ?? 0) + 1);
    }
    return counts;
  }, [applications]);

  const needsFollowUp = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    return applications.filter((app) => {
      if (!(app.status === "applied" || app.status === "screening")) return false;
      if (app.next_step_date) return false;
      const appliedAt = new Date(app.date_applied);
      return appliedAt < cutoff;
    });
  }, [applications]);

  const interviewCount = applications.filter((app) =>
    ["interview_1", "interview_2", "interview_3", "offer", "accepted"].includes(app.status),
  ).length;
  const appliedCount = applications.filter((app) => app.status !== "draft").length;
  const responseRate = appliedCount > 0 ? Math.round((interviewCount / appliedCount) * 100) : 0;

  if (isLoading) {
    return <p className="text-sm text-stone-600">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardTitle>Total applications</CardTitle>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{applications.length}</p>
        </Card>
        <Card>
          <CardTitle>Response rate</CardTitle>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{responseRate}%</p>
          <p className="mt-1 text-xs text-stone-500">Interview-stage / applied</p>
        </Card>
        <Card>
          <CardTitle>Upcoming reminders</CardTitle>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{reminders.length}</p>
        </Card>
        <Card>
          <CardTitle>Needs follow-up</CardTitle>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{needsFollowUp.length}</p>
          <p className="mt-1 text-xs text-stone-500">Applied/screening without next step after 7 days</p>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Pipeline summary</CardTitle>
            <Link href="/dashboard/applications/new">
              <Button size="sm">Quick add application</Button>
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from(pipelineCounts.entries()).map(([status, count]) => (
              <div key={status} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                <Badge className={statusClass(status as never)}>{statusLabel(status as never)}</Badge>
                <p className="mt-2 text-2xl font-semibold text-stone-900">{count}</p>
              </div>
            ))}
          </div>

          {pipelineCounts.size === 0 && (
            <EmptyState
              title="No applications yet"
              description="Create your first application to see pipeline insights and reminders."
            />
          )}
        </Card>

        <Card>
          <CardTitle>Upcoming reminders</CardTitle>
          <div className="mt-4 space-y-3">
            {reminders.length === 0 ? (
              <p className="text-sm text-stone-600">No open reminders.</p>
            ) : (
              reminders.map((reminder) => (
                <div key={reminder.id} className="rounded-lg border border-stone-200 p-3">
                  <p className="text-sm font-medium text-stone-900">{reminder.title}</p>
                  <p className="mt-1 text-xs text-stone-600">Due {formatDateTime(reminder.due_at)}</p>
                  <div className="mt-3 flex gap-2">
                    <ReminderActionForm
                      reminderId={reminder.id}
                      applicationId={reminder.application_id}
                      status="done"
                      label="Mark done"
                    />
                    <ReminderActionForm
                      reminderId={reminder.id}
                      applicationId={reminder.application_id}
                      status="dismissed"
                      label="Dismiss"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>Applications needing follow-up</CardTitle>
          <div className="mt-4 space-y-3">
            {needsFollowUp.length === 0 ? (
              <p className="text-sm text-stone-600">No stale applications. Great momentum.</p>
            ) : (
              needsFollowUp.slice(0, 8).map((app) => (
                <Link
                  key={app.id}
                  href={`/dashboard/applications/${app.id}`}
                  className="block rounded-lg border border-stone-200 p-3 hover:border-stone-300"
                >
                  <p className="text-sm font-medium text-stone-900">{app.company_name} · {app.role_title}</p>
                  <p className="mt-1 text-xs text-stone-600">Applied {formatDate(app.date_applied)}</p>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Recent activity</CardTitle>
          <div className="mt-4 space-y-3">
            {activity.length === 0 ? (
              <p className="text-sm text-stone-600">No activity yet.</p>
            ) : (
              activity.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-stone-200 p-3">
                  <p className="text-sm text-stone-900">
                    <span className="font-medium">{entry.entity_type}</span> · {entry.action}
                  </p>
                  <p className="mt-1 text-xs text-stone-600">{formatDateTime(entry.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {fetchError && <p className="text-sm text-red-600">{fetchError}</p>}
    </div>
  );
}
