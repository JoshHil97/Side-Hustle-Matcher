create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  website_url text,
  location text,
  industry text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint companies_user_id_name_key unique (user_id, name)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_id uuid,
  company_name text not null,
  role_title text not null,
  job_url text,
  location text,
  work_mode text,
  salary_min integer,
  salary_max integer,
  currency text not null default 'GBP',
  date_posted date,
  date_applied date not null default current_date,
  source text,
  priority text not null default 'medium',
  status text not null default 'applied',
  next_step_date date,
  next_step_note text,
  description_snapshot text,
  fit_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint applications_company_id_fkey
    foreign key (company_id) references public.companies(id) on delete set null,
  constraint applications_work_mode_check
    check (work_mode in ('remote', 'hybrid', 'onsite')),
  constraint applications_priority_check
    check (priority in ('low', 'medium', 'high')),
  constraint applications_status_check
    check (
      status in (
        'draft',
        'applied',
        'screening',
        'interview_1',
        'interview_2',
        'interview_3',
        'task',
        'offer',
        'rejected',
        'withdrawn',
        'accepted'
      )
    ),
  constraint applications_fit_score_check
    check (fit_score between 0 and 100)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_id uuid,
  name text not null,
  email text,
  phone text,
  role text,
  linkedin_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint contacts_company_id_fkey
    foreign key (company_id) references public.companies(id) on delete set null
);

create table public.application_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  application_id uuid not null,
  contact_id uuid not null,
  relationship text,
  created_at timestamptz not null default now(),
  constraint application_contacts_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint application_contacts_application_id_fkey
    foreign key (application_id) references public.applications(id) on delete cascade,
  constraint application_contacts_contact_id_fkey
    foreign key (contact_id) references public.contacts(id) on delete cascade,
  constraint application_contacts_application_contact_key unique (application_id, contact_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  application_id uuid not null,
  kind text not null default 'general',
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint notes_application_id_fkey
    foreign key (application_id) references public.applications(id) on delete cascade,
  constraint notes_kind_check
    check (kind in ('general', 'interview_prep', 'follow_up', 'company_research'))
);

create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  application_id uuid not null,
  from_status text,
  to_status text not null,
  occurred_at timestamptz not null default now(),
  note text,
  constraint status_history_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint status_history_application_id_fkey
    foreign key (application_id) references public.applications(id) on delete cascade
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  application_id uuid,
  company_id uuid,
  storage_bucket text not null default 'documents',
  storage_path text not null,
  file_name text not null,
  file_type text,
  file_size integer,
  category text not null default 'other',
  version_label text,
  created_at timestamptz not null default now(),
  constraint documents_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint documents_application_id_fkey
    foreign key (application_id) references public.applications(id) on delete cascade,
  constraint documents_company_id_fkey
    foreign key (company_id) references public.companies(id) on delete set null,
  constraint documents_category_check
    check (category in ('cv', 'cover_letter', 'portfolio', 'other'))
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  type text not null default 'other',
  tags text[] not null default '{}'::text[],
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint templates_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint templates_type_check
    check (type in ('cover_letter_block', 'interview_answer', 'follow_up_email', 'cv_bullet', 'other'))
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  application_id uuid not null,
  title text not null,
  due_at timestamptz not null,
  status text not null default 'open',
  channel text not null default 'in_app',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint reminders_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint reminders_application_id_fkey
    foreign key (application_id) references public.applications(id) on delete cascade,
  constraint reminders_status_check
    check (status in ('open', 'done', 'dismissed')),
  constraint reminders_channel_check
    check (channel in ('in_app', 'email'))
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint activity_log_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade
);

create index idx_applications_user_id on public.applications (user_id);
create index idx_applications_user_status on public.applications (user_id, status);
create index idx_applications_user_date_applied_desc on public.applications (user_id, date_applied desc);
create index idx_applications_user_next_step_date on public.applications (user_id, next_step_date);
create index idx_applications_user_company_name on public.applications (user_id, company_name);
create index idx_applications_user_role_title on public.applications (user_id, role_title);
create index idx_applications_search_trgm on public.applications
using gin ((coalesce(company_name, '') || ' ' || coalesce(role_title, '')) gin_trgm_ops);

create index idx_contacts_user_id on public.contacts (user_id);
create index idx_contacts_user_company_id on public.contacts (user_id, company_id);

create index idx_application_contacts_user_id on public.application_contacts (user_id);
create index idx_application_contacts_user_application_id on public.application_contacts (user_id, application_id);
create index idx_application_contacts_user_contact_id on public.application_contacts (user_id, contact_id);

