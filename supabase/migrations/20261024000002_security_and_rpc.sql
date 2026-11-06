-- Heir of Wisdom: parent gate, row level security, content validation and learning RPCs.
-- All child-data access checks parent ownership on the server; knowing an ID is never permission.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.owns_child(p_child uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.child_profiles c
    where c.id = p_child and c.parent_id = auth.uid()
  );
$$;

-- Parent gate is open when no PIN is set yet (first onboarding) or it was unlocked recently.
create or replace function public.gate_ok()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((
    select p.pin_hash is null or (p.gate_unlocked_until is not null and p.gate_unlocked_until > now())
    from public.parent_users p where p.id = auth.uid()
  ), false);
$$;

create or replace function public.audit(p_action text, p_target_type text, p_target_id text, p_detail jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_logs (actor_id, action, target_type, target_id, detail)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_detail, '{}'::jsonb));
$$;
revoke all on function public.audit(text, text, text, jsonb) from public, anon, authenticated;

create or replace function public.require_gate()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not public.gate_ok() then raise exception 'parent_gate_required' using errcode = '42501'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- New auth user -> parent row, free subscription, consent records
-- Consent is captured at sign-up in user metadata and written server-side.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_parent()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_consents jsonb := coalesce(new.raw_user_meta_data -> 'consents', '{}'::jsonb);
  v_version text := coalesce(new.raw_user_meta_data ->> 'consent_version', '2026-10-24');
begin
  if coalesce((v_consents ->> 'terms')::boolean, false) is not true
     or coalesce((v_consents ->> 'privacy')::boolean, false) is not true
     or coalesce((v_consents ->> 'coppa_parental_consent')::boolean, false) is not true then
    raise exception 'consent_required';
  end if;

  insert into public.parent_users (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80));

  insert into public.subscriptions (parent_id) values (new.id);

  insert into public.consent_records (parent_id, consent_type, document_version, granted)
  values
    (new.id, 'terms', v_version, true),
    (new.id, 'privacy', v_version, true),
    (new.id, 'coppa_parental_consent', v_version, true),
    (new.id, 'reminder_emails', v_version, coalesce((v_consents ->> 'reminder_emails')::boolean, false));

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (new.id, 'parent.signup', 'parent', new.id::text);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_parent();

-- ---------------------------------------------------------------------------
-- Parent gate RPCs
-- ---------------------------------------------------------------------------
create or replace function public.gate_status()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'has_pin', p.pin_hash is not null,
    'unlocked', public.gate_ok(),
    'unlocked_until', p.gate_unlocked_until,
    'pin_locked_until', p.pin_locked_until
  ) from public.parent_users p where p.id = auth.uid();
$$;

