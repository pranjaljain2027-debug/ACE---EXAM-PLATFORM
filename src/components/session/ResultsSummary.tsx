/**
 * The session summary shown on the results screen (R26).
 *
 * Every figure is a count or proportion of the child's own practice answers,
 * and the copy says so — this is not an assessment result (R5, R20). Where an
 * area has too few answers, the component renders the insufficient-data state
 * from U13 rather than a percentage (R28, AE3).
 */
import React from "react";
import { areaStateFrom } from "@/lib/scoring/insufficientData";
import type { DiagnosticResult } from "@/lib/scoring/diagnostic";

const AREA_LABELS = {
  nonverbal: "Nonverbal reasoning",
  quantitative: "Quantitative reasoning",
  verbal: "Verbal reasoning",
} as const;

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export interface ResultsSummaryProps {
  readonly diagnostic: DiagnosticResult;
}

export function ResultsSummary({ diagnostic }: ResultsSummaryProps) {
  const { answeredCount, correctCount, areas, status } = diagnostic;

  if (answeredCount === 0) {
    return (
      <section className="results-summary" aria-labelledby="results-summary-heading">
        <h2 id="results-summary-heading">No questions answered</h2>
        <p>
          This session has no recorded answers yet, so there is nothing to report.
          Answers appear here as soon as questions are completed.
        </p>
      </section>
    );
  }

  return (
    <section className="results-summary" aria-labelledby="results-summary-heading">
      <h2 id="results-summary-heading">Session summary</h2>

      <p>
        {plural(answeredCount, "question", "questions")} answered,{" "}
        {plural(correctCount, "answer", "answers")} correct.
      </p>

      <p className="results-summary__status">{status}</p>

      <h3>By reasoning area</h3>
      <ul className="results-summary__areas">
        {areas.map((area) => {
          const state = areaStateFrom(area);
          return (
            <li key={area.area}>
              <span className="results-summary__area-label">
                {AREA_LABELS[area.area]}
              </span>
              {state.status === "sufficient-data" ? (
                <span className="results-summary__area-value">
                  {Math.round(state.accuracy * 100)}% correct from {area.answered}{" "}
                  questions
                </span>
              ) : (
                <span className="results-summary__area-insufficient">
                  Not enough data yet — {area.answered} answered
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
