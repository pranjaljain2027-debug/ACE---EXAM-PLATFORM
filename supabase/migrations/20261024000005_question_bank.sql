-- Question bank, curriculum taxonomy, staff review pipeline and predict-first attempts.
-- Plan: HEIR_OF_WISDOM_3D_SPATIAL_REASONING_PLAN §17-§20 (first slice).
--
-- Trust model
--  * Geometric / arithmetic validation runs in the TypeScript validator (src/content/bank/validate.ts),
--    executed by the bank-import edge function or by an operator. Only service_role/postgres may call the
--    importer, so a validation report cannot be forged from the browser.
--  * The importer re-checks structure in SQL (fail closed) before storing anything.
--  * Versions are immutable after import. Fixes ship as a new version.
--  * Nothing is published without a named human reviewer (a row in staff_roles) approving it.
--  * Answer keys never leave the server except to staff, or as explanation/rationales after a learner answers.

-- ---------------------------------------------------------------------------
-- Taxonomy
-- ---------------------------------------------------------------------------
create table public.question_types (
  id text primary key,
  title text not null,
  domain text not null,
  definition text not null default '',
  excludes text not null default '',
  engine text not null check (engine in ('available', 'planned')),
  target int not null check (target > 0),
  age_bands text[] not null default '{}',
  difficulty_bands int[] not null default '{}',
  acceptance jsonb not null default '[]'::jsonb,
  sort int not null default 0
);

create table public.learning_paths (
  id text primary key,
  title text not null,
  kind text not null check (kind in ('exam_prep', 'general_reasoning')),
  description text not null default '',
  sort int not null default 0
);

create table public.curriculum_sections (
  id text primary key,
  path_id text not null references public.learning_paths (id) on delete cascade,
  title text not null,
  sort int not null default 0
);

create table public.curriculum_topics (
  id text primary key,
  section_id text not null references public.curriculum_sections (id) on delete cascade,
  path_id text not null references public.learning_paths (id) on delete cascade,
  title text not null,
  sort int not null default 0
);

create table public.topic_question_types (
  topic_id text not null references public.curriculum_topics (id) on delete cascade,
  type_id text not null references public.question_types (id),
  primary key (topic_id, type_id)
);

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------
create table public.staff_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('reviewer', 'author', 'admin')),
  granted_by text not null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.has_staff_role(p_role text default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.staff_roles s
     where s.user_id = auth.uid() and (p_role is null or s.role = p_role or s.role = 'admin')
  );
$$;

create or replace function public.require_staff(p_role text default null)
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not public.has_staff_role(p_role) then raise exception 'staff_role_required' using errcode = '42501'; end if;
  if not public.gate_ok() then raise exception 'parent_gate_required' using errcode = '42501'; end if;
end $$;

-- Operator-only: grant a role to an existing account by email. Run from the SQL editor.
create or replace function public.grant_staff_by_email(p_email text, p_role text, p_granted_by text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid;
begin
  if coalesce(trim(p_granted_by), '') = '' then raise exception 'granted_by_required'; end if;
  select id into v_uid from auth.users where lower(email) = lower(trim(p_email));
  if v_uid is null then raise exception 'no_account_for_email: % (the person must sign up first)', p_email; end if;
  insert into public.staff_roles (user_id, role, granted_by) values (v_uid, p_role, p_granted_by)
  on conflict (user_id, role) do nothing;
  insert into public.audit_logs (actor_id, action, target_type, target_id, detail)
  values (null, 'staff.grant', 'user', v_uid::text, jsonb_build_object('role', p_role, 'granted_by', p_granted_by));
  return jsonb_build_object('user_id', v_uid, 'role', p_role);
end $$;

create or replace function public.my_staff_roles()
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(role order by role), '{}') from public.staff_roles where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Bank questions
-- ---------------------------------------------------------------------------
create table public.bank_questions (
  id text not null check (id ~ '^[a-z0-9][a-z0-9-]{2,60}$'),
  version int not null check (version > 0),
  question_type text not null references public.question_types (id),
  title text not null,
  primary_topic text not null references public.curriculum_topics (id),
  secondary_topics text[] not null default '{}',
  exam_alignment jsonb not null default '[]'::jsonb,
  age_band text not null,
  reading_load text not null check (reading_load in ('low', 'medium', 'high')),
  difficulty int not null check (difficulty between 1 and 5),
  language text not null default 'en-US',
  learning_objective text not null,
  accessibility jsonb not null,
  transfer_target text,
  payload jsonb not null,
  answer_key jsonb not null,
  authoring jsonb not null,
  content_hash text not null,
  batch_id text not null,
  validation_report jsonb not null,
  validator_version text not null,
  needs_semantic_review boolean not null default false,
  review_status text not null check (review_status in (
    'draft', 'validation_failed', 'review_required', 'changes_requested', 'approved', 'published', 'retired', 'rejected')),
  imported_by uuid references auth.users (id) on delete set null,
  imported_at timestamptz not null default now(),
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  retired_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (id, version)
);
create index on public.bank_questions (question_type, review_status);
create index on public.bank_questions (primary_topic, review_status);

