/**
 * The onboarding flow (U7, R16, R18).
 *
 * A stepper, not a survey: six short screens, one question each.
 *
 * The page owns the reducer and nothing else. Every rule about what counts as an
 * answer, whether Continue is allowed, and what Back does to the answers lives in
 * `src/lib/onboarding/reducer.ts` as a pure function — which is why those rules
 * could be tested without rendering this component at all.
 *
 * Persistence is deliberately not here. The answers live in reducer state for the
 * life of the visit; a real store would be introduced when the flow is wired to
 * the accounts that U6 built. Adding a persistence layer now would mean writing
 * and then discarding a serialisation format nobody has a use for yet.
 */
"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { STEP_IDS, STEP_LABELS, canAdvance, missingFields } from "@/lib/onboarding/schema";
import {
  INITIAL_STATE,
  canGoBack,
  currentStep,
  onboardingReducer,
} from "@/lib/onboarding/reducer";
import {
  AgeStep,
  BeginStep,
  ExperienceStep,
  GoalStep,
  InterestsStep,
  ScheduleStep,
} from "./steps";

export default function OnboardingPage() {
  const [state, dispatch] = useReducer(onboardingReducer, INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const step = currentStep(state);
  const errors = state.showErrors ? missingFields(step, state.answers) : [];

  async function handleSubmit() {
    setSubmitting(true);
    // The child profile is not persisted in this build — there is no
    // authenticated parent account to attach it to yet, and writing one to
    // browser storage would be a record of a child's details with no owner and
    // no way to delete it. Routing to the dashboard shows where the answers
    // lead, and the launch checklist records this as outstanding.
    router.push("/parent");
  }

  return (
    <main className="onboarding-page" aria-labelledby="onboarding-title">
      <h1 id="onboarding-title" className="ui-visually-hidden">
        Set up Heir of Wisdom for your child
      </h1>

      <nav aria-label="Setup progress">
        <ol className="onboarding-progress">
          {STEP_IDS.map((id, index) => {
            const isCurrent = index === state.stepIndex;
            const isDone = index < state.stepIndex;
            return (
              <li
                key={id}
                className={isCurrent ? "is-current" : isDone ? "is-done" : undefined}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span className="onboarding-progress__label">{STEP_LABELS[id]}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {step === "age" && (
        <AgeStep
          value={state.answers.ageBand}
          onSelect={(value) => dispatch({ type: "setAgeBand", value })}
          errors={errors}
        />
      )}

      {step === "experience" && (
        <ExperienceStep
          value={state.answers.experienceLevel}
          onSelect={(value) => dispatch({ type: "setExperienceLevel", value })}
          errors={errors}
        />
      )}

      {step === "goal" && (
        <GoalStep
          values={state.answers.goals}
          onChange={(values) => dispatch({ type: "setGoals", values })}
          errors={errors}
        />
      )}

      {step === "schedule" && (
        <ScheduleStep
          value={state.answers.schedulePreference}
          onSelect={(value) => dispatch({ type: "setSchedulePreference", value })}
          errors={errors}
        />
      )}

      {step === "interests" && (
        <InterestsStep
          values={state.answers.interests}
          onChange={(values) => dispatch({ type: "setInterests", values })}
          onSkip={() => dispatch({ type: "goNext" })}
          errors={[]}
        />
      )}

      {step === "begin" && (
        <BeginStep
          ageBand={state.answers.ageBand}
          experienceLevel={state.answers.experienceLevel}
          goals={state.answers.goals}
          schedulePreference={state.answers.schedulePreference}
          interestCount={state.answers.interests.length}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {step !== "begin" && (
        <footer className="onboarding-nav">
          <button
            type="button"
            onClick={() => dispatch({ type: "goBack" })}
            disabled={!canGoBack(state)}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "goNext" })}
            // The button is disabled on an incomplete required step *and* the
            // reducer refuses to advance. Both, because a disabled button can be
            // bypassed by a keyboard shortcut or a dispatched action, and a
            // disabled control with no explanation is worse than an error the
            // parent can read.
            disabled={!canAdvance(step, state.answers)}
          >
            Continue
          </button>
        </footer>
      )}
    </main>
  );
}
