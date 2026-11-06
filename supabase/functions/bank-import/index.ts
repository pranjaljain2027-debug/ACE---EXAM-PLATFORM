// bank-import: staff-only question batch import (dry run by default).
// Runs the same TypeScript validator as the CLI (bundled in validator.js), then hands the batch and the
// reports to public.bank_import_batch with the service role. Browsers cannot call that SQL function directly,
// so a validation report cannot be forged client-side.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { validateBatch, VALIDATOR_VERSION } from './validator.js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const auth = req.headers.get('authorization') ?? '';

  const asUser = createClient(url, anon, { global: { headers: { authorization: auth } }, auth: { persistSession: false } });
  const { data: userData, error: userErr } = await asUser.auth.getUser();
  if (userErr || !userData?.user) return json(401, { error: 'not_authenticated' });
  const { data: roles, error: roleErr } = await asUser.rpc('my_staff_roles');
  if (roleErr) return json(500, { error: 'role_check_failed' });
  if (!Array.isArray(roles) || !roles.some((r: string) => ['author', 'reviewer', 'admin'].includes(r))) return json(403, { error: 'staff_role_required' });

  let body: { batch_id?: string; questions?: unknown[]; dry_run?: boolean };
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }); }
  const questions = body.questions;
  if (!Array.isArray(questions) || !questions.length) return json(400, { error: 'questions_required' });
  if (questions.length > 500) return json(413, { error: 'max_500_questions_per_batch' });
  const batchId = String(body.batch_id ?? '').trim();
  if (!/^[a-z0-9][a-z0-9._-]{2,80}$/i.test(batchId)) return json(400, { error: 'batch_id_required' });
  const dryRun = body.dry_run !== false;

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: existing } = await admin.from('bank_questions').select('id, version');

  // deno-lint-ignore no-explicit-any
  const result = validateBatch(questions as any, existing ?? []);
  // Fold batch-level errors into the per-question reports so the importer sees them.
  const reports = result.reports.map((r) => {
    const extra = result.batchIssues.filter((i) => i.question === r.question);
    const issues = [...r.issues, ...extra];
    return { ...r, issues, passed: r.passed && !extra.some((i) => i.severity === 'error') };
  });

  const { data, error } = await admin.rpc('bank_import_batch', {
    p_questions: questions, p_reports: reports, p_batch_id: batchId, p_dry_run: dryRun, p_actor: userData.user.id,
  });
  if (error) return json(400, { error: error.message, validator_version: VALIDATOR_VERSION });
  return json(200, { ...data, validator_version: VALIDATOR_VERSION, reports });
});
