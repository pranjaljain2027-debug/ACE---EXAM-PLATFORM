import type { Difficulty, Domain, ItemPayload, PublicLesson, Skill } from '../content/types';

export interface ActivityMeta {
  id: string;
  content_version: number;
  title: string;
  domain: Domain;
  skill_id: string;
  mode: 'lesson' | 'baseline' | 'practice';
  activity_type: string;
  prerequisites: string[];
  difficulty: Difficulty;
  age_min: number;
  age_max: number;
}

export interface Catalog {
  skills: Skill[];
  lessons: { meta: ActivityMeta; payload: PublicLesson }[];
  items: { meta: ActivityMeta; payload: ItemPayload }[];
}

export interface SessionRow {
  id: string;
  mode: 'lesson' | 'baseline' | 'practice';
  activity_id: string | null;
  state: string;
  item_refs: { id: string; version: number }[];
  timed: boolean;
  time_limit_seconds: number | null;
  checkpoint: Record<string, unknown>;
  started_at: string;
}

export interface ServerAttempt {
  stage: string;
  item_id: string;
  answer: unknown;
  is_correct: boolean | null;
  is_first_attempt: boolean;
  client_event_id: string;
}

export interface SessionStart {
  session: SessionRow;
  resumed: boolean;
  attempts: ServerAttempt[];
  hint_levels: Partial<Record<'discover' | 'apply', number>>;
}

export interface AttemptResult {
  is_correct: boolean | null;
  feedback?: string | null;
  observe_key?: string[] | null;
  is_first_attempt: boolean;
  assisted: boolean;
  independent?: boolean | null;
  duplicate?: boolean;
}

export interface Recommendation {
  kind: string;
  activity_id: string | null;
  reason: string;
}

export interface ItemReview {
  item_id: string;
  answer: unknown;
  skipped: boolean;
  is_correct: boolean;
  correct_option: string;
  explanation: string;
  time_ms: number | null;
}

export interface SessionSummary {
  mode: 'lesson' | 'baseline' | 'practice';
  transfer_outcome?: 'independent' | 'assisted' | 'not_yet';
  discover_hints_used?: boolean;
  items?: ItemReview[];
  correct?: number;
  total?: number;
  answered?: number;
  timed?: boolean;
  provisional?: boolean;
  recommendation?: Recommendation;
  already_completed?: boolean;
}

export interface StudioState {
  child: { id: string; nickname: string; avatar: string; avatar_color: string; age: number; grade: string };
  schedule: { session_minutes: number; reduced_motion: boolean; audio_enabled: boolean } | null;
  baseline_done: boolean;
  completed_lessons: string[];
  independent_lessons: string[];
  open_sessions: { id: string; mode: string; activity_id: string | null; state: string }[];
  recommendation: Recommendation | null;
  discoveries: { activity_id: string; note: string | null; outcome: string; at: string }[];
}

export interface ShapeEvent {
  client_event_id: string;
  type: 'shape_action' | 'stage_view';
  stage?: string;
  detail: { action: string };
}

export interface LearningBackend {
  kind: 'remote' | 'demo';
  catalog(): Promise<Catalog>;
  studioState(childId: string): Promise<StudioState>;
  start(childId: string, mode: 'lesson' | 'baseline' | 'practice', opts?: { activityId?: string; itemIds?: string[]; timed?: boolean }): Promise<SessionStart>;
  advance(sessionId: string, to: string): Promise<void>;
  hint(sessionId: string, stage: 'discover' | 'apply', level: number, eventId: string): Promise<void>;
  submit(sessionId: string, stage: string, itemId: string | null, answer: unknown, eventId: string, timeMs?: number): Promise<AttemptResult>;
  events(sessionId: string, events: ShapeEvent[]): Promise<void>;
  checkpoint(sessionId: string, data: Record<string, unknown>): Promise<void>;
  finish(sessionId: string, reflection?: { note?: string; strategy?: string }): Promise<SessionSummary>;
  practiceItemsForSkill(skillId: string): Promise<string[]>;
}
