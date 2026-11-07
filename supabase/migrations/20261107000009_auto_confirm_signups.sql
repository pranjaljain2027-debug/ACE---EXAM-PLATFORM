-- Owner decision 2026-11-07: confirm email sign-ups on creation so parents can sign in immediately.
-- Reason: Auth Site URL still points at localhost, so confirmation links land on an error page.
-- Remove this trigger once Site URL and redirect URLs point at hierofwisdom.me and real SMTP is set up:
--   drop trigger auto_confirm_email_signup on auth.users;
create or replace function public.auto_confirm_email_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is not null and new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end $$;
revoke all on function public.auto_confirm_email_signup() from public, anon, authenticated;

drop trigger if exists auto_confirm_email_signup on auth.users;
create trigger auto_confirm_email_signup before insert on auth.users
  for each row execute function public.auto_confirm_email_signup();

update auth.users set email_confirmed_at = now() where email is not null and email_confirmed_at is null;
