-- 2026-11-07: an auto-confirm trigger was added and removed the same day (owner wants verified emails).
-- Net effect: none. Kept so migration history matches the live project.
drop trigger if exists auto_confirm_email_signup on auth.users;
drop function if exists public.auto_confirm_email_signup();
