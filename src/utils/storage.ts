import { ParentUser, ChildProfile, SessionRecord } from '../types/reasoning';

const STORAGE_KEY_PARENT = 'heir_wisdom_parent_user';
const STORAGE_KEY_SESSIONS = 'heir_wisdom_sessions';

const DEFAULT_CHILDREN: ChildProfile[] = [
  {
    id: 'child-leo',
    name: 'Leo',
    age: 9,
    grade: '4th Grade',
    avatar: 'Lion',
    avatarColor: '#C99543',
    learningGoal: 'gifted',
    targetExam: 'CogAT',
    startingLevel: 2,
    createdAt: '2026-09-14T08:30:00.000Z',
    unlockedModules: ['rotation', 'reflection', 'progression', 'attributes'],
    completedActivityIds: ['rot-101', 'rot-102', 'ref-101'],
    totalPracticeTimeSeconds: 2840,
  },
  {
    id: 'child-maya',
    name: 'Maya',
    age: 11,
    grade: '6th Grade',
    avatar: 'Falcon',
    avatarColor: '#2B4C7E',
    learningGoal: 'reasoning',
    targetExam: 'General Reasoning',
    startingLevel: 3,
    createdAt: '2026-10-01T14:15:00.000Z',
    unlockedModules: ['rotation', 'reflection', 'progression', 'attributes'],
    completedActivityIds: ['rot-101', 'prog-101'],
    totalPracticeTimeSeconds: 1520,
  },
];

const DEFAULT_PARENT: ParentUser = {
  id: 'parent-sarah-1',
  name: 'Sarah Jenkins',
  email: 'sarah.jenkins@example.com',
  subscriptionPlan: 'scholar',
  billingCycle: 'annual',
  children: DEFAULT_CHILDREN,
  activeChildId: 'child-leo',
};

const DEFAULT_SESSIONS: SessionRecord[] = [
  {
    id: 'sess-001',
    childId: 'child-leo',
    activityId: 'rot-101',
    activityTitle: 'The Cardinal Compass Turn',
    moduleId: 'rotation',
    subskillId: 'rot-quarter-cw',
    startedAt: '2026-10-14T15:10:00.000Z',
    completedAt: '2026-10-14T15:22:00.000Z',
    durationSeconds: 720,
    stagesVisited: ['observe', 'experiment', 'discover', 'apply', 'reflect'],
    initialObservation: 'The direction the arrow is pointing',
    experimentTransformationsCount: 5,
    ruleDiscoveredOnAttempt: 1,
    hintsUsedCount: 0,
    transferAnsweredCorrectly: true,
    transferAttemptsCount: 1,
    reflectionMood: 'Confident',
    reflectionNote: 'A 90 degree turn is just like a clock moving to 3 o\'clock!',
    adaptationRecommendation: 'Advance to counterclockwise and diagonal variations.',
  },
  {
    id: 'sess-002',
    childId: 'child-leo',
    activityId: 'rot-102',
    activityTitle: 'Counter-Clockwise Beacon',
    moduleId: 'rotation',
    subskillId: 'rot-quarter-ccw',
    startedAt: '2026-10-15T16:00:00.000Z',
    completedAt: '2026-10-15T16:14:00.000Z',
    durationSeconds: 840,
    stagesVisited: ['observe', 'experiment', 'discover', 'apply', 'reflect'],
    initialObservation: 'The direction of rotation (turning backwards)',
    experimentTransformationsCount: 8,
    ruleDiscoveredOnAttempt: 2,
    hintsUsedCount: 1,
    transferAnsweredCorrectly: true,
    transferAttemptsCount: 1,
    reflectionMood: 'Curious',
    reflectionNote: 'Counterclockwise goes backwards against the numbers on the clock.',
    adaptationRecommendation: 'Solid transfer. Ready for 180° inversions.',
  },
  {
    id: 'sess-003',
    childId: 'child-leo',
    activityId: 'ref-101',
    activityTitle: 'The Chiral Crescent',
    moduleId: 'reflection',
    subskillId: 'ref-horizontal',
    startedAt: '2026-10-17T11:20:00.000Z',
    completedAt: '2026-10-17T11:35:00.000Z',
    durationSeconds: 900,
    stagesVisited: ['observe', 'experiment', 'discover', 'apply', 'reflect'],
    initialObservation: 'It mirrors horizontally (left becomes right)',
    experimentTransformationsCount: 6,
    ruleDiscoveredOnAttempt: 1,
    hintsUsedCount: 0,
    transferAnsweredCorrectly: true,
    transferAttemptsCount: 1,
    reflectionMood: 'Excited',
    reflectionNote: 'Flipping is different from rotating because my left hand turns into a right hand in the mirror.',
    adaptationRecommendation: 'Understands horizontal reflection. Introduce vertical reflection.',
  },
];

export function getParentUser(): ParentUser {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PARENT);
    if (!raw) {
      saveParentUser(DEFAULT_PARENT);
      return DEFAULT_PARENT;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PARENT;
  }
}

export function saveParentUser(user: ParentUser): void {
  try {
    localStorage.setItem(STORAGE_KEY_PARENT, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save parent user:', e);
  }
}

export function getActiveChild(): ChildProfile {
  const parent = getParentUser();
  const active = parent.children.find((c) => c.id === parent.activeChildId);
  return active || parent.children[0] || DEFAULT_CHILDREN[0];
}

export function setActiveChild(childId: string): void {
  const parent = getParentUser();
  if (parent.children.some((c) => c.id === childId)) {
    parent.activeChildId = childId;
    saveParentUser(parent);
  }
}

export function updateChildProfile(updated: ChildProfile): void {
  const parent = getParentUser();
  parent.children = parent.children.map((c) => (c.id === updated.id ? updated : c));
  saveParentUser(parent);
}

export function addChildProfile(childData: Omit<ChildProfile, 'id' | 'createdAt' | 'unlockedModules' | 'completedActivityIds' | 'totalPracticeTimeSeconds'>): ChildProfile {
  const parent = getParentUser();
  const newChild: ChildProfile = {
    ...childData,
    id: `child-${Date.now()}`,
    createdAt: new Date().toISOString(),
    unlockedModules: ['rotation', 'reflection', 'progression', 'attributes'],
    completedActivityIds: [],
    totalPracticeTimeSeconds: 0,
  };
  parent.children.push(newChild);
  parent.activeChildId = newChild.id;
  saveParentUser(parent);
  return newChild;
}

export function getSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) {
      saveSessions(DEFAULT_SESSIONS);
      return DEFAULT_SESSIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SESSIONS;
  }
}

export function saveSessions(sessions: SessionRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions:', e);
  }
}

export function getSessionsForChild(childId: string): SessionRecord[] {
  return getSessions().filter((s) => s.childId === childId);
}

export function recordSessionCompletion(session: SessionRecord): void {
  const sessions = getSessions();
  sessions.unshift(session);
  saveSessions(sessions);

  // Update child profile progress
  const parent = getParentUser();
  const child = parent.children.find((c) => c.id === session.childId);
  if (child) {
    if (!child.completedActivityIds.includes(session.activityId)) {
      child.completedActivityIds.push(session.activityId);
    }
    child.totalPracticeTimeSeconds += session.durationSeconds;
    saveParentUser(parent);
  }
}

export function resetToDefaults(): void {
  localStorage.removeItem(STORAGE_KEY_PARENT);
  localStorage.removeItem(STORAGE_KEY_SESSIONS);
}
