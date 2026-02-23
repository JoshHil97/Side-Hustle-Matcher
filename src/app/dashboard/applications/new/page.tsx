"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_STATUSES, PRIORITIES, WORK_MODES } from "@/lib/constants";
import { createApplicationAction } from "@/server/actions";
import type { ActionState } from "@/server/actions";
import { useSupabase } from "@/hooks/use-supabase";
import { useUserContext } from "@/hooks/use-user-context";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ActionMessage } from "@/components/ui/action-message";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/field";
import { TokenField } from "@/components/auth/token-field";
import { statusLabel, todayPlusDays } from "@/lib/utils";
import type { Database } from "@/types/database";

type Company = Database["public"]["Tables"]["companies"]["Row"];

const createInitialState: ActionState<{ id: string }> = { status: "idle" };

export default function NewApplicationPage() {
  const supabase = useSupabase();
  const { userId, loading } = useUserContext();
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [state, action, pending] = useActionState(createApplicationAction, createInitialState);

  useEffect(() => {
    const createdId = (state.data as { id?: string } | undefined)?.id;
    if (state.status === "success" && createdId) {
      router.replace(`/dashboard/applications/${createdId}`);
    }
  }, [state, router]);

  useEffect(() => {
    if (loading || !userId) return;

    supabase
      .from("companies")
      .select("*")
      .order("name", { ascending: true })
      .then(({ data }) => setCompanies(data ?? []));
  }, [loading, userId, supabase]);

  function onCompanyPick(nextCompanyId: string) {
    setSelectedCompanyId(nextCompanyId);
    const company = companies.find((item) => item.id === nextCompanyId);
    if (company) {
      setCompanyName(company.name);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">New application</h1>
        <p className="mt-1 text-sm text-stone-600">Capture every role with enough context for fast interview prep later.</p>
      </div>

      <Card>
        <CardTitle>Application details</CardTitle>

        <form action={action} className="mt-4 space-y-5">
          <TokenField />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="company_id">Company record (optional)</Label>
              <Select id="company_id" name="company_id" value={selectedCompanyId} onChange={(event) => onCompanyPick(event.target.value)}>
                <option value="">Select existing company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="company_name">Company name</Label>
              <Input
                id="company_name"
                name="company_name"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                required
              />
              <FieldError message={state.errors?.company_name?.[0]} />
            </div>

            <div>
              <Label htmlFor="role_title">Role title</Label>
              <Input id="role_title" name="role_title" required />
              <FieldError message={state.errors?.role_title?.[0]} />
            </div>
            <div>
              <Label htmlFor="job_url">Job URL</Label>
              <Input id="job_url" name="job_url" type="url" placeholder="https://..." />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="London" />
            </div>
            <div>
              <Label htmlFor="work_mode">Work mode</Label>
              <Select id="work_mode" name="work_mode" defaultValue="">
                <option value="">Select mode</option>
                {WORK_MODES.map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="salary_min">Salary min</Label>
              <Input id="salary_min" name="salary_min" type="number" min={0} />
            </div>
            <div>
              <Label htmlFor="salary_max">Salary max</Label>
              <Input id="salary_max" name="salary_max" type="number" min={0} />
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue="GBP" required />
            </div>
            <div>
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" placeholder="LinkedIn / referral" />
            </div>

            <div>
              <Label htmlFor="date_posted">Date posted</Label>
              <Input id="date_posted" name="date_posted" type="date" />
            </div>
            <div>
              <Label htmlFor="date_applied">Date applied</Label>
              <Input id="date_applied" name="date_applied" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select id="priority" name="priority" defaultValue="medium">
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue="applied">
                {APP_STATUSES.map((status) => (
                  <option key={status} value={status}>{statusLabel(status)}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="next_step_date">Next step date</Label>
              <Input id="next_step_date" name="next_step_date" type="date" defaultValue={todayPlusDays(7)} />
            </div>

            <div>
              <Label htmlFor="fit_score">Fit score (0-100)</Label>
              <Input id="fit_score" name="fit_score" type="number" min={0} max={100} />
            </div>
          </div>

          <div>
            <Label htmlFor="next_step_note">Next step note</Label>
            <Textarea id="next_step_note" name="next_step_note" rows={2} />
          </div>

          <div>
            <Label htmlFor="description_snapshot">Job description snapshot</Label>
            <Textarea id="description_snapshot" name="description_snapshot" rows={8} placeholder="Paste key responsibilities, requirements, and role context." />
          </div>

          <ActionMessage state={state} />

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" name="intent" value="create" disabled={pending}>
              {pending ? "Saving..." : "Create application"}
            </Button>
            <Button type="submit" name="intent" value="draft" variant="secondary" disabled={pending}>
              Save as draft
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/dashboard/applications")}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
