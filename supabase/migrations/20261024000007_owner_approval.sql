-- Owner-instructed publishing, recorded honestly.
-- The owner can approve publishing without a staff account. Such rows say so (approval_basis =
-- 'owner_instruction', approved_by_label names the person) instead of borrowing a reviewer identity.
-- They show in /staff as "published on owner instruction, not individually reviewed".

alter table public.bank_questions add column if not exists approval_basis text not null default 'reviewer'
  check (approval_basis in ('reviewer', 'owner_instruction'));
alter table public.bank_questions add column if not exists approved_by_label text;

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
      or (old.review_status = 'retired' and new.review_status = 'published' and new.approved_at is not null)
    ) then
      raise exception 'invalid_review_transition: % -> %', old.review_status, new.review_status;
    end if;
    new.updated_at := now();
  end if;
  if new.review_status in ('approved', 'published') then
    if new.approved_at is null then raise exception 'approval_requires_a_named_reviewer'; end if;
    if new.approval_basis = 'reviewer' and new.approved_by is null then raise exception 'approval_requires_a_named_reviewer'; end if;
    if new.approval_basis = 'owner_instruction' and coalesce(trim(new.approved_by_label), '') = '' then raise exception 'owner_approval_requires_a_name'; end if;
    if coalesce((new.validation_report ->> 'passed')::boolean, false) is not true then raise exception 'cannot_approve_failed_validation'; end if;
  end if;
  if new.review_status = 'published' and new.published_at is null then raise exception 'published_at_required'; end if;
  return new;
end $$;

-- Rollback: any version that was approved before (by a reviewer or the owner) can go live again.
create or replace function public.staff_rollback(p_id text, p_to_version int, p_notes text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare b public.bank_questions;
begin
  perform public.require_staff('reviewer');
  if coalesce(trim(p_notes), '') = '' then raise exception 'notes_required'; end if;
  select * into b from public.bank_questions where id = p_id and version = p_to_version for update;
  if b.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if b.review_status <> 'retired' or b.approved_at is null then raise exception 'can_only_roll_back_to_a_retired_approved_version'; end if;
  update public.bank_questions set review_status = 'retired', retired_at = now() where id = p_id and review_status = 'published';
  update public.bank_questions set review_status = 'published', published_by = auth.uid(), published_at = now(), retired_at = null
   where id = p_id and version = p_to_version;
  insert into public.question_reviews (item_kind, item_id, item_version, reviewer_id, decision, notes) values ('bank', p_id, p_to_version, auth.uid(), 'rollback', p_notes);
  perform public.audit('bank.rollback', 'bank_question', p_id || '@' || p_to_version, jsonb_build_object('notes', p_notes));
  return jsonb_build_object('ok', true);
end $$;

-- Operator-only: publish approved-by-owner questions. Run from the SQL editor.
create or replace function public.owner_publish(p_ids text[], p_owner_name text, p_note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id text; v_ver int; n int := 0;
begin
  if coalesce(trim(p_owner_name), '') = '' or coalesce(trim(p_note), '') = '' then raise exception 'owner_name_and_note_required'; end if;
  foreach v_id in array p_ids loop
    select version into v_ver from public.bank_questions
     where id = v_id and review_status in ('review_required', 'changes_requested', 'approved') order by version desc limit 1;
    if v_ver is null then raise exception 'nothing_to_publish_for %', v_id; end if;
    update public.bank_questions set review_status = 'approved', approval_basis = 'owner_instruction', approved_by_label = p_owner_name, approved_at = now()
     where id = v_id and version = v_ver and review_status <> 'approved';
    update public.bank_questions set review_status = 'retired', retired_at = now() where id = v_id and version <> v_ver and review_status = 'published';
    update public.bank_questions set review_status = 'published', published_at = now() where id = v_id and version = v_ver;
    insert into public.question_reviews (item_kind, item_id, item_version, reviewer_id, decision, notes)
    values ('bank', v_id, v_ver, null, 'approve', 'Owner instruction: ' || p_owner_name || '. ' || p_note),
           ('bank', v_id, v_ver, null, 'publish', 'Published on owner instruction: ' || p_owner_name || '. Not individually reviewed.');
    n := n + 1;
  end loop;
  insert into public.audit_logs (actor_id, action, target_type, target_id, detail)
  values (null, 'bank.owner_publish', 'bank_question', array_to_string(p_ids, ','), jsonb_build_object('owner', p_owner_name, 'note', p_note));
  return jsonb_build_object('published', n);
end $$;
revoke all on function public.owner_publish(text[], text, text) from public, anon, authenticated;

-- Queue shows the approval basis so reviewers can find owner-published items.
create or replace function public.staff_review_queue()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_staff(null);
  return jsonb_build_object(
    'bank', coalesce((select jsonb_agg(jsonb_build_object(
        'kind', 'bank', 'id', b.id, 'version', b.version, 'title', b.title, 'question_type', b.question_type,
        'status', b.review_status, 'needs_semantic_review', b.needs_semantic_review, 'batch_id', b.batch_id,
        'authoring_source', b.authoring ->> 'source', 'imported_at', b.imported_at,
        'validation_passed', coalesce((b.validation_report ->> 'passed')::boolean, false),
        'approval_basis', b.approval_basis, 'approved_by_label', b.approved_by_label)
        order by case b.review_status when 'review_required' then 0 when 'changes_requested' then 1 when 'approved' then 2 when 'validation_failed' then 3 else 4 end, b.id, b.version)
      from public.bank_questions b), '[]'::jsonb),
    'legacy', coalesce((select jsonb_agg(jsonb_build_object(
        'kind', 'activity', 'id', a.id, 'version', a.content_version, 'title', a.title, 'mode', a.mode,
        'activity_type', a.activity_type, 'status', a.review_status, 'human_reviewed', a.human_reviewed,
        'machine_validation', a.reviewed_by)
        order by a.human_reviewed, a.mode, a.id)
      from public.activities a where a.review_status = 'published'), '[]'::jsonb));
end $$;

-- Reviewers can confirm an owner-published item with the full checklist, turning it into a reviewed one.
create or replace function public.staff_confirm_owner_published(p_id text, p_version int, p_notes text, p_checklist jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare b public.bank_questions;
begin
  perform public.require_staff('reviewer');
  select * into b from public.bank_questions where id = p_id and version = p_version for update;
  if b.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if b.approval_basis <> 'owner_instruction' then raise exception 'already_reviewed'; end if;
  if coalesce((p_checklist ->> 'learner_view_checked')::boolean, false) is not true
     or coalesce((p_checklist ->> 'single_answer_confirmed')::boolean, false) is not true
     or coalesce((p_checklist ->> 'age_appropriate')::boolean, false) is not true then raise exception 'checklist_incomplete'; end if;
  if b.needs_semantic_review and coalesce((p_checklist ->> 'semantic_review_done')::boolean, false) is not true then raise exception 'semantic_review_required'; end if;
  update public.bank_questions set approval_basis = 'reviewer', approved_by = auth.uid(), approved_at = now() where id = p_id and version = p_version;
  insert into public.question_reviews (item_kind, item_id, item_version, reviewer_id, decision, notes, checklist)
  values ('bank', p_id, p_version, auth.uid(), 'approve', coalesce(p_notes, ''), p_checklist);
  perform public.audit('bank.confirm_review', 'bank_question', p_id || '@' || p_version);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.staff_confirm_owner_published(text, int, text, jsonb) from public, anon;
