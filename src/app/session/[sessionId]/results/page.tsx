import { usePathname, useSearchParams } from "next/navigation";
import { useOnboardingDraft } from "../../lib/onboarding/draft";
import { getNextAction } from "../../lib/scoring/nextAction";
import { mockDataSource } from "../../lib/data/mock";
import ResultsSummary from "../../components/session/ResultsSummary";
import NextActionCard from "../../components/session/NextActionCard";

const ResultsPage: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id") || "default";
  const parentSession = mockDataSource.getParentSession(sessionId);
  const { step, values } = useOnboardingDraft();

  if (!parentSession) {
    return <p>Session not found</p>;
  }

  // Calculate results from practice responses
  const responses = mockDataSource.getPracticeResponses(sessionId || "");
  const total = responses.length;

  // Determine correct vs incorrect (simplified: each response has a correct flag)
  const correct = responses.filter((r: { correct: boolean }) => r.correct).length;

  const nextAction = getNextAction(total, correct, values.goals);

  return (
    <section className="results-page" aria-label="Results page">
      <h1>Results</h1>
      {parentSession.email && <p>Thank you for practicing, {parentSession.email}.</p>}

      <ResultsSummary summary={{ totalQuestions: total, correct, areaCounts: { nonverbal: 0, quantitative: 0, verbal: 0 }, hasSufficientData: total >= 3 }} />

      {correct > 0 && (
        <p>
          {"Great work! " + (correct === total ? "All your answers were correct!" : "You got some answers right.")}
        </p>
      )}

      {total > 0 ? (
        <p className="insight">
          {"Based on your results, " + nextAction.insight}
        </p>
      ) : (
        <p className="insight">
          {"Keep practicing! Each session helps build reasoning skills."}
        </p>
      )}

      {total >= 3 ? (
        <NextActionCard nextAction={nextAction} />
      ) : (
        <p>
          {"Complete more practice sessions to see personalized next steps."}
        </p>
      )}

      <p className="disclaimer">
        {"These results reflect your performance on Heir of Wisdom's practice questions. They are not an IQ score, official assessment result, or predictor of placement."}
      </p>

      <nav>
        <a href="/">Back home</a>
      </nav>
    </section>
  );
};

export default ResultsPage;