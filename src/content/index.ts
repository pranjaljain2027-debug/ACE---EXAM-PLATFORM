import { sceneSignature } from '../engine/geometry';
import { BASELINE_ITEMS, PRACTICE_ITEMS } from './items';
import { LESSONS, SKILLS } from './lessons';
import type { ContentActivity, ItemActivity, ItemKey, ItemPayload, LessonActivity, LessonKey, PublicLesson } from './types';

export { LESSONS, SKILLS, BASELINE_ITEMS, PRACTICE_ITEMS };
export const ALL_CONTENT: ContentActivity[] = [...LESSONS, ...BASELINE_ITEMS, ...PRACTICE_ITEMS];

export const getLesson = (id: string): LessonActivity | undefined => LESSONS.find((l) => l.id === id);
export const getItem = (id: string): ItemActivity | undefined =>
  [...BASELINE_ITEMS, ...PRACTICE_ITEMS].find((i) => i.id === id);

/**
 * Publish validation. Mirrors public.validate_activity on the server, plus checks that need geometry:
 * options must be visually distinct, so no item has two pictures that look the same.
 */
export function validateActivity(a: ContentActivity): string[] {
  const errs: string[] = [];
  if (a.mode === 'lesson') {
    const p = a.payload as PublicLesson;
    const k = a.answer_key as LessonKey;
    if (!p.frames || !p.initialState || !p.targetState || !p.allowedActions || !p.ruleOptions || !p.hints || !p.transferChallenge || !p.observationChoices)
      errs.push('lesson_payload_missing_fields');
    if (p.hints?.length !== 3) errs.push('lesson_needs_three_hint_levels');
    if (!p.ruleOptions?.some((r) => r.id === k.discover.correct)) errs.push('discover_key_not_in_options');
    if (!p.transferChallenge?.options.some((o) => o.id === k.apply.correct)) errs.push('apply_key_not_in_options');
    if (!k.observe.correct.length || k.observe.correct.some((c) => !p.observationChoices.some((o) => o.id === c))) errs.push('observe_key_invalid');
    const sigs = new Set(p.transferChallenge?.options.map((o) => sceneSignature(o.objects)));
    if (sigs.size !== p.transferChallenge?.options.length) errs.push('transfer_options_not_distinct');
  } else {
    const p = a.payload as ItemPayload;
    const k = a.answer_key as ItemKey;
    if (!p.prompt || !p.options) errs.push('item_payload_missing_fields');
    if ((p.options?.length ?? 0) < 3) errs.push('item_needs_three_options');
    if (!p.options?.some((o) => o.id === k.item.correct)) errs.push('item_key_not_in_options');
    const sigs = new Set(p.options?.map((o) => sceneSignature(o.objects)));
    if (sigs.size !== p.options?.length) errs.push('item_options_not_distinct');
  }
  if (/"(isCorrect|isKeyFactor)"/i.test(JSON.stringify(a.payload))) errs.push('answers_leaked_into_public_payload');
  if (a.review_status === 'published' && !a.reviewed_by) errs.push('cannot_publish_unreviewed_content');
  return errs;
}
