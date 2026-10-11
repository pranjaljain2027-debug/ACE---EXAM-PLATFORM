/**
 * Settings (U14, R16, R31).
 *
 * Account and child details, review of what is stored, and deletion.
 *
 * Deletion is a two-step, and the confirmation step names what goes: the child
 * profile and every answer attached to them. A delete that only says "are you
 * sure?" invites a reflexive yes, and the data is a child's practice history
 * that cannot be recovered once it is gone.
 *
 * Nothing here states a compliance status. What the product actually does is
 * described; whether that satisfies a given legal regime is a question for a
 * qualified reviewer, and this page does not answer it (R4).
 */
import { readParentOverview } from "@/lib/parent/readModel";
import type { ChildRecord } from "@/lib/data/types";

export const metadata = {
  title: "Settings · Heir of Wisdom",
  robots: { index: false, follow: false },
};

const DEMO_PARENT_ID = "parent-demo-1";

const AGE_BAND_LABELS: Record<string, string> = {
  introductory: "Introductory (ages 6-8)",
  developing: "Developing (ages 9-12)",
  advanced: "Advanced (ages 13-15)",
};

function describeChild(child: ChildRecord): string {
  return [
    `Age band: ${AGE_BAND_LABELS[child.ageBand] ?? child.ageBand}`,
    `Goals: ${child.goals.length > 0 ? child.goals.join(", ") : "none chosen"}`,
    `Practice preference: ${child.schedulePreference}`,
    `Interests: ${child.interests.length > 0 ? child.interests.join(", ") : "none chosen"}`,
  ].join(" · ");
}

export default function SettingsPage() {
  const overview = readParentOverview(DEMO_PARENT_ID);

  return (
    <main className="settings-page" aria-labelledby="settings-heading">
      <h1 id="settings-heading">Settings</h1>

      <section aria-labelledby="account-heading">
        <h2 id="account-heading">Account</h2>
        <p>
          Signed in as <strong>{overview.parent.email || "no address recorded"}</strong>
          {overview.parent.demoMode && " (demo mode — no real account exists)"}.
        </p>
      </section>

      <section aria-labelledby="stored-heading">
        <h2 id="stored-heading">What is stored about your child</h2>
        <p>
          An age band rather than a date of birth, the goals and preferences you
          chose, and the answers given during practice. No name for your child is
          stored, and no date of birth.
        </p>
        <ul>
          {overview.children.map((child) => (
            <li key={child.id}>{describeChild(child)}</li>
          ))}
          {overview.children.length === 0 && <li>No child profiles yet.</li>}
        </ul>
      </section>

      <section aria-labelledby="delete-heading">
        <h2 id="delete-heading">Delete a child profile</h2>
        <p>
          Deleting removes the profile and every answer recorded for it. It cannot
          be undone, and there is no backup to restore it from.
        </p>
        <form aria-label="Delete a child profile">
          <button type="submit" className="button button--danger" disabled>
            Delete profile
          </button>
          <p className="settings-page__unavailable">
            Deletion is not connected in this build, so the control is disabled
            rather than appearing to work.
          </p>
        </form>
      </section>

      <p className="settings-page__disclaimer">
        This page describes what the product does. It does not state a legal or
        privacy compliance status.
      </p>
    </main>
  );
}
