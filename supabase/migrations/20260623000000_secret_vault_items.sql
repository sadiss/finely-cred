-- Owner Secret Vault — server index for cross-device + NCG API feed
create table if not exists public.secret_vault_items (
  id text primary key,
  tenant_id text not null,
  type text not null default 'file',
  media_kind text not null default 'document',
  title text not null,
  notes text null,
  tags jsonb not null default '[]'::jsonb,
  blob_ref text null,
  filename text null,
  mime_type text null,
  size_bytes bigint null,
  sha256 text null,
  source_url text null,
  youtube_id text null,
  intel jsonb null,
  shared_with_roles jsonb not null default '[]'::jsonb,
  share_with_ncg boolean not null default false,
  created_by_user_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists secret_vault_items_tenant_updated_idx
  on public.secret_vault_items (tenant_id, updated_at desc);

create index if not exists secret_vault_items_ncg_idx
  on public.secret_vault_items (tenant_id, share_with_ncg)
  where share_with_ncg = true;

alter table public.secret_vault_items enable row level security;

drop policy if exists secret_vault_items_admin on public.secret_vault_items;
create policy secret_vault_items_admin on public.secret_vault_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists secret_vault_items_select_owner on public.secret_vault_items;
create policy secret_vault_items_select_owner on public.secret_vault_items
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.tenant_id = secret_vault_items.tenant_id
      and m.status = 'active'
      and (m.role in ('platform_admin', 'tenant_owner', 'agent') or coalesce((m.permissions->>'canAccessVault')::boolean, false))
  )
);
