import type {
  ActivityFormat,
  AllowedAction,
  HintItem,
  PatternFrame,
  VisualObject,
} from '../types/reasoning';

export type Domain = 'rotation' | 'reflection' | 'progression' | 'attributes';
export type ContentMode = 'lesson' | 'baseline' | 'practice';
export type ActivityType = 'sequence' | 'matrix' | 'analogy' | 'classification' | 'transformation';
export type AssessmentTag = 'cogat_nonverbal' | 'olsat_nonverbal' | 'nnat' | 'general';

export interface Difficulty {
  rule_count: number;
  reasoning_steps: number;
  distractor_complexity: number;
}

/** Lesson content as served to the browser: no correct flags, no per-option explanations. */
export interface PublicLesson {
  id: string;
  title: string;
  moduleId: Domain;
  moduleTitle: string;
  subskillId: string;
  subskillTitle: string;
  activityFormat: ActivityFormat;
  promptText: string;
  observationPrompt: string;
  observationChoices: { id: string; label: string; category: string }[];
  frames: PatternFrame[];
  missingFrameIndex: number;
  initialState: VisualObject[];
  targetState: VisualObject[];
  allowedActions: AllowedAction[];
  ruleOptions: { id: string; label: string }[];
  hints: HintItem[];
  explanationSteps: string[];
  transferChallenge: {
    id: string;
    prompt: string;
    frames: PatternFrame[];
    missingIndex: number;
    options: { id: string; objects: VisualObject[] }[];
  };
  pedagogicalTakeaway: string;
}

export interface ChoiceKey {
  correct: string;
  feedback: Record<string, string>;
  misconceptions: Record<string, string>;
  explanation?: string;
}

export interface LessonKey {
  observe: { correct: string[]; feedback: Record<string, string> };
  discover: ChoiceKey;
  apply: ChoiceKey;
}

export type ItemStem =
  | { kind: 'matrix'; cols: number; cells: (VisualObject[] | null)[] }
  | { kind: 'analogy'; a: VisualObject[]; b: VisualObject[]; c: VisualObject[] }
  | { kind: 'sequence'; frames: (VisualObject[] | null)[] }
  | { kind: 'classification' };

/** Practice and baseline items: original multiple-choice figural items. */
export interface ItemPayload {
  prompt: string;
  stem: ItemStem;
  options: { id: string; objects: VisualObject[]; label?: string }[];
}

export interface ItemKey {
  item: ChoiceKey & { explanation: string };
}

export interface ContentActivity<P = PublicLesson | ItemPayload, K = LessonKey | ItemKey> {
  id: string;
  content_version: number;
  title: string;
  domain: Domain;
  skill_id: string;
  subskills: string[];
  assessment_tags: AssessmentTag[];
  mode: ContentMode;
  activity_type: ActivityType;
  age_min: number;
  age_max: number;
  prerequisites: string[]; // skill ids
  difficulty: Difficulty;
  payload: P;
  answer_key: K;
  accessibility_metadata: { alt: string; colorIndependent: boolean };
  review_status: 'draft' | 'in_review' | 'approved' | 'published' | 'retired';
  reviewed_by?: string;
}

export type LessonActivity = ContentActivity<PublicLesson, LessonKey>;
export type ItemActivity = ContentActivity<ItemPayload, ItemKey>;

export interface Skill {
  id: string;
  domain: Domain;
  title: string;
  description: string;
  prerequisites: string[];
  assessment_tags: AssessmentTag[];
  sort_order: number;
}