create or replace function public.set_parent_pin(p_pin text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_gate();
  if p_pin !~ '^[0-9]{4}$' then raise exception 'pin_must_be_4_digits'; end if;
  update public.parent_users
     set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')),
         gate_unlocked_until = now() + interval '15 minutes',
         failed_pin_attempts = 0, pin_locked_until = null
   where id = auth.uid();
  perform public.audit('parent.pin_set', 'parent', auth.uid()::text);
end $$;

create or replace function public.verify_parent_pin(p_pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v public.parent_users;
begin
  select * into v from public.parent_users where id = auth.uid() for update;
  if not found then raise exception 'not_authenticated'; end if;
  if v.pin_hash is null then return jsonb_build_object('ok', true, 'reason', 'no_pin'); end if;
  if v.pin_locked_until is not null and v.pin_locked_until > now() then
    return jsonb_build_object('ok', false, 'reason', 'locked', 'locked_until', v.pin_locked_until);
  end if;
  if v.pin_hash = extensions.crypt(coalesce(p_pin, ''), v.pin_hash) then
    update public.parent_users
       set gate_unlocked_until = now() + interval '15 minutes', failed_pin_attempts = 0, pin_locked_until = null
     where id = v.id;
    perform public.audit('parent.gate_unlocked', 'parent', v.id::text, '{"method":"pin"}');
    return jsonb_build_object('ok', true);
  end if;
  update public.parent_users
     set failed_pin_attempts = failed_pin_attempts + 1,
         pin_locked_until = case when failed_pin_attempts + 1 >= 5 then now() + interval '10 minutes' else null end
   where id = v.id;
  perform public.audit('parent.gate_failed', 'parent', v.id::text);
  return jsonb_build_object('ok', false, 'reason', 'wrong_pin', 'remaining', greatest(0, 4 - v.failed_pin_attempts));
end $$;

-- A password sign-in within the last 5 minutes opens the gate (parent just proved identity).
create or replace function public.unlock_gate_after_login()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_ts bigint;
begin
  select max((e ->> 'timestamp')::bigint) into v_ts
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) e
   where e ->> 'method' in ('password', 'otp', 'magiclink', 'email/signup', 'recovery');
  if v_ts is null or to_timestamp(v_ts) < now() - interval '5 minutes' then
    return jsonb_build_object('ok', false);
  end if;
  update public.parent_users set gate_unlocked_until = now() + interval '15 minutes' where id = auth.uid();
  perform public.audit('parent.gate_unlocked', 'parent', auth.uid()::text, '{"method":"fresh_login"}');
  return jsonb_build_object('ok', true);
end $$;

-- Entering the child Studio closes the gate. A PIN must exist first.
create or replace function public.lock_parent_gate()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.parent_users where id = auth.uid() and pin_hash is not null) then
    raise exception 'pin_required_before_child_mode';
  end if;
  update public.parent_users set gate_unlocked_until = null where id = auth.uid();
end $$;

