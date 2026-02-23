-- Create private documents bucket if missing
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update
set public = excluded.public;

-- Only authenticated users can access their own path prefix:
-- documents/{user_id}/{application_id}/{timestamp}_{filename}

-- SELECT
drop policy if exists documents_select_own on storage.objects;
create policy documents_select_own
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- INSERT
drop policy if exists documents_insert_own on storage.objects;
create policy documents_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and coalesce((storage.foldername(name))[2], '') <> ''
);

-- UPDATE
drop policy if exists documents_update_own on storage.objects;
create policy documents_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and coalesce((storage.foldername(name))[2], '') <> ''
);

-- DELETE
drop policy if exists documents_delete_own on storage.objects;
create policy documents_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
