import { describe, expect, it } from "vitest";
import {
  INITIAL_STATE,
  canGoBack,
  canGoNext,
  currentStep,
  onboardingReducer,
} from "./reducer";
import type { OnboardingAction, OnboardingState } from "./reducer";
import { EMPTY_ANSWERS, canAdvance, missingFields, stepIsComplete } from "./schema";
import type { OnboardingAnswers, StepId } from "./schema";

/** Apply a list of actions from the initial state. */
function run(actions: readonly OnboardingAction[], from: OnboardingState = INITIAL_STATE) {
  return actions.reduce(onboardingReducer, from);
}

/** Every required answer, so navigation can be exercised past the gate. */
const FILLED: OnboardingAnswers = {
  ageBand: "developing",
  experienceLevel: "some_experience",
  goals: ["build_confidence"],
  schedulePreference: "evenings",
  interests: [],
};

describe("step completion", () => {
  it("requires a value on every required step", () => {
    for (const step of ["age", "experience", "goal", "schedule"] as const) {
      expect(stepIsComplete(step, EMPTY_ANSWERS)).toBe(false);
    }
  });

  it("never requires interests (R18)", () => {
    // The requirement is unconditional: step 5 always offers Skip. Asserted
    // against an empty answer set, which is exactly the Skip case.
    expect(stepIsComplete("interests", EMPTY_ANSWERS)).toBe(true);
    expect(canAdvance("interests", EMPTY_ANSWERS)).toBe(true);
    expect(missingFields("interests", EMPTY_ANSWERS)).toEqual([]);
  });

  it("accepts 'not sure yet' as a goal rather than treating it as no answer (spec §5.2)", () => {
    expect(stepIsComplete("goal", { ...EMPTY_ANSWERS, goals: ["not_sure_yet"] })).toBe(true);
  });

  it("reports what is missing, per step, and nothing for the optional ones", () => {
    expect(missingFields("goal", EMPTY_ANSWERS)).toHaveLength(1);
    expect(missingFields("begin", EMPTY_ANSWERS)).toEqual([]);
  });
});

describe("answering", () => {
  it("records a choice and clears a pending error", () => {
    const errored = run([{ type: "goNext" }]);
    expect(errored.showErrors).toBe(true);

    const answered = run([{ type: "setAgeBand", value: "developing" }], errored);

    expect(answered.answers.ageBand).toBe("developing");
    expect(answered.showErrors).toBe(false);
  });

  it("toggles a goal on and off", () => {
    const once = run([{ type: "toggleGoal", value: "build_confidence" }]);
    expect(once.answers.goals).toEqual(["build_confidence"]);

    const twice = run([{ type: "toggleGoal", value: "build_confidence" }], once);
    expect(twice.answers.goals).toEqual([]);
  });

  it("toggles an interest without touching goals", () => {
    const state = run([
      { type: "toggleGoal", value: "build_confidence" },
      { type: "toggleInterest", value: "patterns_shapes" },
    ]);

    expect(state.answers.interests).toEqual(["patterns_shapes"]);
    expect(state.answers.goals).toEqual(["build_confidence"]);
  });
});

describe("the gate on Continue", () => {
  it("blocks Continue on an incomplete required step and shows the reason", () => {
    const state = run([{ type: "goNext" }]);

    expect(state.stepIndex).toBe(0);
    expect(state.showErrors).toBe(true);
  });

  it("advances once the step is answered", () => {
    const state = run([
      { type: "setAgeBand", value: "developing" },
      { type: "goNext" },
    ]);

    expect(state.stepIndex).toBe(1);
    expect(currentStep(state)).toBe("experience");
  });

  it("skips straight through the optional interests step", () => {
    // Answer then advance, one step at a time — advancing while the current
    // step is unanswered is what the gate is for.
    const state = run([
      { type: "setAgeBand", value: "developing" },
      { type: "goNext" },
      { type: "setExperienceLevel", value: "some_experience" },
      { type: "goNext" },
      { type: "toggleGoal", value: "build_confidence" },
      { type: "goNext" },
      { type: "setSchedulePreference", value: "any_time" },
      { type: "goNext" },
    ]);

    expect(currentStep(state)).toBe("interests");
    expect(canGoNext(state)).toBe(true);
    // No interest has been chosen and Continue still works — that is Skip.
    expect(state.answers.interests).toEqual([]);
  });
});

