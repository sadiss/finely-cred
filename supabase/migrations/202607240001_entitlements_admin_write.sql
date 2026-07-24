-- Allow platform admins to grant/revoke partner entitlements from the app
-- (stripe-webhook already upserts via service role; client grants were local-only).

drop policy if exists entitlements_admin_write on public.entitlements;
create policy entitlements_admin_write on public.entitlements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Partners can still only read their own rows (existing entitlements_select_own).
