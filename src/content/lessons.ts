import { ACTIVITIES } from '../data/activities';
import { CURRICULUM_MODULES } from '../data/modules';
import type { ReasoningActivity } from '../types/reasoning';
import type { AssessmentTag, Domain, LessonActivity, PublicLesson, Skill } from './types';

export const CONTENT_VERSION = 1;
/** Lessons revised after first publish. Published content is immutable, so a fix ships as a new version. */
export const LESSON_VERSIONS: Record<string, number> = {
  'ref-101': 2, // crescent replaced by a chiral flag: a mirrored crescent equals a half turn
  'ref-102': 2, // transfer uses the chiral flag
  'ref-103': 2, // chiral test rebuilt with flag and L-shape; transfer puzzle had the answer already shown
};
export const REVIEWER = 'heir-content-review:2026-10-24';

export const DOMAIN_TAGS: Record<Domain, AssessmentTag[]> = {
  rotation: ['cogat_nonverbal', 'nnat', 'general'],
  reflection: ['cogat_nonverbal', 'olsat_nonverbal', 'nnat', 'general'],
  progression: ['cogat_nonverbal', 'olsat_nonverbal', 'nnat', 'general'],
  attributes: ['cogat_nonverbal', 'olsat_nonverbal', 'nnat', 'general'],
};

const SKILL_PREREQS: Record<string, string[]> = {
  'rot-quarter-ccw': ['rot-quarter-cw'],
  'rot-half-turn': ['rot-quarter-cw'],
  'rot-incremental-45': ['rot-quarter-ccw', 'rot-half-turn'],
  'ref-vertical': ['ref-horizontal'],
  'ref-vs-rotation': ['ref-horizontal', 'rot-quarter-cw'],
  'ref-compound-axis': ['ref-horizontal', 'ref-vertical'],
  'prog-size-scale': ['prog-count-step'],
  'prog-position-orbit': ['prog-count-step'],
  'prog-alternating': ['prog-count-step'],
  'attr-shape-substitution': ['attr-color-cycle'],
  'attr-dual-conjunction': ['attr-color-cycle', 'rot-quarter-cw'],
  'attr-distractor-filter': ['attr-color-cycle'],
};

export const SKILLS: Skill[] = CURRICULUM_MODULES.flatMap((m, mi) =>
  m.subskills.map((s, si) => ({
    id: s.id,
    domain: m.id as Domain,
    title: s.title,
    description: s.description,
    prerequisites: SKILL_PREREQS[s.id] ?? [],
    assessment_tags: DOMAIN_TAGS[m.id as Domain],
    sort_order: mi * 10 + si,
  })),
);

export { DOMAIN_TITLES } from './lessonsMeta';

/** Heuristic misconception tags for the original lesson options, reviewed by hand. */
function misconceptionFor(label: string, explanation: string): string {
  const t = `${label} ${explanation}`.toLowerCase();
  if (/(flip|mirror|upside)/.test(t)) return 'confuses_reflection_and_rotation';
  if (/(counter|backward|left instead|wrong way|opposite direction)/.test(t)) return 'wrong_direction';
  if (/(random|no rule|chance)/.test(t)) return 'sees_no_rule';
  if (/(identical|same as step|no rotation applied|unchanged|did not change|repeat)/.test(t)) return 'no_change_applied';
  if (/(skip|too far|twice|overshoot)/.test(t)) return 'wrong_step_size';
  if (/(colou?r)/.test(t)) return 'tracks_wrong_attribute';
  return 'partial_rule';
}

export function toLessonActivity(a: ReasoningActivity): LessonActivity {
  const payload: PublicLesson = {
    id: a.id,
    title: a.title,
    moduleId: a.moduleId,
    moduleTitle: a.moduleTitle,
    subskillId: a.subskillId,
    subskillTitle: a.subskillTitle,
    activityFormat: a.activityFormat,
    promptText: a.promptText,
    observationPrompt: a.observationPrompt,
    observationChoices: a.observationChoices.map(({ id, label, category }) => ({ id, label, category })),
    frames: a.frames,
    missingFrameIndex: a.missingFrameIndex,
    initialState: a.initialState,
    targetState: a.targetState,
    allowedActions: a.allowedActions,
    ruleOptions: a.ruleOptions.map(({ id, label }) => ({ id, label })),
    hints: a.hints,
    explanationSteps: a.explanationSteps,
    transferChallenge: {
      id: a.transferChallenge.id,
      prompt: a.transferChallenge.prompt,
      frames: a.transferChallenge.frames,
      missingIndex: a.transferChallenge.missingIndex,
      options: a.transferChallenge.options.map(({ id, objects }) => ({ id, objects })),
    },
    pedagogicalTakeaway: a.pedagogicalTakeaway,
  };

  const rule = a.ruleOptions.find((r) => r.isCorrect)!;
  const opt = a.transferChallenge.options.find((o) => o.isCorrect)!;
  const ruleCount = a.difficulty >= 3 && a.moduleId === 'attributes' ? 2 : 1;

  return {
    id: a.id,
    content_version: LESSON_VERSIONS[a.id] ?? CONTENT_VERSION,
    title: a.title,
    domain: a.moduleId,
    skill_id: a.subskillId,
    subskills: [a.subskillId],
    assessment_tags: DOMAIN_TAGS[a.moduleId],
    mode: 'lesson',
    activity_type: a.activityFormat,
    age_min: a.ageBand === '8-10' ? 8 : 10,
    age_max: a.ageBand === '8-10' ? 10 : 12,
    prerequisites: SKILL_PREREQS[a.subskillId] ?? [],
    difficulty: { rule_count: ruleCount, reasoning_steps: Math.min(3, a.difficulty), distractor_complexity: Math.min(3, a.difficulty) },
    payload,
    answer_key: {
      observe: {
        correct: a.observationChoices.filter((c) => c.isKeyFactor).map((c) => c.id),
        feedback: Object.fromEntries(
          a.observationChoices.map((c) => [c.id, c.isKeyFactor ? 'Yes, that changes from step to step.' : 'Look again. Does this really change?']),
        ),
      },
      discover: {
        correct: rule.id,
        feedback: Object.fromEntries(a.ruleOptions.map((r) => [r.id, r.explanation])),
        misconceptions: Object.fromEntries(a.ruleOptions.filter((r) => !r.isCorrect).map((r) => [r.id, misconceptionFor(r.label, r.explanation)])),
      },
      apply: {
        correct: opt.id,
        feedback: Object.fromEntries(a.transferChallenge.options.map((o) => [o.id, o.explanation])),
        misconceptions: Object.fromEntries(
          a.transferChallenge.options.filter((o) => !o.isCorrect).map((o) => [o.id, misconceptionFor('', o.explanation)]),
        ),
      },
    },
    accessibility_metadata: { alt: `${a.title}: ${a.promptText}`, colorIndependent: !a.allowedActions.includes('change-color') },
    review_status: 'published',
    reviewed_by: REVIEWER,
  };
}

export const LESSONS: LessonActivity[] = ACTIVITIES.map(toLessonActivity);
