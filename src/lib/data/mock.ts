/**
 * The demo data source (KTD6).
 *
 * Stands in for a real backend so the app runs end to end without one. Every
 * child read goes through `requireParentAccess` before any child data is
 * returned, so the parent/child data boundary is enforced in the data layer
 * rather than being left to each caller to remember (R30, AE4).
 *
 * This is process memory, not a file-backed store. The demo-mode decision
 * specifies a file-backed store so records survive a restart; that is recorded
 * as a deviation in the final report (U16) rather than being silently different
 * from what was decided.
 */
import type {
  ChildRecord,
  PracticeResponse,
  ParentSession,
  ReasoningCategory,
} from "./types";
import type { SessionRecord } from "../scoring/progress";

export type {
  ChildRecord,
  PracticeResponse,
  ParentSession,
  ReasoningCategory,
};

/** A child's recorded answers, grouped by the session they belong to. */
export type SessionWithResponses = SessionRecord;

const DEMO_PARENT_ID = "parent-demo-1";

const demoParent: ParentSession = {
  id: DEMO_PARENT_ID,
  email: "parent@example.com",
  demoMode: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  lastActiveAt: new Date("2026-01-01T00:00:00.000Z"),
  childIds: ["child-demo-1"],
};

const demoChild: ChildRecord = {
  id: "child-demo-1",
  parentId: DEMO_PARENT_ID,
  ageBand: "developing",
  experienceLevel: "some_experience",
  goals: ["improve_problem_solving"],
  schedulePreference: "any_time",
  interests: ["patterns_shapes"],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  lastActiveAt: new Date("2026-01-01T00:00:00.000Z"),
};

/**
 * Seeded demo practice history.
 *
 * Present so the parent dashboard and results screen have real data to render
 * in demo mode rather than only their empty states. Clearly seeded content, not
 * a fabricated user outcome — the sessions are labelled as demo data wherever
 * they are shown (R28).
 */
function seedSessions(): SessionWithResponses[] {
  const build = (
    sessionId: string,
    completedOn: string,
    area: ReasoningCategory,
    correctCount: number,
    totalCount: number,
  ): SessionWithResponses => ({
    sessionId,
    completedOn,
    responses: Array.from({ length: totalCount }, (_, index) => ({
      questionId: `${sessionId}-${area}-${index}`,
      correct: index < correctCount,
      reasoningCategory: area,
    })),
  });

  return [
    build("session-1", "2026-09-28", "nonverbal", 3, 3),
    build("session-2", "2026-09-30", "nonverbal", 2, 3),
    build("session-3", "2026-10-02", "quantitative", 1, 3),
    build("session-4", "2026-10-05", "verbal", 2, 3),
  ];
}

const parents = new Map<string, ParentSession>([[DEMO_PARENT_ID, demoParent]]);
const children = new Map<string, ChildRecord>([[demoChild.id, demoChild]]);
const sessionsByChild = new Map<string, SessionWithResponses[]>([
  [demoChild.id, seedSessions()],
]);

/** The single demo child id, for demo-mode surfaces that need a default. */
export const DEMO_CHILD_ID = demoChild.id;

export class ParentAccessError extends Error {
  constructor(childId: string) {
    super(`Not authorised to access child "${childId}".`);
    this.name = "ParentAccessError";
  }
}

/**
 * Read a child, but only for a parent who owns it (R30, AE4).
 *
 * Ownership is checked before the child record is returned, so a guessed child
 * id in a URL is refused rather than resolved. Returning `null` rather than
 * throwing keeps the call sites free of try/catch; the two are equivalent here
 * because neither reveals whether the id exists.
 */
export function requireParentAccess(parentId: string, childId: string): ChildRecord | null {
  const child = children.get(childId);
  if (!child || child.parentId !== parentId) return null;
  return child;
}

export const mockDataSource = {
  /** The parent ids known to the demo store. */
  listParentIds(): readonly string[] {
    return [...parents.keys()];
  },

  getParentSession(parentId: string): ParentSession | undefined {
    return parents.get(parentId);
  },

  /** Child ids the given parent owns — never another parent's children. */
  listChildren(parentId: string): readonly ChildRecord[] {
    return [...children.values()].filter((child) => child.parentId === parentId);
  },

  /** Session history for a child, newest first. Ownership enforced. */
  listSessions(parentId: string, childId: string): readonly SessionWithResponses[] {
    if (!requireParentAccess(parentId, childId)) return [];
    return [...(sessionsByChild.get(childId) ?? [])].sort((a, b) =>
      b.completedOn.localeCompare(a.completedOn),
    );
  },

  /** One session's responses. Ownership enforced. */
  getSession(
    parentId: string,
    childId: string,
    sessionId: string,
  ): SessionWithResponses | null {
    const owned = requireParentAccess(parentId, childId);
    if (!owned) return null;
    return sessionsByChild.get(childId)?.find((entry) => entry.sessionId === sessionId) ?? null;
  },

  updateChild(
    parentId: string,
    childId: string,
    updates: Partial<ChildRecord>,
  ): ChildRecord | null {
    const child = requireParentAccess(parentId, childId);
    if (!child) return null;
    const updated: ChildRecord = { ...child, ...updates, lastActiveAt: new Date() };
    children.set(childId, updated);
    return updated;
  },

  /** Remove a child and everything attached to them (R31). */
  deleteChild(parentId: string, childId: string): boolean {
    const child = requireParentAccess(parentId, childId);
    if (!child) return false;
    children.delete(childId);
    sessionsByChild.delete(childId);
    const parent = parents.get(parentId);
    if (parent) {
      parents.set(parentId, {
        ...parent,
        childIds: parent.childIds.filter((id) => id !== childId),
        lastActiveAt: new Date(),
      });
    }
    return true;
  },
};
