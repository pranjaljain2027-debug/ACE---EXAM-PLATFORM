/**
 * The recent-activity feed (U14, R33).
 *
 * Newest first, because a parent opening a dashboard is almost always asking
 * "what happened recently". Each entry states what was answered and whether
 * there was enough to draw a conclusion — a session with two answers is listed
 * honestly as a session with two answers, not quietly folded into an average.
 */
import Link from "next/link";
import type { ActivityEntry } from "@/lib/parent/readModel";

/** ISO dates to something a parent reads without effort. */
function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export interface ActivityFeedProps {
  readonly entries: readonly ActivityEntry[];
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  if (entries.length === 0) {
    return <p>No sessions recorded yet.</p>;
  }

  return (
    <ol className="parent-activity-feed">
      {entries.map((entry) => (
        <li key={entry.sessionId} className="parent-activity-feed__item">
          <p className="parent-activity-feed__date">
            <Link href={`/session/${entry.sessionId}/results`}>
              {formatDate(entry.completedOn)}
            </Link>
          </p>
          <p className="parent-activity-feed__detail">
            {entry.answeredCount === 1 ? "1 question" : `${entry.answeredCount} questions`}{" "}
            answered, {entry.correctCount} correct.
            {!entry.hadSufficientData && " Not enough answers yet to report a percentage."}
          </p>
        </li>
      ))}
    </ol>
  );
}
