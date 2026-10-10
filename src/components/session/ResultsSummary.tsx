import React from "react";
import type { ResultsSummary } from "../../lib/scoring/nextAction";

const ResultsSummary: React.FC<{ summary: ResultsSummary }> = ({ summary }) => {
  const { totalQuestions, correct, accuracy, areaCounts, hasSufficientData } = summary;

  return (
    <div className="results-summary">
      <h2>Session Summary</h2>
      <p>
        You answered{" "}{totalQuestions}{" "}{totalQuestions > 1 ? "questions" : "question"}{" "}.
      </p>
      {totalQuestions > 0 && (
        <p>
          You got{" "}{correct}{" "}{correct === 1 ? "answer" : "answers"}{" "}{"right."}
        </p>
      )}
      {hasSufficientData && (
        <p>
          Your accuracy was{" "}{accuracy.toFixed(0)}{"%."}
        </p>
      )}
      {!hasSufficientData && (
        <p>
          {"Insufficient data yet — keep practicing to build a clearer picture."}
        </p>
      )}
    </div>
  );
};

export default ResultsSummary;