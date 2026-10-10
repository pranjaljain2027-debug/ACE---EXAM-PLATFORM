export type AgeBand = "introductory" | "developing" | "advanced";

export type ExperienceLevel = "new_to_reasoning" | "some_experience" | "regular_practiser";

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

export interface ParentSession {
  id: string;
  email: string;
  demoMode: boolean;
  createdAt: Date;
  lastActiveAt: Date;
  childCount: number;
}

export interface ChildRecord {
  id: string;
  parentId: string;
  ageBand: AgeBand;
  experienceLevel: ExperienceLevel;
  goals: GoalOption[];
  schedulePreference: SchedulePreference;
  interests: InterestArea[];
  practiceResponses: PracticeResponse[];
  createdAt: Date;
  lastActiveAt: Date;
}

export interface PracticeResponse {
  questionId: string;
  selectedChoiceId: string;
  answeredAt: Date;
}