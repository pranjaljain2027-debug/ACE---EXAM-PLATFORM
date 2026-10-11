/**
 * The six onboarding steps (U7, R17, R18).
 *
 * Every step is a pure function of its props: it renders what it is given and
 * reports what the parent chose. None of them advances, validates, or holds
 * state — that all lives in the reducer, which is why the rules could be tested
 * without rendering anything.
 *
 * The props are uniform by design. The single-choice steps share one shape and
 * the multi-choice steps share another, because the previous version of this
 * flow gave every step a slightly different `onChange` signature and the page
 * could not satisfy all of them at once.
 */
"use client";

import { ChoiceStep, MultiChoiceStep, StepShell } from "./StepShell";
import type { StepProps } from "./StepShell";
import type {
  AgeBand,
  ExperienceLevel,
  GoalOption,
  InterestArea,
  SchedulePreference,
} from "@/lib/onboarding/schema";

const AGE_CHOICES = [
  { value: "introductory" as const, label: "Introductory", hint: "Ages 6–8" },
  { value: "developing" as const, label: "Developing", hint: "Ages 9–12" },
  { value: "advanced" as const, label: "Advanced", hint: "Ages 13–15" },
] as const;

const EXPERIENCE_CHOICES = [
  { value: "new_to_reasoning" as const, label: "New to reasoning practice" },
  { value: "some_experience" as const, label: "Some experience" },
  { value: "regular_practiser" as const, label: "Regularly practises" },
] as const;

const GOAL_CHOICES = [
  { value: "improve_problem_solving" as const, label: "Improve problem solving" },
  { value: "enhance_logical_thinking" as const, label: "Strengthen logical thinking" },
  { value: "build_confidence" as const, label: "Build confidence" },
  { value: "prepare_assessment" as const, label: "Prepare for an assessment" },
  // Spec §5.2 requires this to be a valid answer, not a way of failing to
  // answer — which is why it sits in the same list as the others rather than
  // being a separate escape hatch below them.
  { value: "not_sure_yet" as const, label: "Not sure yet" },
] as const;

const SCHEDULE_CHOICES = [
  { value: "mornings" as const, label: "Mornings" },
  { value: "afternoons" as const, label: "Afternoons" },
  { value: "evenings" as const, label: "Evenings" },
  { value: "any_time" as const, label: "Any time works" },
] as const;

const INTEREST_CHOICES = [
  { value: "patterns_shapes" as const, label: "Patterns and shapes" },
  { value: "logic_and_sequence" as const, label: "Logic and sequence" },
  { value: "verbal_reasoning" as const, label: "Words and meaning" },
  { value: "numerical_patterns" as const, label: "Number patterns" },
] as const;

/** Toggle membership in a list. Pure, and shared by both multi-choice steps. */
function toggle<T>(current: readonly T[], value: T): readonly T[] {
  return current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value];
}

export function AgeStep({
  value,
  onSelect,
  errors,
}: StepProps & {
  readonly value: AgeBand | null;
  readonly onSelect: (value: AgeBand) => void;
}) {
  return (
    <StepShell
      titleId="onboarding-age-title"
      heading="How old is your child?"
      intro="We ask for an age band rather than a date of birth. Heir of Wisdom does not store your child's date of birth."
      errors={errors}
    >
      <ChoiceStep
        name="ageBand"
        legend="Age band"
        value={value}
        choices={AGE_CHOICES}
        onSelect={onSelect}
      />
    </StepShell>
  );
}

export function ExperienceStep({
  value,
  onSelect,
  errors,
}: StepProps & {
  readonly value: ExperienceLevel | null;
  readonly onSelect: (value: ExperienceLevel) => void;
}) {
  return (
    <StepShell
      titleId="onboarding-experience-title"
      heading="Any experience with reasoning practice?"
      intro="This helps us start at a sensible level rather than one that is too easy or too hard."
      errors={errors}
    >
      <ChoiceStep
        name="experienceLevel"
        legend="Experience"
        value={value}
        choices={EXPERIENCE_CHOICES}
        onSelect={onSelect}
      />
    </StepShell>
  );
}

