-- Fix: text[] || 'literal' was parsed as an array literal. Cast error codes to text.
create or replace function public.validate_activity(p_mode text, p_payload jsonb, p_key jsonb)
returns text[] language plpgsql immutable set search_path = '' as $$
declare errs text[] := '{}'; ids text[];
begin
  if p_mode = 'lesson' then
    if not (p_payload ? 'frames' and p_payload ? 'initialState' and p_payload ? 'targetState'
            and p_payload ? 'allowedActions' and p_payload ? 'ruleOptions' and p_payload ? 'hints'
            and p_payload ? 'transferChallenge' and p_payload ? 'observationChoices') then
      errs := errs || 'lesson_payload_missing_fields'::text;
    end if;
    if jsonb_array_length(coalesce(p_payload -> 'hints', '[]')) <> 3 then errs := errs || 'lesson_needs_three_hint_levels'::text; end if;
    select array_agg(x ->> 'id') into ids from jsonb_array_elements(coalesce(p_payload -> 'ruleOptions', '[]')) x;
    if not (coalesce(p_key #>> '{discover,correct}', '') = any(coalesce(ids, '{}'))) then errs := errs || 'discover_key_not_in_options'::text; end if;
    select array_agg(x ->> 'id') into ids from jsonb_array_elements(coalesce(p_payload #> '{transferChallenge,options}', '[]')) x;
    if not (coalesce(p_key #>> '{apply,correct}', '') = any(coalesce(ids, '{}'))) then errs := errs || 'apply_key_not_in_options'::text; end if;
    select array_agg(x ->> 'id') into ids from jsonb_array_elements(coalesce(p_payload -> 'observationChoices', '[]')) x;
    if jsonb_array_length(coalesce(p_key #> '{observe,correct}', '[]')) = 0
       or exists (select 1 from jsonb_array_elements_text(coalesce(p_key #> '{observe,correct}', '[]')) c where not (c = any(coalesce(ids, '{}')))) then
      errs := errs || 'observe_key_invalid'::text;
    end if;
  else
    if not (p_payload ? 'prompt' and p_payload ? 'options') then errs := errs || 'item_payload_missing_fields'::text; end if;
    if jsonb_array_length(coalesce(p_payload -> 'options', '[]')) < 3 then errs := errs || 'item_needs_three_options'::text; end if;
    select array_agg(x ->> 'id') into ids from jsonb_array_elements(coalesce(p_payload -> 'options', '[]')) x;
    if not (coalesce(p_key #>> '{item,correct}', '') = any(coalesce(ids, '{}'))) then errs := errs || 'item_key_not_in_options'::text; end if;
  end if;
  if p_payload::text ~* '"(isCorrect|isKeyFactor)"' then errs := errs || 'answers_leaked_into_public_payload'::text; end if;
  return errs;
end $$;

-- When a skill has no second lesson, "new transfer" points at that skill's original practice items,
-- which are genuinely new configurations of the same rule. Recommendations whose activity is a
-- practice item are started as a practice set by the Studio.
create or replace function public.transfer_target(p_skill text, p_exclude text)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select x.id from (select distinct on (id) * from public.activities
       where mode = 'lesson' and review_status = 'published' and skill_id = p_skill and id <> p_exclude
       order by id, content_version desc) x order by x.id limit 1),
    (select x.id from (select distinct on (id) * from public.activities
       where mode = 'practice' and review_status = 'published' and skill_id = p_skill
       order by id, content_version desc) x order by x.id limit 1),
    (select x.id from (select distinct on (id) * from public.activities
       where mode = 'lesson' and review_status = 'published' and p_skill = any(prerequisites)
       order by id, content_version desc) x order by x.id limit 1)
  );
$$;
revoke all on function public.transfer_target(text, text) from public, anon, authenticated;

create or replace function public.fill_recommendation_target()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.activity_id is null and new.kind in ('new_transfer', 'remediate', 'advance') and new.skill_id is not null then
    new.activity_id := public.transfer_target(new.skill_id,
      coalesce((select activity_id from public.learning_sessions where id = new.source_session_id), ''));
  end if;
  return new;
end $$;
revoke all on function public.fill_recommendation_target() from public, anon, authenticated;

create trigger recommendations_fill_target before insert on public.recommendations
  for each row execute function public.fill_recommendation_target();

-- Keep the session summary in step with the stored recommendation.
create or replace function public.sync_summary_recommendation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.state = 'COMPLETE' and new.summary is not null and (new.summary #>> '{recommendation,activity_id}') is null then
    new.summary := jsonb_set(new.summary, '{recommendation,activity_id}',
      coalesce(to_jsonb((select activity_id from public.recommendations where source_session_id = new.id order by created_at desc limit 1)), 'null'::jsonb));
  end if;
  return new;
end $$;
revoke all on function public.sync_summary_recommendation() from public, anon, authenticated;

create trigger sessions_sync_recommendation before update on public.learning_sessions
  for each row execute function public.sync_summary_recommendation();

-- Studio needs to know which practice items exist per skill to launch a recommended practice set.
create or replace function public.practice_items_for_skill(p_skill text)
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(id order by id), '{}') from (
    select distinct on (id) id from public.activities
     where mode = 'practice' and review_status = 'published' and skill_id = p_skill
     order by id, content_version desc) x;
$$;
grant execute on function public.practice_items_for_skill(text) to authenticated;

-- Client entry point: completes once and returns the stored summary (with any trigger-filled target).
create or replace function public.finish_session(p_session uuid, p_reflection jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r jsonb;
begin
  r := public.complete_session(p_session, p_reflection);
  return (select summary from public.learning_sessions where id = p_session)
         || jsonb_build_object('already_completed', coalesce((r ->> 'already_completed')::boolean, false));
end $$;
revoke all on function public.finish_session(uuid, jsonb) from public, anon;
grant execute on function public.finish_session(uuid, jsonb) to authenticated;

-- Helpers used by RLS policies stay callable by signed-in users only.
revoke execute on function public.gate_ok() from public, anon;
revoke execute on function public.owns_child(uuid) from public, anon;
revoke execute on function public.practice_items_for_skill(text) from public, anon;
revoke execute on function public.require_gate() from authenticated;
grant execute on function public.gate_ok() to authenticated;
grant execute on function public.owns_child(uuid) to authenticated;
