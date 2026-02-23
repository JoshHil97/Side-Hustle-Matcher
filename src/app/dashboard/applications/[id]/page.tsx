"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { DOCUMENT_CATEGORIES, NOTE_KINDS, STATUS_PIPELINE } from "@/lib/constants";
import {
  createAndLinkContactAction,
  createNoteAction,
  createReminderAction,
  deleteApplicationAction,
  duplicateApplicationAction,
  archiveApplicationAction,
  initialActionState,
  linkContactToApplicationAction,
  setNextStepAction,
  updateApplicationAction,
  updateApplicationStatusAction,
  updateReminderStatusAction,
  uploadDocumentAction,
} from "@/server/actions";
import type { ActionState } from "@/server/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionMessage } from "@/components/ui/action-message";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { TokenField } from "@/components/auth/token-field";
import { useSupabase } from "@/hooks/use-supabase";
import { useUserContext } from "@/hooks/use-user-context";
import {
  formatDate,
  formatDateTime,
  priorityClass,
  statusClass,
  statusLabel,
  toInputDate,
  toInputDateTime,
} from "@/lib/utils";
import type { Database } from "@/types/database";

type Application = Database["public"]["Tables"]["applications"]["Row"];
type Company = Database["public"]["Tables"]["companies"]["Row"];
type Note = Database["public"]["Tables"]["notes"]["Row"];
type StatusHistory = Database["public"]["Tables"]["status_history"]["Row"];
type Document = Database["public"]["Tables"]["documents"]["Row"];
type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
type Contact = Database["public"]["Tables"]["contacts"]["Row"];

type LinkedContact = Database["public"]["Tables"]["application_contacts"]["Row"] & {
  contacts: Contact | null;
};

function useReloadOnSuccess(state: ActionState, reload: () => void) {
  useEffect(() => {
    if (state.status === "success") {
      reload();
    }
  }, [state, reload]);
}