create table public.question_topic_tags (
  question_id text not null,
  version int not null,
  topic_id text not null references public.curriculum_topics (id),
  is_primary boolean not null default false,
  primary key (question_id, version, topic_id),
  foreign key (question_id, version) references public.bank_questions (id, version) on delete cascade
);

-- Review history for bank questions and for legacy activities.
create table public.question_reviews (
  id uuid primary key default gen_random_uuid(),
  item_kind text not null check (item_kind in ('bank', 'activity')),
  item_id text not null,
  item_version int not null,
  reviewer_id uuid references auth.users (id) on delete set null,
  decision text not null check (decision in ('approve', 'reject', 'request_changes', 'publish', 'retire', 'rollback', 'import')),
  notes text not null default '',
  checklist jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.question_reviews (item_kind, item_id, item_version);

-- Legacy activities: record honest human-review state separately from machine validation.
alter table public.activities add column if not exists human_reviewed boolean not null default false;
alter table public.activities add column if not exists human_reviewed_by uuid references auth.users (id) on delete set null;
alter table public.activities add column if not exists human_reviewed_at timestamptz;

-- Immutability and state machine.
create or replace function public.bank_question_rules()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if old.payload is distinct from new.payload or old.answer_key is distinct from new.answer_key
       or old.question_type is distinct from new.question_type or old.content_hash is distinct from new.content_hash
       or old.validation_report is distinct from new.validation_report or old.primary_topic is distinct from new.primary_topic then
      raise exception 'question_versions_are_immutable_create_a_new_version: %@%', new.id, new.version;
    end if;
    if old.review_status <> new.review_status and not (
         (old.review_status in ('review_required', 'changes_requested') and new.review_status in ('approved', 'rejected', 'changes_requested'))
      or (old.review_status = 'approved' and new.review_status in ('published', 'changes_requested', 'rejected'))
      or (old.review_status = 'published' and new.review_status = 'retired')
      or (old.review_status = 'retired' and new.review_status = 'published' and new.approved_by is not null)
    ) then
      raise exception 'invalid_review_transition: % -> %', old.review_status, new.review_status;
    end if;
    new.updated_at := now();
  end if;
  if new.review_status in ('approved', 'published') then
    if new.approved_by is null or new.approved_at is null then raise exception 'approval_requires_a_named_reviewer'; end if;
    if coalesce((new.validation_report ->> 'passed')::boolean, false) is not true then raise exception 'cannot_approve_failed_validation'; end if;
  end if;
  if new.review_status = 'published' and new.published_at is null then raise exception 'published_at_required'; end if;
  return new;
end $$;
create trigger bank_questions_rules before insert or update on public.bank_questions
  for each row execute function public.bank_question_rules();

-- ---------------------------------------------------------------------------
-- Learner attempts (predict-first)
-- ---------------------------------------------------------------------------
create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles (id) on delete cascade,
  question_id text not null,
  question_version int not null,
  client_event_id text not null,
  transfer_of uuid references public.question_attempts (id) on delete set null,
  started_at timestamptz not null default now(),
  initial_option text,
  predicted_at timestamptz,
  exploration_used boolean not null default false,
  exploration_actions int not null default 0,
  first_explored_at timestamptz,
  hint_count int not null default 0,
  final_option text,
  answered_at timestamptz,
  initial_correct boolean,
  correct boolean,
  foreign key (question_id, question_version) references public.bank_questions (id, version),
  unique (child_id, client_event_id)
);
create index on public.question_attempts (child_id, answered_at);

-- ---------------------------------------------------------------------------
-- RLS: everything goes through RPCs. Catalog tables are public-read.
-- ---------------------------------------------------------------------------
alter table public.question_types enable row level security;
alter table public.learning_paths enable row level security;
alter table public.curriculum_sections enable row level security;
alter table public.curriculum_topics enable row level security;
alter table public.topic_question_types enable row level security;
alter table public.staff_roles enable row level security;
alter table public.bank_questions enable row level security;
alter table public.question_topic_tags enable row level security;
alter table public.question_reviews enable row level security;
alter table public.question_attempts enable row level security;

create policy qt_read on public.question_types for select to anon, authenticated using (true);
create policy lp_read on public.learning_paths for select to anon, authenticated using (true);
create policy cs_read on public.curriculum_sections for select to anon, authenticated using (true);
create policy ct_read on public.curriculum_topics for select to anon, authenticated using (true);
create policy tqt_read on public.topic_question_types for select to anon, authenticated using (true);
create policy staff_self on public.staff_roles for select to authenticated using (user_id = auth.uid());
-- bank_questions, question_reviews, question_topic_tags, question_attempts: no direct table access.
revoke all on public.bank_questions, public.question_reviews, public.question_topic_tags, public.question_attempts from anon, authenticated;
revoke insert, update, delete on public.question_types, public.learning_paths, public.curriculum_sections,
  public.curriculum_topics, public.topic_question_types, public.staff_roles from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Import (service_role / postgres only)
-- ---------------------------------------------------------------------------
-- Structural re-check in SQL. Returns a list of errors; empty means OK.
create or replace function public.bank_structural_errors(q jsonb)
returns text[] language plpgsql stable set search_path = '' as $$
declare
  errs text[] := '{}';
  v_opts jsonb := q -> 'payload' -> 'options';
  v_ids text[];
  v_correct text := q -> 'answer_key' ->> 'correct';
  v_type public.question_types;
  i text;
