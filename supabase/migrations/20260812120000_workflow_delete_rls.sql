-- Allow partners (and admins) to delete their own workflow rows.
-- Without these policies, client-side deletes silently fail under RLS and
-- records reappear after the next Supabase sync.

drop policy if exists letters_delete_own on public.letters;
create policy letters_delete_own on public.letters
for delete
to authenticated
using (public.is_partner_owner(partner_id) or public.is_admin());

drop policy if exists evidence_delete_own on public.evidence;
create policy evidence_delete_own on public.evidence
for delete
to authenticated
using (public.is_partner_owner(partner_id) or public.is_admin());

drop policy if exists credit_reports_delete_own on public.credit_reports;
create policy credit_reports_delete_own on public.credit_reports
for delete
to authenticated
using (public.is_partner_owner(partner_id) or public.is_admin());

drop policy if exists cases_delete_own on public.cases;
create policy cases_delete_own on public.cases
for delete
to authenticated
using (public.is_partner_owner(partner_id) or public.is_admin());
