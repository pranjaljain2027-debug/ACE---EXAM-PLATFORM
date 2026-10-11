/**
 * Parent records and child records (R17, R20, R21).
 *
 * A child's record is deliberately narrow. It holds an age band rather than a
 * date of birth, never a full legal name, and nothing that is not needed to
 * deliver practice. That limit is the product's privacy posture expressed as a
 * type: adding a field to `ChildRecord` is a visible change to what the product
 * stores about children.
 */

/** An age band, never a date of birth (R17). */
export type AgeBand = "introductory" | "developing" | "advanced";

export type ExperienceLevel =
  | "new_to_reasoning"
  | "some_experience"
  | "regular_practiser";

export type GoalOption =
  | "improve_problem_solving"
  | "enhance_logical_thinking"
  | "build_confidence"
  | "prepare_assessment"
  | "not_sure_yet";

export type SchedulePreference = "mornings" | "afternoons" | "evenings" | "any_time";

export type InterestArea =
  | "patterns_shapes"
  | "logic_and_sequence"
  | "verbal_reasoning"
  | "numerical_patterns";

/** Mirrors `ReasoningCategory` from the question content model (U8). */
export type ReasoningCategory = "nonverbal" | "quantitative" | "verbal";

/** The parent account. Holds contact details and preferences only. */
export interface ParentSession {
  readonly id: string;
  readonly email: string;
  /**
   * True when this session is running against the demo data source. The UI
   * surfaces this rather than treating it as a real account (KTD6).
   */
  readonly demoMode: boolean;
  readonly childIds: readonly string[];
  readonly createdAt: Date;
  readonly lastActiveAt: Date;
}

/**
 * A child's record.
 *
 * No name and no date of birth. The parent names the child in conversation; the
 * product does not need to store it and does not (R17).
 */
export interface ChildRecord {
  readonly id: string;
  readonly parentId: string;
  readonly ageBand: AgeBand;
  readonly experienceLevel: ExperienceLevel;
  readonly goals: readonly GoalOption[];
  readonly schedulePreference: SchedulePreference;
  readonly interests: readonly InterestArea[];
  readonly createdAt: Date;
  readonly lastActiveAt: Date;
}

/**
 * One recorded answer.
 *
 * `correct` is stored rather than recomputed on read, because the question key
 * can change when content is corrected and a re-derived score would then
 * disagree with what the child actually saw at the time.
 */
export interface PracticeResponse {
  readonly questionId: string;
  readonly selectedChoiceId: string;
  /** The reasoning area the question belongs to, recorded at answer time. */
  readonly reasoningCategory: ReasoningCategory;
  /** Whether the selected choice matched the question's key at answer time. */
  readonly correct: boolean;
  readonly answeredAt: Date;
}
