/**
 * One child's practice detail (U14, R30, AE4).
 *
 * Ownership is settled before anything is read. A child id belonging to another
 * parent resolves to `notFound()` rather than to an empty page, and the empty
 * page would be worse: it looks like "this child has no history yet", which is
 * information about someone else's child.
 */
import { notFound } from "next/navigation";
import { readChild, readParentOverview } from "@/lib/parent/readModel";
import { ActivityFeed } from "@/components/parent/ActivityFeed";
import { AreaBreakdown } from "@/components/parent/AreaBreakdown";
import { RecommendedNext } from "@/components/parent/RecommendedNext";
import type { ReasoningCategory } from "@/lib/data/types";

export const metadata = {
  title: "Practice detail · Heir of Wisdom",
  robots: { index: false, follow: false },
};

const DEMO_PARENT_ID = "parent-demo-1";

const AREA_LABELS: Record<ReasoningCategory, string> = {
  nonverbal: "Nonverbal reasoning",
  quantitative: "Quantitative reasoning",
  verbal: "Verbal reasoning",
};

interface ChildPageProps {
  params: Promise<{ childId: string }>;
}

export default async function ChildPage({ params }: ChildPageProps) {
  const { childId } = await params;

  // Refuse before reading, not after rendering.
  if (!readChild(DEMO_PARENT_ID, childId)) notFound();

  const overview = readParentOverview(DEMO_PARENT_ID, childId);
  if (!overview.activeChild || !overview.progress) notFound();

  const { progress, activity, recommendation } = overview;

  return (
    <main className="child-detail" aria-labelledby="child-heading">
      <h1 id="child-heading">Practice detail</h1>

      <p className="child-detail__summary">
        {progress.sessionCount === 0
          ? "No sessions yet."
          : `${progress.sessionCount} ${
              progress.sessionCount === 1 ? "session" : "sessions"
            } since ${progress.firstSessionOn}.`}
      </p>

      <RecommendedNext recommendation={recommendation} />

      {progress.totalAnswered === 0 ? (
        <section aria-labelledby="child-empty-heading">
          <h2 id="child-empty-heading">Not enough data yet</h2>
          <p>
            A few answered questions are not enough to show a percentage in any
            reasoning area. Keep practising and the figures will appear.
          </p>
        </section>
      ) : (
        <>
          <AreaBreakdown areas={progress.areas} />

          <section aria-labelledby="child-practice-heading">
            <h2 id="child-practice-heading">Practice history</h2>
            <dl className="child-detail__totals">
              <dt>Total questions answered</dt>
              <dd>{progress.totalAnswered}</dd>
              <dt>Total answered correctly</dt>
              <dd>{progress.totalCorrect}</dd>
              <dt>Most recent session</dt>
              <dd>{progress.mostRecentSessionOn ?? "None yet"}</dd>
            </dl>
          </section>

          <section aria-labelledby="child-activity-heading">
            <h2 id="child-activity-heading">Sessions by date</h2>
            <ActivityFeed entries={activity} />
          </section>
        </>
      )}

      <p className="child-detail__disclaimer">
        These figures describe answers to Heir of Wisdom&rsquo;s own practice
        questions across {Object.values(AREA_LABELS).join(", ").toLowerCase()}. They
        are not an assessment result.
      </p>
    </main>
  );
}
