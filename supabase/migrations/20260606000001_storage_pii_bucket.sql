-- Private storage bucket for partner PII: evidence screenshots, generated
-- letter PDFs, uploaded documents, etc.
--
-- WHY THIS EXISTS:
-- The app stores binary files via SupabaseBlobStore, which uploads to the bucket
-- named by VITE_SUPABASE_PRIVATE_BUCKET (default "pii") at the path
--   partners/{partnerId}/{kind}/{id}.{ext}
-- and renders them through short-lived signed URLs. If the bucket or its access
-- policies don't exist, uploads and signed-URL reads fail on live, so screenshots
-- and letter PDFs appear locally (IndexedDB) but NOT on live. This migration
-- creates the bucket and the access rules so they work on live too.
--
-- NOTE: if you set VITE_SUPABASE_PRIVATE_BUCKET to something other than "pii",
-- change the bucket id in BOTH the insert and the policies below to match.

-- 1) Create the private bucket (not public; access is via signed URLs only).
insert into storage.buckets (id, name, public)
values ('pii', 'pii', false)
on conflict (id) do nothing;

-- 2) RLS on storage objects (enabled by default on Supabase; harmless if already on).
alter table storage.objects enable row level security;

-- 3) Access policy: an authenticated user can read/write objects in the "pii"
--    bucket for a partner they own - OR any partner if they are an admin.
--    Path layout is partners/{partnerId}/..., so the partner id is the 2nd
--    folder segment: (storage.foldername(name))[2].
--    Reuses public.is_partner_owner() (admin bypass included) from the
--    20260521000001 migration, so this matches the letters/evidence table rules.
drop policy if exists pii_partner_owner_all on storage.objects;
create policy pii_partner_owner_all on storage.objects
for all
to authenticated
using (
  bucket_id = 'pii'
  and public.is_partner_owner((storage.foldername(name))[2])
)
with check (
  bucket_id = 'pii'
  and public.is_partner_owner((storage.foldername(name))[2])
);
