export type MapState = 'recommended' | 'in_progress' | 'mastered' | 'review' | 'available' | 'locked';

export interface MapLesson {
  id: string;
  skill_id: string;
  domain: string;
  prerequisites: string[];
}

export interface MapInput {
  lessons: MapLesson[];
  completed: string[];
  independent: string[];
  openLessonIds: string[];
  recommendedId: string | null;
}

/**
 * Data-driven learning map (C03). Prerequisites are skills; a skill counts as met once any lesson
 * for it has been completed (evidence of exposure, not mastery). Completed lessons stay open to revisit.
 */
export function buildLearningMap(input: MapInput): Record<string, { state: MapState; missing: string[] }> {
  const completed = new Set(input.completed);
  const independent = new Set(input.independent);
  const open = new Set(input.openLessonIds);
  const metSkills = new Set(input.lessons.filter((l) => completed.has(l.id)).map((l) => l.skill_id));
  const out: Record<string, { state: MapState; missing: string[] }> = {};
  for (const l of input.lessons) {
    const missing = l.prerequisites.filter((p) => !metSkills.has(p));
    let state: MapState;
    if (input.recommendedId === l.id && !independent.has(l.id)) state = 'recommended';
    else if (open.has(l.id)) state = 'in_progress';
    else if (independent.has(l.id)) state = 'mastered';
    else if (completed.has(l.id)) state = 'review';
    else if (missing.length === 0) state = 'available';
    else state = 'locked';
    out[l.id] = { state, missing };
  }
  return out;
}

/** The single mission C01 shows: resume, then recommendation, then the first available lesson. */
export function pickMission(input: MapInput & { baselineDone: boolean; openBaseline: boolean }): { kind: 'baseline' | 'resume' | 'lesson' | 'practice'; id: string | null } {
  if (!input.baselineDone) return { kind: 'baseline', id: null };
  if (input.openLessonIds.length) return { kind: 'resume', id: input.openLessonIds[0] };
  if (input.recommendedId) {
    const isLesson = input.lessons.some((l) => l.id === input.recommendedId);
    return { kind: isLesson ? 'lesson' : 'practice', id: input.recommendedId };
  }
  const map = buildLearningMap(input);
  const first = input.lessons.find((l) => map[l.id].state === 'available') ?? input.lessons.find((l) => map[l.id].state === 'review');
  return { kind: 'lesson', id: first?.id ?? input.lessons[0]?.id ?? null };
}
