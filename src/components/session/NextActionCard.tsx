/**
 * The single recommended next action (R26).
 *
 * Exactly one primary action is rendered — the plan is explicit that a results
 * screen offering three equally-weighted suggestions is a screen that offers no
 * recommendation at all.
 */
import Link from "next/link";
import type { NextAction } from "@/lib/scoring/nextAction";

export interface NextActionCardProps {
  readonly nextAction: NextAction;
}

export function NextActionCard({ nextAction }: NextActionCardProps) {
  const { insight, label, href } = nextAction;

  return (
    <section className="next-action-card" aria-labelledby="next-action-heading">
      <h3 id="next-action-heading">Suggested next step</h3>
      <p>{insight}</p>
      <Link className="button button--primary" href={href}>
        {label}
      </Link>
    </section>
  );
}