begin
  if coalesce(q ->> 'id', '') !~ '^[a-z0-9][a-z0-9-]{2,60}$' then errs := errs || 'id_format'::text; end if;
  if jsonb_typeof(q -> 'version') <> 'number' or (q ->> 'version')::numeric < 1 or (q ->> 'version')::numeric <> floor((q ->> 'version')::numeric) then errs := errs || 'version_positive_integer'::text; end if;
  select * into v_type from public.question_types where id = q ->> 'question_type';
  if v_type.id is null then errs := errs || 'unknown_question_type'::text;
  elsif v_type.engine <> 'available' then errs := errs || 'question_type_not_supported_yet'::text; end if;
  if not exists (select 1 from public.curriculum_topics where id = q ->> 'primary_topic') then errs := errs || 'unknown_primary_topic'::text;
  elsif not exists (select 1 from public.topic_question_types where topic_id = q ->> 'primary_topic' and type_id = q ->> 'question_type') then errs := errs || 'primary_topic_does_not_list_this_type'::text; end if;
  if jsonb_typeof(q -> 'secondary_topics') = 'array' then
    for i in select jsonb_array_elements_text(q -> 'secondary_topics') loop
      if not exists (select 1 from public.curriculum_topics where id = i) then errs := errs || ('unknown_secondary_topic_' || i); end if;
    end loop;
  end if;
  if (q -> 'payload' ->> 'family') is distinct from (q ->> 'question_type') then errs := errs || 'family_must_match_question_type'::text; end if;
  if jsonb_typeof(v_opts) <> 'array' or jsonb_array_length(v_opts) <> 4 then errs := errs || 'exactly_four_options'::text;
  else
    select array_agg(o ->> 'id') into v_ids from jsonb_array_elements(v_opts) o;
    if (select count(distinct x) from unnest(v_ids) x where coalesce(x, '') <> '') <> 4 then errs := errs || 'option_ids_unique_nonempty'::text; end if;
    if not (v_correct = any (v_ids)) then errs := errs || 'key_not_an_option'::text; end if;
    foreach i in array v_ids loop
      if coalesce(q -> 'answer_key' -> 'rationales' ->> i, '') = '' then errs := errs || ('rationale_missing_' || i); end if;
    end loop;
    if (select count(distinct o - 'id') from jsonb_array_elements(v_opts) o) <> 4 then errs := errs || 'options_not_distinct'::text; end if;
  end if;
  if coalesce(q -> 'answer_key' -> 'explanation' ->> 'summary', '') = '' then errs := errs || 'explanation_required'::text; end if;
  if coalesce(q -> 'payload' ->> 'hint', '') = '' then errs := errs || 'hint_required'::text; end if;
  if coalesce(q -> 'accessibility' ->> 'alt', '') = '' then errs := errs || 'alt_text_required'::text; end if;
  if (q -> 'payload')::text ~ '"(correct|is_correct|rationales|distractor_kinds|solution)"' then errs := errs || 'answer_data_in_public_payload'::text; end if;
  if q ->> 'question_type' like 'spatial_%' and coalesce((q -> 'payload' -> 'interaction' ->> 'predict_first')::boolean, false) is not true then
    errs := errs || 'spatial_items_are_predict_first'::text;
  end if;
  if coalesce(q -> 'authoring' ->> 'source', '') not in ('hand_authored', 'deterministic_generator', 'ai_assisted_draft') then errs := errs || 'authoring_source_required'::text; end if;
  return errs;
end $$;