describe("Back navigation (R16)", () => {
  const atSchedule = run([
    { type: "setAgeBand", value: "developing" },
    { type: "setExperienceLevel", value: "some_experience" },
    { type: "toggleGoal", value: "build_confidence" },
    { type: "setSchedulePreference", value: "evenings" },
  ]);

  it("never clears answers, however far back it goes (AE5)", () => {
    let state = atSchedule;
    // Walk all the way back to the first step.
    for (let step = 0; step < 4; step += 1) {
      state = run([{ type: "goBack" }], state);
    }

    expect(state.stepIndex).toBe(0);
    expect(state.answers).toEqual(FILLED);
  });

  it("does not go back past the first step", () => {
    const state = run([{ type: "goBack" }]);

    expect(state.stepIndex).toBe(0);
    expect(canGoBack(state)).toBe(false);
  });

  it("leaves the answers editable after going back", () => {
    const back = run([{ type: "goBack" }, { type: "goBack" }], atSchedule);
    const edited = run([{ type: "setAgeBand", value: "advanced" }], back);

    expect(edited.answers.ageBand).toBe("advanced");
    // The other answers survive the edit.
    expect(edited.answers.goals).toEqual(["build_confidence"]);
  });
});

describe("completion", () => {
  const atBegin = run([
    { type: "setAgeBand", value: "developing" },
    { type: "goNext" },
    { type: "setExperienceLevel", value: "some_experience" },
    { type: "goNext" },
    { type: "toggleGoal", value: "build_confidence" },
    { type: "goNext" },
    { type: "setSchedulePreference", value: "evenings" },
    { type: "goNext" },
    { type: "goNext" },
  ]);

  it("reaches the final step and cannot go past it", () => {
    expect(currentStep(atBegin)).toBe("begin");
    expect(canGoNext(atBegin)).toBe(false);
  });

  it("completes with every required answer present", () => {
    expect(onboardingReducer(atBegin, { type: "submit" }).completed).toBe(true);
  });

  it("refuses to complete from a step that is not the last", () => {
    const early = run([
      { type: "setAgeBand", value: "developing" },
      { type: "setExperienceLevel", value: "some_experience" },
    ]);

    expect(onboardingReducer(early, { type: "submit" }).completed).toBe(false);
  });

  it("resets everything", () => {
    const done = onboardingReducer(atBegin, { type: "submit" });

    expect(onboardingReducer(done, { type: "reset" })).toEqual(INITIAL_STATE);
  });
});

describe("privacy of the collected record (R17, R20)", () => {
  it("stores an age band and nothing that could identify a child", () => {
    const state = run([
      { type: "setAgeBand", value: "developing" },
      { type: "setExperienceLevel", value: "some_experience" },
      { type: "toggleGoal", value: "build_confidence" },
      { type: "setSchedulePreference", value: "evenings" },
      { type: "toggleInterest", value: "patterns_shapes" },
    ]);

    const keys = Object.keys(state.answers);

    // The whole collected surface, spelled out. A name or a date of birth
    // appearing here is the requirement failing, and this test is what makes
    // that visible at the point someone adds a field.
    expect(keys.sort()).toEqual([
      "ageBand",
      "experienceLevel",
      "goals",
      "interests",
      "schedulePreference",
    ]);

    const serialised = JSON.stringify(state.answers);
    expect(serialised).not.toMatch(/name|birth|dob|dateOfBirth/i);
  });
});

describe("every step is reachable and labelled", () => {
  it("knows a valid step for every index the reducer can produce", () => {
    for (let index = 0; index <= 5; index += 1) {
      const step: StepId = currentStep({ ...INITIAL_STATE, stepIndex: index });
      expect(["age", "experience", "goal", "schedule", "interests", "begin"]).toContain(step);
    }
  });
});
