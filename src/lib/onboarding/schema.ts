/**
 * The onboarding data model (U7, R16, R17, R18).
 *
 * Pure types and pure validators. The step components know how to collect a
 * value; this file knows what a valid value is and which steps require one. That
 * split is what makes the requirements testable without rendering anything: R18
 * in particular ("interests are never required") is a rule about data, not about
 * a button's disabled state, so it lives here where a test can reach it.
 *
 * Age is a band, never a date of birth (R17). There is no field in this file a
 * birth date could be stored in, which is the point of expressing the limit as a
 * type rather than as a validation rule someone could forget.
 */

/** An age band. Not a date of birth, not an age in years (R17). */
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

export type SchedulePreference =
  | "mornings"
  | "afternoons"
  | "evenings"
  | "any_time";

export type InterestArea =
  | "patterns_shapes"
  | "logic_and_sequence"
  | "verbal_reasoning"
  | "numerical_patterns";

/** The steps, in the order spec §5.1 confirms. */
export const STEP_IDS = [
  "age",
  "experience",
  "goal",
  "schedule",
  "interests",
  "begin",
] as const;

export type StepId = (typeof STEP_IDS)[number];

/**
 * Steps that block Continue until answered.
 *
 * Interests is absent, and its absence is the requirement: R18 says it must
 * always be skippable. Keeping the list here rather than inferring it from the
 * step order means a future step cannot become required by accident.
 */
export const REQUIRED_STEPS: readonly StepId[] = ["age", "experience", "goal", "schedule"];

/** Everything onboarding collects. Nothing beyond this list is stored (R20). */
export interface OnboardingAnswers {
  readonly ageBand: AgeBand | null;
  readonly experienceLevel: ExperienceLevel | null;
  readonly goals: readonly GoalOption[];
  readonly schedulePreference: SchedulePreference | null;
  readonly interests: readonly InterestArea[];
}

/** The initial state: nothing chosen, on the first step. */
export const EMPTY_ANSWERS: OnboardingAnswers = {
  ageBand: null,
  experienceLevel: null,
  goals: [],
  schedulePreference: null,
  interests: [],
};

/**
 * Whether a step has enough input to continue past.
 *
 * `age` and `experience` and `schedule` are single-choice, so a value is the
 * requirement. `goal` is multi-choice and needs at least one — which includes
 * "not sure yet", because spec §5.2 requires that to be a valid answer rather
 * than a way of failing to answer.
 *
 * `interests` returns true unconditionally, and `begin` always returns true.
 */
export function stepIsComplete(step: StepId, answers: OnboardingAnswers): boolean {
  switch (step) {
    case "age":
      return answers.ageBand !== null;
    case "experience":
      return answers.experienceLevel !== null;
    case "goal":
      return answers.goals.length > 0;
    case "schedule":
      return answers.schedulePreference !== null;
    case "interests":
      return true;
    case "begin":
      return true;
  }
}

/** Whether Continue should be enabled on a step. */
export function canAdvance(step: StepId, answers: OnboardingAnswers): boolean {
  return !REQUIRED_STEPS.includes(step) || stepIsComplete(step, answers);
}

/** The human-readable label for a step, used by the progress indicator. */
export const STEP_LABELS: Readonly<Record<StepId, string>> = {
  age: "Age",
  experience: "Experience",
  goal: "Goal",
  schedule: "Schedule",
  interests: "Interests",
  begin: "Begin",
};

/**
 * The fields a step is missing, for inline validation.
 *
 * Empty for interests and begin, so the error summary never tells a parent they
 * have not filled in something that was optional.
 */
export function missingFields(step: StepId, answers: OnboardingAnswers): readonly string[] {
  switch (step) {
    case "age":
      return answers.ageBand === null ? ["Select an age band to continue."] : [];
    case "experience":
      return answers.experienceLevel === null
        ? ["Select an experience level to continue."]
        : [];
    case "goal":
      return answers.goals.length === 0 ? ["Select at least one goal to continue."] : [];
    case "schedule":
      return answers.schedulePreference === null
        ? ["Select a practice schedule to continue."]
        : [];
    case "interests":
    case "begin":
      return [];
  }
}