create index idx_notes_user_id on public.notes (user_id);
create index idx_notes_user_application_id on public.notes (user_id, application_id);
create index idx_notes_user_kind on public.notes (user_id, kind);

create index idx_status_history_user_id on public.status_history (user_id);
create index idx_status_history_user_application_id on public.status_history (user_id, application_id);
create index idx_status_history_user_occurred_at_desc on public.status_history (user_id, occurred_at desc);

create index idx_documents_user_id on public.documents (user_id);
create index idx_documents_user_application_id on public.documents (user_id, application_id);
create index idx_documents_user_category on public.documents (user_id, category);

create index idx_templates_user_id on public.templates (user_id);
create index idx_templates_user_type on public.templates (user_id, type);
create index idx_templates_tags_gin on public.templates using gin (tags);

create index idx_reminders_user_id on public.reminders (user_id);
create index idx_reminders_user_application_id on public.reminders (user_id, application_id);
create index idx_reminders_user_status_due_at on public.reminders (user_id, status, due_at);

create index idx_activity_log_user_id on public.activity_log (user_id);
create index idx_activity_log_user_created_at_desc on public.activity_log (user_id, created_at desc);
create index idx_activity_log_user_entity_type on public.activity_log (user_id, entity_type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.log_application_status_change()
returns trigger
language plpgsql
as $$
begin
  if old.status is distinct from new.status then
    insert into public.status_history (
      user_id,
      application_id,
      from_status,
      to_status,
      occurred_at,
      note
    )
    values (
      new.user_id,
      new.id,
      old.status,
      new.status,
      now(),
      null
    );
  end if;

  return new;
end;
$$;

create or replace function public.log_activity()
returns trigger
language plpgsql
as $$
declare
  row_data jsonb;
  v_user_id uuid;
  v_entity_id uuid;
  v_entity_type text;
  v_action text;
  v_metadata jsonb;
begin
  if tg_op = 'DELETE' then
    row_data := to_jsonb(old);
  else
    row_data := to_jsonb(new);
  end if;

  v_user_id := (row_data ->> 'user_id')::uuid;
  v_entity_id := (row_data ->> 'id')::uuid;

  v_entity_type := case tg_table_name
    when 'applications' then 'application'
    when 'companies' then 'company'
    when 'contacts' then 'contact'
    when 'notes' then 'note'
    when 'documents' then 'document'
    when 'templates' then 'template'
    when 'reminders' then 'reminder'
    when 'application_contacts' then 'application_contact'
    else tg_table_name
  end;

  if tg_op = 'INSERT' then
    v_action := 'created';
    v_metadata := jsonb_build_object('table', tg_table_name);
  elsif tg_op = 'UPDATE' then
    if tg_table_name = 'applications' and old.status is distinct from new.status then
      v_action := 'status_changed';
      v_metadata := jsonb_build_object(
        'table', tg_table_name,
        'from_status', old.status,
        'to_status', new.status
      );
    else
      v_action := 'updated';
      v_metadata := jsonb_build_object('table', tg_table_name);
    end if;
  else
    v_action := 'deleted';
    v_metadata := jsonb_build_object('table', tg_table_name);
  end if;

  insert into public.activity_log (
    user_id,
    entity_type,
    entity_id,
    action,
    metadata,
    created_at
  )
  values (
    v_user_id,
    v_entity_type,
    v_entity_id,
    v_action,
    v_metadata,
    now()
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, created_at)
  values (new.id, new.raw_user_meta_data ->> 'full_name', now())
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger trg_companies_set_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

create trigger trg_applications_set_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

create trigger trg_contacts_set_updated_at
before update on public.contacts
for each row
execute function public.set_updated_at();

create trigger trg_notes_set_updated_at
before update on public.notes
for each row
execute function public.set_updated_at();

create trigger trg_templates_set_updated_at
before update on public.templates
for each row
execute function public.set_updated_at();

create trigger trg_applications_status_history
after update on public.applications
for each row
when (old.status is distinct from new.status)
execute function public.log_application_status_change();

create trigger trg_activity_applications
after insert or update or delete on public.applications
for each row
execute function public.log_activity();

create trigger trg_activity_companies
after insert or update or delete on public.companies
for each row
execute function public.log_activity();

create trigger trg_activity_contacts
after insert or update or delete on public.contacts
for each row
execute function public.log_activity();

create trigger trg_activity_notes
after insert or update or delete on public.notes
for each row
execute function public.log_activity();

create trigger trg_activity_documents
after insert or update or delete on public.documents
for each row
execute function public.log_activity();

create trigger trg_activity_templates
after insert or update or delete on public.templates
for each row
execute function public.log_activity();

create trigger trg_activity_reminders
after insert or update or delete on public.reminders
for each row
execute function public.log_activity();

create trigger trg_activity_application_contacts
after insert or update or delete on public.application_contacts
for each row
execute function public.log_activity();

create trigger trg_auth_users_create_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.applications enable row level security;
alter table public.contacts enable row level security;
alter table public.application_contacts enable row level security;
alter table public.notes enable row level security;
alter table public.status_history enable row level security;
alter table public.documents enable row level security;
alter table public.templates enable row level security;
alter table public.reminders enable row level security;
alter table public.activity_log enable row level security;

create policy profiles_select_own
on public.profiles
for select
using (id = auth.uid());

create policy profiles_insert_own
on public.profiles
for insert
with check (id = auth.uid());

create policy profiles_update_own
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy profiles_delete_own
on public.profiles
for delete
using (id = auth.uid());

create policy companies_select_own
on public.companies
for select
using (user_id = auth.uid());

create policy companies_insert_own
on public.companies
for insert
with check (user_id = auth.uid());

create policy companies_update_own
on public.companies
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy companies_delete_own
on public.companies
for delete
using (user_id = auth.uid());

create policy applications_select_own
on public.applications
for select
using (user_id = auth.uid());

create policy applications_insert_own
on public.applications
for insert
with check (user_id = auth.uid());

create policy applications_update_own
on public.applications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy applications_delete_own
on public.applications
for delete
using (user_id = auth.uid());

create policy contacts_select_own
on public.contacts
for select
using (user_id = auth.uid());

create policy contacts_insert_own
on public.contacts
for insert
with check (user_id = auth.uid());

create policy contacts_update_own
on public.contacts
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy contacts_delete_own
on public.contacts
for delete
using (user_id = auth.uid());

create policy application_contacts_select_own
on public.application_contacts
for select
using (user_id = auth.uid());

create policy application_contacts_insert_own
on public.application_contacts
for insert
with check (user_id = auth.uid());

create policy application_contacts_update_own
on public.application_contacts
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy application_contacts_delete_own
on public.application_contacts
for delete
using (user_id = auth.uid());

create policy notes_select_own
on public.notes
for select
using (user_id = auth.uid());

create policy notes_insert_own
on public.notes
for insert
with check (user_id = auth.uid());

create policy notes_update_own
on public.notes
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy notes_delete_own
on public.notes
for delete
using (user_id = auth.uid());

create policy status_history_select_own
on public.status_history
for select
using (user_id = auth.uid());

create policy status_history_insert_own
on public.status_history
for insert
with check (user_id = auth.uid());

create policy status_history_update_own
on public.status_history
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy status_history_delete_own
on public.status_history
for delete
using (user_id = auth.uid());

create policy documents_select_own
on public.documents
for select
using (user_id = auth.uid());

create policy documents_insert_own
on public.documents
for insert
with check (user_id = auth.uid());

create policy documents_update_own
on public.documents
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy documents_delete_own
on public.documents
for delete
using (user_id = auth.uid());

create policy templates_select_own
on public.templates
for select
using (user_id = auth.uid());

create policy templates_insert_own
on public.templates
for insert
with check (user_id = auth.uid());

create policy templates_update_own
on public.templates
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy templates_delete_own
on public.templates
for delete
using (user_id = auth.uid());

create policy reminders_select_own
on public.reminders
for select
using (user_id = auth.uid());

create policy reminders_insert_own
on public.reminders
for insert
with check (user_id = auth.uid());

create policy reminders_update_own
on public.reminders
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy reminders_delete_own
on public.reminders
for delete
using (user_id = auth.uid());

create policy activity_log_select_own
on public.activity_log
for select
using (user_id = auth.uid());

create policy activity_log_insert_own
on public.activity_log
for insert
with check (user_id = auth.uid());

create policy activity_log_update_own
on public.activity_log
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy activity_log_delete_own
on public.activity_log
for delete
using (user_id = auth.uid());

-- Storage RLS policy guidance for bucket `documents`:
-- Path convention (full): documents/{user_id}/{application_id}/{timestamp}_{filename}
-- Within the `documents` bucket, users can read/write only their own paths under:
-- {user_id}/{application_id}/{timestamp}_{filename}
-- Create storage.objects policies that enforce:
-- 1) bucket_id = 'documents'
-- 2) split_part(name, '/', 1) = auth.uid()::text
