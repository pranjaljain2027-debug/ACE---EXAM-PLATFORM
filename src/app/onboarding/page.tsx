import AgeStep from "./steps/AgeStep";
import ExperienceStep from "./steps/ExperienceStep";
import GoalStep from "./steps/GoalStep";
import ScheduleStep from "./steps/ScheduleStep";
import InterestsStep from "./steps/InterestsStep";
import BeginStep from "./steps/BeginStep";

type AgeBand = "introductory" | "developing" | "advanced";
type ExperienceLevel = "new_to_reasoning" | "some_experience" | "regular_practiser";
type GoalOption = 
  | "improve_problem_solving"
  | "enhance_logical_thinking"
  | "build_confidence"
  | "prepare_assessment"
  | "not_sure_yet";
type SchedulePreference = "mornings" | "afternoons" | "evenings" | "any_time";
type InterestArea = 
  | "patterns_shapes"
  | "logic_and_sequence"
  | "verbal_reasoning"
  | "numerical_patterns";

interface OnboardingStepperState {
  ageBand: AgeBand;
  experienceLevel: ExperienceLevel;
  goals: GoalOption[];
  schedulePreference: SchedulePreference;
  interests: InterestArea[];
  completed: boolean;
  step: number;
  saved: boolean;
}

const STORAGE_KEY = "heir-onboarding-draft";

const loadFromStorage = (): OnboardingStepperState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ageBand: parsed.ageBand || "introductory",
        experienceLevel: parsed.experienceLevel || "new_to_reasoning",
        goals: parsed.goals || [],
        schedulePreference: parsed.schedulePreference || "any_time",
        interests: parsed.interests || [],
        completed: Boolean(parsed.completed),
        step: parsed.step !== undefined ? parsed.step : 1,
        saved: true,
      };
    }
  } catch {
    /* fall through to defaults */
  }
  return {
    ageBand: "introductory",
    experienceLevel: "new_to_reasoning",
    goals: [],
    schedulePreference: "any_time",
    interests: [],
    completed: false,
    step: 1,
    saved: false,
  };
};

const saveToStorage = (state: OnboardingStepperState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* persist failure is non-blocking */
  };
};

const OnboardingPage: React.FC = () => {
  const [state, setState] = React.useState<OnboardingStepperState>(loadFromStorage());

  const setAgeBand = (ageBand: AgeBand) => {
    const newState: OnboardingStepperState = {
      ...state,
      ageBand,
      step: state.step < 6 ? state.step + 1 : 6,
    };
    setState(newState);
    saveToStorage(newState);
  };

  setExperienceLevel = (experienceLevel: ExperienceLevel) => {
    const newState: OnboardingStepperState = {
      ...state,
      experienceLevel,
      step: state.step < 6 ? state.step + 1 : 6,
    };
    setState(newState);
    saveToStorage(newState);
  };

  setGoals = (goals: GoalOption[]) => {
    const newState: OnboardingStepperState = {
      ...state,
      goals,
      step: state.step < 6 ? state.step + 1 : 6,
    };
    setState(newState);
    saveToStorage(newState);
  };

  setSchedulePreference = (schedulePreference: SchedulePreference) => {
    const newState: OnboardingStepperState = {
      ...state,
      schedulePreference,
      step: state.step < 6 ? state.step + 1 : 6,
    };
    setState(newState);
    saveToStorage(newState);
  };

  setInterests = (interests: InterestArea[]) => {
    const newState: OnboardingStepperState = {
      ...state,
      interests,
      step: state.step < 6 ? state.step + 1 : 6,
    };
    setState(newState);
    saveToStorage(newState);
  };

  setCompleted = (completed: boolean) => {
    const newState: OnboardingStepperState = {
      ...state,
      completed,
    };
    setState(newState);
    saveToStorage(newState);
  };

  const handleContinue = () => {
    if (state.step === 5) {
      // Skip interests step, go to begin
      setState((prev) => ({ ...prev, step: 6, saved: true }));
      saveToStorage({ ...state, step: 6, saved: true });
    } else if (state.step < 6) {
      setState((prev) => ({ ...prev, step: prev.step + 1, saved: true }));
      saveToStorage({ ...state, step: state.step + 1, saved: true });
    }
  };

  const handleBack = () => {
    if (state.step > 1) {
      setState((prev) => ({ ...prev, step: prev.step - 1, saved: true }));
      saveToStorage({ ...state, step: state.step - 1, saved: true });
    }
  };

  return (
    <main className="onboarding-page" aria-label="Onboarding page">
      <h1 className="sr-only">Heir of Wisdom onboarding</h1>
      <section className="onboarding-stepper" aria-label="Stepper navigation">
        <ol role="list">
          <li className={`onboarding-stepper__item ${state.step >= 1 ? "active" : ""}` role="listitem">
            <span className="onboarding-stepper__number">1</span><span className="onboarding-stepper__label">Age</span>
          </li>
          <li className={`onboarding-stepper__item ${state.step >= 2 ? "active" : ""}` role="listitem">
            <span className="onboarding-stepper__number">2</span><span className="onboarding-stepper__label">Experience</span>
          </li>
          <li className={`onboarding-stepper__item ${state.step >= 3 ? "active" : ""}` role="listitem">
            <span className="onboarding-stepper__number">3</span><span className="onboarding-stepper__label">Goal</span>
          </li>
          <li className={`onboarding-stepper__item ${state.step >= 4 ? "active" : ""}` role="listitem">
            <span className="onboarding-stepper__number">4</span><span className="onboarding-stepper__label">Schedule</span>
          </li>
          <li className={`onboarding-stepper__item ${state.step >= 5 ? "active" : ""}` role="listitem">
            <span className="onboarding-stepper__number">5</span><span className="onboarding-stepper__label">Interests</span>
          </li>
          <li className={`onboarding-stepper__item ${state.step >= 6 ? "complete" : ""}` role="listitem">
            <span className="onboarding-stepper__number">6</span><span className="onboarding-stepper__label">Begin</span>
          </li>
        </ol>
      </section>

      <section className="onboarding-container">
        {state.step === 1 && <AgeStep onChange={setAgeBand} />}
        {state.step === 2 && <ExperienceStep onChange={setExperienceLevel} />}
        {state.step === 3 && <GoalStep onChange={setGoals} />}
        {state.step === 4 && <ScheduleStep onChange={setSchedulePreference} />}
        {state.step === 5 && <InterestsStep onChange={setInterests} />}
        {state.step === 6 && <BeginStep onComplete={setCompleted} />}
      </section>

      <footer className="onboarding-footer">
        <button onClick={handleBack} disabled={state.step <= 1} aria-label="Go back">
          Back
        </button>
        <button onClick={handleContinue} disabled={state.step >= 6} aria-label="Continue">
          {state.step < 6 ? "Continue" : "Complete"}
        </button>
      </footer>
    </main>
  );
};

export default OnboardingPage;