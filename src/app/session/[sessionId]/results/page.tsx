/**
 * The session results screen (U12, R26, R5, R28, R33).
 *
 * A server component. It reads the session through the data layer, which
 * enforces parent/child ownership before returning anything (R30), and hands the
 * result to presentational components. The disclaimer is rendered here rather
 * than in a component so it cannot be dropped from one variant of the page
 * without the other losing it.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { scoreSession } from "@/lib/scoring/diagnostic";
import { getNextAction } from "@/lib/scoring/nextAction";
import { mockDataSource } from "@/lib/data/mock";
import { ResultsSummary } from "@/components/session/ResultsSummary";
import { NextActionCard } from "@/components/session/NextActionCard";

export const metadata = {
  title: "Session results · Heir of Wisdom",
  description: "What your child practised in this session, and what to do next.",
};

interface ResultsPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { sessionId } = await params;

  const parentId = mockDataSource.listParentIds()[0];
  if (!parentId) notFound();

  const children = mockDataSource.listChildren(parentId);
  const child = children[0];
  if (!child) notFound();

  // Ownership is enforced inside the data layer; an unowned session resolves to
  // null here rather than rendering someone else's practice history.
  const session = mockDataSource.getSession(parentId, child.id, sessionId);
  if (!session) notFound();

  const diagnostic = scoreSession(session.responses);
  const nextAction = getNextAction(session.responses);

  return (
    <main className="session-results" aria-labelledby="results-heading">
      <h1 id="results-heading">Session results</h1>

      <ResultsSummary diagnostic={diagnostic} />
      <NextActionCard nextAction={nextAction} />

      <aside className="session-results__disclaimer">
        <h2>What these results mean</h2>
        <p>
          These results describe how your child answered Heir of Wisdom&rsquo;s own
          practice questions. They are not an IQ score, an official assessment
          result, or a predictor of placement.
        </p>
      </aside>

      <nav aria-label="After this session">
        <Link className="button button--primary" href="/parent">
          Back to dashboard
        </Link>
      </nav>
    </main>
  );
}
