-- Heir of Wisdom: learning engine RPCs.
-- State machine: OBSERVE -> EXPERIMENT -> DISCOVER -> APPLY -> REFLECT -> COMPLETE
-- with retry loops DISCOVER -> EXPERIMENT and APPLY -> REMEDIATION -> APPLY.
-- Correctness is computed here from server-only answer keys. Every write is idempotent
-- on a client-generated event id so refresh/reconnect never duplicates attempts or awards.

create or replace function public.assert_session_owner(p_session uuid)
returns public.learning_sessions language plpgsql security definer set search_path = '' as $$
declare s public.learning_sessions;
begin
  select * into s from public.learning_sessions where id = p_session for update;
  if not found or not public.owns_child(s.child_id) then raise exception 'not_found' using errcode = 'P0002'; end if;
  return s;
end $$;
revoke all on function public.assert_session_owner(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- start_session: creates or resumes a session
-- ---------------------------------------------------------------------------
create or replace function public.start_session(
  p_child uuid, p_mode text, p_activity text default null, p_item_ids text[] default null,
  p_timed boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.learning_sessions; a public.activities; v_refs jsonb; v_resumed boolean := false;
begin
  if not public.owns_child(p_child) then raise exception 'not_found' using errcode = 'P0002'; end if;
  if p_mode not in ('lesson', 'baseline', 'practice') then raise exception 'invalid_mode'; end if;

  if p_mode = 'lesson' then
    a := public.current_activity(p_activity);
    if a.id is null or a.mode <> 'lesson' then raise exception 'activity_not_found'; end if;
    select * into s from public.learning_sessions
     where child_id = p_child and mode = 'lesson' and activity_id = a.id
       and completed_at is null and state <> 'ABANDONED' and updated_at > now() - interval '7 days'
     order by updated_at desc limit 1;
    if found then v_resumed := true;
    else
      insert into public.learning_sessions (child_id, mode, activity_id, content_version, state)
      values (p_child, 'lesson', a.id, a.content_version, 'OBSERVE') returning * into s;
    end if;

  elsif p_mode = 'baseline' then
    select * into s from public.learning_sessions
     where child_id = p_child and mode = 'baseline' and completed_at is null and state <> 'ABANDONED'
     order by updated_at desc limit 1;
    if found then v_resumed := true;
    else
      select jsonb_agg(jsonb_build_object('id', x.id, 'version', x.content_version) order by x.difficulty ->> 'rule_count', x.id)
        into v_refs
        from (select distinct on (id) * from public.activities
               where mode = 'baseline' and review_status = 'published'
               order by id, content_version desc) x;
      if v_refs is null then raise exception 'no_baseline_content'; end if;
      insert into public.learning_sessions (child_id, mode, item_refs, state)
      values (p_child, 'baseline', v_refs, 'IN_PROGRESS') returning * into s;
    end if;

  else -- practice
    if p_item_ids is null or cardinality(p_item_ids) = 0 or cardinality(p_item_ids) > 20 then
      raise exception 'practice_needs_1_to_20_items';
    end if;
    select jsonb_agg(jsonb_build_object('id', x.id, 'version', x.content_version) order by array_position(p_item_ids, x.id))
      into v_refs
      from (select distinct on (id) * from public.activities
             where mode = 'practice' and review_status = 'published' and id = any(p_item_ids)
             order by id, content_version desc) x;
    if v_refs is null or jsonb_array_length(v_refs) <> cardinality(p_item_ids) then raise exception 'practice_item_not_found'; end if;
    insert into public.learning_sessions (child_id, mode, item_refs, state, timed, time_limit_seconds)
    values (p_child, 'practice', v_refs, 'IN_PROGRESS', coalesce(p_timed, false),
            case when p_timed then 60 * cardinality(p_item_ids) else null end)
    returning * into s;
  end if;

  return jsonb_build_object(
    'session', to_jsonb(s) - 'summary',
    'resumed', v_resumed,
    'attempts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'stage', t.stage, 'item_id', t.item_id, 'answer', t.answer, 'client_event_id', t.client_event_id,
        -- correctness only revealed where the stage gives immediate feedback
        'is_correct', case when t.stage in ('observe', 'discover', 'apply') then t.is_correct end,
        'is_first_attempt', t.is_first_attempt) order by t.created_at)
      from public.activity_attempts t where t.session_id = s.id), '[]'::jsonb),
    'hint_levels', coalesce((
      select jsonb_object_agg(stage, lvl) from (
        select e.stage, max((e.detail ->> 'level')::int) lvl from public.interaction_events e
         where e.session_id = s.id and e.event_type = 'hint' group by e.stage) h), '{}'::jsonb)
  );