function StatusPipelineForm({ applicationId, currentStatus, onDone }: { applicationId: string; currentStatus: string; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateApplicationStatusAction, initialActionState);
  useReloadOnSuccess(state, onDone);

  return (
    <form action={action} className="space-y-2">
      <TokenField />
      <input type="hidden" name="application_id" value={applicationId} />

      <div className="flex flex-wrap gap-2">
        {STATUS_PIPELINE.map((status) => (
          <button
            key={status}
            name="status"
            value={status}
            type="submit"
            disabled={pending}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              currentStatus === status
                ? "border-stone-600 bg-stone-600 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
            }`}
          >
            {statusLabel(status)}
          </button>
        ))}
      </div>

      <ActionMessage state={state} />
    </form>
  );
}

function ReminderStatusForm({ reminder, onDone }: { reminder: Reminder; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateReminderStatusAction, initialActionState);
  useReloadOnSuccess(state, onDone);

  return (
    <form action={action} className="flex gap-2">
      <TokenField />
      <input type="hidden" name="reminder_id" value={reminder.id} />
      <input type="hidden" name="application_id" value={reminder.application_id} />
      <button
        name="status"
        value="done"
        type="submit"
        disabled={pending}
        className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-700"
      >
        Done
      </button>
      <button
        name="status"
        value="dismissed"
        type="submit"
        disabled={pending}
        className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700"
      >
        Dismiss
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function DeleteButtonForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(deleteApplicationAction, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      router.replace("/dashboard/applications");
    }
  }, [state, router]);

  return (
    <form action={action}>
      <TokenField />
      <input type="hidden" name="application_id" value={applicationId} />
      <Button type="submit" variant="danger" size="sm" disabled={pending}>
        Delete
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const applicationId = params.id;

  const supabase = useSupabase();
  const { userId, loading } = useUserContext();
  const router = useRouter();

  const [application, setApplication] = useState<Application | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [linkedContacts, setLinkedContacts] = useState<LinkedContact[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [activeKind, setActiveKind] = useState<Database["public"]["Tables"]["notes"]["Row"]["kind"]>("general");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [downloadBusyId, setDownloadBusyId] = useState("");

  const [updateState, updateAction, updatePending] = useActionState(updateApplicationAction, initialActionState);
  const [noteState, noteAction, notePending] = useActionState(createNoteAction, initialActionState);
  const [nextStepState, nextStepAction, nextStepPending] = useActionState(setNextStepAction, initialActionState);
  const [docState, docAction, docPending] = useActionState(uploadDocumentAction, initialActionState);
  const [linkContactState, linkContactAction, linkContactPending] = useActionState(linkContactToApplicationAction, initialActionState);
  const [quickContactState, quickContactAction, quickContactPending] = useActionState(createAndLinkContactAction, initialActionState);
  const [reminderState, reminderAction, reminderPending] = useActionState(createReminderAction, initialActionState);
  const [duplicateState, duplicateAction, duplicatePending] = useActionState(duplicateApplicationAction, { status: "idle" } as ActionState<{ id: string }>);
  const [archiveState, archiveAction, archivePending] = useActionState(archiveApplicationAction, initialActionState);

  async function loadDetail() {
    if (!userId || !applicationId) return;

    setIsLoading(true);
    setError("");

    const applicationRes = (await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single()) as unknown as {
      data: Application | null;
      error: { message: string } | null;
    };
    const companiesRes = await supabase.from("companies").select("*").order("name", { ascending: true });
    const contactsRes = await supabase.from("contacts").select("*").order("name", { ascending: true });
    const linkedContactsRes = await supabase
      .from("application_contacts")
      .select("*,contacts(*)")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });
    const notesRes = await supabase
      .from("notes")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });
    const statusRes = await supabase
      .from("status_history")
      .select("*")
      .eq("application_id", applicationId)
      .order("occurred_at", { ascending: false });
    const docsRes = await supabase
      .from("documents")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });
    const remindersRes = await supabase
      .from("reminders")
      .select("*")
      .eq("application_id", applicationId)
      .order("due_at", { ascending: true });

    const anyError =
      applicationRes.error ||
      companiesRes.error ||
      contactsRes.error ||
      linkedContactsRes.error ||
      notesRes.error ||
      statusRes.error ||
      docsRes.error ||
      remindersRes.error;

    if (anyError) {
      setError(
        applicationRes.error?.message ??
          companiesRes.error?.message ??
          contactsRes.error?.message ??
          linkedContactsRes.error?.message ??
          notesRes.error?.message ??
          statusRes.error?.message ??
          docsRes.error?.message ??
          remindersRes.error?.message ??
          "Could not load application details.",
      );
      setIsLoading(false);
      return;
    }

    if (!applicationRes.data) {
      setError("Application not found.");
      setIsLoading(false);
      return;
    }

    setApplication(applicationRes.data);
    setCompanies(companiesRes.data ?? []);
    setAllContacts(contactsRes.data ?? []);
    setLinkedContacts((linkedContactsRes.data as unknown as LinkedContact[]) ?? []);
    setNotes(notesRes.data ?? []);
    setStatusHistory(statusRes.data ?? []);
    setDocuments(docsRes.data ?? []);
    setReminders(remindersRes.data ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    if (loading || !userId) return;
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, userId, applicationId]);

  useReloadOnSuccess(updateState, loadDetail);
  useReloadOnSuccess(noteState, loadDetail);
  useReloadOnSuccess(nextStepState, loadDetail);
  useReloadOnSuccess(docState, loadDetail);
  useReloadOnSuccess(linkContactState, loadDetail);
  useReloadOnSuccess(quickContactState, loadDetail);
  useReloadOnSuccess(reminderState, loadDetail);
  useReloadOnSuccess(archiveState, loadDetail);

  useEffect(() => {
    const duplicatedId = (duplicateState.data as { id?: string } | undefined)?.id;
    if (duplicateState.status === "success" && duplicatedId) {
      router.push(`/dashboard/applications/`);
    }
  }, [duplicateState, router]);

  const filteredNotes = useMemo(
    () => notes.filter((note) => note.kind === activeKind),
    [notes, activeKind],
  );

  const timeline = useMemo(() => {
    const statusItems = statusHistory.map((entry) => ({
      id: `status-${entry.id}`,
      when: entry.occurred_at,
      title: entry.from_status
        ? `Status changed: ${entry.from_status} -> ${entry.to_status}`
        : `Status set: ${entry.to_status}`,
      meta: entry.note ?? "",
      type: "status",
    }));

    const noteItems = notes.map((entry) => ({
      id: `note-${entry.id}`,
      when: entry.created_at,
      title: `Note added (${entry.kind.replace("_", " ")})`,
      meta: entry.content.slice(0, 160),
      type: "note",
    }));

    const docItems = documents.map((entry) => ({
      id: `doc-${entry.id}`,
      when: entry.created_at,
      title: `Document uploaded (${entry.category})`,
      meta: entry.file_name,
      type: "document",
    }));

    const reminderItems = reminders.map((entry) => ({
      id: `reminder-${entry.id}`,
      when: entry.created_at,
      title: `Reminder created (${entry.status})`,
      meta: entry.title,
      type: "reminder",
    }));

    return [...statusItems, ...noteItems, ...docItems, ...reminderItems].sort(
      (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime(),
    );
  }, [statusHistory, notes, documents, reminders]);

  async function openDownload(document: Document) {
    setDownloadBusyId(document.id);
    const { data, error: signedUrlError } = await supabase.storage
      .from(document.storage_bucket)
      .createSignedUrl(document.storage_path, 90);
    setDownloadBusyId("");

    if (signedUrlError || !data?.signedUrl) {
      setError(signedUrlError?.message ?? "Could not generate download link.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (isLoading) {
    return <p className="text-sm text-stone-600">Loading application...</p>;
  }

  if (!application) {
    return <EmptyState title="Application not found" description="This record may have been deleted or you no longer have access." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-stone-600">{application.company_name}</p>
          <h1 className="text-2xl font-semibold text-stone-900">{application.role_title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className={statusClass(application.status)}>{statusLabel(application.status)}</Badge>
            <Badge className={priorityClass(application.priority)}>Priority: {application.priority}</Badge>
            <Badge className="border-stone-200 bg-stone-100 text-stone-700">Applied: {formatDate(application.date_applied)}</Badge>
            {application.next_step_date && (
              <Badge className="border-blue-200 bg-blue-100 text-blue-700">Next step: {formatDate(application.next_step_date)}</Badge>
            )}
          </div>
          {application.job_url && (
            <a href={application.job_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-stone-700 hover:text-stone-800">
              Open job posting
            </a>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <form action={duplicateAction}>
            <TokenField />
            <input type="hidden" name="application_id" value={application.id} />
            <Button size="sm" variant="secondary" type="submit" disabled={duplicatePending}>Duplicate</Button>
          </form>
          <form action={archiveAction}>
            <TokenField />
            <input type="hidden" name="application_id" value={application.id} />
            <Button size="sm" variant="secondary" type="submit" disabled={archivePending}>Archive</Button>
          </form>
          <DeleteButtonForm applicationId={application.id} />
          <Link href="/dashboard/applications">
            <Button variant="ghost" size="sm">Back</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardTitle>Status pipeline</CardTitle>
        <div className="mt-3">
          <StatusPipelineForm applicationId={application.id} currentStatus={application.status} onDone={loadDetail} />
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>Application memory bank</CardTitle>

          <form action={updateAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <TokenField />
            <input type="hidden" name="application_id" value={application.id} />

            <div>
              <Label>Company record</Label>
              <Select name="company_id" defaultValue={application.company_id ?? ""}>
                <option value="">None</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Company name</Label>
              <Input name="company_name" defaultValue={application.company_name} required />
            </div>
            <div>
              <Label>Role title</Label>
              <Input name="role_title" defaultValue={application.role_title} required />
            </div>
            <div>
              <Label>Job URL</Label>
              <Input name="job_url" defaultValue={application.job_url ?? ""} />
            </div>
            <div>
              <Label>Location</Label>
              <Input name="location" defaultValue={application.location ?? ""} />
            </div>
            <div>
              <Label>Work mode</Label>
              <Select name="work_mode" defaultValue={application.work_mode ?? ""}>
                <option value="">Unknown</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </Select>
            </div>
            <div>
              <Label>Salary min</Label>
              <Input type="number" name="salary_min" defaultValue={application.salary_min ?? ""} />
            </div>
            <div>
              <Label>Salary max</Label>
              <Input type="number" name="salary_max" defaultValue={application.salary_max ?? ""} />
            </div>
            <div>
              <Label>Currency</Label>
              <Input name="currency" defaultValue={application.currency} />
            </div>
            <div>
              <Label>Source</Label>
              <Input name="source" defaultValue={application.source ?? ""} />
            </div>
            <div>
              <Label>Date posted</Label>
              <Input type="date" name="date_posted" defaultValue={toInputDate(application.date_posted)} />
            </div>
            <div>
              <Label>Date applied</Label>
              <Input type="date" name="date_applied" defaultValue={toInputDate(application.date_applied)} required />
            </div>
            <div>
              <Label>Priority</Label>
              <Select name="priority" defaultValue={application.priority}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </Select>
            </div>
            <div>
              <Label>Fit score</Label>
              <Input type="number" min={0} max={100} name="fit_score" defaultValue={application.fit_score ?? ""} />
            </div>
            <div>
              <Label>Next step date</Label>
              <Input type="date" name="next_step_date" defaultValue={toInputDate(application.next_step_date)} />
            </div>
            <div>
              <Label>Next step note</Label>
              <Input name="next_step_note" defaultValue={application.next_step_note ?? ""} />
            </div>

            <div className="sm:col-span-2">
              <Label>Job description snapshot</Label>
              <Textarea name="description_snapshot" rows={8} defaultValue={application.description_snapshot ?? ""} />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <Button type="submit" disabled={updatePending}>Save summary</Button>
              <ActionMessage state={updateState} />
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle>Next step updater</CardTitle>
            <form action={nextStepAction} className="mt-4 space-y-3">
              <TokenField />
              <input type="hidden" name="application_id" value={application.id} />
              <div>
                <Label>Next step date</Label>
                <Input type="date" name="next_step_date" defaultValue={toInputDate(application.next_step_date)} />
              </div>
              <div>
                <Label>Next step note</Label>
                <Input name="next_step_note" defaultValue={application.next_step_note ?? ""} />
              </div>
              <Button type="submit" disabled={nextStepPending}>Update next step</Button>
              <ActionMessage state={nextStepState} />
            </form>
          </Card>

          <Card>
            <CardTitle>Reminders</CardTitle>
            <form action={reminderAction} className="mt-4 space-y-3">
              <TokenField />
              <input type="hidden" name="application_id" value={application.id} />
              <div>
                <Label>Reminder title</Label>
                <Input name="title" placeholder="Follow up with recruiter" required />
              </div>
              <div>
                <Label>Due at</Label>
                <Input type="datetime-local" name="due_at" defaultValue={toInputDateTime(new Date().toISOString())} required />
              </div>
              <div>
                <Label>Channel</Label>
                <Select name="channel" defaultValue="in_app">
                  <option value="in_app">In app</option>
                  <option value="email">Email (future integration)</option>
                </Select>
              </div>
              <Button type="submit" disabled={reminderPending}>Create reminder</Button>
              <ActionMessage state={reminderState} />
            </form>

            <div className="mt-4 space-y-2">
              {reminders.length === 0 ? (
                <p className="text-sm text-stone-600">No reminders yet.</p>
              ) : (
                reminders.map((reminder) => (
                  <div key={reminder.id} className="rounded-md border border-stone-200 p-3">
                    <p className="text-sm font-medium text-stone-900">{reminder.title}</p>
                    <p className="mt-1 text-xs text-stone-600">Due {formatDateTime(reminder.due_at)}</p>
                    <ReminderStatusForm reminder={reminder} onDone={loadDetail} />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Notes</CardTitle>
            <div className="flex flex-wrap gap-1">
              {NOTE_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setActiveKind(kind)}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    activeKind === kind
                      ? "border-stone-600 bg-stone-50 text-stone-700"
                      : "border-stone-300 bg-white text-stone-700"
                  }`}
                >
                  {kind.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <form action={noteAction} className="mt-4 space-y-3">
            <TokenField />
            <input type="hidden" name="application_id" value={application.id} />
            <input type="hidden" name="kind" value={activeKind} />
            <div>
              <Label>New {activeKind.replace("_", " ")} note</Label>
              <Textarea name="content" rows={4} placeholder="Capture interview prep, follow-up strategy, or company research." required />
            </div>
            <Button type="submit" disabled={notePending}>Add note</Button>
            <ActionMessage state={noteState} />
          </form>

          <div className="mt-4 space-y-2">
            {filteredNotes.length === 0 ? (
              <p className="text-sm text-stone-600">No notes in this tab yet.</p>
            ) : (
              filteredNotes.map((note) => (
                <div key={note.id} className="rounded-md border border-stone-200 p-3">
                  <p className="text-sm whitespace-pre-wrap text-stone-800">{note.content}</p>
                  <p className="mt-2 text-xs text-stone-500">{formatDateTime(note.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Timeline</CardTitle>
          <div className="mt-4 space-y-3">
            {timeline.length === 0 ? (
              <p className="text-sm text-stone-600">No timeline activity yet.</p>
            ) : (
              timeline.map((item) => (
                <div key={item.id} className="rounded-md border border-stone-200 p-3">
                  <p className="text-sm font-medium text-stone-900">{item.title}</p>
                  {item.meta && <p className="mt-1 text-sm text-stone-700">{item.meta}</p>}
                  <p className="mt-2 text-xs text-stone-500">{formatDateTime(item.when)}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>Documents</CardTitle>

          <form action={docAction} className="mt-4 space-y-3">
            <TokenField />
            <input type="hidden" name="application_id" value={application.id} />
            <input type="hidden" name="company_id" value={application.company_id ?? ""} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select name="category" defaultValue="other">
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category.replace("_", " ")}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Version label</Label>
                <Input name="version_label" placeholder="Cover Letter FinTech v2" />
              </div>
            </div>

            <div>
              <Label>File</Label>
              <Input type="file" name="file" required />
            </div>

            <Button type="submit" disabled={docPending}>Upload document</Button>
            <ActionMessage state={docState} />
          </form>

          <div className="mt-4 space-y-2">
            {documents.length === 0 ? (
              <p className="text-sm text-stone-600">No documents uploaded for this application yet.</p>
            ) : (
              documents.map((document) => (
                <div key={document.id} className="rounded-md border border-stone-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-stone-900">{document.file_name}</p>
                      <p className="text-xs text-stone-600">
                        {document.category.replace("_", " ")}
                        {document.version_label ? ` · ${document.version_label}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openDownload(document)}
                      disabled={downloadBusyId === document.id}
                    >
                      {downloadBusyId === document.id ? "Preparing..." : "Download"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Contacts</CardTitle>

          <form action={linkContactAction} className="mt-4 space-y-3">
            <TokenField />
            <input type="hidden" name="application_id" value={application.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Link existing contact</Label>
                <Select name="contact_id" required>
                  <option value="">Select contact</option>
                  {allContacts.map((contact) => (
                    <option value={contact.id} key={contact.id}>
                      {contact.name}
                      {contact.role ? ` · ${contact.role}` : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Relationship</Label>
                <Input name="relationship" placeholder="recruiter / hiring manager" />
              </div>
            </div>
            <Button type="submit" disabled={linkContactPending}>Link contact</Button>
            <ActionMessage state={linkContactState} />
          </form>

          <form action={quickContactAction} className="mt-5 space-y-3 rounded-md border border-stone-200 p-3">
            <TokenField />
            <input type="hidden" name="application_id" value={application.id} />
            <input type="hidden" name="company_id" value={application.company_id ?? ""} />

            <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">Quick add contact</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input name="name" required />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" />
              </div>
              <div>
                <Label>Role</Label>
                <Input name="role" placeholder="Talent partner" />
              </div>
              <div>
                <Label>Relationship</Label>
                <Input name="relationship" placeholder="recruiter" />
              </div>
              <div>
                <Label>LinkedIn</Label>
                <Input name="linkedin_url" type="url" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input name="phone" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea name="notes" rows={2} />
            </div>
            <Button type="submit" disabled={quickContactPending}>Create and link</Button>
            <ActionMessage state={quickContactState} />
          </form>

          <div className="mt-4 space-y-2">
            {linkedContacts.length === 0 ? (
              <p className="text-sm text-stone-600">No contacts linked yet.</p>
            ) : (
              linkedContacts.map((entry) => (
                <div key={entry.id} className="rounded-md border border-stone-200 p-3">
                  <p className="text-sm font-medium text-stone-900">{entry.contacts?.name ?? "Unknown contact"}</p>
                  <p className="mt-1 text-xs text-stone-600">
                    {entry.relationship ?? "No relationship set"}
                    {entry.contacts?.email ? ` · ${entry.contacts.email}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {duplicateState.status === "error" && <p className="text-sm text-red-600">{duplicateState.message}</p>}
      {archiveState.status === "error" && <p className="text-sm text-red-600">{archiveState.message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
