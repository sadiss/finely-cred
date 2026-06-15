-- Fix: Admin users could not see all partners because the SELECT policy
-- only checked claimed_user_id = auth.uid(), ignoring the is_admin() function
-- that was added in 20260521000001_add_admin_bypass_to_rls.sql.

-- Fix the partners SELECT policy so admins can see ALL partners.
drop policy if exists partner_select_own on public.partners;
create policy partner_select_own on public.partners
for select
to authenticated
using (
  claimed_user_id = auth.uid()
  or public.is_admin()
);

-- Also fix INSERT/UPDATE/DELETE so admins can manage any partner record.
drop policy if exists partner_insert_self on public.partners;
create policy partner_insert_self on public.partners
for insert
to authenticated
with check (
  claimed_user_id = auth.uid()
  or public.is_admin()
);

drop policy if exists partner_update_own on public.partners;
create policy partner_update_own on public.partners
for update
to authenticated
using (
  claimed_user_id = auth.uid()
  or public.is_admin()
)
with check (
  claimed_user_id = auth.uid()
  or public.is_admin()
);

drop policy if exists partner_delete_own on public.partners;
create policy partner_delete_own on public.partners
for delete
to authenticated
using (
  claimed_user_id = auth.uid()
  or public.is_admin()
);
