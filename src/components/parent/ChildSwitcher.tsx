/**
 * The child switcher (U14, R30).
 *
 * A list of links rather than a `<select>`. A select would need client-side
 * state and a submit; links are what the platform already does, work without
 * JavaScript, and can be middle-clicked. The current child is marked with
 * `aria-current` so it is announced, not merely styled differently — the child
 * data on the page belongs to whichever child is marked here, and a parent
 * should not have to infer which from a highlight.
 */
import Link from "next/link";
import type { ChildRecord } from "@/lib/data/types";

/** The band label a parent chose at onboarding. Not a date of birth (R17). */
const AGE_BAND_LABELS: Record<string, string> = {
  introductory: "Introductory",
  developing: "Developing",
  advanced: "Advanced",
};

export interface ChildSwitcherProps {
  /**
   * The profiles to switch between.
   *
   * Named `profiles` rather than `children`: a `children` prop on a component
   * that maps over it reads as though JSX children were being passed, and React
   * treats the name as reserved. These are child *records*, not React children.
   */
  readonly profiles: readonly ChildRecord[];
  readonly activeChildId: string | null;
}

export function ChildSwitcher({ profiles, activeChildId }: ChildSwitcherProps) {
  if (profiles.length === 0) return null;

  return (
    <nav aria-label="Choose a child">
      <ul className="parent-child-switcher">
        {profiles.map((child) => {
          const isActive = child.id === activeChildId;
          return (
            <li key={child.id}>
              <Link
                href={`/parent?child=${child.id}`}
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "parent-child-switcher__link is-active" : "parent-child-switcher__link"}
              >
                {AGE_BAND_LABELS[child.ageBand] ?? child.ageBand}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
