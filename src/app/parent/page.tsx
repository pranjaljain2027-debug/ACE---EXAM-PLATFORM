/**
 * The parent dashboard (U14, R27, R28, R29, R33).
 *
 * Answers three questions in the order a parent actually asks them: what has
 * been practised, what is going well, and what should we do next.
 *
 * Two states are designed rather than accidental. A parent with no child gets an
 * invitation to add one, not an empty dashboard. A parent whose child has not
 * practised gets "not enough data yet", not a chart of zeroes — the difference
 * between "we have nothing to show" and "your child scored nothing" is the whole
 * point of R28, and it is invisible the moment a chart renders a zero.
 */
import Link from "next/link";
import { readParentOverview } from "@/lib/parent/readModel";
import { ActivityFeed } from "@/components/parent/ActivityFeed";
import { AreaBreakdown } from "@/components/parent/AreaBreakdown";
import { ChildSwitcher } from "@/components/parent/ChildSwitcher";
import { RecommendedNext } from "@/components/parent/RecommendedNext";

export const metadata = {
  title: "Dashboard · Heir of Wisdom",
  description: "What your child has practised and what to do next.",
  robots: { index: false, follow: false },
};

/**
 * The demo parent.
 *
 * A real parent id comes from the session cookie. This build has one demo
 * parent, and it is named here rather than read from a request so the ownership
 * path stays explicit.
 */
const DEMO_PARENT_ID = "parent-demo-1";

export default function ParentPage() {
  const overview = readParentOverview(DEMO_PARENT_ID);

  if (overview.children.length === 0) {
    return (
      <main className="parent-dashboard" aria-labelledby="parent-heading">
        <h1 id="parent-heading">Dashboard</h1>
        <section aria-labelledby="no-children-heading">
          <h2 id="no-children-heading">No child profile yet</h2>
          <p>
            Add a child to see what they have practised, how it is going, and what
            to try next.
          </p>
          <Link className="button button--primary" href="/onboarding">
            Add a child
          </Link>
        </section>
      </main>
    );
  }

  const { activeChild, progress, activity, mostActive, recommendation } = overview;

  return (
    <main className="parent-dashboard" aria-labelledby="parent-heading">
      <h1 id="parent-heading">Dashboard</h1>

      <ChildSwitcher profiles={overview.children} activeChildId={activeChild?.id ?? null} />

      {overview.parent.demoMode && (
        <aside role="note" className="parent-dashboard__demo-note">
          <p>
            This is demo data, so it does not reflect a real child&rsquo;s practice.
            It is here so you can see what the dashboard looks like with activity in
            it.
          </p>
        </aside>
      )}

      <RecommendedNext recommendation={recommendation} />

      {progress === null || progress.totalAnswered === 0 ? (
        <section aria-labelledby="no-activity-heading">
          <h2 id="no-activity-heading">No practice yet</h2>
          <p>
            Once your child answers a few questions, their progress appears here.
            A few questions is not enough to show a percentage, so the numbers stay
            hidden until there is something worth showing.
          </p>
          <Link className="button button--primary" href="/practice">
            Start practice
          </Link>
        </section>
      ) : (
        <>
          <AreaBreakdown areas={progress.areas} />

          <section aria-labelledby="activity-heading">
            <h2 id="activity-heading">Recent activity</h2>
            <ActivityFeed entries={activity} />
            {mostActive.length > 0 && (
              <p className="parent-dashboard__most-active">
                Practice so far has been concentrated in{" "}
                {mostActive.join(" and ")} reasoning.
              </p>
            )}
          </section>
        </>
      )}

      <p className="parent-dashboard__disclaimer">
        These figures describe answers to Heir of Wisdom&rsquo;s own practice
        questions. They are not an assessment result or a prediction of one.
      </p>
    </main>
  );
}
