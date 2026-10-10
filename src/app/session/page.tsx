import { Suspense } from "react";
import { demoMatrixQuestion } from "../../content/demo/matrix-question";
import { ExplanationPlayer } from "../../components/reasoning/ExplanationPlayer";

const PracticeSession: React.FC = () => {
  return (
    <Suspense fallback={<p>Loading practice session...</p>}>
      <section className="practice-session" aria-label="Practice session">
        <h1>Practice Session</h1>
        <ExplanationPlayer question={demoMatrixQuestion} />
      </section>
    </Suspense>
  );
};

export default PracticeSession;