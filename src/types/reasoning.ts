export type ShapeType =
  | 'triangle'
  | 'square'
  | 'circle'
  | 'arrow'
  | 'diamond'
  | 'hexagon'
  | 'star'
  | 'crescent';

export type RuleType =
  | 'rotation'
  | 'reflection'
  | 'color_change'
  | 'size_change'
  | 'position_change'
  | 'count_progression'
  | 'shape_substitution'
  | 'overlap';

export interface VisualObject {
  id: string;
  shape: ShapeType;
  x: number; // 0 to 100 percentage in cell
  y: number; // 0 to 100 percentage in cell
  rotation: number; // 0, 45, 90, 135, 180, 225, 270, 315
  scale: number; // 0.6, 0.8, 1.0, 1.2, 1.4
  color: string; // hex or semantic palette color
  reflectedX: boolean;
  reflectedY: boolean;
  zIndex: number;
}

export interface PatternFrame {
  stepIndex: number;
  objects: VisualObject[];
  isMissing?: boolean;
  label?: string;
}

export type ActivityFormat = 'sequence' | 'matrix' | 'analogy' | 'transformation';

export type AllowedAction =
  | 'rotate-90-cw'
  | 'rotate-90-ccw'
  | 'rotate-45'
  | 'reflect-x'
  | 'reflect-y'
  | 'change-color'
  | 'resize'
  | 'reposition'
  | 'add-element'
  | 'remove-element';

export interface ObservationChoice {
  id: string;
  label: string;
  category: 'direction' | 'color' | 'shape' | 'size' | 'position' | 'count';
  isKeyFactor: boolean;
}

export interface RuleOption {
  id: string;
  label: string;
  isCorrect: boolean;
  explanation: string;
}

export interface HintItem {
  tier: 1 | 2 | 3;
  name: string; // Attention | Relationship | Guided demonstration
  content: string;
  actionPreview?: {
    type: 'rotate' | 'reflect' | 'color' | 'scale' | 'shift';
    value: string | number;
  };
}

export interface TransferOption {
  id: string;
  objects: VisualObject[];
  isCorrect: boolean;
  explanation: string;
}

export interface TransferChallenge {
  id: string;
  prompt: string;
  ruleContext: string;
  frames: PatternFrame[];
  missingIndex: number;
  options: TransferOption[];
}

export interface ReasoningActivity {
  id: string;
  title: string;
  moduleId: 'rotation' | 'reflection' | 'progression' | 'attributes';
  moduleTitle: string;
  subskillId: string;
  subskillTitle: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  ageBand: '8-10' | '10-12';
  activityFormat: ActivityFormat;
  promptText: string;
  observationPrompt: string;
  observationChoices: ObservationChoice[];
  frames: PatternFrame[];
  missingFrameIndex: number;
  initialState: VisualObject[];
  targetState: VisualObject[];
  allowedActions: AllowedAction[];
  ruleOptions: RuleOption[];
  hints: HintItem[];
  explanationSteps: string[];
  transferChallenge: TransferChallenge;
  pedagogicalTakeaway: string;
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  grade: string;
  avatar: string;
  avatarColor: string;
  learningGoal: 'gifted' | 'reasoning' | 'logic' | 'exploration';
  targetExam?: 'CogAT' | 'OLSAT' | 'NNAT' | 'General Reasoning';
  startingLevel: number;
  createdAt: string;
  unlockedModules: string[];
  completedActivityIds: string[];
  totalPracticeTimeSeconds: number;
}

export interface SessionRecord {
  id: string;
  childId: string;
  activityId: string;
  activityTitle: string;
  moduleId: string;
  subskillId: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  stagesVisited: ('observe' | 'experiment' | 'discover' | 'apply' | 'reflect')[];
  initialObservation: string;
  experimentTransformationsCount: number;
  ruleDiscoveredOnAttempt: number;
  hintsUsedCount: number;
  transferAnsweredCorrectly: boolean;
  transferAttemptsCount: number;
  reflectionMood?: string;
  reflectionNote?: string;
  adaptationRecommendation: string;
}

export interface ParentUser {
  id: string;
  name: string;
  email: string;
  subscriptionPlan: 'starter' | 'scholar' | 'studio_family';
  billingCycle: 'monthly' | 'annual';
  children: ChildProfile[];
  activeChildId: string;
}