create or replace function public.bank_import_batch(p_questions jsonb, p_reports jsonb, p_batch_id text, p_dry_run boolean, p_actor uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  q jsonb; r jsonb; errs text[]; v_hash text; v_existing public.bank_questions;
  v_results jsonb := '[]'::jsonb; v_inserted int := 0; v_skipped int := 0; v_failed int := 0; v_status text;
  v_seen text[] := '{}'; v_key text;
begin
  if jsonb_typeof(p_questions) <> 'array' then raise exception 'questions_must_be_an_array'; end if;
  if coalesce(trim(p_batch_id), '') = '' then raise exception 'batch_id_required'; end if;
  for q in select * from jsonb_array_elements(p_questions) loop
    v_key := coalesce(q ->> 'id', '?') || '@' || coalesce(q ->> 'version', '?');
    r := (select x from jsonb_array_elements(coalesce(p_reports, '[]'::jsonb)) x
           where x ->> 'question' = q ->> 'id' and (x ->> 'version') = (q ->> 'version') limit 1);
    errs := public.bank_structural_errors(q);
    if r is null then errs := errs || 'validator_report_missing'::text;
    elsif coalesce((r ->> 'passed')::boolean, false) is not true then
      errs := errs || array(select 'validator:' || (i ->> 'path') || ':' || (i ->> 'rule') from jsonb_array_elements(r -> 'issues') i where i ->> 'severity' = 'error');
    end if;
    if v_key = any (v_seen) then errs := errs || 'duplicate_in_batch'::text; end if;
    v_seen := v_seen || v_key;
    if coalesce(q ->> 'transfer_target', '') <> ''
       and not exists (select 1 from public.bank_questions where id = q ->> 'transfer_target')
       and not exists (select 1 from jsonb_array_elements(p_questions) x where x ->> 'id' = q ->> 'transfer_target') then
      errs := errs || 'unknown_transfer_target'::text;
    end if;
    v_hash := encode(extensions.digest(convert_to((q -> 'payload')::text || '|' || (q -> 'answer_key')::text, 'UTF8'), 'sha256'), 'hex');

    select * into v_existing from public.bank_questions where id = q ->> 'id' and version = (q ->> 'version')::int;
    if v_existing.id is not null then
      if v_existing.content_hash = v_hash then
        v_skipped := v_skipped + 1;
        v_results := v_results || jsonb_build_object('question', v_key, 'result', 'already_imported');
        continue;
      end if;
      errs := errs || 'version_already_exists_with_different_content_create_a_new_version'::text;
    end if;

    v_status := case when cardinality(errs) = 0 then 'review_required' else 'validation_failed' end;
    if cardinality(errs) > 0 then v_failed := v_failed + 1; end if;
    v_results := v_results || jsonb_build_object('question', v_key, 'result', case when cardinality(errs) = 0 then 'ok' else 'failed' end,
                                                 'errors', to_jsonb(errs), 'needs_semantic_review', coalesce((r ->> 'needs_semantic_review')::boolean, false));

    -- Failed items are stored only when they are structurally insertable, so authors can see them in the queue.
    if not p_dry_run and v_existing.id is null
       and not (errs && array['id_format', 'version_positive_integer', 'unknown_question_type', 'unknown_primary_topic', 'duplicate_in_batch', 'validator_report_missing']) then
      insert into public.bank_questions (
        id, version, question_type, title, primary_topic, secondary_topics, exam_alignment, age_band, reading_load,
        difficulty, language, learning_objective, accessibility, transfer_target, payload, answer_key, authoring,
        content_hash, batch_id, validation_report, validator_version, needs_semantic_review, review_status, imported_by)
      values (
        q ->> 'id', (q ->> 'version')::int, q ->> 'question_type', coalesce(q ->> 'title', ''), q ->> 'primary_topic',
        coalesce(array(select jsonb_array_elements_text(q -> 'secondary_topics')), '{}'), coalesce(q -> 'exam_alignment', '[]'),
        coalesce(q ->> 'age_band', ''), coalesce(q ->> 'reading_load', 'medium'), least(5, greatest(1, coalesce((q ->> 'difficulty')::int, 1))),
        coalesce(q ->> 'language', 'en-US'), coalesce(q ->> 'learning_objective', ''), coalesce(q -> 'accessibility', '{}'),
        nullif(q ->> 'transfer_target', ''), q -> 'payload', q -> 'answer_key', q -> 'authoring',
        v_hash, p_batch_id, coalesce(r, '{}'::jsonb) || jsonb_build_object('sql_errors', to_jsonb(errs)),
        coalesce(r ->> 'validator_version', 'none'), coalesce((r ->> 'needs_semantic_review')::boolean, false), v_status, p_actor);
      insert into public.question_topic_tags (question_id, version, topic_id, is_primary)
      select q ->> 'id', (q ->> 'version')::int, t, t = q ->> 'primary_topic'
        from (select q ->> 'primary_topic' as t union select jsonb_array_elements_text(coalesce(q -> 'secondary_topics', '[]'))) s
       where exists (select 1 from public.curriculum_topics c where c.id = s.t)
      on conflict do nothing;
      insert into public.question_reviews (item_kind, item_id, item_version, reviewer_id, decision, notes)
      values ('bank', q ->> 'id', (q ->> 'version')::int, p_actor, 'import', 'Imported in ' || p_batch_id || ' as ' || v_status);
      v_inserted := v_inserted + 1;
    end if;
  end loop;
  return jsonb_build_object('batch_id', p_batch_id, 'dry_run', p_dry_run, 'total', jsonb_array_length(p_questions),
    'inserted', v_inserted, 'already_imported', v_skipped, 'failed', v_failed, 'results', v_results);
end $$;

-- ---------------------------------------------------------------------------
-- Staff review
-- ---------------------------------------------------------------------------
create or replace function public.staff_review_queue()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_staff(null);
  return jsonb_build_object(
    'bank', coalesce((select jsonb_agg(jsonb_build_object(
        'kind', 'bank', 'id', b.id, 'version', b.version, 'title', b.title, 'question_type', b.question_type,
        'status', b.review_status, 'needs_semantic_review', b.needs_semantic_review, 'batch_id', b.batch_id,
        'authoring_source', b.authoring ->> 'source', 'imported_at', b.imported_at,
        'validation_passed', coalesce((b.validation_report ->> 'passed')::boolean, false))
        order by case b.review_status when 'review_required' then 0 when 'changes_requested' then 1 when 'approved' then 2 when 'validation_failed' then 3 else 4 end, b.id, b.version)
      from public.bank_questions b), '[]'::jsonb),
    'legacy', coalesce((select jsonb_agg(jsonb_build_object(
        'kind', 'activity', 'id', a.id, 'version', a.content_version, 'title', a.title, 'mode', a.mode,
        'activity_type', a.activity_type, 'status', a.review_status, 'human_reviewed', a.human_reviewed,
        'machine_validation', a.reviewed_by)
        order by a.human_reviewed, a.mode, a.id)
      from public.activities a where a.review_status = 'published'), '[]'::jsonb));
end $$;

create or replace function public.staff_review_item(p_kind text, p_id text, p_version int)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v jsonb;
begin
  perform public.require_staff(null);
  if p_kind = 'bank' then
    select to_jsonb(b) into v from public.bank_questions b where id = p_id and version = p_version;
  else
    select to_jsonb(a) into v from public.activities a where id = p_id and content_version = p_version;
  end if;
  if v is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  return v || jsonb_build_object('history', coalesce((
    select jsonb_agg(jsonb_build_object('decision', r.decision, 'notes', r.notes, 'checklist', r.checklist, 'at', r.created_at,
                                        'reviewer', (select u.email from auth.users u where u.id = r.reviewer_id)) order by r.created_at)
      from public.question_reviews r where r.item_kind = p_kind and r.item_id = p_id and r.item_version = p_version), '[]'::jsonb));
end $$;

-- approve | reject | request_changes for bank items. Approval requires the review checklist.
create or replace function public.staff_decide(p_id text, p_version int, p_decision text, p_notes text, p_checklist jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare b public.bank_questions;
begin
  perform public.require_staff('reviewer');
  select * into b from public.bank_questions where id = p_id and version = p_version for update;
  if b.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if p_decision not in ('approve', 'reject', 'request_changes') then raise exception 'invalid_decision'; end if;
  if p_decision <> 'approve' and coalesce(trim(p_notes), '') = '' then raise exception 'notes_required'; end if;
  if p_decision = 'approve' then
    if coalesce((p_checklist ->> 'learner_view_checked')::boolean, false) is not true
       or coalesce((p_checklist ->> 'single_answer_confirmed')::boolean, false) is not true
       or coalesce((p_checklist ->> 'age_appropriate')::boolean, false) is not true then
      raise exception 'checklist_incomplete';
    end if;
    if b.needs_semantic_review and coalesce((p_checklist ->> 'semantic_review_done')::boolean, false) is not true then
      raise exception 'semantic_review_required';
    end if;
    update public.bank_questions set review_status = 'approved', approved_by = auth.uid(), approved_at = now() where id = p_id and version = p_version;
  elsif p_decision = 'reject' then
    update public.bank_questions set review_status = 'rejected' where id = p_id and version = p_version;
  else
    update public.bank_questions set review_status = 'changes_requested' where id = p_id and version = p_version;
  end if;
  insert into public.question_reviews (item_kind, item_id, item_version, reviewer_id, decision, notes, checklist)
  values ('bank', p_id, p_version, auth.uid(), p_decision, coalesce(p_notes, ''), coalesce(p_checklist, '{}'::jsonb));
  perform public.audit('bank.' || p_decision, 'bank_question', p_id || '@' || p_version, jsonb_build_object('notes', p_notes));
  return jsonb_build_object('ok', true, 'status', (select review_status from public.bank_questions where id = p_id and version = p_version));
end $$;

create or replace function public.staff_publish(p_id text, p_version int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare b public.bank_questions;
begin
  perform public.require_staff('reviewer');
  select * into b from public.bank_questions where id = p_id and version = p_version for update;
  if b.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if b.review_status <> 'approved' then raise exception 'only_approved_items_can_be_published'; end if;
  update public.bank_questions set review_status = 'retired', retired_at = now()
   where id = p_id and version <> p_version and review_status = 'published';
  update public.bank_questions set review_status = 'published', published_by = auth.uid(), published_at = now()
   where id = p_id and version = p_version;
  insert into public.question_reviews (item_kind, item_id, item_version, reviewer_id, decision) values ('bank', p_id, p_version, auth.uid(), 'publish');
  perform public.audit('bank.publish', 'bank_question', p_id || '@' || p_version);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.staff_retire(p_id text, p_version int, p_notes text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_staff('reviewer');
  if coalesce(trim(p_notes), '') = '' then raise exception 'notes_required'; end if;
  update public.bank_questions set review_status = 'retired', retired_at = now()
   where id = p_id and version = p_version and review_status = 'published';
  if not found then raise exception 'not_published'; end if;
  insert into public.question_reviews (item_kind, item_id, item_version, reviewer_id, decision, notes) values ('bank', p_id, p_version, auth.uid(), 'retire', p_notes);
  perform public.audit('bank.retire', 'bank_question', p_id || '@' || p_version, jsonb_build_object('notes', p_notes));
  return jsonb_build_object('ok', true);
end $$;

-- Re-publish an earlier, previously approved version and retire the current one.
create or replace function public.staff_rollback(p_id text, p_to_version int, p_notes text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare b public.bank_questions;
begin
  perform public.require_staff('reviewer');
  if coalesce(trim(p_notes), '') = '' then raise exception 'notes_required'; end if;
  select * into b from public.bank_questions where id = p_id and version = p_to_version for update;
  if b.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if b.review_status <> 'retired' or b.approved_by is null then raise exception 'can_only_roll_back_to_a_retired_approved_version'; end if;
  update public.bank_questions set review_status = 'retired', retired_at = now() where id = p_id and review_status = 'published';
  update public.bank_questions set review_status = 'published', published_by = auth.uid(), published_at = now(), retired_at = null
   where id = p_id and version = p_to_version;
  insert into public.question_reviews (item_kind, item_id, item_version, reviewer_id, decision, notes) values ('bank', p_id, p_to_version, auth.uid(), 'rollback', p_notes);
  perform public.audit('bank.rollback', 'bank_question', p_id || '@' || p_to_version, jsonb_build_object('notes', p_notes));
  return jsonb_build_object('ok', true);
end $$;

-- Legacy (already live) activities: approve keeps them live with a named human reviewer; reject retires them.
create or replace function public.staff_decide_activity(p_id text, p_version int, p_decision text, p_notes text, p_checklist jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.activities;
begin
  perform public.require_staff('reviewer');
  select * into a from public.activities where id = p_id and content_version = p_version for update;
  if a.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if a.review_status <> 'published' then raise exception 'only_live_activities_are_reviewed_here'; end if;
  if p_decision = 'approve' then
    if coalesce((p_checklist ->> 'learner_view_checked')::boolean, false) is not true
       or coalesce((p_checklist ->> 'single_answer_confirmed')::boolean, false) is not true
       or coalesce((p_checklist ->> 'age_appropriate')::boolean, false) is not true then
      raise exception 'checklist_incomplete';
    end if;
    update public.activities set human_reviewed = true, human_reviewed_by = auth.uid(), human_reviewed_at = now()
     where id = p_id and content_version = p_version;
  elsif p_decision in ('reject', 'request_changes') then
    if coalesce(trim(p_notes), '') = '' then raise exception 'notes_required'; end if;
    update public.activities set review_status = 'retired' where id = p_id and content_version = p_version;
  else raise exception 'invalid_decision';
  end if;
  insert into public.question_reviews (item_kind, item_id, item_version, reviewer_id, decision, notes, checklist)
  values ('activity', p_id, p_version, auth.uid(), p_decision, coalesce(p_notes, ''), coalesce(p_checklist, '{}'::jsonb));
  perform public.audit('activity.' || p_decision, 'activity', p_id || '@' || p_version, jsonb_build_object('notes', p_notes));
  return jsonb_build_object('ok', true);
end $$;

-- Coverage: one row per question type. Legacy 2D items count toward their canonical type.
create or replace function public.content_coverage()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_staff(null);
  return (
    select jsonb_agg(row_to_json(t)::jsonb order by t.sort)
    from (
      select qt.id, qt.title, qt.domain, qt.engine, qt.target, qt.sort,
        (select count(*) from public.bank_questions b where b.question_type = qt.id and b.review_status in ('draft', 'validation_failed', 'changes_requested'))::int as draft,
        (select count(*) from public.bank_questions b where b.question_type = qt.id and b.review_status in ('review_required', 'approved'))::int as in_review,
        (select count(*) from public.bank_questions b where b.question_type = qt.id and b.review_status = 'published')::int as published,
        (select count(*) from public.activities a where a.mode in ('baseline', 'practice') and a.review_status = 'published'
            and case a.activity_type when 'matrix' then 'figure_matrix' when 'analogy' then 'figural_analogy'
                                     when 'sequence' then 'figural_series' when 'classification' then 'figure_classification' end = qt.id)::int as legacy_live,
        (select count(*) from public.activities a where a.mode in ('baseline', 'practice') and a.review_status = 'published' and a.human_reviewed
            and case a.activity_type when 'matrix' then 'figure_matrix' when 'analogy' then 'figural_analogy'
                                     when 'sequence' then 'figural_series' when 'classification' then 'figure_classification' end = qt.id)::int as legacy_human_reviewed
      from public.question_types qt
    ) t);
end $$;

create or replace function public.staff_export(p_status text default 'published')
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_staff(null);
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'version', version, 'question_type', question_type, 'title', title, 'primary_topic', primary_topic,
      'secondary_topics', to_jsonb(secondary_topics), 'exam_alignment', exam_alignment, 'age_band', age_band,
      'reading_load', reading_load, 'difficulty', difficulty, 'language', language, 'learning_objective', learning_objective,
      'accessibility', accessibility, 'transfer_target', transfer_target, 'payload', payload, 'answer_key', answer_key,
      'authoring', authoring, 'review_status', review_status, 'content_hash', content_hash) order by id, version)
    from public.bank_questions where p_status is null or review_status = p_status), '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------------
-- Learner: catalog and predict-first attempts
-- ---------------------------------------------------------------------------
create or replace function public.path_catalog()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'title', p.title, 'kind', p.kind, 'description', p.description,
    'sections', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id, 'title', s.title,
        'topics', (select coalesce(jsonb_agg(jsonb_build_object(
            'id', t.id, 'title', t.title,
            'types', (select coalesce(jsonb_agg(tq.type_id), '[]'::jsonb) from public.topic_question_types tq where tq.topic_id = t.id),
            'published', (select count(distinct g.question_id) from public.question_topic_tags g
                            join public.bank_questions b on b.id = g.question_id and b.version = g.version
                           where g.topic_id = t.id and b.review_status = 'published')) order by t.sort), '[]'::jsonb)
                    from public.curriculum_topics t where t.section_id = s.id)) order by s.sort), '[]'::jsonb)
      from public.curriculum_sections s where s.path_id = p.id)) order by p.sort), '[]'::jsonb)
  from public.learning_paths p;