end $$;

-- ---------------------------------------------------------------------------
-- advance_session: validated state transitions
-- ---------------------------------------------------------------------------
create or replace function public.advance_session(p_session uuid, p_to text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.learning_sessions; ok boolean := false;
begin
  s := public.assert_session_owner(p_session);
  if s.mode <> 'lesson' then raise exception 'only_lessons_have_stages'; end if;
  if s.state = p_to then return jsonb_build_object('state', s.state, 'unchanged', true); end if;
  if s.completed_at is not null then raise exception 'session_complete'; end if;

  ok := case
    when s.state = 'OBSERVE' and p_to = 'EXPERIMENT' then
      exists (select 1 from public.activity_attempts where session_id = s.id and stage = 'observe')
    when s.state = 'EXPERIMENT' and p_to = 'DISCOVER' then true
    when s.state = 'DISCOVER' and p_to = 'EXPERIMENT' then true
    when s.state = 'DISCOVER' and p_to = 'APPLY' then
      exists (select 1 from public.activity_attempts where session_id = s.id and stage = 'discover' and is_correct)
    when s.state = 'APPLY' and p_to = 'REMEDIATION' then
      exists (select 1 from public.activity_attempts where session_id = s.id and stage = 'apply' and is_first_attempt and not is_correct)
    when s.state = 'REMEDIATION' and p_to = 'APPLY' then true
    when s.state in ('APPLY', 'REMEDIATION') and p_to = 'REFLECT' then
      exists (select 1 from public.activity_attempts where session_id = s.id and stage = 'apply')
    else false end;

  if not ok then raise exception 'invalid_transition % -> %', s.state, p_to; end if;
  update public.learning_sessions set state = p_to, updated_at = now() where id = s.id;
  return jsonb_build_object('state', p_to);
end $$;

-- ---------------------------------------------------------------------------
-- record_hint: progressive hints, never during first transfer attempt or scored practice/baseline
-- ---------------------------------------------------------------------------
create or replace function public.record_hint(p_session uuid, p_stage text, p_level int, p_client_event uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.learning_sessions; v_max int;
begin
  s := public.assert_session_owner(p_session);
  if exists (select 1 from public.interaction_events where client_event_id = p_client_event) then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;
  if s.mode <> 'lesson' then raise exception 'hints_not_available_in_scored_mode'; end if;
  if p_level not between 1 and 3 then raise exception 'invalid_hint_level'; end if;
  if p_stage = 'discover' and s.state <> 'DISCOVER' then raise exception 'hint_stage_mismatch'; end if;
  if p_stage = 'apply' then
    if s.state not in ('APPLY', 'REMEDIATION') then raise exception 'hint_stage_mismatch'; end if;
    if not exists (select 1 from public.activity_attempts where session_id = s.id and stage = 'apply') then
      raise exception 'no_hints_before_first_transfer_attempt';
    end if;
  end if;
  if p_stage not in ('discover', 'apply') then raise exception 'hint_stage_not_allowed'; end if;

  select coalesce(max((detail ->> 'level')::int), 0) into v_max
    from public.interaction_events where session_id = s.id and event_type = 'hint' and stage = p_stage;
  if p_level > v_max + 1 then raise exception 'hints_must_be_progressive'; end if;

  insert into public.interaction_events (session_id, child_id, client_event_id, event_type, stage, detail)
  values (s.id, s.child_id, p_client_event, 'hint', p_stage, jsonb_build_object('level', p_level));
  update public.learning_sessions set updated_at = now() where id = s.id;
  return jsonb_build_object('ok', true, 'level', greatest(v_max, p_level));
end $$;

-- ---------------------------------------------------------------------------
-- submit_attempt: server-scored, idempotent
-- ---------------------------------------------------------------------------
create or replace function public.submit_attempt(
  p_session uuid, p_stage text, p_item text, p_answer jsonb, p_client_event uuid, p_time_ms int default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  s public.learning_sessions; a public.activities; t public.activity_attempts;
  v_key jsonb; v_correct boolean; v_first boolean; v_hint int := 0; v_feedback text; v_misc text;
  v_version int; v_answer_text text; v_reveal boolean;
begin
  s := public.assert_session_owner(p_session);

  select * into t from public.activity_attempts where client_event_id = p_client_event;
  if found then
    return jsonb_build_object('duplicate', true, 'attempt_id', t.id, 'is_first_attempt', t.is_first_attempt,
      'is_correct', case when t.stage in ('observe', 'discover', 'apply') then t.is_correct end,
      'assisted', t.assisted);
  end if;
  if s.completed_at is not null then raise exception 'session_complete'; end if;

  if s.mode = 'lesson' then
    if not ((p_stage = 'observe' and s.state = 'OBSERVE')
         or (p_stage = 'discover' and s.state = 'DISCOVER')
         or (p_stage = 'apply' and s.state in ('APPLY', 'REMEDIATION'))) then
      raise exception 'stage_not_active';
    end if;
    select * into a from public.activities where id = s.activity_id and content_version = s.content_version;
    v_version := s.content_version;
    v_key := a.answer_key -> p_stage;
  else
    if s.mode <> p_stage then raise exception 'stage_not_active'; end if;
    select (r ->> 'version')::int into v_version from jsonb_array_elements(s.item_refs) r where r ->> 'id' = p_item;
    if v_version is null then raise exception 'item_not_in_session'; end if;
    select * into a from public.activities where id = p_item and content_version = v_version;
    v_key := a.answer_key -> 'item';
  end if;

  if p_answer is null or p_answer = 'null'::jsonb then
    v_correct := case when s.mode = 'lesson' then null else false end; -- skipped
  elsif p_stage = 'observe' then
    select coalesce(array_agg(x order by x), '{}') = coalesce((select array_agg(y order by y) from jsonb_array_elements_text(v_key -> 'correct') y), '{}')
      into v_correct from jsonb_array_elements_text(p_answer) x;
  else
    v_answer_text := p_answer #>> '{}';
    v_correct := v_answer_text = (v_key ->> 'correct');
    v_feedback := v_key -> 'feedback' ->> v_answer_text;
    if not v_correct then v_misc := v_key -> 'misconceptions' ->> v_answer_text; end if;
  end if;

  v_first := not exists (select 1 from public.activity_attempts
                          where session_id = s.id and stage = p_stage and item_id = coalesce(p_item, p_stage));
  if s.mode = 'lesson' then
    select coalesce(max((detail ->> 'level')::int), 0) into v_hint
      from public.interaction_events where session_id = s.id and event_type = 'hint' and stage = p_stage;
  end if;

  insert into public.activity_attempts (session_id, child_id, activity_id, content_version, stage, item_id,
    client_event_id, answer, is_correct, is_first_attempt, hint_level, assisted, misconception, time_ms)
  values (s.id, s.child_id, a.id, v_version, p_stage, coalesce(p_item, p_stage), p_client_event, p_answer,
    v_correct, v_first, v_hint, (v_hint > 0 or not v_first), v_misc, p_time_ms)
  returning * into t;

  update public.learning_sessions set updated_at = now() where id = s.id;

  v_reveal := p_stage in ('observe', 'discover', 'apply');   -- practice & baseline: review only after submission
  return jsonb_build_object(
    'attempt_id', t.id, 'is_first_attempt', v_first, 'assisted', t.assisted, 'hint_level', v_hint,
    'is_correct', case when v_reveal then v_correct end,
    'feedback', case when v_reveal then v_feedback end,
    'observe_key', case when p_stage = 'observe' then v_key -> 'correct' end,
    'independent', case when v_reveal then (v_correct and v_first and v_hint = 0) end
  );
end $$;

-- ---------------------------------------------------------------------------
-- Lightweight interaction log (action types only, no raw pointer traces) and checkpoints
-- ---------------------------------------------------------------------------
create or replace function public.record_events(p_session uuid, p_events jsonb)
returns int language plpgsql security definer set search_path = '' as $$
declare s public.learning_sessions; n int;
begin
  s := public.assert_session_owner(p_session);
  if jsonb_array_length(p_events) > 200 then raise exception 'too_many_events'; end if;
  insert into public.interaction_events (session_id, child_id, client_event_id, event_type, stage, detail)
  select s.id, s.child_id, (e ->> 'client_event_id')::uuid, e ->> 'type', e ->> 'stage',
         jsonb_build_object('action', left(coalesce(e #>> '{detail,action}', ''), 40))
    from jsonb_array_elements(p_events) e
   where e ->> 'type' in ('shape_action', 'stage_view')
  on conflict (client_event_id) do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.save_checkpoint(p_session uuid, p_checkpoint jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare s public.learning_sessions;
begin
  s := public.assert_session_owner(p_session);
  if s.completed_at is not null then return; end if;
  if octet_length(p_checkpoint::text) > 20000 then raise exception 'checkpoint_too_large'; end if;
  update public.learning_sessions set checkpoint = p_checkpoint, updated_at = now() where id = s.id;
end $$;

-- ---------------------------------------------------------------------------
-- Skill status: interpretable rules, never a single-question decision
-- ---------------------------------------------------------------------------
create or replace function public.skill_status(e public.skill_estimates)
returns text language sql immutable set search_path = '' as $$
  select case
    when e.independent_transfers + e.assisted_transfers + e.failed_transfers + e.practice_total < 3 then 'insufficient_evidence'
    when e.independent_transfers >= 2 and e.independent_transfers >= e.failed_transfers
         and (e.practice_total = 0 or e.practice_correct::numeric / e.practice_total >= 0.7) then 'applying_independently'
    when e.independent_transfers + e.assisted_transfers >= 1
         or (e.practice_total > 0 and e.practice_correct::numeric / e.practice_total >= 0.5) then 'developing'
    else 'needs_support' end;
$$;

-- ---------------------------------------------------------------------------
-- complete_session: exactly-once evidence update and recommendation
-- ---------------------------------------------------------------------------
create or replace function public.complete_session(p_session uuid, p_reflection jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  s public.learning_sessions; a public.activities; v_first public.activity_attempts;
  v_outcome text; v_any_correct boolean; v_discover_hint boolean; v_summary jsonb;
  v_rec_kind text; v_rec_activity text; v_rec_skill text; v_reason text; v_misc text;
  v_items jsonb; v_recent_failed int; e public.skill_estimates;
begin
  s := public.assert_session_owner(p_session);
  if s.completed_at is not null then
    return s.summary || jsonb_build_object('already_completed', true);   -- no duplicate awards
  end if;

  if s.mode = 'lesson' then
    if s.state <> 'REFLECT' then raise exception 'reflect_stage_required'; end if;
    select * into a from public.activities where id = s.activity_id and content_version = s.content_version;
    select * into v_first from public.activity_attempts
     where session_id = s.id and stage = 'apply' order by created_at limit 1;
    select bool_or(is_correct) into v_any_correct from public.activity_attempts where session_id = s.id and stage = 'apply';
    v_discover_hint := exists (select 1 from public.interaction_events where session_id = s.id and event_type = 'hint' and stage = 'discover');
    v_outcome := case
      when v_first.is_correct and v_first.hint_level = 0 then 'independent'
      when v_any_correct then 'assisted'
      else 'not_yet' end;

    insert into public.skill_estimates as k (child_id, skill_id, independent_transfers, assisted_transfers, failed_transfers,
        discover_with_hints, discover_independent, first_evidence_at, last_evidence_at)
    values (s.child_id, a.skill_id,
        (v_outcome = 'independent')::int, (v_outcome = 'assisted')::int, (v_outcome = 'not_yet')::int,
        v_discover_hint::int, (not v_discover_hint)::int, now(), now())
    on conflict (child_id, skill_id) do update set
      independent_transfers = k.independent_transfers + excluded.independent_transfers,
      assisted_transfers = k.assisted_transfers + excluded.assisted_transfers,
      failed_transfers = k.failed_transfers + excluded.failed_transfers,
      discover_with_hints = k.discover_with_hints + excluded.discover_with_hints,
      discover_independent = k.discover_independent + excluded.discover_independent,
      last_evidence_at = now(), updated_at = now()
    returning * into e;
    update public.skill_estimates set status = public.skill_status(e) where child_id = e.child_id and skill_id = e.skill_id;

    -- Rule-based recommendation
    v_misc := v_first.misconception;
    select count(*) into v_recent_failed from (
      select x.id from public.learning_sessions x
        join public.activities ax on ax.id = x.activity_id and ax.content_version = x.content_version
       where x.child_id = s.child_id and x.mode = 'lesson' and ax.skill_id = a.skill_id
         and x.summary ->> 'transfer_outcome' = 'not_yet'
       order by x.completed_at desc limit 3) f;

    if v_outcome = 'not_yet' and v_recent_failed >= 1 then
      v_rec_kind := 'break';
      select x.id into v_rec_activity from (select distinct on (id) * from public.activities
        where mode = 'lesson' and review_status = 'published' and domain <> a.domain order by id, content_version desc) x
        order by (x.difficulty ->> 'rule_count')::int, x.id limit 1;
      v_reason := 'Two tries in a row did not transfer yet. A different kind of puzzle is a good reset; we will come back to this rule.';
    elsif v_outcome = 'not_yet' then
      v_rec_kind := 'remediate';
      select x.id into v_rec_activity from (select distinct on (id) * from public.activities
        where mode = 'lesson' and review_status = 'published' and skill_id = a.skill_id and id <> a.id
          and (difficulty ->> 'rule_count')::int <= (a.difficulty ->> 'rule_count')::int order by id, content_version desc) x
        order by (x.difficulty ->> 'rule_count')::int, x.id limit 1;
      v_rec_activity := coalesce(v_rec_activity, a.id);
      v_reason := coalesce('Mix-up spotted: ' || replace(v_misc, '_', ' ') || '. ', '') || 'A simpler visual of the same rule comes next.';
    elsif v_outcome = 'assisted' then
      v_rec_kind := 'new_transfer';
      select x.id into v_rec_activity from (select distinct on (id) * from public.activities
        where mode = 'lesson' and review_status = 'published' and skill_id = a.skill_id and id <> a.id order by id, content_version desc) x
        order by x.id limit 1;
      v_reason := 'Solved with help. Next is a fresh problem on the same rule to try without hints.';
    elsif e.independent_transfers >= 2 then
      v_rec_kind := 'advance';
      select x.id into v_rec_activity from (select distinct on (id) * from public.activities
        where mode = 'lesson' and review_status = 'published' and id <> a.id
          and (a.skill_id = any(prerequisites) or skill_id <> a.skill_id) order by id, content_version desc) x
        left join public.skill_estimates k2 on k2.child_id = s.child_id and k2.skill_id = x.skill_id
        order by (a.skill_id = any(x.prerequisites)) desc, coalesce(k2.independent_transfers, 0), x.id limit 1;
      v_reason := 'Applied this rule independently more than once. Ready for the next rule.';
    else
      v_rec_kind := 'new_transfer';
      select x.id into v_rec_activity from (select distinct on (id) * from public.activities
        where mode = 'lesson' and review_status = 'published' and skill_id = a.skill_id and id <> a.id order by id, content_version desc) x
        order by x.id limit 1;
      v_reason := 'One independent success. One more new problem on this rule confirms it.';
    end if;
    v_rec_skill := a.skill_id;

    v_summary := jsonb_build_object(
      'mode', 'lesson', 'activity_id', a.id, 'skill_id', a.skill_id,
      'transfer_outcome', v_outcome, 'discover_hints_used', v_discover_hint,
      'transfer_first_attempt_correct', coalesce(v_first.is_correct, false),
      'reflection', jsonb_build_object('note', left(coalesce(p_reflection ->> 'note', ''), 500), 'strategy', left(coalesce(p_reflection ->> 'strategy', ''), 80)),
      'recommendation', jsonb_build_object('kind', v_rec_kind, 'activity_id', v_rec_activity, 'reason', v_reason));

  else
    if s.state <> 'IN_PROGRESS' then raise exception 'invalid_state'; end if;
    -- Per-item review (latest answer per item; unanswered = skipped)
    select jsonb_agg(jsonb_build_object(
        'item_id', r ->> 'id', 'skill_id', ax.skill_id, 'domain', ax.domain,
        'answer', la.answer, 'skipped', la.id is null or la.answer is null or la.answer = 'null'::jsonb,
        'is_correct', coalesce(la.is_correct, false),
        'correct_option', ax.answer_key #>> '{item,correct}',
        'explanation', ax.answer_key #>> '{item,explanation}',
        'time_ms', la.time_ms) order by ord)
      into v_items
      from jsonb_array_elements(s.item_refs) with ordinality as r(r, ord)
      join public.activities ax on ax.id = r ->> 'id' and ax.content_version = (r ->> 'version')::int
      left join lateral (select * from public.activity_attempts t
                          where t.session_id = s.id and t.item_id = r ->> 'id' order by t.created_at desc limit 1) la on true;

    if s.mode = 'practice' then
      insert into public.skill_estimates as k (child_id, skill_id, practice_correct, practice_total, first_evidence_at, last_evidence_at)
      select s.child_id, i ->> 'skill_id', sum((i ->> 'is_correct')::boolean::int), count(*), now(), now()
        from jsonb_array_elements(v_items) i group by i ->> 'skill_id'
      on conflict (child_id, skill_id) do update set
        practice_correct = k.practice_correct + excluded.practice_correct,
        practice_total = k.practice_total + excluded.practice_total,
        last_evidence_at = now(), updated_at = now();
      update public.skill_estimates k set status = public.skill_status(k) where k.child_id = s.child_id;
      v_rec_kind := 'continue';
      v_reason := 'Practice reviewed. Missed items point to the lesson to revisit.';
      select ax.id into v_rec_activity from jsonb_array_elements(v_items) i
        join lateral (select distinct on (id) * from public.activities where mode = 'lesson' and review_status = 'published'
                       and skill_id = i ->> 'skill_id' order by id, content_version desc) ax on true
       where not (i ->> 'is_correct')::boolean order by ax.id limit 1;
    else
      v_rec_kind := 'baseline';
      select ax.id into v_rec_activity from (
          select i ->> 'domain' d, avg((i ->> 'is_correct')::boolean::int) ratio from jsonb_array_elements(v_items) i group by 1) dom
        join lateral (select distinct on (id) * from public.activities where mode = 'lesson' and review_status = 'published'
                       and domain = dom.d and cardinality(prerequisites) = 0 order by id, content_version desc) ax on true
       order by dom.ratio, ax.id limit 1;
      v_reason := 'Starting point chosen from the Discovery Quest. This is a provisional starting point, not a score.';
    end if;

    v_summary := jsonb_build_object(
      'mode', s.mode, 'timed', s.timed, 'items', v_items,
      'answered', (select count(*) from jsonb_array_elements(v_items) i where not (i ->> 'skipped')::boolean),
      'correct', (select count(*) from jsonb_array_elements(v_items) i where (i ->> 'is_correct')::boolean),
      'total', jsonb_array_length(v_items),
      'provisional', s.mode = 'baseline',
      'recommendation', jsonb_build_object('kind', v_rec_kind, 'activity_id', v_rec_activity, 'reason', v_reason));
  end if;

  insert into public.recommendations (child_id, source_session_id, kind, activity_id, skill_id, reason)
  values (s.child_id, s.id, v_rec_kind, v_rec_activity, v_rec_skill, v_reason);

  update public.learning_sessions
     set state = 'COMPLETE', completed_at = now(), updated_at = now(), summary = v_summary
   where id = s.id;
  return v_summary;
end $$;

-- ---------------------------------------------------------------------------
-- Child Studio state (no parent gate; contains no parent-only data)
-- ---------------------------------------------------------------------------
create or replace function public.get_studio_state(p_child uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.owns_child(p_child) then raise exception 'not_found' using errcode = 'P0002'; end if;
  return jsonb_build_object(
    'child', (select jsonb_build_object('id', c.id, 'nickname', c.nickname, 'avatar', c.avatar, 'avatar_color', c.avatar_color, 'age', c.age, 'grade', c.grade)
                from public.child_profiles c where c.id = p_child),
    'schedule', (select to_jsonb(l) - 'child_id' from public.learning_schedules l where l.child_id = p_child),
    'baseline_done', exists (select 1 from public.learning_sessions where child_id = p_child and mode = 'baseline' and completed_at is not null),
    'completed_lessons', coalesce((select jsonb_agg(distinct activity_id) from public.learning_sessions
                                    where child_id = p_child and mode = 'lesson' and completed_at is not null), '[]'::jsonb),
    'independent_lessons', coalesce((select jsonb_agg(distinct activity_id) from public.learning_sessions
                                    where child_id = p_child and mode = 'lesson' and summary ->> 'transfer_outcome' = 'independent'), '[]'::jsonb),
    'open_sessions', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'mode', mode, 'activity_id', activity_id, 'state', state))
                                 from public.learning_sessions where child_id = p_child and completed_at is null and state <> 'ABANDONED'
                                  and updated_at > now() - interval '7 days'), '[]'::jsonb),
    'recommendation', (select jsonb_build_object('kind', kind, 'activity_id', activity_id, 'reason', reason)
                         from public.recommendations where child_id = p_child order by created_at desc limit 1),
    'discoveries', coalesce((select jsonb_agg(jsonb_build_object('activity_id', activity_id, 'note', summary #>> '{reflection,note}', 'outcome', summary ->> 'transfer_outcome', 'at', completed_at) order by completed_at desc)
                               from public.learning_sessions where child_id = p_child and mode = 'lesson' and completed_at is not null), '[]'::jsonb)
  );
end $$;

-- ---------------------------------------------------------------------------
-- Parent report (gate required)
-- ---------------------------------------------------------------------------
create or replace function public.get_parent_report(p_child uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_gate();
  if not public.owns_child(p_child) then raise exception 'not_found' using errcode = 'P0002'; end if;
  return jsonb_build_object(
    'generated_at', now(),
    'skills', coalesce((select jsonb_agg(jsonb_build_object(
        'skill_id', k.skill_id, 'title', sk.title, 'domain', sk.domain,
        'independent_transfers', k.independent_transfers, 'assisted_transfers', k.assisted_transfers,
        'failed_transfers', k.failed_transfers, 'discover_with_hints', k.discover_with_hints,
        'discover_independent', k.discover_independent, 'practice_correct', k.practice_correct,
        'practice_total', k.practice_total,
        'evidence_count', k.independent_transfers + k.assisted_transfers + k.failed_transfers + k.practice_total,
        'first_evidence_at', k.first_evidence_at, 'last_evidence_at', k.last_evidence_at,
        'status', case when k.status = 'applying_independently' and k.last_evidence_at < now() - interval '21 days' then 'review_due' else k.status end
      ) order by sk.sort_order)
      from public.skill_estimates k join public.skills sk on sk.id = k.skill_id where k.child_id = p_child), '[]'::jsonb),
    'weekly', coalesce((select jsonb_agg(jsonb_build_object('week_start', w, 'sessions', n, 'independent_transfers', it, 'minutes', mins) order by w)
      from (select date_trunc('week', completed_at)::date w, count(*) n,
                   count(*) filter (where summary ->> 'transfer_outcome' = 'independent') it,
                   round(sum(extract(epoch from (completed_at - started_at))) / 60)::int mins
              from public.learning_sessions where child_id = p_child and completed_at > now() - interval '8 weeks'
             group by 1) x), '[]'::jsonb),
    'independent_transfers_this_week', (select count(*) from public.learning_sessions
        where child_id = p_child and completed_at >= date_trunc('week', now()) and summary ->> 'transfer_outcome' = 'independent'),
    'hint_reliance', (select jsonb_build_object(
        'discover_with_hints', coalesce(sum(discover_with_hints), 0), 'discover_independent', coalesce(sum(discover_independent), 0))
        from public.skill_estimates where child_id = p_child),
    'misconceptions', coalesce((select jsonb_agg(jsonb_build_object('tag', misconception, 'count', n) order by n desc)
        from (select misconception, count(*) n from public.activity_attempts
               where child_id = p_child and misconception is not null group by 1) m), '[]'::jsonb),
    'baseline', (select summary from public.learning_sessions where child_id = p_child and mode = 'baseline' and completed_at is not null
                  order by completed_at desc limit 1),
    'recent_sessions', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'mode', mode, 'activity_id', activity_id,
        'completed_at', completed_at, 'outcome', summary ->> 'transfer_outcome', 'correct', summary -> 'correct', 'total', summary -> 'total', 'timed', timed)
        order by completed_at desc) from (select * from public.learning_sessions where child_id = p_child and completed_at is not null
        order by completed_at desc limit 15) r), '[]'::jsonb),
    'recommendation', (select jsonb_build_object('kind', kind, 'activity_id', activity_id, 'reason', reason, 'at', created_at)
        from public.recommendations where child_id = p_child order by created_at desc limit 1)
  );
end $$;

-- ---------------------------------------------------------------------------
-- Privacy: deletion (auditable) and reminder consent
-- ---------------------------------------------------------------------------
create or replace function public.delete_child_data(p_child uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_req uuid;
begin
  perform public.require_gate();
  if not public.owns_child(p_child) then raise exception 'not_found' using errcode = 'P0002'; end if;
  insert into public.deletion_requests (parent_id, scope, child_ref) values (auth.uid(), 'child', p_child) returning id into v_req;
  perform public.audit('privacy.deletion_requested', 'child', p_child::text, jsonb_build_object('request_id', v_req));
  delete from public.child_profiles where id = p_child;   -- cascades sessions, attempts, events, estimates
  update public.deletion_requests set status = 'completed', completed_at = now() where id = v_req;
  perform public.audit('privacy.deletion_completed', 'child', p_child::text, jsonb_build_object('request_id', v_req));
  return jsonb_build_object('request_id', v_req, 'status', 'completed');
end $$;

create or replace function public.delete_account()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_req uuid; v_uid uuid := auth.uid();
begin
  perform public.require_gate();
  insert into public.deletion_requests (parent_id, scope) values (v_uid, 'account') returning id into v_req;
  perform public.audit('privacy.account_deletion_requested', 'parent', v_uid::text, jsonb_build_object('request_id', v_req));
  update public.deletion_requests set status = 'completed', completed_at = now() where id = v_req;
  delete from auth.users where id = v_uid;   -- cascades every parent and child record
  insert into public.audit_logs (actor_id, action, target_type, target_id, detail)
  values (v_uid, 'privacy.account_deletion_completed', 'parent', v_uid::text, jsonb_build_object('request_id', v_req));
  return jsonb_build_object('request_id', v_req, 'status', 'completed');
end $$;

create or replace function public.set_reminder_consent(p_granted boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_gate();
  insert into public.consent_records (parent_id, consent_type, document_version, granted, method)
  values (auth.uid(), 'reminder_emails', '2026-10-24', p_granted, 'settings_toggle');
  perform public.audit('consent.reminder_emails', 'parent', auth.uid()::text, jsonb_build_object('granted', p_granted));
end $$;

-- Billing entitlement (changed only by the verified webhook via service role).
create or replace function public.get_billing()
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_gate();
  return (select jsonb_build_object('plan', plan, 'status', status, 'current_period_end', current_period_end,
                                    'cancel_at_period_end', cancel_at_period_end, 'provider', provider)
            from public.subscriptions where parent_id = auth.uid());
end $$;

revoke all on function public.skill_status(public.skill_estimates) from public, anon, authenticated;
-- Client-callable RPCs: authenticated only.
do $$
declare f text;
begin
  foreach f in array array[
    'gate_status()', 'set_parent_pin(text)', 'verify_parent_pin(text)', 'unlock_gate_after_login()', 'lock_parent_gate()',
    'upsert_child(uuid,text,int,text,text,text,text[],jsonb)', 'start_session(uuid,text,text,text[],boolean)',
    'advance_session(uuid,text)', 'record_hint(uuid,text,int,uuid)', 'submit_attempt(uuid,text,text,jsonb,uuid,int)',
    'record_events(uuid,jsonb)', 'save_checkpoint(uuid,jsonb)', 'complete_session(uuid,jsonb)',
    'get_studio_state(uuid)', 'get_parent_report(uuid)', 'delete_child_data(uuid)', 'delete_account()',
    'set_reminder_consent(boolean)', 'get_billing()']
  loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
