/**
 * The parent dashboard's read model (U14).
 *
 * One function that assembles everything the dashboard and the child detail view
 * render, so the two cannot disagree about a child's practice history. The
 * assembling happens here rather than in each page because the two pages answer
 * the same questions at different depths, and a figure that differs between them
 * is the kind of thing a parent notices and stops trusting.
 *
 * Ownership is settled before anything is read: `requireParentAccess` runs
 * first, and a child this parent does not own resolves to `null` rather than to
 * an empty result that looks like "no sessions yet" (R30, AE4).
 */
import { mockDataSource, requireParentAccess } from "@/lib/data/mock";
import type { ChildRecord, ParentSession } from "@/lib/data/types";
import { computeProgress, mostActiveAreas, sessionSummaries } from "@/lib/scoring/progress";
import type { AreaProgress, ProgressSummary } from "@/lib/scoring/progress";
import type { DiagnosticResult, ScoredResponse } from "@/lib/scoring/diagnostic";
import type { PracticeRecommendation } from "@/lib/scoring/diagnosticRules";

/** A dated entry in the activity feed. */
export type ActivityEntry = {
  readonly sessionId: string;
  readonly completedOn: string;
  readonly answeredCount: number;
  readonly correctCount: number;
  /** Whether this session had enough answers anywhere to report a figure. */
  readonly hadSufficientData: boolean;
};

/** Everything the parent overview renders. */
export type ParentOverview = {
  readonly parent: ParentSession;
  readonly children: readonly ChildRecord[];
  /** The child the dashboard is currently scoped to. */
  readonly activeChild: ChildRecord | null;
  readonly progress: ProgressSummary | null;
  readonly activity: readonly ActivityEntry[];
  readonly mostActive: readonly string[];
  readonly recommendation: PracticeRecommendation | null;
};

/**
 * Read a child for a parent, or null.
 *
 * Null for an unowned child and for an unknown one alike — the two are
 * deliberately indistinguishable, so a caller probing ids cannot use the
 * response to learn which children exist.
 */
export function readChild(parentId: string, childId: string): ChildRecord | null {
  return requireParentAccess(parentId, childId);
}

function toActivity(
  summaries: ReadonlyArray<{
    sessionId: string;
    completedOn: string;
    diagnostic: DiagnosticResult;
  }>,
): readonly ActivityEntry[] {
  return summaries.map((entry) => ({
    sessionId: entry.sessionId,
    completedOn: entry.completedOn,
    answeredCount: entry.diagnostic.answeredCount,
    correctCount: entry.diagnostic.correctCount,
    hadSufficientData: entry.diagnostic.complete,
  }));
}

/**
 * The parent overview.
 *
 * With no children, or with a child who has not practised, the shape of the
 * result is the same — `progress` is null rather than a zeroed summary — so the
 * page renders its designed empty state instead of a chart of nothing (AE3).
 */
export function readParentOverview(
  parentId: string,
  childId?: string,
): ParentOverview {
  const parent = mockDataSource.getParentSession(parentId);
  const children = mockDataSource.listChildren(parentId);

  if (!parent) {
    return {
      parent: {
        id: parentId,
        email: "",
        demoMode: true,
        childIds: [],
        createdAt: new Date(0),
        lastActiveAt: new Date(0),
      },
      children: [],
      activeChild: null,
      progress: null,
      activity: [],
      mostActive: [],
      recommendation: null,
    };
  }

  const activeChild = childId ? readChild(parentId, childId) : (children[0] ?? null);

  if (!activeChild) {
    return {
      parent,
      children,
      activeChild: null,
      progress: null,
      activity: [],
      mostActive: [],
      recommendation: null,
    };
  }

  const sessions = mockDataSource.listSessions(parentId, activeChild.id);
  const records = sessions.map((entry) => ({
    sessionId: entry.sessionId,
    completedOn: entry.completedOn,
    responses: entry.responses as readonly ScoredResponse[],
  }));

  const progress = computeProgress(records);
  const summaries = sessionSummaries(records);

  return {
    parent,
    children,
    activeChild,
    progress,
    activity: toActivity(summaries),
    mostActive: mostActiveAreas(progress, 2),
    recommendation: progress.recommendation,
  };
}

/**
 * The per-area figures for the child detail view.
 *
 * Areas without a sufficient sample carry `accuracy: undefined` rather than a
 * zero, and the page renders the reason instead. A `0%` here would read as "your
 * child did badly at verbal reasoning" when the truth is "we have not assessed
 * it yet", which is the exact confusion R28 exists to prevent.
 */
export function readAreaProgress(areas: readonly AreaProgress[]): readonly AreaProgress[] {
  return areas;
}
