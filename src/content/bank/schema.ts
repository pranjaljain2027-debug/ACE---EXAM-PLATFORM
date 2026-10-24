/**
 * Question bank record format (plan §18.3, §18.6). One JSON object per question version.
 * `payload` is learner-facing and served before answering. `answer_key` is private and served
 * only to staff, or (explanation and rationales only) after a learner submits.
 */
import type { Axis, Cell, Side } from '../../engine/voxel';
import type { ItemPayload } from '../types';

export type ReviewState = 'draft' | 'validation_failed' | 'review_required' | 'approved' | 'published' | 'retired' | 'rejected' | 'changes_requested';

export interface TextOption { id: string; text: string; picture?: string }
export interface VoxelOption { id: string; kind: 'voxel'; cells: Cell[] }
export interface GridOption { id: string; kind: 'grid'; grid: string[] }

export type SpatialTask =
  | { type: 'rotation'; axis: Axis; quarter_turns: number; described_as: string }
  | { type: 'viewpoint'; side: Side; described_as: string }
  | { type: 'reflection'; plane_normal: Axis; described_as: string };

export interface SpatialPayload {
  schema_version: 1;
  family: 'spatial_cube_rotation' | 'spatial_viewpoint' | 'spatial_plane_reflection';
  prompt: string;
  read_aloud?: string;
  hint: string;
  source: { geometry_type: 'voxel_shape'; coordinate_system: 'right_handed_y_up'; occupied_cells: Cell[] };
  task: SpatialTask;
  options: (VoxelOption | GridOption)[];
  interaction: { predict_first: true; exploration: 'after_prediction' };
}

export interface NumberSeriesPayload {
  schema_version: 1;
  family: 'number_series';
  prompt: string;
  read_aloud?: string;
  hint: string;
  sequence: (number | null)[];
  options: TextOption[];
  interaction: { predict_first: false };
}

export interface BalanceScale { left: Record<string, number>; right: Record<string, number> }
export interface NumberPuzzlePayload {
  schema_version: 1;
  family: 'number_puzzle';
  prompt: string;
  read_aloud?: string;
  hint: string;
  scales: BalanceScale[];
  ask: { shape: string; in_terms_of: string };
  options: TextOption[];
  interaction: { predict_first: false };
}

export interface VerbalPayload {
  schema_version: 1;
  family: 'verbal_analogy' | 'verbal_classification';
  prompt: string;
  read_aloud?: string;
  hint: string;
  stem?: { a: string; b: string; c: string };
  options: TextOption[];
  interaction: { predict_first: false };
}

export interface FigurePayload extends ItemPayload {
  schema_version: 1;
  family: 'figure_matrix' | 'figural_analogy' | 'figural_series' | 'figure_classification';
  hint: string;
  read_aloud?: string;
  interaction: { predict_first: false };
}

export type BankPayload = SpatialPayload | NumberSeriesPayload | NumberPuzzlePayload | VerbalPayload | FigurePayload;

export type SeriesRule =
  | { kind: 'arithmetic'; step: number }
  | { kind: 'geometric'; ratio: number }
  | { kind: 'alternating_add'; steps: number[] }
  | { kind: 'growing_add'; first_step: number; step_increase: number };

export interface AnswerKey {
  correct: string;
  explanation: { summary: string; steps: string[] };
  rationales: Record<string, string>; // every option id
  distractor_kinds: Record<string, string>; // every wrong option id
  solution?: { cells?: Cell[]; grid?: string[] };
  rule?: SeriesRule;
  puzzle_solution?: Record<string, number>;
  answer_value?: number;
  semantic_relation?: string;
  /** Figural items: id of the generator rule in src/content/items.ts, so the validator can recompute the answer. */
  figure_rule?: string;
}

export interface BankQuestion {
  id: string;
  version: number;
  question_type: string;
  title: string;
  primary_topic: string;
  secondary_topics: string[];
  exam_alignment: { exam: 'cogat' | 'olsat' | 'nnat'; topic: string; rationale: string }[];
  age_band: string;
  reading_load: 'low' | 'medium' | 'high';
  difficulty: 1 | 2 | 3 | 4 | 5;
  language: 'en-US';
  learning_objective: string;
  accessibility: { relies_on_color: boolean; alt: string; notes?: string };
  transfer_target?: string;
  payload: BankPayload;
  answer_key: AnswerKey;
  authoring: { source: 'hand_authored' | 'deterministic_generator' | 'ai_assisted_draft'; author: string; notes?: string };
}

export interface ValidationIssue { question: string; path: string; rule: string; severity: 'error' | 'warning' }
export interface ValidationReport {
  validator_version: string;
  question: string;
  version: number;
  passed: boolean;
  checks: string[];
  issues: ValidationIssue[];
  needs_semantic_review: boolean;
}
