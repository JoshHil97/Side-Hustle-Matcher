"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { createCompanyAction, initialActionState, updateCompanyAction } from "@/server/actions";
import type { ActionState } from "@/server/actions";
import { TokenField } from "@/components/auth/token-field";
import { ActionMessage } from "@/components/ui/action-message";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Textarea } from "@/components/ui/field";
import { useSupabase } from "@/hooks/use-supabase";
import { useUserContext } from "@/hooks/use-user-context";
import { notesToCompanyResearch } from "@/lib/utils";
import type { Database } from "@/types/database";

type Company = Database["public"]["Tables"]["companies"]["Row"];
type Application = Database["public"]["Tables"]["applications"]["Row"];
type Contact = Database["public"]["Tables"]["contacts"]["Row"];

function useReloadOnSuccess(state: ActionState, reload: () => void) {
  useEffect(() => {
    if (state.status === "success") reload();
  }, [state, reload]);
}

function CompanyEditForm({ company, onDone }: { company: Company; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateCompanyAction, initialActionState);
  useReloadOnSuccess(state, onDone);
  const research = notesToCompanyResearch(company.notes);

  return (
    <form action={action} className="space-y-3 rounded-lg border border-stone-200 p-4">
      <TokenField />
      <input type="hidden" name="company_id" value={company.id} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input name="name" defaultValue={company.name} required />
        </div>
        <div>
          <Label>Website</Label>
          <Input name="website_url" type="url" defaultValue={company.website_url ?? ""} />
        </div>
        <div>
          <Label>Location</Label>
          <Input name="location" defaultValue={company.location ?? ""} />
        </div>
        <div>
          <Label>Industry</Label>
          <Input name="industry" defaultValue={company.industry ?? ""} />
        </div>
      </div>

      <div>
        <Label>General notes</Label>
        <Textarea name="general" defaultValue={research.general} rows={2} />
      </div>
      <div>
        <Label>Values notes</Label>
        <Textarea name="values" defaultValue={research.values} rows={2} />
      </div>
      <div>
        <Label>Interview process notes</Label>
        <Textarea name="interview_process" defaultValue={research.interview_process} rows={2} />
      </div>
      <div>
        <Label>Salary notes</Label>
        <Textarea name="salary_notes" defaultValue={research.salary_notes} rows={2} />
      </div>
      <div>
        <Label>Tech stack notes</Label>
        <Textarea name="tech_stack_notes" defaultValue={research.tech_stack_notes} rows={2} />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>Save company research</Button>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

export default function CompaniesPage() {
  const supabase = useSupabase();
  const { userId, loading } = useUserContext();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [createState, createAction, createPending] = useActionState(createCompanyAction, initialActionState);
  useReloadOnSuccess(createState, loadData);

  async function loadData() {
    if (!userId) return;

    setIsLoading(true);
    setError("");

    const [companiesRes, applicationsRes, contactsRes] = await Promise.all([
      supabase.from("companies").select("*").order("name", { ascending: true }),
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
      supabase.from("contacts").select("*").order("name", { ascending: true }),
    ]);

    if (companiesRes.error || applicationsRes.error || contactsRes.error) {
      setError(companiesRes.error?.message ?? applicationsRes.error?.message ?? contactsRes.error?.message ?? "Failed to load companies.");
      setIsLoading(false);
      return;
    }

    const companiesData = (companiesRes.data ?? []) as Company[];
    const applicationsData = (applicationsRes.data ?? []) as Application[];
    const contactsData = (contactsRes.data ?? []) as Contact[];

    setCompanies(companiesData);
    setApplications(applicationsData);
    setContacts(contactsData);

    if (!selectedCompanyId && companiesData[0]?.id) {
      setSelectedCompanyId(companiesData[0].id);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    if (loading || !userId) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, userId]);

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((company) => {
      return (
        company.name.toLowerCase().includes(q) ||
        (company.industry ?? "").toLowerCase().includes(q) ||
        (company.location ?? "").toLowerCase().includes(q)
      );
    });
  }, [companies, search]);

  const selectedCompany = companies.find((company) => company.id === selectedCompanyId) ?? null;
  const companyApplications = selectedCompany
    ? applications.filter((app) => app.company_id === selectedCompany.id)
    : [];
  const companyContacts = selectedCompany
    ? contacts.filter((contact) => contact.company_id === selectedCompany.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-stone-900">Companies</h1>
        <Input
          className="max-w-sm"
          placeholder="Search companies"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardTitle>Company directory</CardTitle>
          <div className="mt-4 space-y-2">
            {isLoading ? (
              <p className="text-sm text-stone-600">Loading companies...</p>
            ) : filteredCompanies.length === 0 ? (
              <EmptyState title="No companies" description="Add your first company to map applications and contacts." />
            ) : (
              filteredCompanies.map((company) => (
                <button
                  type="button"
                  key={company.id}
                  onClick={() => setSelectedCompanyId(company.id)}
                  className={`w-full rounded-md border p-3 text-left ${
                    selectedCompanyId === company.id
                      ? "border-stone-400 bg-stone-50"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <p className="text-sm font-medium text-stone-900">{company.name}</p>
                  <p className="mt-1 text-xs text-stone-600">{company.industry || "No industry set"}</p>
                </button>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardTitle>Create company</CardTitle>
            <form action={createAction} className="mt-4 space-y-3">
              <TokenField />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input name="name" required />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input name="website_url" type="url" />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input name="location" />
                </div>
                <div>
                  <Label>Industry</Label>
                  <Input name="industry" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Values notes</Label>
                  <Textarea name="values" rows={2} />
                </div>
                <div>
                  <Label>Interview process notes</Label>
                  <Textarea name="interview_process" rows={2} />
                </div>
                <div>
                  <Label>Salary notes</Label>
                  <Textarea name="salary_notes" rows={2} />
                </div>
                <div>
                  <Label>Tech stack notes</Label>
                  <Textarea name="tech_stack_notes" rows={2} />
                </div>
              </div>

              <Button type="submit" disabled={createPending}>Add company</Button>
              <ActionMessage state={createState} />
            </form>
          </Card>

          {selectedCompany ? (
            <Card>
              <CardTitle>Company research and links</CardTitle>
              <div className="mt-4 space-y-4">
                <CompanyEditForm company={selectedCompany} onDone={loadData} />

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-stone-200 p-3">
                    <p className="text-sm font-semibold text-stone-900">Linked applications</p>
                    <div className="mt-2 space-y-2">
                      {companyApplications.length === 0 ? (
                        <p className="text-sm text-stone-600">No applications linked.</p>
                      ) : (
                        companyApplications.map((application) => (
                          <Link key={application.id} href={`/dashboard/applications/${application.id}`} className="block text-sm text-stone-700 hover:text-stone-800">
                            {application.role_title} · {application.status}
                          </Link>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-stone-200 p-3">
                    <p className="text-sm font-semibold text-stone-900">Linked contacts</p>
                    <div className="mt-2 space-y-2">
                      {companyContacts.length === 0 ? (
                        <p className="text-sm text-stone-600">No contacts linked.</p>
                      ) : (
                        companyContacts.map((contact) => (
                          <p key={contact.id} className="text-sm text-stone-700">
                            {contact.name}
                            {contact.role ? ` · ${contact.role}` : ""}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState title="Select a company" description="Pick a company from the directory to edit research and view linked records." />
          )}
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
