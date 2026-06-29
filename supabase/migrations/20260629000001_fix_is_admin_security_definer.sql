-- Fix: is_admin() and is_partner_owner() need SECURITY DEFINER.
--
-- Root cause of error 42501 on partners INSERT/UPDATE:
--   is_admin() queries the admin_emails table, but admin_emails has RLS
--   enabled with NO SELECT policy for authenticated users. Without
--   SECURITY DEFINER the function runs as the calling user, gets 0 rows,
--   and always returns false — so any INSERT where claimed_user_id is NULL
--   (admin-created partner rows) fails the WITH CHECK policy.
--
-- Fix: SECURITY DEFINER causes the function to run as the DB owner,
--   bypassing RLS on admin_emails. set search_path = public prevents
--   search-path hijacking (security best practice for SECURITY DEFINER fns).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
  select exists (
    select 1
    from public.admin_emails
    where email = auth.jwt() ->> 'email'
  );
$func$;

-- is_partner_owner() also benefits from SECURITY DEFINER since it queries
-- the RLS-enabled partners table from inside a policy helper context.
create or replace function public.is_partner_owner(pid text)
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
  select exists (
    select 1
    from public.partners p
    where p.id = pid
      and (
        p.claimed_user_id = auth.uid()
        or public.is_admin()
      )
  );
$func$;
