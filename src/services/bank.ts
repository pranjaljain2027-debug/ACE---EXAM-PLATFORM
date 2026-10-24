/** Question bank RPCs: learner (predict-first attempts), catalog, staff review pipeline. */
import { supabase } from '../lib/supabase';
import { SUPABASE_URL } from '../config';
import type { BankPayload, ValidationReport } from '../content/bank/schema';

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export interface CatalogTopic { id: string; title: string; types: string[]; published: number }
export interface CatalogSection { id: string; title: string; topics: CatalogTopic[] }
export interface CatalogPath { id: string; title: string; kind: 'exam_prep' | 'general_reasoning'; description: string; sections: CatalogSection[] }

export interface PublicQuestion {
  id: string; version: number; question_type: string; title: string; difficulty: number; age_band: string;
  accessibility: { alt: string; relies_on_color: boolean; notes?: string };
  payload: Omit<BankPayload, 'hint'>; has_hint: boolean;
}
export interface AttemptStart {
  attempt_id: string; question: PublicQuestion;
  state: { predicted: boolean; initial_option: string | null; answered: boolean; hint_count: number };
}
export interface AnswerResult {
  correct: boolean; initial_correct: boolean; chosen: string; correct_option: string;
  explanation: { summary: string; steps: string[] }; rationale_chosen: string; rationale_correct: string;
  transfer: { question_id: string } | null;
}
export interface TopicQuestion { id: string; version: number; title: string; question_type: string; difficulty: number; answered: boolean; solved: boolean }

export const bankApi = {
  catalog: () => rpc<CatalogPath[]>('path_catalog'),
  topicQuestions: (child: string, topic: string) => rpc<TopicQuestion[]>('topic_questions', { p_child: child, p_topic: topic }),
  start: (child: string, question: string, eventId: string, transferOf?: string | null) =>
    rpc<AttemptStart>('qa_start', { p_child: child, p_question: question, p_client_event_id: eventId, p_transfer_of: transferOf ?? null }),
  predict: (attempt: string, option: string) => rpc<{ recorded: boolean }>('qa_predict', { p_attempt: attempt, p_option: option }),
  explore: (attempt: string, actions: number) => rpc('qa_explore', { p_attempt: attempt, p_actions: actions }),
  hint: (attempt: string) => rpc<{ hint: string }>('qa_hint', { p_attempt: attempt }),
  answer: (attempt: string, option: string) => rpc<AnswerResult>('qa_answer', { p_attempt: attempt, p_option: option }),
  evidence: (child: string) => rpc<EvidenceRow[]>('bank_evidence', { p_child: child }),
};

export interface EvidenceRow {
  question_type: string; title: string; answered: number; correct: number; first_prediction_correct: number;
  used_exploration: number; used_hint: number; transfer_attempts: number; transfer_independent: number;
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------
export interface QueueBank { kind: 'bank'; id: string; version: number; title: string; question_type: string; status: string; needs_semantic_review: boolean; batch_id: string; authoring_source: string; imported_at: string; validation_passed: boolean }
export interface QueueLegacy { kind: 'activity'; id: string; version: number; title: string; mode: string; activity_type: string; status: string; human_reviewed: boolean; machine_validation: string }
export interface ReviewHistory { decision: string; notes: string; checklist: Record<string, boolean>; at: string; reviewer: string | null }
export interface CoverageRow { id: string; title: string; domain: string; engine: string; target: number; draft: number; in_review: number; published: number; legacy_live: number; legacy_human_reviewed: number }
export interface ImportResult {
  batch_id: string; dry_run: boolean; total: number; inserted: number; already_imported: number; failed: number; validator_version: string;
  results: { question: string; result: 'ok' | 'failed' | 'already_imported'; errors?: string[]; needs_semantic_review?: boolean }[];
  reports: ValidationReport[];
}

export const staffApi = {
  roles: () => rpc<string[]>('my_staff_roles'),
  queue: () => rpc<{ bank: QueueBank[]; legacy: QueueLegacy[] }>('staff_review_queue'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: (kind: 'bank' | 'activity', id: string, version: number) => rpc<any>('staff_review_item', { p_kind: kind, p_id: id, p_version: version }),
  decide: (id: string, version: number, decision: string, notes: string, checklist: Record<string, boolean>) =>
    rpc('staff_decide', { p_id: id, p_version: version, p_decision: decision, p_notes: notes, p_checklist: checklist }),
  decideActivity: (id: string, version: number, decision: string, notes: string, checklist: Record<string, boolean>) =>
    rpc('staff_decide_activity', { p_id: id, p_version: version, p_decision: decision, p_notes: notes, p_checklist: checklist }),
  publish: (id: string, version: number) => rpc('staff_publish', { p_id: id, p_version: version }),
  retire: (id: string, version: number, notes: string) => rpc('staff_retire', { p_id: id, p_version: version, p_notes: notes }),
  rollback: (id: string, toVersion: number, notes: string) => rpc('staff_rollback', { p_id: id, p_to_version: toVersion, p_notes: notes }),
  coverage: () => rpc<CoverageRow[]>('content_coverage'),
  exportJson: (status: string | null) => rpc<unknown[]>('staff_export', { p_status: status }),
  async importBatch(batch: { batch_id: string; questions: unknown[] }, dryRun: boolean): Promise<ImportResult> {
    const { data: s } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/bank-import`, {
      method: 'POST',
      headers: { authorization: `Bearer ${s.session?.access_token ?? ''}`, 'content-type': 'application/json' },
      body: JSON.stringify({ ...batch, dry_run: dryRun }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? `import_failed_${res.status}`);
    return body as ImportResult;
  },
};