-- ---------------------------------------------------------------------------
-- Child profile management (parent mode)
-- ---------------------------------------------------------------------------
create or replace function public.upsert_child(
  p_child uuid, p_nickname text, p_age int, p_grade text, p_avatar text, p_avatar_color text,
  p_goals text[], p_schedule jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid := p_child; v_count int;
begin
  perform public.require_gate();
  if p_child is null then
    select count(*) into v_count from public.child_profiles where parent_id = auth.uid();
    if v_count >= 6 then raise exception 'child_limit_reached'; end if;
    insert into public.child_profiles (parent_id, nickname, age, grade, avatar, avatar_color)
    values (auth.uid(), trim(p_nickname), p_age, p_grade, p_avatar, p_avatar_color)
    returning id into v_id;
    perform public.audit('child.created', 'child', v_id::text);
  else
    if not public.owns_child(p_child) then raise exception 'not_found'; end if;
    update public.child_profiles
       set nickname = trim(p_nickname), age = p_age, grade = p_grade, avatar = p_avatar,
           avatar_color = p_avatar_color, updated_at = now()
     where id = p_child;
    perform public.audit('child.updated', 'child', v_id::text);
  end if;

  if p_goals is not null then
    if cardinality(p_goals) = 0 then raise exception 'at_least_one_goal'; end if;
    delete from public.learning_goals where child_id = v_id;
    insert into public.learning_goals (child_id, goal) select v_id, g from unnest(p_goals) g on conflict do nothing;
  end if;

  if p_schedule is not null then
    insert into public.learning_schedules (child_id, session_minutes, preferred_days, reminders_opt_in, audio_enabled, reduced_motion)
    values (
      v_id,
      coalesce((p_schedule ->> 'session_minutes')::int, 15),
      coalesce(array(select jsonb_array_elements_text(p_schedule -> 'preferred_days')), '{}'),
      coalesce((p_schedule ->> 'reminders_opt_in')::boolean, false),
      coalesce((p_schedule ->> 'audio_enabled')::boolean, true),
      coalesce((p_schedule ->> 'reduced_motion')::boolean, false)
    )
    on conflict (child_id) do update set
      session_minutes = excluded.session_minutes, preferred_days = excluded.preferred_days,
      reminders_opt_in = excluded.reminders_opt_in, audio_enabled = excluded.audio_enabled,
      reduced_motion = excluded.reduced_motion, updated_at = now();
  end if;
  return v_id;
end $$;

-- ---------------------------------------------------------------------------
-- Content validation: unreviewed or invalid content cannot publish
-- ---------------------------------------------------------------------------
create or replace function public.validate_activity(p_mode text, p_payload jsonb, p_key jsonb)
returns text[] language plpgsql immutable set search_path = '' as $$
declare errs text[] := '{}'; ids text[];
begin
  if p_mode = 'lesson' then
    if not (p_payload ? 'frames' and p_payload ? 'initialState' and p_payload ? 'targetState'
            and p_payload ? 'allowedActions' and p_payload ? 'ruleOptions' and p_payload ? 'hints'
            and p_payload ? 'transferChallenge' and p_payload ? 'observationChoices') then
      errs := errs || 'lesson_payload_missing_fields';
    end if;
    if jsonb_array_length(coalesce(p_payload -> 'hints', '[]')) <> 3 then errs := errs || 'lesson_needs_three_hint_levels'; end if;
    select array_agg(x ->> 'id') into ids from jsonb_array_elements(coalesce(p_payload -> 'ruleOptions', '[]')) x;
    if not (coalesce(p_key #>> '{discover,correct}', '') = any(coalesce(ids, '{}'))) then errs := errs || 'discover_key_not_in_options'; end if;
    select array_agg(x ->> 'id') into ids from jsonb_array_elements(coalesce(p_payload #> '{transferChallenge,options}', '[]')) x;
    if not (coalesce(p_key #>> '{apply,correct}', '') = any(coalesce(ids, '{}'))) then errs := errs || 'apply_key_not_in_options'; end if;
    select array_agg(x ->> 'id') into ids from jsonb_array_elements(coalesce(p_payload -> 'observationChoices', '[]')) x;
    if jsonb_array_length(coalesce(p_key #> '{observe,correct}', '[]')) = 0
       or exists (select 1 from jsonb_array_elements_text(coalesce(p_key #> '{observe,correct}', '[]')) c where not (c = any(coalesce(ids, '{}')))) then
      errs := errs || 'observe_key_invalid';
    end if;
  else
    if not (p_payload ? 'prompt' and p_payload ? 'options') then errs := errs || 'item_payload_missing_fields'; end if;
    if jsonb_array_length(coalesce(p_payload -> 'options', '[]')) < 3 then errs := errs || 'item_needs_three_options'; end if;
    select array_agg(x ->> 'id') into ids from jsonb_array_elements(coalesce(p_payload -> 'options', '[]')) x;
    if not (coalesce(p_key #>> '{item,correct}', '') = any(coalesce(ids, '{}'))) then errs := errs || 'item_key_not_in_options'; end if;
  end if;
  if p_payload::text ~* '"(isCorrect|isKeyFactor)"' then errs := errs || 'answers_leaked_into_public_payload'; end if;
  return errs;
end $$;

create or replace function public.enforce_publish_rules()
returns trigger language plpgsql set search_path = '' as $$
declare errs text[];
begin
  if new.review_status = 'published' then
    if new.reviewed_by is null or new.reviewed_at is null then
      raise exception 'cannot_publish_unreviewed_content: %', new.id;
    end if;
    errs := public.validate_activity(new.mode, new.payload, new.answer_key);
    if cardinality(errs) > 0 then
      raise exception 'invalid_content %: %', new.id, array_to_string(errs, ', ');
    end if;
    new.published_at := coalesce(new.published_at, now());
  end if;
  if tg_op = 'UPDATE' and old.review_status = 'published' and new.review_status = 'published'
     and (old.payload is distinct from new.payload or old.answer_key is distinct from new.answer_key) then
    raise exception 'published_content_is_immutable_create_new_version: %', new.id;
  end if;
  return new;
end $$;

create trigger activities_publish_rules
  before insert or update on public.activities
  for each row execute function public.enforce_publish_rules();

-- Latest published version of an activity.
create or replace function public.current_activity(p_id text)
returns public.activities language sql stable security definer set search_path = '' as $$
  select * from public.activities
   where id = p_id and review_status = 'published'
   order by content_version desc limit 1;
$$;
revoke all on function public.current_activity(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Audit triggers
-- ---------------------------------------------------------------------------
create or replace function public.audit_subscription_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_logs (actor_id, action, target_type, target_id, detail)
  values (new.parent_id, 'subscription.' || lower(tg_op), 'subscription', new.parent_id::text,
          jsonb_build_object('plan', new.plan, 'status', new.status));
  return new;
end $$;
create trigger subscriptions_audit after insert or update on public.subscriptions
  for each row execute function public.audit_subscription_change();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.parent_users enable row level security;
alter table public.consent_records enable row level security;
alter table public.child_profiles enable row level security;
alter table public.learning_goals enable row level security;
alter table public.learning_schedules enable row level security;
alter table public.skills enable row level security;
alter table public.activities enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.activity_attempts enable row level security;
alter table public.interaction_events enable row level security;
alter table public.skill_estimates enable row level security;
alter table public.recommendations enable row level security;
alter table public.subscriptions enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.audit_logs enable row level security;

-- Parents: own row; PIN columns are never readable or writable directly.
revoke all on public.parent_users from anon, authenticated;
grant select (id, display_name, created_at) on public.parent_users to authenticated;
grant update (display_name) on public.parent_users to authenticated;
create policy parent_self_select on public.parent_users for select to authenticated using (id = auth.uid());
create policy parent_self_update on public.parent_users for update to authenticated using (id = auth.uid() and public.gate_ok());

-- Child profiles: readable in child mode (Studio shows nickname/avatar); writes go through upsert_child.
revoke insert, update, delete on public.child_profiles from anon, authenticated;
create policy child_select_own on public.child_profiles for select to authenticated using (parent_id = auth.uid());

create policy goals_select_own on public.learning_goals for select to authenticated using (public.owns_child(child_id));
revoke insert, update, delete on public.learning_goals from anon, authenticated;
create policy schedule_select_own on public.learning_schedules for select to authenticated using (public.owns_child(child_id));
revoke insert, update, delete on public.learning_schedules from anon, authenticated;

-- Content: published only, answer key never exposed.
create policy skills_read on public.skills for select to anon, authenticated using (true);
revoke insert, update, delete on public.skills from anon, authenticated;
revoke all on public.activities from anon, authenticated;
grant select (id, content_version, title, domain, skill_id, subskills, assessment_tags, mode, activity_type,
              age_min, age_max, prerequisites, difficulty, payload, accessibility_metadata, published_at)
  on public.activities to anon, authenticated;
create policy activities_read_published on public.activities for select to anon, authenticated using (review_status = 'published');

-- Learning evidence and parent-only records: readable only with the parent gate open. Writes via RPC only.
revoke insert, update, delete on public.learning_sessions, public.activity_attempts, public.interaction_events,
  public.skill_estimates, public.recommendations, public.subscriptions, public.deletion_requests,
  public.audit_logs, public.consent_records from anon, authenticated;
create policy sessions_parent on public.learning_sessions for select to authenticated using (public.owns_child(child_id) and public.gate_ok());
create policy attempts_parent on public.activity_attempts for select to authenticated using (public.owns_child(child_id) and public.gate_ok());
create policy events_parent on public.interaction_events for select to authenticated using (public.owns_child(child_id) and public.gate_ok());
create policy estimates_parent on public.skill_estimates for select to authenticated using (public.owns_child(child_id) and public.gate_ok());
create policy recs_parent on public.recommendations for select to authenticated using (public.owns_child(child_id) and public.gate_ok());
create policy subs_parent on public.subscriptions for select to authenticated using (parent_id = auth.uid() and public.gate_ok());
create policy deletion_parent on public.deletion_requests for select to authenticated using (parent_id = auth.uid() and public.gate_ok());
create policy audit_parent on public.audit_logs for select to authenticated using (actor_id = auth.uid() and public.gate_ok());
create policy consent_parent on public.consent_records for select to authenticated using (parent_id = auth.uid() and public.gate_ok());

-- Internal helpers are not callable by clients.
revoke all on function public.require_gate() from public, anon;
revoke all on function public.handle_new_parent() from public, anon, authenticated;
revoke all on function public.enforce_publish_rules() from public, anon, authenticated;
revoke all on function public.audit_subscription_change() from public, anon, authenticated;