$$;

-- Public view of a published question: payload without the hint (hints are requested and counted).
create or replace function public.bank_public(b public.bank_questions)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object('id', b.id, 'version', b.version, 'question_type', b.question_type, 'title', b.title,
    'difficulty', b.difficulty, 'age_band', b.age_band, 'accessibility', b.accessibility, 'payload', b.payload - 'hint',
    'has_hint', coalesce(b.payload ->> 'hint', '') <> '');
$$;

create or replace function public.topic_questions(p_child uuid, p_topic text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.owns_child(p_child) then raise exception 'not_found' using errcode = 'P0002'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', b.id, 'version', b.version, 'title', b.title, 'question_type', b.question_type,
                                        'difficulty', b.difficulty,
                                        'answered', exists (select 1 from public.question_attempts a where a.child_id = p_child and a.question_id = b.id and a.answered_at is not null),
                                        'solved', exists (select 1 from public.question_attempts a where a.child_id = p_child and a.question_id = b.id and a.correct))
                     order by b.difficulty, b.id)
      from public.bank_questions b
     where b.review_status = 'published'
       and exists (select 1 from public.question_topic_tags g where g.topic_id = p_topic and g.question_id = b.id and g.version = b.version)), '[]'::jsonb);
end $$;

create or replace function public.qa_start(p_child uuid, p_question text, p_client_event_id text, p_transfer_of uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare b public.bank_questions; a public.question_attempts;
begin
  if not public.owns_child(p_child) then raise exception 'not_found' using errcode = 'P0002'; end if;
  if coalesce(p_client_event_id, '') = '' then raise exception 'client_event_id_required'; end if;
  select * into a from public.question_attempts where child_id = p_child and client_event_id = p_client_event_id;
  if a.id is null then
    select * into b from public.bank_questions where id = p_question and review_status = 'published' order by version desc limit 1;
    if b.id is null then raise exception 'question_not_available'; end if;
    if p_transfer_of is not null and not exists (select 1 from public.question_attempts where id = p_transfer_of and child_id = p_child) then
      raise exception 'not_found' using errcode = 'P0002';
    end if;
    insert into public.question_attempts (child_id, question_id, question_version, client_event_id, transfer_of)
    values (p_child, b.id, b.version, p_client_event_id, p_transfer_of) returning * into a;
  else
    select * into b from public.bank_questions where id = a.question_id and version = a.question_version;
  end if;
  return jsonb_build_object('attempt_id', a.id, 'question', public.bank_public(b),
    'state', jsonb_build_object('predicted', a.initial_option is not null, 'initial_option', a.initial_option,
                                'answered', a.answered_at is not null, 'hint_count', a.hint_count));
end $$;

create or replace function public.qa_attempt_for_child(p_attempt uuid)
returns public.question_attempts language plpgsql stable security definer set search_path = '' as $$
declare a public.question_attempts;
begin
  select * into a from public.question_attempts where id = p_attempt;
  if a.id is null or not public.owns_child(a.child_id) then raise exception 'not_found' using errcode = 'P0002'; end if;
  return a;
end $$;

-- Records the first prediction. Correctness is not revealed. Exploration unlocks afterwards.
create or replace function public.qa_predict(p_attempt uuid, p_option text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.question_attempts; b public.bank_questions;
begin
  a := public.qa_attempt_for_child(p_attempt);
  select * into b from public.bank_questions where id = a.question_id and version = a.question_version;
  if not exists (select 1 from jsonb_array_elements(b.payload -> 'options') o where o ->> 'id' = p_option) then raise exception 'invalid_option'; end if;
  if a.initial_option is null then
    update public.question_attempts set initial_option = p_option, predicted_at = now(),
           initial_correct = (p_option = b.answer_key ->> 'correct')
     where id = p_attempt;
  end if;
  return jsonb_build_object('recorded', true, 'exploration_unlocked', true);
end $$;

create or replace function public.qa_explore(p_attempt uuid, p_actions int default 1)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.question_attempts; b public.bank_questions;
begin
  a := public.qa_attempt_for_child(p_attempt);
  select * into b from public.bank_questions where id = a.question_id and version = a.question_version;
  if coalesce((b.payload -> 'interaction' ->> 'predict_first')::boolean, false) and a.initial_option is null then
    raise exception 'predict_first_required';
  end if;
  if a.answered_at is null then
    update public.question_attempts set exploration_used = true, exploration_actions = exploration_actions + greatest(0, least(coalesce(p_actions, 1), 500)),
           first_explored_at = coalesce(first_explored_at, now())
     where id = p_attempt;
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.qa_hint(p_attempt uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.question_attempts; b public.bank_questions;
begin
  a := public.qa_attempt_for_child(p_attempt);
  select * into b from public.bank_questions where id = a.question_id and version = a.question_version;
  if coalesce((b.payload -> 'interaction' ->> 'predict_first')::boolean, false) and a.initial_option is null then
    raise exception 'predict_first_required';
  end if;
  if a.answered_at is null then update public.question_attempts set hint_count = hint_count + 1 where id = p_attempt; end if;
  return jsonb_build_object('hint', b.payload ->> 'hint');
end $$;

-- Final answer. Returns correctness, the explanation and rationales, and a transfer question if one is live.
create or replace function public.qa_answer(p_attempt uuid, p_option text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.question_attempts; b public.bank_questions; v_transfer text;
begin
  a := public.qa_attempt_for_child(p_attempt);
  select * into b from public.bank_questions where id = a.question_id and version = a.question_version;
  if not exists (select 1 from jsonb_array_elements(b.payload -> 'options') o where o ->> 'id' = p_option) then raise exception 'invalid_option'; end if;
  if coalesce((b.payload -> 'interaction' ->> 'predict_first')::boolean, false) and a.initial_option is null then
    raise exception 'predict_first_required';
  end if;
  if a.answered_at is null then
    update public.question_attempts set final_option = p_option, answered_at = now(), correct = (p_option = b.answer_key ->> 'correct'),
           initial_option = coalesce(initial_option, p_option), predicted_at = coalesce(predicted_at, now()),
           initial_correct = coalesce(initial_correct, p_option = b.answer_key ->> 'correct')
     where id = p_attempt returning * into a;
  end if;
  select t.id into v_transfer from public.bank_questions t
   where t.id = b.transfer_target and t.review_status = 'published' limit 1;
  return jsonb_build_object(
    'correct', a.correct, 'initial_correct', a.initial_correct, 'chosen', a.final_option,
    'correct_option', b.answer_key ->> 'correct',
    'explanation', b.answer_key -> 'explanation',
    'rationale_chosen', b.answer_key -> 'rationales' ->> a.final_option,
    'rationale_correct', b.answer_key -> 'rationales' ->> (b.answer_key ->> 'correct'),
    'transfer', case when v_transfer is not null and a.transfer_of is null then jsonb_build_object('question_id', v_transfer) end);
end $$;

-- Parent report evidence for bank questions (behind the parent gate).
create or replace function public.bank_evidence(p_child uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_gate();
  if not public.owns_child(p_child) then raise exception 'not_found' using errcode = 'P0002'; end if;
  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.question_type)
    from (
      select b.question_type, qt.title,
        count(*)::int as answered,
        count(*) filter (where a.correct)::int as correct,
        count(*) filter (where a.initial_correct)::int as first_prediction_correct,
        count(*) filter (where a.exploration_used)::int as used_exploration,
        count(*) filter (where a.hint_count > 0)::int as used_hint,
        count(*) filter (where a.transfer_of is not null)::int as transfer_attempts,
        count(*) filter (where a.transfer_of is not null and a.correct and a.hint_count = 0)::int as transfer_independent
      from public.question_attempts a
      join public.bank_questions b on b.id = a.question_id and b.version = a.question_version
      join public.question_types qt on qt.id = b.question_type
      where a.child_id = p_child and a.answered_at is not null
      group by b.question_type, qt.title
    ) t), '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on function public.has_staff_role(text) from public, anon;
revoke all on function public.require_staff(text) from public, anon, authenticated;
revoke all on function public.grant_staff_by_email(text, text, text) from public, anon, authenticated;
revoke all on function public.bank_structural_errors(jsonb) from public, anon, authenticated;
revoke all on function public.bank_import_batch(jsonb, jsonb, text, boolean, uuid) from public, anon, authenticated;
grant execute on function public.bank_import_batch(jsonb, jsonb, text, boolean, uuid) to service_role;
grant execute on function public.bank_structural_errors(jsonb) to service_role;
revoke all on function public.bank_question_rules() from public, anon, authenticated;
revoke all on function public.bank_public(public.bank_questions) from public, anon, authenticated;
revoke all on function public.qa_attempt_for_child(uuid) from public, anon, authenticated;
revoke all on function public.my_staff_roles() from public, anon;
revoke all on function public.staff_review_queue() from public, anon;
revoke all on function public.staff_review_item(text, text, int) from public, anon;
revoke all on function public.staff_decide(text, int, text, text, jsonb) from public, anon;
revoke all on function public.staff_publish(text, int) from public, anon;
revoke all on function public.staff_retire(text, int, text) from public, anon;
revoke all on function public.staff_rollback(text, int, text) from public, anon;
revoke all on function public.staff_decide_activity(text, int, text, text, jsonb) from public, anon;
revoke all on function public.content_coverage() from public, anon;
revoke all on function public.staff_export(text) from public, anon;
revoke all on function public.topic_questions(uuid, text) from public, anon;
revoke all on function public.qa_start(uuid, text, text, uuid) from public, anon;
revoke all on function public.qa_predict(uuid, text) from public, anon;
revoke all on function public.qa_explore(uuid, int) from public, anon;
revoke all on function public.qa_hint(uuid) from public, anon;
revoke all on function public.qa_answer(uuid, text) from public, anon;
revoke all on function public.bank_evidence(uuid) from public, anon;
grant execute on function public.path_catalog() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Relabel the live 2D content honestly: machine-validated, awaiting human review.
-- The old label looked like a reviewer identity; it was a pipeline tag.
-- ---------------------------------------------------------------------------
update public.activities
   set reviewed_by = 'machine-validated (validate_activity, 2026-10-24); awaiting human review'
 where review_status = 'published' and human_reviewed = false;
