-- Admin-only auth user lookup for partner invite/signup status sync.
-- Called from admin-partner-auth-sync edge function (service role).

create or replace function public.admin_lookup_auth_user(
  p_email text default null,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  r auth.users%rowtype;
begin
  if p_user_id is not null then
    select * into r from auth.users where id = p_user_id;
  elsif p_email is not null and trim(p_email) <> '' then
    select * into r
    from auth.users
    where lower(email) = lower(trim(p_email))
    order by created_at desc
    limit 1;
  else
    return null;
  end if;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'userId', r.id,
    'email', r.email,
    'emailConfirmedAt', r.email_confirmed_at,
    'lastSignInAt', r.last_sign_in_at,
    'createdAt', r.created_at
  );
end;
$$;

revoke all on function public.admin_lookup_auth_user(text, uuid) from public;
grant execute on function public.admin_lookup_auth_user(text, uuid) to service_role;
