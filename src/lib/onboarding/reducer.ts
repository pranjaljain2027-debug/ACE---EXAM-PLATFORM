/**
 * The onboarding reducer (U7, R16).
 *
 * All the state transitions live here as one pure function, so the rules about
 * what Back does and what counts as an answer are testable without rendering a
 * single component. The step components become thin: they report a change, and
 * this decides what it means.
 *
 * R16 — "Back navigation never clears answers" — is why the reducer stores one
 * answers object rather than a value per step. Navigating does not touch it at
 * all; only an explicit answer action does. There is no code path where moving
 * backwards can lose something.
 */
import {
  EMPTY_ANSWERS,
  STEP_IDS,
  canAdvance,
  stepIsComplete,
} from "./schema";
import type {
  AgeBand,
  ExperienceLevel,
  GoalOption,
  InterestArea,
  OnboardingAnswers,
  SchedulePreference,
  StepId,
} from "./schema";

/** Everything the flow needs to render. */
export interface OnboardingState {
  /** Index into `STEP_IDS`. */
  readonly stepIndex: number;
  readonly answers: OnboardingAnswers;
  /** Set when Continue is pressed on an incomplete step; cleared on any change. */
  readonly showErrors: boolean;
  readonly completed: boolean;
}

export const INITIAL_STATE: OnboardingState = {
  stepIndex: 0,
  answers: EMPTY_ANSWERS,
  showErrors: false,
  completed: false,
};

export type OnboardingAction =
  | { readonly type: "setAgeBand"; readonly value: AgeBand }
  | { readonly type: "setExperienceLevel"; readonly value: ExperienceLevel }
  | { readonly type: "toggleGoal"; readonly value: GoalOption }
  /**
   * Replace the whole goal list.
   *
   * The step component owns the toggle — it knows what a click on which box
   * means — and reports the resulting list. Dispatching individual toggles from
   * the page instead would mean the page re-implementing the membership rule,
   * which is the duplication this reducer exists to prevent.
   */
  | { readonly type: "setGoals"; readonly values: readonly GoalOption[] }
  | { readonly type: "setSchedulePreference"; readonly value: SchedulePreference }
  | { readonly type: "toggleInterest"; readonly value: InterestArea }
  /** Replace the whole interest list. See `setGoals`. */
  | { readonly type: "setInterests"; readonly values: readonly InterestArea[] }
  | { readonly type: "goNext" }
  | { readonly type: "goBack" }
  | { readonly type: "submit" }
  | { readonly type: "reset" };

/** The step at an index, or the last step when the index is out of range. */
export function stepAt(index: number): StepId {
  return STEP_IDS[index] ?? "begin";
}

/** The current step id. */
export function currentStep(state: OnboardingState): StepId {
  return stepAt(state.stepIndex);
}

/** Whether Back is available. */
export function canGoBack(state: OnboardingState): boolean {
  return state.stepIndex > 0 && !state.completed;
}

/** Whether Continue is available on the current step. */
export function canGoNext(state: OnboardingState): boolean {
  return (
    !state.completed &&
    state.stepIndex < STEP_IDS.length - 1 &&
    canAdvance(currentStep(state), state.answers)
  );
}

/**
 * Toggle a value in a list.
 *
 * Written once because goal and interest both need it, and two hand-rolled
 * copies of "add if absent, remove if present" is how the two end up
 * disagreeing about what a second click does.
 */
function toggle<T>(list: readonly T[], value: T): readonly T[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

/**
 * Apply an action.
 *
 * Every answer action clears `showErrors`, because a parent who has just fixed
 * the problem should not still be looking at the message about it. That is the
 * detail that makes an inline error feel responsive rather than sticky.
 */
export function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction,
): OnboardingState {
  switch (action.type) {
    case "setAgeBand":
      return { ...state, answers: { ...state.answers, ageBand: action.value }, showErrors: false };

    case "setExperienceLevel":
      return {
        ...state,
        answers: { ...state.answers, experienceLevel: action.value },
        showErrors: false,
      };

    case "toggleGoal":
      return {
        ...state,
        answers: { ...state.answers, goals: toggle(state.answers.goals, action.value) },
        showErrors: false,
      };

    case "setGoals":
      return { ...state, answers: { ...state.answers, goals: action.values }, showErrors: false };

    case "setSchedulePreference":
      return {
        ...state,
        answers: { ...state.answers, schedulePreference: action.value },
        showErrors: false,
      };

    case "toggleInterest":
      return {
        ...state,
        answers: { ...state.answers, interests: toggle(state.answers.interests, action.value) },
        showErrors: false,
      };

    case "setInterests":
      return { ...state, answers: { ...state.answers, interests: action.values }, showErrors: false };

    case "goNext": {
      // An incomplete required step shows its errors and does not move. This is
      // the block R16's sibling rule depends on: Continue is disabled in the UI
      // too, but the reducer refuses as well, so a keyboard shortcut or a
      // programmatic dispatch cannot skip past it.
      if (!canGoNext(state)) {
        return { ...state, showErrors: true };
      }
      return { ...state, stepIndex: state.stepIndex + 1, showErrors: false };
    }

    case "goBack":
      // Back never touches `answers` (R16).
      return canGoBack(state)
        ? { ...state, stepIndex: state.stepIndex - 1, showErrors: false }
        : state;

    case "submit":
      // Only the final step can complete, and only if every required step has a
      // value — a parent cannot reach Begin with a gap behind them anyway, but
      // the check makes the invariant explicit rather than assumed.
      const everyRequiredStepAnswered = STEP_IDS.slice(0, -1).every((step) =>
        stepIsComplete(step, state.answers),
      );
      return state.stepIndex === STEP_IDS.length - 1 && everyRequiredStepAnswered
        ? { ...state, completed: true }
        : state;

    case "reset":
      return INITIAL_STATE;
  }
}
