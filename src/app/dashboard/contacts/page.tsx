"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createContactAction, initialActionState, updateContactAction } from "@/server/actions";
import type { ActionState } from "@/server/actions";
import { TokenField } from "@/components/auth/token-field";
import { ActionMessage } from "@/components/ui/action-message";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { useSupabase } from "@/hooks/use-supabase";
import { useUserContext } from "@/hooks/use-user-context";
import type { Database } from "@/types/database";

type Contact = Database["public"]["Tables"]["contacts"]["Row"];
type Company = Database["public"]["Tables"]["companies"]["Row"];

function useReloadOnSuccess(state: ActionState, reload: () => void) {
  useEffect(() => {
    if (state.status === "success") reload();
  }, [state, reload]);
}

function EditContactForm({ contact, companies, onDone }: { contact: Contact; companies: Company[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateContactAction, initialActionState);
  useReloadOnSuccess(state, onDone);

  return (
    <form action={action} className="space-y-3 rounded-md border border-stone-200 p-3">
      <TokenField />
      <input type="hidden" name="contact_id" value={contact.id} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input name="name" defaultValue={contact.name} required />
        </div>
        <div>
          <Label>Company</Label>
          <Select name="company_id" defaultValue={contact.company_id ?? ""}>
            <option value="">No company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" name="email" defaultValue={contact.email ?? ""} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input name="phone" defaultValue={contact.phone ?? ""} />
        </div>
        <div>
          <Label>Role</Label>
          <Input name="role" defaultValue={contact.role ?? ""} />
        </div>
        <div>
          <Label>LinkedIn URL</Label>
          <Input type="url" name="linkedin_url" defaultValue={contact.linkedin_url ?? ""} />
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea name="notes" rows={2} defaultValue={contact.notes ?? ""} />
      </div>

      <Button type="submit" size="sm" disabled={pending}>Save contact</Button>
      <ActionMessage state={state} />
    </form>
  );
}

export default function ContactsPage() {
  const supabase = useSupabase();
  const { userId, loading } = useUserContext();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [createState, createAction, createPending] = useActionState(createContactAction, { status: "idle" } as ActionState<{ id: string }>);
  useReloadOnSuccess(createState, loadData);

  async function loadData() {
    if (!userId) return;
    setIsLoading(true);
    setError("");

    const [contactsRes, companiesRes] = await Promise.all([
      supabase.from("contacts").select("*").order("created_at", { ascending: false }),
      supabase.from("companies").select("*").order("name", { ascending: true }),
    ]);

    if (contactsRes.error || companiesRes.error) {
      setError(contactsRes.error?.message ?? companiesRes.error?.message ?? "Could not load contacts.");
      setIsLoading(false);
      return;
    }

    const contactsData = (contactsRes.data ?? []) as Contact[];
    const companiesData = (companiesRes.data ?? []) as Company[];

    setContacts(contactsData);
    setCompanies(companiesData);

    if (!selectedContactId && contactsData[0]?.id) {
      setSelectedContactId(contactsData[0].id);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    if (loading || !userId) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, userId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;

    return contacts.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(q) ||
        (contact.email ?? "").toLowerCase().includes(q) ||
        (contact.role ?? "").toLowerCase().includes(q)
      );
    });
  }, [contacts, search]);

  const selectedContact = contacts.find((contact) => contact.id === selectedContactId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-stone-900">Contacts</h1>
        <Input className="max-w-sm" placeholder="Search contacts" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardTitle>Directory</CardTitle>
          <div className="mt-4 space-y-2">
            {isLoading ? (
              <p className="text-sm text-stone-600">Loading contacts...</p>
            ) : filtered.length === 0 ? (
              <EmptyState title="No contacts" description="Add recruiter and hiring manager contacts here." />
            ) : (
              filtered.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`w-full rounded-md border p-3 text-left ${
                    selectedContactId === contact.id
                      ? "border-stone-400 bg-stone-50"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <p className="text-sm font-medium text-stone-900">{contact.name}</p>
                  <p className="mt-1 text-xs text-stone-600">{contact.role || "No role"}</p>
                </button>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardTitle>Add contact</CardTitle>
            <form action={createAction} className="mt-4 space-y-3">
              <TokenField />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input name="name" required />
                </div>
                <div>
                  <Label>Company</Label>
                  <Select name="company_id" defaultValue="">
                    <option value="">No company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" name="email" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input name="phone" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input name="role" />
                </div>
                <div>
                  <Label>LinkedIn URL</Label>
                  <Input type="url" name="linkedin_url" />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea name="notes" rows={2} />
              </div>

              <Button type="submit" disabled={createPending}>Add contact</Button>
              <ActionMessage state={createState} />
            </form>
          </Card>

          {selectedContact ? (
            <Card>
              <CardTitle>Edit contact</CardTitle>
              <div className="mt-4">
                <EditContactForm contact={selectedContact} companies={companies} onDone={loadData} />
              </div>
            </Card>
          ) : (
            <EmptyState title="Select a contact" description="Pick any contact from the directory to edit details." />
          )}
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