export function GoalStep({
  values,
  onChange,
  errors,
}: StepProps & {
  readonly values: readonly GoalOption[];
  readonly onChange: (next: readonly GoalOption[]) => void;
}) {
  return (
    <StepShell
      titleId="onboarding-goal-title"
      heading="What would you like to work on?"
      intro="Choose as many as apply. If you are not sure, choose “Not sure yet” — that is a perfectly good answer."
      errors={errors}
    >
      <MultiChoiceStep
        name="goals"
        legend="Goals"
        values={values}
        choices={GOAL_CHOICES}
        toggle={toggle}
        onChange={onChange}
      />
    </StepShell>
  );
}

export function ScheduleStep({
  value,
  onSelect,
  errors,
}: StepProps & {
  readonly value: SchedulePreference | null;
  readonly onSelect: (value: SchedulePreference) => void;
}) {
  return (
    <StepShell
      titleId="onboarding-schedule-title"
      heading="When would your child practise?"
      intro="We will suggest practice times that fit."
      errors={errors}
    >
      <ChoiceStep
        name="schedulePreference"
        legend="Practice time"
        value={value}
        choices={SCHEDULE_CHOICES}
        onSelect={onSelect}
      />
    </StepShell>
  );
}

export function InterestsStep({
  values,
  onChange,
  onSkip,
  errors,
}: StepProps & {
  readonly values: readonly InterestArea[];
  readonly onChange: (next: readonly InterestArea[]) => void;
  readonly onSkip: () => void;
}) {
  return (
    <StepShell
      titleId="onboarding-interests-title"
      heading="What does your child enjoy?"
      intro="Entirely optional — this only shapes which practice comes first."
      errors={errors}
      skip={
        <button type="button" onClick={onSkip} className="onboarding-step__skip">
          Skip this step
        </button>
      }
    >
      <MultiChoiceStep
        name="interests"
        legend="Interests"
        values={values}
        choices={INTEREST_CHOICES}
        toggle={toggle}
        onChange={onChange}
      />
    </StepShell>
  );
}

/**
 * The summary step.
 *
 * The copy describes what was chosen and what happens next. It does not call
 * the resulting path "AI-personalised" — spec §5.2 forbids it, and the plan is
 * explicit that the recommendation comes from documented rules.
 */
export function BeginStep({
  ageBand,
  experienceLevel,
  goals,
  schedulePreference,
  interestCount,
  onSubmit,
  submitting,
}: {
  readonly ageBand: AgeBand | null;
  readonly experienceLevel: ExperienceLevel | null;
  readonly goals: readonly GoalOption[];
  readonly schedulePreference: SchedulePreference | null;
  readonly interestCount: number;
  readonly onSubmit: () => void;
  readonly submitting: boolean;
}) {
  return (
    <StepShell
      titleId="onboarding-begin-title"
      heading="Ready to begin"
      intro="Here is what we have set up. You can change any of it later in settings."
      errors={[]}
    >
      <dl className="onboarding-summary">
        <dt>Age band</dt>
        <dd>{ageBand ?? "—"}</dd>
        <dt>Experience</dt>
        <dd>{experienceLevel ?? "—"}</dd>
        <dt>Goals</dt>
        <dd>{goals.length > 0 ? goals.join(", ") : "—"}</dd>
        <dt>Practice time</dt>
        <dd>{schedulePreference ?? "—"}</dd>
        <dt>Interests</dt>
        <dd>{interestCount > 0 ? `${interestCount} chosen` : "None chosen"}</dd>
      </dl>

      <p>
        We will suggest practice based on these answers using a fixed set of rules,
        so the recommendation can be explained to you. Nothing you enter here
        identifies your child by name.
      </p>

      <button type="button" onClick={onSubmit} disabled={submitting} className="button button--primary">
        {submitting ? "Creating profile…" : "Create profile and start"}
      </button>
    </StepShell>
  );
}
